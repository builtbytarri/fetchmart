import { Injectable, Inject } from '@nestjs/common';
import type { EmailProvider } from './email.interface';
import { SendEmailOptions, EmailTemplate, EMAIL_PROVIDER } from './email.interface';

@Injectable()
export class EmailService {
  constructor(
    @Inject(EMAIL_PROVIDER) private readonly emailProvider: EmailProvider,
  ) {}

  async sendEmail(options: SendEmailOptions): Promise<void> {
    await this.emailProvider.sendEmail(options);
  }

  async sendPasswordResetEmail(to: string, resetToken: string, resetUrl: string): Promise<void> {
    await this.sendEmail({
      to,
      subject: 'Reset Your Password',
      template: EmailTemplate.PASSWORD_RESET,
      data: {
        resetToken,
        resetUrl,
      },
    });
  }
}
