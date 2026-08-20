import { Module } from '@nestjs/common';
import { StorageController } from './storage.controller';
import { StorageService } from './storage.service';
import { CloudinaryStorageProvider } from './cloudinary.provider';
import { STORAGE_PROVIDER } from './storage.interface';
import { AuthModule } from '../auth';

@Module({
  imports: [AuthModule],
  controllers: [StorageController],
  providers: [
    {
      provide: STORAGE_PROVIDER,
      useClass: CloudinaryStorageProvider,
    },
    StorageService,
  ],
  exports: [StorageService],
})
export class StorageModule {}
