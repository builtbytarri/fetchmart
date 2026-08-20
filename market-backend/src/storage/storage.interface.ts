/**
 * Upload instructions handed to the client.
 *
 * Providers differ in how they accept a direct browser/app upload, so the
 * result carries the HTTP method and any form fields the client must send.
 * The client never sees the API secret — only a short-lived signature.
 */
export interface SignedUploadResult {
  /** Absolute URL the client uploads to. */
  uploadUrl: string;
  /** POST = multipart form upload (Cloudinary); PUT = raw binary body (S3/R2). */
  method: 'POST' | 'PUT';
  /**
   * Multipart fields that must accompany a POST upload (signature, timestamp,
   * api key, folder…). Empty for PUT providers.
   */
  fields: Record<string, string>;
  /**
   * Where the file will be readable once uploaded. POST providers also return
   * the canonical URL in their response body — prefer that when present, since
   * it carries the provider's own versioning.
   */
  publicUrl: string;
  /** Storage key / public id, for later deletion. */
  key: string;
  expiresAt: Date;
}

export interface StorageProvider {
  getSignedUpload(
    key: string,
    contentType: string,
    expiresIn?: number,
  ): Promise<SignedUploadResult>;
  getPublicUrl(key: string): string;
  deleteFile(key: string): Promise<boolean>;
}

export const STORAGE_PROVIDER = 'STORAGE_PROVIDER';

/** Image types accepted for upload. Anything else is rejected before signing. */
export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
] as const;
