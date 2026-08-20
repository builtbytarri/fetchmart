import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { FlutterwaveProvider } from './providers/flutterwave.provider';
import { PAYMENT_PROVIDER } from './payment.interface';
import { AuthModule } from '../auth';
import { OrdersModule } from '../orders';
import { WalletModule } from '../wallet';
import { NotificationsModule } from '../notifications';
import { CouponsModule } from '../coupons';
import { JobsModule } from '../jobs/jobs.module';

@Module({
  imports: [AuthModule, OrdersModule, WalletModule, NotificationsModule, CouponsModule, JobsModule],
  controllers: [PaymentsController],
  providers: [
    {
      provide: PAYMENT_PROVIDER,
      useClass: FlutterwaveProvider,
    },
    PaymentsService,
  ],
  exports: [PaymentsService],
})
export class PaymentsModule {}
