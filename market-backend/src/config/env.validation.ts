import { plainToInstance } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
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

  @IsString()
  @IsNotEmpty()
  KORAH_PUBLIC_KEY: string;

  @IsString()
  @IsNotEmpty()
  KORAH_SECRET_KEY: string;

  @IsString()
  @IsNotEmpty()
  KORAH_WEBHOOK_SECRET: string;

  @IsString()
  @IsNotEmpty()
  MAP_PROVIDER: string;

  @IsString()
  @IsNotEmpty()
  MAP_API_KEY: string;

  @IsString()
  @IsNotEmpty()
  R2_ACCOUNT_ID: string;

  @IsString()
  @IsNotEmpty()
  R2_ACCESS_KEY: string;

  @IsString()
  @IsNotEmpty()
  R2_SECRET_KEY: string;

  @IsString()
  @IsNotEmpty()
  R2_BUCKET_NAME: string;
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
