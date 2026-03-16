import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { KorahPayProvider } from './providers/korah-pay.provider';
import { PAYMENT_PROVIDER } from './payment.interface';
import { AuthModule } from '../auth';

@Module({
  imports: [AuthModule],
  controllers: [PaymentsController],
  providers: [
    {
      provide: PAYMENT_PROVIDER,
      useClass: KorahPayProvider,
    },
    PaymentsService,
  ],
  exports: [PaymentsService],
})
export class PaymentsModule {}
