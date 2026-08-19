/**
 * OAuth stubs — active while running on a dev build that doesn't include
 * the Google/Apple native modules.
 *
 * When you're ready to enable social login:
 *  1. Get Google client IDs + enable Apple capability (see todo.txt)
 *  2. Run: npx expo prebuild --clean && npx expo run:ios
 *  3. Replace this file with oauth.native.ts (the real implementation)
 *
 * The UI checks `isAvailable()` before rendering buttons, so nothing
 * shows or crashes in the meantime.
 */

export interface GoogleAuthResult { idToken: string }
export interface AppleAuthResult {
  identityToken: string;
  firstName?: string;
  lastName?: string;
}

export const googleAuth = {
  isAvailable: () => false as boolean,
  async signIn(): Promise<GoogleAuthResult> {
    throw new Error('Google Sign-In requires a native build. See todo.txt.');
  },
  async signOut() {},
  statusCodes: { SIGN_IN_CANCELLED: -1, IN_PROGRESS: -2, PLAY_SERVICES_NOT_AVAILABLE: -3 },
};

export const appleAuth = {
  async isAvailable() { return false; },
  async signIn(): Promise<AppleAuthResult> {
    throw new Error('Apple Sign-In requires a native build. See todo.txt.');
  },
  getNativeModule: () => null as any,
};
