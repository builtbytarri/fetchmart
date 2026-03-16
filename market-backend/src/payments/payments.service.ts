import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database';
import { AppWebSocketGateway } from '../websocket';
import type { PaymentProvider } from './payment.interface';
import { PAYMENT_PROVIDER, PaymentStatus } from './payment.interface';
import { OrderStatus } from '@prisma/client';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(PAYMENT_PROVIDER) private readonly paymentProvider: PaymentProvider,
    private readonly wsGateway: AppWebSocketGateway,
  ) {}

  async initiatePayment(orderId: string, userId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: { select: { email: true, name: true } },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.customerUserId !== userId) {
      throw new BadRequestException('Not authorized to pay for this order');
    }

    if (order.status !== OrderStatus.CREATED) {
      throw new BadRequestException('Order is not in a payable state');
    }

    const result = await this.paymentProvider.initiatePayment({
      orderId: order.id,
      amount: Number(order.totalAmount),
      currency: 'NGN',
      customerEmail: order.customer.email,
      customerName: order.customer.name,
    });

    if (result.success) {
      await this.prisma.order.update({
        where: { id: orderId },
        data: { paymentReference: result.reference },
      });
    }

    return result;
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

        this.wsGateway.emitOrderStatusChanged(order.id, OrderStatus.PAID);
      }
    }

    return result;
  }

  async handleWebhook(payload: Record<string, unknown>, signature: string) {
    const event = payload.event as string;
    const data = payload.data as Record<string, unknown>;

    if (event === 'charge.success') {
      const reference = data.reference as string;
      await this.verifyPayment(reference);
    }

    return { received: true };
  }

  async refundPayment(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (!order.paymentReference) {
      throw new BadRequestException('No payment reference found for this order');
    }

    const result = await this.paymentProvider.refundPayment(
      order.paymentReference,
      Number(order.totalAmount),
    );

    return result;
  }
}
