import { IsBoolean, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { ProductUnit, StockMode } from '@prisma/client';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  stockQuantity?: number = 0;

  @IsUUID()
  @IsOptional()
  categoryId?: string;

  @IsString()
  @IsOptional()
  imageUrl?: string;

  @IsBoolean()
  @IsOptional()
  isBulky?: boolean;

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
