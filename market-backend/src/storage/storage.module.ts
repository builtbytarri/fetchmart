import { Module } from '@nestjs/common';
import { StorageController } from './storage.controller';
import { StorageService } from './storage.service';
import { R2StorageProvider } from './r2.provider';
import { STORAGE_PROVIDER } from './storage.interface';
import { AuthModule } from '../auth';

@Module({
  imports: [AuthModule],
  controllers: [StorageController],
  providers: [
    {
      provide: STORAGE_PROVIDER,
      useClass: R2StorageProvider,
    },
    StorageService,
  ],
  exports: [StorageService],
})
export class StorageModule {}
