export interface StorageProvider {
  getSignedUploadUrl(key: string, contentType: string, expiresIn?: number): Promise<SignedUrlResult>;
  getPublicUrl(key: string): string;
  deleteFile(key: string): Promise<boolean>;
}

export interface SignedUrlResult {
  uploadUrl: string;
  publicUrl: string;
  key: string;
  expiresAt: Date;
}

export const STORAGE_PROVIDER = 'STORAGE_PROVIDER';
