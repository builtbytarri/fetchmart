import { Module, forwardRef } from '@nestjs/common';
import { StoresController } from './stores.controller';
import { StoresService } from './stores.service';
import { AuthModule } from '../auth';
import { ProductsModule } from '../products';
import { DeliveryModule } from '../delivery/delivery.module';
import { NotificationsModule } from '../notifications';
import { PaymentsModule } from '../payments/payments.module';
import { JobsModule } from '../jobs/jobs.module';

@Module({
  imports: [
    AuthModule,
    forwardRef(() => ProductsModule),
    forwardRef(() => DeliveryModule),
    NotificationsModule,
    forwardRef(() => PaymentsModule),
    JobsModule,
  ],
  controllers: [StoresController],
  providers: [StoresService],
  exports: [StoresService],
})
export class StoresModule {}
