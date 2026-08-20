import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { DiscountType } from '@prisma/client';

export class CreateCouponDto {
  @IsString()
  code: string;

  @IsOptional() @IsString()
  description?: string;

  @IsEnum(DiscountType)
  discountType: DiscountType;

  @IsNumber() @Min(0)
  discountValue: number;

  @IsOptional() @IsNumber() @Min(0)
  minOrderAmount?: number;

  @IsOptional() @IsNumber() @Min(0)
  maxDiscount?: number;

  @IsOptional() @IsInt() @Min(1)
  usageLimit?: number;

  @IsOptional() @IsBoolean()
  isActive?: boolean;

  @IsOptional() @IsString()
  expiresAt?: string;
}
