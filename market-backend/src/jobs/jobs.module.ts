import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { JobsService } from './jobs.service';
import { EmailProcessor } from './email.processor';
import { LocationProcessor } from './location.processor';
import { QUEUES } from './jobs.constants';
import { EmailModule } from '../email';
import { AppConfigService } from '../config';

@Module({
  imports: [
    BullModule.forRootAsync({
      useFactory: (appConfig: AppConfigService) => ({
        connection: {
          url: appConfig.getRedisConfig().url,
        },
      }),
      inject: [AppConfigService],
    }),
    BullModule.registerQueue(
      { name: QUEUES.EMAIL },
      { name: QUEUES.LOCATION },
      { name: QUEUES.PAYMENT },
      { name: QUEUES.CLEANUP },
    ),
    EmailModule,
  ],
  providers: [JobsService, EmailProcessor, LocationProcessor],
  exports: [JobsService],
})
export class JobsModule {}
