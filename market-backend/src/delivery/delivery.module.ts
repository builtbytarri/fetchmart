import { Module } from '@nestjs/common';
import { DeliveryController } from './delivery.controller';
import { DeliveryService } from './delivery.service';
import { AuthModule } from '../auth';
import { RidersModule } from '../riders';
import { PricingModule } from '../pricing';
import { WalletModule } from '../wallet';
import { NotificationsModule } from '../notifications';
import { JobsModule } from '../jobs';

@Module({
  imports: [AuthModule, RidersModule, PricingModule, WalletModule, NotificationsModule, JobsModule],
  controllers: [DeliveryController],
  providers: [DeliveryService],
  exports: [DeliveryService],
})
export class DeliveryModule {}
