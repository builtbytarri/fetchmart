export interface EmailProvider {
  sendEmail(options: SendEmailOptions): Promise<void>;
}

export interface SendEmailOptions {
  to: string;
  subject: string;
  template?: EmailTemplate;
  html?: string;
  data?: Record<string, unknown>;
}

export enum EmailTemplate {
  PASSWORD_RESET = 'password_reset',
  EMAIL_VERIFICATION = 'email_verification',
  ORDER_CONFIRMATION = 'order_confirmation',
}

export const EMAIL_PROVIDER = 'EMAIL_PROVIDER';
