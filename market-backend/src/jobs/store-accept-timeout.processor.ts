import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { Job } from 'bullmq';
import { QUEUES, JOBS } from './jobs.constants';
import { PrismaService } from '../database';
import { NotificationsService } from '../notifications';
import { OrderStatus, SettlementType, FaultParty } from '@prisma/client';

interface StoreAcceptTimeoutData {
  orderId: string;
}

/**
 * Fires when a store hasn't accepted a paid order within the configured window.
 * Auto-cancels the order, refunds the customer to source, reverses any wallet
 * credit, and notifies the customer.
 */
@Processor(QUEUES.DELIVERY)
export class StoreAcceptTimeoutProcessor extends WorkerHost {
  private readonly logger = new Logger(StoreAcceptTimeoutProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly moduleRef: ModuleRef,
  ) {
    super();
  }

  async process(job: Job<StoreAcceptTimeoutData>): Promise<void> {
    if (job.name !== JOBS.STORE_ACCEPT_TIMEOUT) return;

    const { orderId } = job.data;

    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      this.logger.warn(`Order ${orderId} not found — skipping store-accept timeout`);
      return;
    }

    // Only act if the store still hasn't responded (order is still PAID).
    if (order.status !== OrderStatus.PAID) {
      this.logger.log(`Order ${orderId} already past PAID — store-accept timeout no-op`);
      return;
    }

    this.logger.log(`Store-accept timeout fired — auto-cancelling order ${orderId}`);

    try {
      // Lazily resolve PaymentsService to avoid a JobsModule ↔ PaymentsModule cycle.
      const { PaymentsService } = require('../payments/payments.service') as {
        PaymentsService: any;
      };
      const paymentsService = this.moduleRef.get<any>(PaymentsService, { strict: false });
      await paymentsService.settleOrder(orderId, {
        type: SettlementType.STORE_TIMEOUT,
        faultParty: FaultParty.STORE,
        reason: 'Store did not accept the order in time',
      });
    } catch (err) {
      this.logger.error(`Store-accept timeout settlement failed for order ${orderId}`, err);
      return;
    }

    try {
      await this.notifications.notifyCustomerOrderCancelled(
        order.customerUserId,
        orderId,
      );
    } catch {
      // Non-fatal.
    }
  }
}
