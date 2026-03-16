import { IsBoolean, IsObject, IsOptional, IsString } from 'class-validator';

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
}
