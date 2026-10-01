/**
 * OAuth — Apple Sign In is live; Google is stubbed.
 *
 * Apple works with no extra credentials: the client gets an identity token from
 * the OS and the backend verifies it against Apple's JWKs (see oauth.service.ts).
 * The only requirements are `usesAppleSignIn` in app.json, the "Sign In with
 * Apple" capability on the App ID, and APPLE_BUNDLE_ID set on the server.
 *
 * Google needs OAuth client IDs from Google Cloud Console. Until those exist the
 * @react-native-google-signin plugin is deliberately left out of app.json — its
 * placeholder `iosUrlScheme` gets baked into Info.plist and App Store Connect
 * rejects the binary (ITMS-90158). To enable Google later:
 *   1. Create iOS / Android / Web OAuth client IDs, put them in .env
 *   2. Re-add the plugin to app.json with the real reversed iOS client ID
 *   3. Swap the googleAuth export below for the one in oauth.native-ready.ts
 *
 * AuthLandingScreen checks availability before rendering either button, so the
 * Google button stays hidden while it is stubbed.
 */

import { Platform } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';

export interface GoogleAuthResult { idToken: string }
export interface AppleAuthResult {
  identityToken: string;
  firstName?: string;
  lastName?: string;
}

export const googleAuth = {
  isAvailable: () => false as boolean,
  async signIn(): Promise<GoogleAuthResult> {
    throw new Error('Google Sign-In is not configured yet.');
  },
  async signOut() {},
  statusCodes: { SIGN_IN_CANCELLED: -1, IN_PROGRESS: -2, PLAY_SERVICES_NOT_AVAILABLE: -3 },
};

export const appleAuth = {
  async isAvailable() {
    if (Platform.OS !== 'ios') return false;
    try { return await AppleAuthentication.isAvailableAsync(); } catch { return false; }
  },

  async signIn(): Promise<AppleAuthResult> {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });
    if (!credential.identityToken) throw new Error('Apple did not return an identity token');
    return {
      identityToken: credential.identityToken,
      firstName: credential.fullName?.givenName ?? undefined,
      lastName: credential.fullName?.familyName ?? undefined,
    };
  },

  getNativeModule: () => AppleAuthentication,
};
