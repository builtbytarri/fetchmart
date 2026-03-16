import { Injectable, Logger } from '@nestjs/common';
import { AppConfigService } from '../config';
import type { StorageProvider } from './storage.interface';
import { SignedUrlResult } from './storage.interface';

@Injectable()
export class R2StorageProvider implements StorageProvider {
  private readonly logger = new Logger(R2StorageProvider.name);

  constructor(private readonly appConfig: AppConfigService) {}

  async getSignedUploadUrl(
    key: string,
    contentType: string,
    expiresIn: number = 3600,
  ): Promise<SignedUrlResult> {
    const r2Config = this.appConfig.getR2Config();
    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    const uploadUrl = `https://${r2Config.accountId}.r2.cloudflarestorage.com/${r2Config.bucketName}/${key}`;
    const publicUrl = this.getPublicUrl(key);

    return {
      uploadUrl,
      publicUrl,
      key,
      expiresAt,
    };
  }

  getPublicUrl(key: string): string {
    const r2Config = this.appConfig.getR2Config();
    return `https://${r2Config.bucketName}.r2.dev/${key}`;
  }

  async deleteFile(key: string): Promise<boolean> {
    this.logger.log(`Delete file: ${key}`);
    return true;
  }
}
