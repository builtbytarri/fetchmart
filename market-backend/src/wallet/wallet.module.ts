import { Module } from '@nestjs/common';
import { WalletController } from './wallet.controller';
import { FinanceController } from './finance.controller';
import { WalletService } from './wallet.service';
import { FlutterwaveProvider } from '../payments/providers/flutterwave.provider';
import { AuthModule } from '../auth';
import { SettingsModule } from '../settings';

@Module({
  imports: [AuthModule, SettingsModule],
  controllers: [WalletController, FinanceController],
  providers: [WalletService, FlutterwaveProvider],
  exports: [WalletService],
})
export class WalletModule {}
