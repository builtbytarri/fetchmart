import { Injectable, Inject } from '@nestjs/common';
import type { SmsProvider } from './sms.interface';
import { SMS_PROVIDER, buildOtpMessage, toTermiiMsisdn } from './sms.interface';

@Injectable()
export class SmsService {
  constructor(
    @Inject(SMS_PROVIDER) private readonly smsProvider: SmsProvider,
  ) {}

  /** Send a verification code using the compliance-approved wording. */
  async sendOtp(phone: string, code: string): Promise<void> {
    await this.smsProvider.sendSms({
      to: toTermiiMsisdn(phone),
      message: buildOtpMessage(code),
    });
  }
}
