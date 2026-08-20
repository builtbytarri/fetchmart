import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { AppConfigService } from '../config';
import type { StorageProvider } from './storage.interface';
import { SignedUploadResult } from './storage.interface';

/**
 * Cloudinary signed direct upload.
 *
 * The app never holds the API secret. We sign the upload parameters here and
 * hand the client a short-lived signature it posts alongside the file, so the
 * image bytes go straight from the device to Cloudinary and never transit this
 * server.
 *
 * Signature rule (Cloudinary): take every signed parameter except `file`,
 * `cloud_name`, `resource_type` and `api_key`, sort by key, join as
 * `k=v&k=v`, append the API secret, then SHA-1 the result.
 */
@Injectable()
export class CloudinaryStorageProvider implements StorageProvider {
  private readonly logger = new Logger(CloudinaryStorageProvider.name);

  constructor(private readonly appConfig: AppConfigService) {}

  private config() {
    const { cloudName, apiKey, apiSecret } = this.appConfig.getCloudinaryConfig();
    if (!cloudName || !apiKey || !apiSecret) {
      // Fail loudly rather than handing back a URL that will silently 401 —
      // a broken-but-plausible upload URL is what made this bug hard to spot.
      throw new ServiceUnavailableException(
        'Image uploads are not configured. Set CLOUDINARY_CLOUD_NAME, ' +
          'CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET.',
      );
    }
    return { cloudName, apiKey, apiSecret };
  }

  private sign(params: Record<string, string | number>, apiSecret: string): string {
    const canonical = Object.keys(params)
      .sort()
      .map((k) => `${k}=${params[k]}`)
      .join('&');
    return createHash('sha1').update(canonical + apiSecret).digest('hex');
  }

  async getSignedUpload(
    key: string,
    _contentType: string,
    expiresIn = 3600,
  ): Promise<SignedUploadResult> {
    const { cloudName, apiKey, apiSecret } = this.config();

    const timestamp = Math.floor(Date.now() / 1000);
    // `key` doubles as the Cloudinary public_id, so deleteFile() can address
    // the asset later without us storing a second identifier.
    const signedParams = { public_id: key, timestamp };
    const signature = this.sign(signedParams, apiSecret);

    return {
      uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      method: 'POST',
      fields: {
        api_key: apiKey,
        timestamp: String(timestamp),
        public_id: key,
        signature,
      },
      publicUrl: this.getPublicUrl(key),
      key,
      expiresAt: new Date(Date.now() + expiresIn * 1000),
    };
  }

  /**
   * Delivery URL. `f_auto,q_auto` lets Cloudinary pick the best format and
   * quality per device, which matters on the Nigerian mobile networks most of
   * our users are on.
   */
  getPublicUrl(key: string): string {
    const { cloudName } = this.config();
    return `https://res.cloudinary.com/${cloudName}/image/upload/f_auto,q_auto/${key}`;
  }

  async deleteFile(key: string): Promise<boolean> {
    const { cloudName, apiKey, apiSecret } = this.config();

    const timestamp = Math.floor(Date.now() / 1000);
    const signature = this.sign({ public_id: key, timestamp }, apiSecret);

    const body = new URLSearchParams({
      public_id: key,
      timestamp: String(timestamp),
      api_key: apiKey,
      signature,
    });

    try {
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`,
        { method: 'POST', body },
      );
      const json = (await res.json()) as { result?: string };
      const ok = json.result === 'ok' || json.result === 'not found';
      if (!ok) this.logger.warn(`Cloudinary delete failed for ${key}: ${json.result}`);
      return ok;
    } catch (err) {
      this.logger.error(`Cloudinary delete errored for ${key}`, err as Error);
      return false;
    }
  }
}
