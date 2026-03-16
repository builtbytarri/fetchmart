import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { QUEUES, JOBS } from './jobs.constants';
import { PrismaService } from '../database';

interface PersistLocationJobData {
  riderId: string;
  latitude: number;
  longitude: number;
}

@Processor(QUEUES.LOCATION)
export class LocationProcessor extends WorkerHost {
  private readonly logger = new Logger(LocationProcessor.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job<PersistLocationJobData>): Promise<void> {
    if (job.name === JOBS.PERSIST_LOCATION) {
      this.logger.log(`Persisting location for rider ${job.data.riderId}`);
      await this.prisma.rider.update({
        where: { id: job.data.riderId },
        data: {
          currentLatitude: job.data.latitude,
          currentLongitude: job.data.longitude,
          lastPingAt: new Date(),
        },
      });
      this.logger.log(`Location persisted for rider ${job.data.riderId}`);
    }
  }
}
