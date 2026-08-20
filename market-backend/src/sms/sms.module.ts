import { Global, Module } from '@nestjs/common';
import { SmsService } from './sms.service';
import { MockSmsProvider } from './providers/mock.provider';
import { TermiiSmsProvider } from './providers/termii.provider';
import { SMS_PROVIDER } from './sms.interface';
import { AppConfigModule, AppConfigService } from '../config';

@Global()
@Module({
  imports: [AppConfigModule],
  providers: [
    {
      provide: SMS_PROVIDER,
      // Selected at boot from SMS_PROVIDER so local development never spends
      // Termii credits, while production sends for real.
      useFactory: (config: AppConfigService, termii: TermiiSmsProvider) =>
        config.getSmsConfig().provider === 'termii' ? termii : new MockSmsProvider(),
      inject: [AppConfigService, TermiiSmsProvider],
    },
    TermiiSmsProvider,
    SmsService,
  ],
  exports: [SmsService],
})
export class SmsModule {}
