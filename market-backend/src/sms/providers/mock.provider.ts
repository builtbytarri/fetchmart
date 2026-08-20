import { Injectable, Logger } from '@nestjs/common';
import type { SmsProvider } from '../sms.interface';
import { SendSmsOptions } from '../sms.interface';

/**
 * Development provider — logs instead of sending.
 *
 * Termii is prepaid and the DND corridor is billed per message, so local
 * development must never hit the real API. The OTP is printed so a developer
 * can complete registration on a simulator.
 */
@Injectable()
export class MockSmsProvider implements SmsProvider {
  private readonly logger = new Logger(MockSmsProvider.name);

  async sendSms(options: SendSmsOptions): Promise<void> {
    this.logger.log(`[MOCK SMS] To: ${options.to}`);
    this.logger.log(`[MOCK SMS] ${options.message}`);
  }
}
