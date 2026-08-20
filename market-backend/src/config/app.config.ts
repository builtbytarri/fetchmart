import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppConfigService {
  constructor(private configService: ConfigService) {}

  get nodeEnv(): string {
    return this.configService.get<string>('NODE_ENV', 'development');
  }

  get isProduction(): boolean {
    return this.nodeEnv === 'production';
  }

  get port(): number {
    return this.configService.get<number>('APP_PORT', 3000);
  }

  getDatabaseConfig() {
    return {
      url: this.configService.get<string>('DATABASE_URL')!,
    };
  }

  getRedisConfig() {
    return {
      url: this.configService.get<string>('REDIS_URL')!,
    };
  }

  getJwtConfig() {
    return {
      accessSecret: this.configService.get<string>('JWT_ACCESS_SECRET'),
      refreshSecret: this.configService.get<string>('JWT_REFRESH_SECRET'),
    };
  }

  getKorahConfig() {
    return {
      publicKey: this.configService.get<string>('KORAH_PUBLIC_KEY'),
      secretKey: this.configService.get<string>('KORAH_SECRET_KEY'),
      webhookSecret: this.configService.get<string>('KORAH_WEBHOOK_SECRET'),
    };
  }

  getFlutterwaveConfig() {
    return {
      secretKey: this.configService.get<string>('FLUTTERWAVE_SECRET_KEY')!,
      publicKey: this.configService.get<string>('FLUTTERWAVE_PUBLIC_KEY')!,
      webhookHash: this.configService.get<string>('FLUTTERWAVE_WEBHOOK_HASH')!,
    };
  }

  /** @deprecated Korah Pay — kept for reference, no longer the active provider */
  getPaymentConfig() {
    return {
      korahPayPublicKey: this.configService.get<string>('KORAH_PUBLIC_KEY'),
      korahPaySecretKey: this.configService.get<string>('KORAH_SECRET_KEY'),
      korahPayWebhookSecret: this.configService.get<string>('KORAH_WEBHOOK_SECRET'),
    };
  }

  getMapConfig() {
    return {
      provider: this.configService.get<string>('MAP_PROVIDER'),
      apiKey: this.configService.get<string>('MAP_API_KEY'),
    };
  }

  getSmsConfig() {
    return {
      // 'mock' logs the code; 'termii' sends for real. Defaults to mock so a
      // misconfigured environment never silently burns prepaid credits.
      provider: this.configService.get<string>('SMS_PROVIDER') ?? 'mock',
      apiKey: this.configService.get<string>('TERMII_API_KEY'),
      senderId: this.configService.get<string>('TERMII_SENDER_ID'),
      // 'dnd' is required to reach Nigerian numbers with Do-Not-Disturb on.
      channel: this.configService.get<string>('TERMII_CHANNEL') ?? 'dnd',
      baseUrl: this.configService.get<string>('TERMII_BASE_URL'),
      testNumbers: this.parseTestNumbers(
        this.configService.get<string>('OTP_TEST_NUMBERS'),
      ),
    };
  }

  /**
   * Fixed-code numbers that bypass the SMS provider entirely.
   *
   * Our Termii sender ID is cleared for Nigeria only, so a reviewer or tester
   * on a foreign number would never receive a code and could not get past the
   * registration screen. These numbers always "receive" a preset code.
   *
   * Format: "2348000000000:123456,15550100:123456"
   */
  private parseTestNumbers(raw?: string): Map<string, string> {
    const map = new Map<string, string>();
    if (!raw) return map;
    for (const pair of raw.split(',')) {
      const [number, code] = pair.split(':').map((p) => p.trim());
      if (number && code) map.set(number.replace(/\D/g, ''), code);
    }
    return map;
  }

  getCloudinaryConfig() {
    return {
      cloudName: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
      apiKey: this.configService.get<string>('CLOUDINARY_API_KEY'),
      apiSecret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
    };
  }

  getGoogleOAuthConfig() {
    return {
      iosClientId: this.configService.get<string>('GOOGLE_OAUTH_IOS_CLIENT_ID'),
      androidClientId: this.configService.get<string>('GOOGLE_OAUTH_ANDROID_CLIENT_ID'),
      webClientId: this.configService.get<string>('GOOGLE_OAUTH_WEB_CLIENT_ID'),
    };
  }

  getAppleOAuthConfig() {
    return {
      bundleId: this.configService.get<string>('APPLE_BUNDLE_ID'),
    };
  }
}
