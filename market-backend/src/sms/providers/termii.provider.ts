import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { AppConfigService } from '../../config';
import type { SmsProvider } from '../sms.interface';
import { SendSmsOptions } from '../sms.interface';

// Default matches the Base URL shown in the Termii dashboard. The legacy
// api.ng.termii.com host still resolves, so this stays configurable in case an
// account is pinned to one or the other.
const DEFAULT_BASE_URL = 'https://v4.api.termii.com';

interface TermiiResponse {
  message_id?: string;
  message?: string;
  code?: string;
  balance?: number;
}

/**
 * Termii SMS provider.
 *
 * Sends over Termii's **DND route**, which is the only corridor that reaches
 * Nigerian numbers with Do-Not-Disturb enabled — a large share of MTN
 * subscribers. On the cheaper `generic` route those messages are dropped
 * silently, which for a registration OTP means the user is stranded on the
 * verification screen with no error to act on.
 *
 * The DND route is API-only; it cannot be exercised from the Termii dashboard.
 */
@Injectable()
export class TermiiSmsProvider implements SmsProvider {
  private readonly logger = new Logger(TermiiSmsProvider.name);

  constructor(private readonly appConfig: AppConfigService) {}

  async sendSms(options: SendSmsOptions): Promise<void> {
    const { apiKey, senderId, channel, baseUrl } = this.appConfig.getSmsConfig();

    if (!apiKey || !senderId) {
      throw new ServiceUnavailableException(
        'SMS is not configured. Set TERMII_API_KEY and TERMII_SENDER_ID.',
      );
    }

    let res: Response;
    try {
      res = await fetch(`${(baseUrl || DEFAULT_BASE_URL).replace(/\/$/, '')}/api/sms/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: options.to,
          from: senderId,
          sms: options.message,
          type: 'plain',
          channel,
          api_key: apiKey,
        }),
      });
    } catch (err) {
      this.logger.error(`Termii request failed: ${(err as Error).message}`);
      throw new ServiceUnavailableException(
        'Could not send the verification code. Please try again.',
      );
    }

    let body: TermiiResponse = {};
    try {
      body = (await res.json()) as TermiiResponse;
    } catch {
      // Non-JSON body — fall through to the status check below.
    }

    if (!res.ok || !body.message_id) {
      // Termii returns 200 with an error message in some failure modes
      // (insufficient wallet balance being the common one), so the status
      // alone is not enough to conclude the message was accepted.
      this.logger.error(
        `Termii rejected the message (HTTP ${res.status}): ${body.message ?? 'no message_id returned'}`,
      );
      throw new ServiceUnavailableException(
        'Could not send the verification code. Please try again.',
      );
    }

    this.logger.log(
      `SMS accepted by Termii (id ${body.message_id})` +
        (body.balance !== undefined ? `, wallet balance ${body.balance}` : ''),
    );
  }
}
