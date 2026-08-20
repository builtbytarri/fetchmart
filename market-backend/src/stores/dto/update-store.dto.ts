import { IsBoolean, IsNumber, IsObject, IsOptional, IsString } from 'class-validator';

export class UpdateStoreDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  isOpen?: boolean;

  @IsObject()
  @IsOptional()
  openingHours?: Record<string, unknown>;

  // A store may move location from the settings screen.
  @IsNumber()
  @IsOptional()
  latitude?: number;

  @IsNumber()
  @IsOptional()
  longitude?: number;

  @IsString()
  @IsOptional()
  address?: string;

  // Storefront photo URL, produced by the /storage/upload-url flow.
  @IsString()
  @IsOptional()
  imageUrl?: string;
}
