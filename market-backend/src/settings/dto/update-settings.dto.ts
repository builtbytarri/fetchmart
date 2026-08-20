import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

/**
 * All fields optional — the admin panel can patch any subset of the
 * platform pricing / commission parameters.
 */
export class UpdateSettingsDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  commissionPercent?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  serviceFeePercent?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  deliveryBaseFee?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  freeRadiusKm?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  perKmRate?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  extraStopFee?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  bulkyItemFee?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  nightSurcharge?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(23)
  nightStartHour?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(23)
  nightEndHour?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  riderDeliverySharePercent?: number;

  @IsOptional()
  @IsString()
  storePoolSubaccountId?: string;

  @IsOptional()
  @IsString()
  riderPoolSubaccountId?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  withdrawalMinAmount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  withdrawalFeePercent?: number;

  // Minutes a store has to accept a paid order before it auto-cancels + refunds.
  // 0 disables the auto-cancel.
  @IsOptional()
  @IsInt()
  @Min(0)
  storeAcceptTimeoutMinutes?: number;

  // Enable the background reconciliation sweep that tops up the Flutterwave pool
  // wallets to match the ledger. Keep off until the Transfers API (IP
  // whitelisting) is configured, otherwise the sweep just logs failed transfers.
  @IsOptional()
  @IsBoolean()
  poolSweepEnabled?: boolean;
}
