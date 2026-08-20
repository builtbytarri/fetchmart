import { api } from './client';

export type UploadFolder = 'products' | 'stores' | 'avatars';

interface SignedUpload {
  uploadUrl: string;
  method: 'POST' | 'PUT';
  fields: Record<string, string>;
  publicUrl: string;
  key: string;
  expiresAt: string;
}

/** Map a picked file's extension to the MIME type the backend accepts. */
function contentTypeFor(uri: string): string {
  const ext = uri.split('?')[0].split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    case 'heic':
      return 'image/heic';
    case 'heif':
      return 'image/heif';
    default:
      return 'image/jpeg';
  }
}

export const storageApi = {
  /**
   * Upload a locally-picked image and return its public URL.
   *
   * The bytes go straight from the device to the storage provider using a
   * short-lived signature minted by our backend — they never pass through our
   * server, which keeps uploads fast on mobile data and keeps the API secret
   * off the device.
   */
  uploadImage: async (localUri: string, folder: UploadFolder): Promise<string> => {
    const contentType = contentTypeFor(localUri);
    const filename = localUri.split('/').pop() || 'image.jpg';

    const { data: signed } = await api.post<SignedUpload>('/storage/upload-url', {
      folder,
      filename,
      contentType,
    });

    if (signed.method === 'POST') {
      const form = new FormData();
      Object.entries(signed.fields).forEach(([k, v]) => form.append(k, v));
      // React Native's FormData takes this {uri, name, type} shape for files.
      form.append('file', { uri: localUri, name: filename, type: contentType } as any);

      const res = await fetch(signed.uploadUrl, { method: 'POST', body: form });
      if (!res.ok) {
        throw new Error(`Upload failed (${res.status})`);
      }
      // Prefer the provider's own URL — it carries their versioning.
      const json = (await res.json()) as { secure_url?: string };
      return json.secure_url ?? signed.publicUrl;
    }

    const blob = await (await fetch(localUri)).blob();
    const res = await fetch(signed.uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': contentType },
      body: blob,
    });
    if (!res.ok) throw new Error(`Upload failed (${res.status})`);
    return signed.publicUrl;
  },
};
