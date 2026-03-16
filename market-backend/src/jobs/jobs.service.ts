import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QUEUES, JOBS } from './jobs.constants';

@Injectable()
export class JobsService {
  constructor(
    @InjectQueue(QUEUES.EMAIL) private readonly emailQueue: Queue,
    @InjectQueue(QUEUES.LOCATION) private readonly locationQueue: Queue,
  ) {}

  async queueEmail(to: string, subject: string, html: string) {
    await this.emailQueue.add(JOBS.SEND_EMAIL, { to, subject, html });
  }

  async queueLocationPersist(riderId: string, latitude: number, longitude: number) {
    await this.locationQueue.add(JOBS.PERSIST_LOCATION, { riderId, latitude, longitude });
  }
}
