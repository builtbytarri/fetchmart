import { Injectable, Inject } from '@nestjs/common';
import type { StorageProvider } from './storage.interface';
import { STORAGE_PROVIDER, SignedUrlResult } from './storage.interface';

@Injectable()
export class StorageService {
  constructor(
    @Inject(STORAGE_PROVIDER) private readonly storageProvider: StorageProvider,
  ) {}

  async getUploadUrl(
    folder: string,
    filename: string,
    contentType: string,
  ): Promise<SignedUrlResult> {
    const key = `${folder}/${Date.now()}_${filename}`;
    return this.storageProvider.getSignedUploadUrl(key, contentType);
  }

  getPublicUrl(key: string): string {
    return this.storageProvider.getPublicUrl(key);
  }

  async deleteFile(key: string): Promise<boolean> {
    return this.storageProvider.deleteFile(key);
  }
}
