import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateStoreDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;

  // Human-readable address chosen on the map picker. Optional and informational
  // — the store is located by latitude/longitude.
  @IsString()
  @IsOptional()
  address?: string;

  // Storefront photo URL, produced by the /storage/upload-url flow.
  @IsString()
  @IsOptional()
  imageUrl?: string;
}
