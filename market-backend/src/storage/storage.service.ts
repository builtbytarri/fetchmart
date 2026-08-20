import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { StorageProvider } from './storage.interface';
import {
  STORAGE_PROVIDER,
  SignedUploadResult,
  ALLOWED_IMAGE_TYPES,
} from './storage.interface';

/** Folders callers may upload into. Prevents writing to arbitrary paths. */
const ALLOWED_FOLDERS = ['products', 'stores', 'avatars'] as const;
export type UploadFolder = (typeof ALLOWED_FOLDERS)[number];

@Injectable()
export class StorageService {
  constructor(
    @Inject(STORAGE_PROVIDER) private readonly storageProvider: StorageProvider,
  ) {}

  async getUploadUrl(
    folder: string,
    filename: string,
    contentType: string,
  ): Promise<SignedUploadResult> {
    if (!ALLOWED_FOLDERS.includes(folder as UploadFolder)) {
      throw new BadRequestException(
        `folder must be one of: ${ALLOWED_FOLDERS.join(', ')}`,
      );
    }
    if (!ALLOWED_IMAGE_TYPES.includes(contentType as never)) {
      throw new BadRequestException(
        `contentType must be one of: ${ALLOWED_IMAGE_TYPES.join(', ')}`,
      );
    }

    // Derive the key ourselves rather than trusting the client's filename —
    // it could otherwise contain path traversal or overwrite another asset.
    // The original extension is dropped; the provider serves by content type.
    const key = `${folder}/${Date.now()}_${randomUUID()}`;
    return this.storageProvider.getSignedUpload(key, contentType);
  }

  getPublicUrl(key: string): string {
    return this.storageProvider.getPublicUrl(key);
  }

  async deleteFile(key: string): Promise<boolean> {
    return this.storageProvider.deleteFile(key);
  }
}
