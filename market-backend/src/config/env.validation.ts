import { plainToInstance } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  validateSync,
} from 'class-validator';

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

export class EnvironmentVariables {
  @IsEnum(Environment)
  NODE_ENV: Environment = Environment.Development;

  @IsNumber()
  APP_PORT: number;

  @IsString()
  @IsNotEmpty()
  DATABASE_URL: string;

  @IsString()
  @IsNotEmpty()
  REDIS_URL: string;

  @IsString()
  @IsNotEmpty()
  JWT_ACCESS_SECRET: string;

  @IsString()
  @IsNotEmpty()
  JWT_REFRESH_SECRET: string;

  // Korah Pay — optional; kept so existing envs don't break during migration
  @IsString()
  @IsOptional()
  KORAH_PUBLIC_KEY?: string;

  @IsString()
  @IsOptional()
  KORAH_SECRET_KEY?: string;

  @IsString()
  @IsOptional()
  KORAH_WEBHOOK_SECRET?: string;

  // SMS (Termii) — optional so local development runs without credentials.
  // Required in production: without it registration cannot complete.
  @IsString()
  @IsOptional()
  SMS_PROVIDER?: string;

  @IsString()
  @IsOptional()
  TERMII_API_KEY?: string;

  @IsString()
  @IsOptional()
  TERMII_SENDER_ID?: string;

  @IsString()
  @IsOptional()
  TERMII_CHANNEL?: string;

  @IsString()
  @IsOptional()
  TERMII_BASE_URL?: string;

  @IsString()
  @IsOptional()
  OTP_TEST_NUMBERS?: string;

  // Flutterwave — required for payment processing
  @IsString()
  @IsNotEmpty()
  FLUTTERWAVE_SECRET_KEY: string;

  @IsString()
  @IsNotEmpty()
  FLUTTERWAVE_PUBLIC_KEY: string;

  @IsString()
  @IsNotEmpty()
  FLUTTERWAVE_WEBHOOK_HASH: string;

  @IsString()
  @IsNotEmpty()
  MAP_PROVIDER: string;

  @IsString()
  @IsNotEmpty()
  MAP_API_KEY: string;

  // Cloudinary — image uploads. Optional at boot so the rest of the API can run
  // without them; the storage endpoint returns a clear 503 if they are missing
  // rather than handing out an upload URL that would silently fail.
  @IsString()
  @IsOptional()
  CLOUDINARY_CLOUD_NAME?: string;

  @IsString()
  @IsOptional()
  CLOUDINARY_API_KEY?: string;

  @IsString()
  @IsOptional()
  CLOUDINARY_API_SECRET?: string;

  // OAuth — Google. We accept tokens from any of these audiences (one per platform).
  // At least one MUST be set or Google sign-in cannot work.
  @IsString()
  @IsOptional()
  GOOGLE_OAUTH_IOS_CLIENT_ID?: string;

  @IsString()
  @IsOptional()
  GOOGLE_OAUTH_ANDROID_CLIENT_ID?: string;

  @IsString()
  @IsOptional()
  GOOGLE_OAUTH_WEB_CLIENT_ID?: string;

  // OAuth — Apple. The bundle ID is the audience claim Apple puts in the identity token.
  @IsString()
  @IsOptional()
  APPLE_BUNDLE_ID?: string;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(`Environment validation failed:\n${errors.toString()}`);
  }

  return validatedConfig;
}
