import { Injectable, Logger } from '@nestjs/common';
import { EmailProvider, SendEmailOptions } from '../email.interface';

@Injectable()
export class MockEmailProvider implements EmailProvider {
  private readonly logger = new Logger(MockEmailProvider.name);

  async sendEmail(options: SendEmailOptions): Promise<void> {
    this.logger.log(`[MOCK EMAIL] To: ${options.to}`);
    this.logger.log(`[MOCK EMAIL] Subject: ${options.subject}`);
    this.logger.log(`[MOCK EMAIL] Template: ${options.template}`);
    this.logger.log(`[MOCK EMAIL] Data: ${JSON.stringify(options.data)}`);
  }
}
