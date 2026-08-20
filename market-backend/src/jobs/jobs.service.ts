import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QUEUES, JOBS } from './jobs.constants';

const OFFER_TIMEOUT_MS = 60_000; // 60 seconds

@Injectable()
export class JobsService {
  constructor(
    @InjectQueue(QUEUES.EMAIL) private readonly emailQueue: Queue,
    @InjectQueue(QUEUES.LOCATION) private readonly locationQueue: Queue,
    @InjectQueue(QUEUES.DELIVERY) private readonly deliveryQueue: Queue,
  ) {}

  async queueEmail(to: string, subject: string, html: string) {
    await this.emailQueue.add(JOBS.SEND_EMAIL, { to, subject, html });
  }

  async queueLocationPersist(riderId: string, latitude: number, longitude: number) {
    await this.locationQueue.add(JOBS.PERSIST_LOCATION, { riderId, latitude, longitude });
  }

  /**
   * Schedule an auto-decline if the rider doesn't respond to the offer within 60 s.
   * Uses a deterministic jobId so it can be cancelled if the rider accepts.
   */
  async scheduleRiderOfferTimeout(
    orderId: string,
    riderId: string,
    riderUserId: string,
    riderName: string,
  ) {
    const jobId = `offer-${orderId}-${riderId}`;
    await this.deliveryQueue.add(
      JOBS.RIDER_OFFER_TIMEOUT,
      { orderId, riderId, riderUserId, riderName },
      { delay: OFFER_TIMEOUT_MS, jobId, removeOnComplete: true, removeOnFail: true },
    );
  }

  /** Cancel a pending offer timeout when the rider accepts. */
  async cancelRiderOfferTimeout(orderId: string, riderId: string) {
    const jobId = `offer-${orderId}-${riderId}`;
    try {
      const job = await this.deliveryQueue.getJob(jobId);
      if (job) await job.remove();
    } catch {
      // Job may have already completed or been removed — safe to ignore
    }
  }

  /**
   * Schedule an auto-cancel if the store doesn't accept a paid order in time.
   * Deterministic jobId so it can be cancelled once the store responds.
   */
  async scheduleStoreAcceptTimeout(orderId: string, delayMs: number) {
    const jobId = `store-accept-${orderId}`;
    await this.deliveryQueue.add(
      JOBS.STORE_ACCEPT_TIMEOUT,
      { orderId },
      { delay: delayMs, jobId, removeOnComplete: true, removeOnFail: true },
    );
  }

  /** Cancel the store-accept timeout when the store accepts or declines. */
  async cancelStoreAcceptTimeout(orderId: string) {
    const jobId = `store-accept-${orderId}`;
    try {
      const job = await this.deliveryQueue.getJob(jobId);
      if (job) await job.remove();
    } catch {
      // Job may have already completed or been removed — safe to ignore
    }
  }
}
