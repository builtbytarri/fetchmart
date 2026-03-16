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
}
