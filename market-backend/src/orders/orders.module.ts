import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { AuthModule } from '../auth';
import { PricingModule } from '../pricing';
import { CouponsModule } from '../coupons';

@Module({
  imports: [AuthModule, PricingModule, CouponsModule],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
