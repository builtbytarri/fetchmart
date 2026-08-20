import {
  IsArray,
  IsLatitude,
  IsLongitude,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class OrderItemDto {
  @IsString()
  @IsNotEmpty()
  productId: string;

  // Fractional for measured goods (half a mudu, 2.5 kg). The real constraint —
  // that the amount is a whole multiple of the product's step size — depends on
  // the product, so it is enforced in OrdersService, not here.
  @IsNumber()
  @Min(0.001)
  quantity: number;
}

export class CreateOrderDto {
  @IsString()
  @IsNotEmpty()
  storeId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  // Delivery destination — falls back to the customer's saved location.
  @IsOptional()
  @IsLatitude()
  destLat?: number;

  @IsOptional()
  @IsLongitude()
  destLng?: number;

  @IsOptional()
  @IsString()
  couponCode?: string;
}
