import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../database';
import { AppWebSocketGateway } from '../websocket';
import { OrdersService } from '../orders';
import { WalletService } from '../wallet';
import { NotificationsService } from '../notifications';
import { CouponsService } from '../coupons';
import { JobsService } from '../jobs/jobs.service';
import type { PaymentProvider } from './payment.interface';
import { PAYMENT_PROVIDER, PaymentStatus } from './payment.interface';
import { FlutterwaveProvider } from './providers/flutterwave.provider';
import {
  OrderStatus,
  Settlement,
  SettlementType,
  SettlementStatus,
  FaultParty,
  Prisma,
  StockMode,
} from '@prisma/client';
import { CreateOrderDto } from '../orders/dto';

export interface SettleOrderOptions {
  type: SettlementType;
  reason?: string;
  faultParty?: FaultParty;
  createdByUserId?: string;
  /** Optional goodwill compensation paid to the assigned rider from platform funds. */
  riderCompensation?: number;
}

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ordersService: OrdersService,
    @Inject(PAYMENT_PROVIDER) private readonly paymentProvider: PaymentProvider,
    private readonly wsGateway: AppWebSocketGateway,
    private readonly walletService: WalletService,
    private readonly notifications: NotificationsService,
    private readonly couponsService: CouponsService,
    private readonly jobsService: JobsService,
  ) {}

  /**
   * Atomic checkout — creates the order AND initiates Flutterwave payment in one call.
   *
   * If payment initiation fails for any reason (Flutterwave down, bad keys, etc.)
   * the order is immediately compensated: stock is restored and the order record
   * is deleted. The caller receives a clear error and no orphan order is created.
   *
   * Flow:
   *  1. Validate cart and create order (with stock decrement) via OrdersService
   *  2. Fetch customer email/name needed by Flutterwave
   *  3. Call Flutterwave /v3/payments
   *  4a. Success → store tx_ref on order, return { orderId, reference, authorizationUrl }
   *  4b. Failure → compensate (delete order + restore stock), throw 400
   */
  async checkout(
    userId: string,
    dto: CreateOrderDto,
    redirectUrl?: string,
  ) {
    // Step 1: create order — this runs inside a Prisma transaction that decrements stock.
    const order = await this.ordersService.create(userId, dto);

    // Step 2: fetch customer details needed for the Flutterwave request.
    const customer = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true },
    });

    if (!customer) {
      await this.compensateOrder(order.id);
      throw new BadRequestException('Customer not found');
    }

    // Step 3: initiate Flutterwave payment.
    let paymentResult;
    try {
      paymentResult = await this.paymentProvider.initiatePayment({
        orderId: order.id,
        amount: Number(order.totalAmount),
        currency: 'NGN',
        customerEmail: customer.email,
        customerName: customer.name,
        redirectUrl,
      });
    } catch (err) {
      this.logger.error('Flutterwave initiatePayment threw unexpectedly', err);
      await this.compensateOrder(order.id);
      throw new BadRequestException('Payment service unavailable. Please try again.');
    }

    // Step 4b: payment initiation failed — roll back the order.
    if (!paymentResult.success || !paymentResult.authorizationUrl) {
      await this.compensateOrder(order.id);
      throw new BadRequestException(
        'Could not open the payment page. Please check your internet connection and try again.',
      );
    }

    // Step 4a: success — store the tx_ref so we can match it when Flutterwave
    // calls our webhook or the mobile app calls the verify endpoint.
    await this.prisma.order.update({
      where: { id: order.id },
      data: { paymentReference: paymentResult.reference },
    });

    return {
      orderId:          order.id,
      reference:        paymentResult.reference,
      authorizationUrl: paymentResult.authorizationUrl,
    };
  }

  /**
   * Compensate a failed checkout: restore all stock decrements and hard-delete
   * the order. Called whenever payment initiation fails after the order was created.
   *
   * Uses a Prisma transaction so either everything rolls back or nothing does.
   */
  private async compensateOrder(orderId: string): Promise<void> {
    try {
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
        include: { orderItems: { include: { product: { select: { stockMode: true } } } } },
      });

      if (!order) return;  // Already cleaned up or never existed

      await this.prisma.$transaction([
        // Restore stock for every item in the order
        // Only COUNTED products track a real figure — restocking an IN_STOCK
        // product would inflate a number that is never decremented.
        ...order.orderItems
          .filter((item) => item.product?.stockMode === StockMode.COUNTED)
          .map((item) =>
            this.prisma.product.update({
              where: { id: item.productId },
              data: { stockQuantity: { increment: item.quantity } },
            }),
          ),
        // Hard-delete the order (cascade removes orderItems via FK)
        this.prisma.order.delete({ where: { id: orderId } }),
      ]);

      this.logger.log(`Order ${orderId} compensated — stock restored, record deleted`);
    } catch (err) {
      // Log but don't rethrow — the original payment error is what the client needs to see.
      // A background cleanup job or manual review can handle stuck orders if this fails.
      this.logger.error(`Failed to compensate order ${orderId}`, err);
    }
  }

  // ── Keep the old initiatePayment for existing orders (admin / retry flows) ─

  async initiatePayment(orderId: string, userId: string, redirectUrl?: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { customer: { select: { email: true, name: true } } },
    });

    if (!order) throw new NotFoundException('Order not found');
    if (order.customerUserId !== userId) throw new BadRequestException('Not authorized');
    if (order.status !== OrderStatus.CREATED) throw new BadRequestException('Order is not in a payable state');

    const result = await this.paymentProvider.initiatePayment({
      orderId: order.id,
      amount: Number(order.totalAmount),
      currency: 'NGN',
      customerEmail: order.customer.email,
      customerName: order.customer.name,
      redirectUrl,
    });

    if (result.success) {
      await this.prisma.order.update({
        where: { id: orderId },
        data: { paymentReference: result.reference },
      });
    }

    return result;
  }

  // ── Verification ──────────────────────────────────────────────────────────

  /**
   * Active, order-scoped payment check used by the mobile "Waiting for payment"
   * poller. Instead of waiting for Flutterwave's inbound webhook (which can't
   * reach a local/dev server, and never fires a redirect for async methods like
   * bank transfer), this makes an OUTBOUND verify call to Flutterwave and marks
   * the order PAID if the charge succeeded. Idempotent and ownership-scoped.
   */
  async verifyOrderPayment(orderId: string, userId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, status: true, customerUserId: true, paymentReference: true },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.customerUserId !== userId) {
      throw new BadRequestException('Not your order');
    }

    // Only hit Flutterwave while the order is still awaiting payment.
    if (order.status === OrderStatus.CREATED && order.paymentReference) {
      try {
        await this.verifyPayment(order.paymentReference);
      } catch (err) {
        this.logger.warn(`Active verify failed for order ${orderId}: ${err}`);
      }
    }

    const fresh = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: { status: true },
    });
    return { orderId, status: fresh?.status ?? order.status };
  }

  async verifyPayment(reference: string) {
    const result = await this.paymentProvider.verifyPayment(reference);

    if (result.success && result.status === PaymentStatus.SUCCESS) {
      const order = await this.prisma.order.findFirst({
        where: { paymentReference: reference },
      });

      if (order && order.status === OrderStatus.CREATED) {
        await this.prisma.order.update({
          where: { id: order.id },
          data: { status: OrderStatus.PAID },
        });
        await this.walletService.creditStoreForOrder(order.id);
        this.wsGateway.emitOrderStatusChanged(order.id, OrderStatus.PAID);
        await this.afterOrderPaid(order.id);
      }
    }

    return result;
  }

  async verifyByTransactionId(transactionId: number) {
    const provider = this.paymentProvider as FlutterwaveProvider;
    const result = await provider.verifyByTransactionId(transactionId);

    if (!result.success || result.status !== PaymentStatus.SUCCESS) {
      return { success: false, status: result.status, message: 'Payment not successful' };
    }

    const txRef = result.txRef ?? result.reference;

    if (!txRef?.startsWith('ORDER-')) {
      this.logger.warn(`Unexpected tx_ref format: ${txRef}`);
      return { success: false, status: PaymentStatus.FAILED, message: 'Invalid transaction reference' };
    }

    if (result.currency !== 'NGN') {
      this.logger.warn(`Unexpected currency: ${result.currency}`);
      return { success: false, status: PaymentStatus.FAILED, message: 'Invalid currency' };
    }

    const order = await this.prisma.order.findFirst({
      where: { paymentReference: txRef },
    });

    if (!order) {
      this.logger.warn(`No order found for tx_ref: ${txRef}`);
      return { success: false, status: PaymentStatus.FAILED, message: 'Order not found' };
    }

    if (result.amount < Number(order.totalAmount)) {
      this.logger.warn(`Amount mismatch for ${txRef}: expected ${order.totalAmount}, got ${result.amount}`);
      return { success: false, status: PaymentStatus.FAILED, message: 'Amount mismatch' };
    }

    if (order.status !== OrderStatus.CREATED) {
      return { success: true, status: PaymentStatus.SUCCESS, orderId: order.id };
    }

    await this.prisma.order.update({
      where: { id: order.id },
      data: { status: OrderStatus.PAID },
    });
    await this.walletService.creditStoreForOrder(order.id);
    this.wsGateway.emitOrderStatusChanged(order.id, OrderStatus.PAID);
    await this.afterOrderPaid(order.id);

    // Persist card token for future use (best-effort — don't block on failure)
    if (result.cardToken && result.maskedCard) {
      this.saveCardToken(order.customerUserId, result).catch(err =>
        this.logger.warn('Failed to save card token', err),
      );
    }

    return { success: true, status: PaymentStatus.SUCCESS, orderId: order.id };
  }

  private async saveCardToken(
    userId: string,
    result: { cardToken?: string; maskedCard?: string; cardType?: string; expiryMonth?: string; expiryYear?: string },
  ) {
    if (!result.cardToken || !result.maskedCard) return;

    // Avoid duplicate tokens for the same card
    const existing = await this.prisma.paymentToken.findFirst({
      where: { userId, token: result.cardToken },
    });
    if (existing) return;

    await this.prisma.paymentToken.create({
      data: {
        userId,
        token: result.cardToken,
        maskedCard: result.maskedCard,
        cardType: result.cardType ?? 'CARD',
        expiryMonth: result.expiryMonth ?? '',
        expiryYear: result.expiryYear ?? '',
      },
    });
  }

  async getMyPaymentTokens(userId: string) {
    return this.prisma.paymentToken.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        maskedCard: true,
        cardType: true,
        expiryMonth: true,
        expiryYear: true,
        isDefault: true,
        createdAt: true,
      },
    });
  }

  async deletePaymentToken(userId: string, tokenId: string) {
    const token = await this.prisma.paymentToken.findFirst({
      where: { id: tokenId, userId },
    });
    if (!token) throw new NotFoundException('Payment method not found');
    await this.prisma.paymentToken.delete({ where: { id: tokenId } });
    return { success: true };
  }

  /** Push-notify the store owner whenever a new order is paid. */
  private async afterOrderPaid(orderId: string): Promise<void> {
    try {
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
        include: { store: { include: { owner: true } } },
      });
      if (!order?.store?.owner) return;

      if (order.couponCode) {
        await this.couponsService.incrementUsage(order.couponCode).catch(err =>
          this.logger.warn(`Failed to increment coupon usage for ${order.couponCode}`, err),
        );
      }

      await this.notifications.notifyStoreNewOrder(
        order.store.owner.id,
        orderId,
        Math.round(Number(order.totalAmount)),
      );

      // Schedule an auto-cancel if the store doesn't accept within the window.
      const settings = await this.prisma.platformSettings.findFirst();
      const minutes = settings?.storeAcceptTimeoutMinutes ?? 10;
      if (minutes > 0) {
        await this.jobsService
          .scheduleStoreAcceptTimeout(orderId, minutes * 60_000)
          .catch((err) =>
            this.logger.warn(`Failed to schedule store-accept timeout for ${orderId}`, err),
          );
      }
    } catch (err) {
      this.logger.error('afterOrderPaid notification failed', err);
    }
  }

  // ── Webhook ───────────────────────────────────────────────────────────────

  async handleWebhook(payload: Record<string, unknown>, signature: string) {
    const event = payload.event as string;
    const data  = payload.data  as Record<string, unknown>;

    if (event === 'charge.completed' || event === 'charge.success') {
      const reference = (data.tx_ref ?? data.reference) as string;
      if (reference) await this.verifyPayment(reference);
    }

    // Payout transfers: finalize the matching withdrawal (re-credits on failure).
    if (event === 'transfer.completed' || event === 'transfer.success') {
      const reference = data.reference as string;
      const status = data.status as string;
      if (reference && status) await this.walletService.handleTransferWebhook(reference, status);
    }

    return { received: true };
  }

  // ── Refund ────────────────────────────────────────────────────────────────

  async refundPayment(orderId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });

    if (!order)                   throw new NotFoundException('Order not found');
    if (!order.paymentReference)  throw new BadRequestException('No payment reference found');

    return this.paymentProvider.refundPayment(order.paymentReference, Number(order.totalAmount));
  }

  // ── Settlement: the single unwind path for cancelled / refunded orders ──────

  /**
   * Fully unwind a paid order: restore stock + cancel it (once), reverse the
   * store/rider wallet credits, refund the customer to source, optionally pay
   * the rider a goodwill compensation, and write a Settlement audit record.
   *
   * Used by: store decline, store-accept timeout, admin cancel, admin settle.
   * Safe to call once per order — stock/refund only run while the order is not
   * yet CANCELLED; credit reversals are idempotent via order flags.
   */
  async settleOrder(orderId: string, opts: SettleOrderOptions): Promise<Settlement> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { orderItems: { include: { product: { select: { stockMode: true } } } } },
    });
    if (!order) throw new NotFoundException('Order not found');

    const isCancelled = order.status === OrderStatus.CANCELLED;
    const isCompleted = order.status === OrderStatus.COMPLETED;

    // 1. Restore stock + cancel the order — only for a LIVE (non-terminal) order.
    //    A delivered (COMPLETED) order is never restocked or flipped to CANCELLED;
    //    an admin settling it just refunds + reverses credits + records the audit.
    if (!isCancelled && !isCompleted) {
      await this.prisma.$transaction([
        // Only COUNTED products track a real figure — restocking an IN_STOCK
        // product would inflate a number that is never decremented.
        ...order.orderItems
          .filter((item) => item.product?.stockMode === StockMode.COUNTED)
          .map((item) =>
            this.prisma.product.update({
              where: { id: item.productId },
              data: { stockQuantity: { increment: item.quantity } },
            }),
          ),
        this.prisma.order.update({
          where: { id: orderId },
          data: { status: OrderStatus.CANCELLED },
        }),
      ]);
      this.wsGateway.emitOrderStatusChanged(orderId, OrderStatus.CANCELLED);
    }

    // 2. Reverse store/rider wallet credits (idempotent).
    const { storeReversal, riderReversal } =
      await this.walletService.reverseOrderCredits(orderId);

    // 3. Refund the customer to source (best-effort — never block the unwind).
    //    Skip if already cancelled (already refunded); a completed order CAN still
    //    be refunded when an admin explicitly settles it.
    let refundStatus: SettlementStatus = SettlementStatus.PENDING;
    let refundAmount = 0;
    if (!isCancelled && order.paymentReference) {
      try {
        const res = await this.paymentProvider.refundPayment(
          order.paymentReference,
          Number(order.totalAmount),
        );
        refundAmount = Number(order.totalAmount);
        refundStatus = res?.success ? SettlementStatus.COMPLETED : SettlementStatus.FAILED;
        if (!res?.success) {
          this.logger.error(`Refund failed for settled order ${orderId}`);
        }
      } catch (err) {
        refundStatus = SettlementStatus.FAILED;
        this.logger.error(`Refund threw for settled order ${orderId}`, err);
      }
    } else if (isCancelled) {
      // Order was already unwound previously; don't double-refund.
      refundStatus = SettlementStatus.COMPLETED;
    }

    // 4. Optional rider compensation out of platform funds.
    let riderCompensation = 0;
    if (opts.riderCompensation && opts.riderCompensation > 0) {
      riderCompensation = await this.walletService.creditRiderCompensation(
        orderId,
        opts.riderCompensation,
      );
    }

    // 5. Audit record.
    const settlement = await this.prisma.settlement.create({
      data: {
        orderId,
        type: opts.type,
        reason: opts.reason,
        refundAmount: new Prisma.Decimal(refundAmount),
        storeReversal: new Prisma.Decimal(storeReversal),
        riderReversal: new Prisma.Decimal(riderReversal),
        riderCompensation: new Prisma.Decimal(riderCompensation),
        faultParty: opts.faultParty,
        refundStatus,
        createdByUserId: opts.createdByUserId,
      },
    });

    this.wsGateway.emitToAdmin('order_settled', {
      orderId,
      type: opts.type,
      refundAmount,
      refundStatus,
    });

    return settlement;
  }
}
