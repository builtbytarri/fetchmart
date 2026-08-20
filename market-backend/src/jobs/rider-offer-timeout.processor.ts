import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { Job } from 'bullmq';
import { QUEUES, JOBS } from './jobs.constants';
import { PrismaService } from '../database';
import { AppWebSocketGateway } from '../websocket';
import { OrderStatus } from '@prisma/client';

interface RiderOfferTimeoutData {
  orderId: string;
  riderId: string;
  riderUserId: string;
  riderName: string;
}

@Processor(QUEUES.DELIVERY)
export class RiderOfferTimeoutProcessor extends WorkerHost {
  private readonly logger = new Logger(RiderOfferTimeoutProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly wsGateway: AppWebSocketGateway,
    private readonly moduleRef: ModuleRef,
  ) {
    super();
  }

  async process(job: Job<RiderOfferTimeoutData>): Promise<void> {
    if (job.name !== JOBS.RIDER_OFFER_TIMEOUT) return;

    const { orderId, riderId, riderUserId, riderName } = job.data;
    this.logger.log(`Rider offer timeout fired — orderId=${orderId} riderId=${riderId}`);

    // Re-fetch order to check current state — rider may have already responded
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });

    if (!order) {
      this.logger.warn(`Order ${orderId} not found — skipping timeout`);
      return;
    }

    // Only act if the order is still ASSIGNED to exactly this rider
    if (order.status !== OrderStatus.ASSIGNED || order.riderId !== riderId) {
      this.logger.log(`Order ${orderId} no longer waiting on rider ${riderId} — skipping`);
      return;
    }

    // Record the timeout-decline
    const declines = (Array.isArray(order.riderDeclines) ? order.riderDeclines : []) as any[];
    declines.push({ riderId, name: riderName, declinedAt: new Date().toISOString(), reason: 'timeout' });

    await this.prisma.order.update({
      where: { id: orderId },
      data: {
        riderId: null,
        status: OrderStatus.PREPARING,
        riderDeclines: declines,
      },
    });

    this.wsGateway.emitOrderStatusChanged(orderId, OrderStatus.PREPARING);
    this.wsGateway.emitToAdmin('rider_offer_timed_out', {
      orderId,
      riderId,
      riderName,
      message: `Rider ${riderName} did not respond in 60 s — re-assigning`,
    });
    this.wsGateway.emitToRider(riderId, 'offer_expired', { orderId });

    // Trigger re-assignment via DeliveryService.
    // We use ModuleRef.get with strict:false so NestJS resolves it from the global
    // application container without requiring DeliveryModule to import JobsModule.
    try {
      // Lazy resolve to avoid import-time circular reference — DeliveryService is
      // available in the global container because AppModule imports DeliveryModule.
      const token = 'DeliveryService';
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { DeliveryService: DS } = require('../delivery/delivery.service') as { DeliveryService: any };
      const deliveryService = this.moduleRef.get<any>(DS, { strict: false });
      await deliveryService.autoAssignRider(orderId);
    } catch (err) {
      this.logger.warn(`Re-assignment after timeout failed for order ${orderId}: ${err}`);
    }
  }
}
