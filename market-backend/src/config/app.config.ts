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

  getR2Config() {
    return {
      accountId: this.configService.get<string>('R2_ACCOUNT_ID'),
      accessKey: this.configService.get<string>('R2_ACCESS_KEY'),
      secretKey: this.configService.get<string>('R2_SECRET_KEY'),
      bucketName: this.configService.get<string>('R2_BUCKET_NAME'),
    };
  }
}
