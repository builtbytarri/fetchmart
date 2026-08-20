import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString, IsUUID, Min, ValidateIf } from 'class-validator';
import { ProductUnit, StockMode } from '@prisma/client';

export class UpdateProductDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  price?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  stockQuantity?: number;

  @IsBoolean()
  @IsOptional()
  isAvailable?: boolean;

  @IsBoolean()
  @IsOptional()
  isSuggested?: boolean;

  @IsBoolean()
  @IsOptional()
  isBulky?: boolean;

  // null clears the product image; undefined leaves it untouched.
  @IsString()
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  imageUrl?: string | null;

  @IsUUID()
  @IsOptional()
  categoryId?: string | null;

  // Unit of sale. PIECE keeps the old whole-number behaviour; the others are
  // measured goods that can be bought in fractions.
  @IsEnum(ProductUnit)
  @IsOptional()
  unit?: ProductUnit;

  // Smallest purchasable increment, e.g. 0.5 for a mudu sold in halves.
  @IsNumber()
  @Min(0.001)
  @IsOptional()
  stepSize?: number;

  // IN_STOCK skips exact counting for goods bought in bulk and sold singly.
  @IsEnum(StockMode)
  @IsOptional()
  stockMode?: StockMode;
}
