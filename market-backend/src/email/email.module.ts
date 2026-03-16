import { Global, Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { MockEmailProvider } from './providers/mock.provider';
import { EMAIL_PROVIDER } from './email.interface';

@Global()
@Module({
  providers: [
    {
      provide: EMAIL_PROVIDER,
      useClass: MockEmailProvider,
    },
    EmailService,
  ],
  exports: [EmailService],
})
export class EmailModule {}
