/**
 * fetchJson — GET JSON via XMLHttpRequest with an explicit TEXT response type.
 *
 * Why not `fetch(url).then(r => r.json())`? On iOS, React Native delivers the
 * response body as a Blob and `.json()`/`.text()` read it through the native
 * FileReader, which intermittently throws:
 *   "Unable to resolve data for blob: <uuid>"
 * (the blob is released before it's read). Forcing `responseType = 'text'`
 * keeps the body a plain string and never touches the Blob module — so direct
 * calls to third-party JSON APIs (Mapbox Directions / Geocoding) are reliable.
 *
 * Supports cancellation via an optional AbortSignal (for debounced search).
 */
export function fetchJson<T = any>(
  url: string,
  options?: { signal?: AbortSignal; timeout?: number },
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', url);
    xhr.responseType = 'text';
    xhr.timeout = options?.timeout ?? 15000;

    const makeAbortError = () => {
      const err = new Error('Aborted');
      err.name = 'AbortError';
      return err;
    };

    const signal = options?.signal;
    const onAbort = () => {
      xhr.abort();
      reject(makeAbortError());
    };
    if (signal) {
      if (signal.aborted) {
        reject(makeAbortError());
        return;
      }
      signal.addEventListener('abort', onAbort);
    }

    const cleanup = () => signal?.removeEventListener('abort', onAbort);

    xhr.onload = () => {
      cleanup();
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText));
        } catch (e) {
          reject(e);
        }
      } else {
        reject(new Error(`HTTP ${xhr.status}`));
      }
    };
    xhr.onerror = () => {
      cleanup();
      reject(new Error('Network error'));
    };
    xhr.ontimeout = () => {
      cleanup();
      reject(new Error('Request timed out'));
    };
    xhr.send();
  });
}
