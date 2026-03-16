import { IsNumber, IsOptional, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class NearbyQueryDto {
  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  latitude: number;

  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  longitude: number;

  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  @IsOptional()
  @Min(1)
  radius?: number = 10; // Default 10km
}
