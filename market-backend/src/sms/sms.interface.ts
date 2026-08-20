export interface SendSmsOptions {
  /** Recipient in Termii's expected format: country code, no plus (2348…). */
  to: string;
  /** Full message body. Must match the sample approved by Termii compliance. */
  message: string;
}

export interface SmsProvider {
  sendSms(options: SendSmsOptions): Promise<void>;
}

export const SMS_PROVIDER = 'SMS_PROVIDER';

/**
 * The OTP body approved by Termii compliance for this account.
 *
 * This wording is not cosmetic. Termii's DND corridor is pre-cleared with the
 * Nigerian telcos against this exact sample, and their support explicitly
 * warned that messages deviating from it — or omitting the business name —
 * risk being blocked or flagged by the carriers. Change it only after getting
 * a new sample approved.
 */
export function buildOtpMessage(code: string): string {
  return `Your FetchMart verification code is ${code}. It expires in 10 minutes. Never share this code with anyone`;
}

/**
 * Normalise a Nigerian number to the form Termii accepts: international
 * dialling code with no leading plus or zero.
 *
 *   0803 123 4567  → 2348031234567
 *   +2348031234567 → 2348031234567
 *   8031234567     → 2348031234567
 *
 * Termii silently fails on local-format numbers, which would look identical to
 * a delivery failure from the app's side.
 */
export function toTermiiMsisdn(phone: string, defaultCountryCode = '234'): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith(defaultCountryCode)) return digits;
  if (digits.startsWith('0')) return defaultCountryCode + digits.slice(1);
  // A bare subscriber number (no trunk zero, no country code).
  if (digits.length === 10) return defaultCountryCode + digits;
  return digits;
}
