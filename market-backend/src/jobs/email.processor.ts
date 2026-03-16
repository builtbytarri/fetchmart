import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { QUEUES, JOBS } from './jobs.constants';
import { EmailService } from '../email';

interface SendEmailJobData {
  to: string;
  subject: string;
  html: string;
}

@Processor(QUEUES.EMAIL)
export class EmailProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(private readonly emailService: EmailService) {
    super();
  }

  async process(job: Job<SendEmailJobData>): Promise<void> {
    if (job.name === JOBS.SEND_EMAIL) {
      this.logger.log(`Processing email job ${job.id}`);
      await this.emailService.sendEmail({
        to: job.data.to,
        subject: job.data.subject,
        html: job.data.html,
      });
      this.logger.log(`Email job ${job.id} completed`);
    }
  }
}
