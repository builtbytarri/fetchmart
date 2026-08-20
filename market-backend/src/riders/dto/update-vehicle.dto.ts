import { IsOptional, IsString, IsIn } from 'class-validator';

export class UpdateVehicleDto {
  @IsOptional()
  @IsString()
  @IsIn(['bicycle', 'motorcycle', 'car'])
  vehicleType?: string;

  @IsOptional()
  @IsString()
  vehiclePlate?: string;

  @IsOptional()
  @IsString()
  vehicleColor?: string;
}
