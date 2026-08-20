import { timingSafeEqual } from 'node:crypto';
import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  ParseIntPipe,
  Body,
  Headers,
  UseGuards,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { AppConfigService } from '../config';
import { JwtAuthGuard, RolesGuard, Roles, CurrentUser } from '../auth';
import { UserRole } from '@prisma/client';
import { CreateOrderDto } from '../orders/dto';

interface TokenPayload {
  userId: string;
  role: UserRole;
}

@Controller('payments')
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly appConfig: AppConfigService,
  ) {}

  /**
   * PRIMARY checkout endpoint — atomic create-order + initiate-payment.
   *
   * If Flutterwave fails for any reason, the order is deleted and stock
   * is restored before returning an error. No orphan orders are created.
   *
   * Body: { storeId, items: [...], redirectUrl? }
   * Returns: { orderId, reference, authorizationUrl }
   */
  @Post('checkout')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CUSTOMER)
  async checkout(
    @CurrentUser() user: TokenPayload,
    @Body() body: CreateOrderDto & { redirectUrl?: string },
  ) {
    const { redirectUrl, ...orderDto } = body;
    return this.paymentsService.checkout(user.userId, orderDto, redirectUrl);
  }

  /** Retry initiation for an already-created order (admin / edge cases). */
  @Post('orders/:orderId/initiate')
  @UseGuards(JwtAuthGuard)
  async initiatePayment(
    @Param('orderId') orderId: string,
    @CurrentUser() user: TokenPayload,
    @Body('redirectUrl') redirectUrl?: string,
  ) {
    return this.paymentsService.initiatePayment(orderId, user.userId, redirectUrl);
  }

  /**
   * Active payment poll for the mobile "Waiting for payment" screen.
   * Triggers an outbound Flutterwave verification for the order's stored
   * reference and returns the (possibly updated) order status. Works even when
   * the Flutterwave webhook can't reach the server (local dev, async bank
   * transfer with no redirect).
   */
  @Get('orders/:orderId/verify')
  @UseGuards(JwtAuthGuard)
  async verifyOrder(
    @Param('orderId') orderId: string,
    @CurrentUser() user: TokenPayload,
  ) {
    return this.paymentsService.verifyOrderPayment(orderId, user.userId);
  }

  /**
   * Step 2 (mobile): Verify by Flutterwave numeric transactionId.
   * Called immediately after the WebView intercepts the redirect:
   *   fetchmart.app/payment/callback?status=successful&tx_ref=...&transaction_id=<id>
   */
  @Get('verify/transaction/:transactionId')
  async verifyByTransactionId(
    @Param('transactionId', ParseIntPipe) transactionId: number,
  ) {
    return this.paymentsService.verifyByTransactionId(transactionId);
  }

  /**
   * Step 2 (legacy / webhook): Verify by our tx_ref string.
   * Kept for backwards compat and the webhook handler.
   */
  @Get('verify/:reference')
  async verifyPayment(@Param('reference') reference: string) {
    return this.paymentsService.verifyPayment(reference);
  }

  /**
   * Flutterwave webhook.
   * Verif-hash is a plain string set in the Flutterwave dashboard —
   * NOT an HMAC. We compare directly.
   * Docs: https://developer.flutterwave.com/docs/webhooks
   */
  @Post('webhook/flutterwave')
  async handleFlutterwaveWebhook(
    @Body() payload: Record<string, unknown>,
    @Headers('verif-hash') verifHash: string,
  ) {
    const expectedHash = this.appConfig.getFlutterwaveConfig().webhookHash;

    // Constant-time compare so the response time cannot be used to guess the
    // secret one character at a time. timingSafeEqual throws on a length
    // mismatch, so that case is screened out first.
    const provided = Buffer.from(verifHash ?? '', 'utf8');
    const expected = Buffer.from(expectedHash ?? '', 'utf8');
    const valid =
      provided.length > 0 &&
      provided.length === expected.length &&
      timingSafeEqual(provided, expected);

    if (!valid) {
      this.logger.warn('Rejected webhook: invalid verif-hash');
      throw new UnauthorizedException('Invalid webhook signature');
    }

    const event = payload.event as string | undefined;
    const data = payload.data as Record<string, unknown> | undefined;

    if (event === 'charge.completed' && data) {
      const txRef = data.tx_ref as string;
      if (txRef) {
        await this.paymentsService.verifyPayment(txRef);
      }
    }

    // Payout transfer events finalize withdrawals (re-credit on failure).
    if (event?.startsWith('transfer.') && data) {
      await this.paymentsService.handleWebhook(payload, verifHash);
    }

    return { received: true };
  }

  /** @deprecated Korah Pay webhook — kept until old orders fully migrate */
  @Post('webhook/korah')
  async handleKorahWebhook(
    @Body() payload: Record<string, unknown>,
    @Headers('x-korah-signature') signature: string,
  ) {
    return this.paymentsService.handleWebhook(payload, signature);
  }

  // ── Saved Payment Methods ─────────────────────────────────────────────────

  @Get('methods')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CUSTOMER)
  async getMyPaymentMethods(@CurrentUser() user: TokenPayload) {
    return this.paymentsService.getMyPaymentTokens(user.userId);
  }

  @Delete('methods/:tokenId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CUSTOMER)
  async deletePaymentMethod(
    @CurrentUser() user: TokenPayload,
    @Param('tokenId') tokenId: string,
  ) {
    return this.paymentsService.deletePaymentToken(user.userId, tokenId);
  }
}
