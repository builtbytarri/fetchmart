import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateNotificationPreferencesDto {
  @IsOptional() @IsBoolean() notifyPush?: boolean;
  @IsOptional() @IsBoolean() notifyOrderUpdates?: boolean;
  @IsOptional() @IsBoolean() notifyPromotions?: boolean;
  @IsOptional() @IsBoolean() notifyNewStores?: boolean;
  @IsOptional() @IsBoolean() notifyEmail?: boolean;
}
