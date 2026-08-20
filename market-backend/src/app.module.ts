import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AppConfigModule } from './config';
import { DatabaseModule } from './database';
import { RedisModule } from './redis';
import { HealthModule } from './health';
import { AuthModule } from './auth';
import { UsersModule } from './users';
import { EmailModule } from './email';
import { SmsModule } from './sms';
import { StoresModule } from './stores';
import { ProductsModule } from './products';
import { OrdersModule } from './orders';
import { RidersModule } from './riders';
import { WebSocketModule } from './websocket';
import { DeliveryModule } from './delivery';
import { PaymentsModule } from './payments';
import { StorageModule } from './storage';
import { JobsModule } from './jobs';
import { AdminModule } from './admin/admin.module';
import { SettingsModule } from './settings';
import { PricingModule } from './pricing';
import { WalletModule } from './wallet';
import { NotificationsModule } from './notifications';
import { CouponsModule } from './coupons';

@Module({
  imports: [
    AppConfigModule,
    DatabaseModule,
    RedisModule,
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    HealthModule,
    AuthModule,
    UsersModule,
    EmailModule,
    SmsModule,
    StoresModule,
    ProductsModule,
    OrdersModule,
    RidersModule,
    WebSocketModule,
    DeliveryModule,
    PaymentsModule,
    StorageModule,
    JobsModule,
    AdminModule,
    SettingsModule,
    PricingModule,
    WalletModule,
    NotificationsModule,
    CouponsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
