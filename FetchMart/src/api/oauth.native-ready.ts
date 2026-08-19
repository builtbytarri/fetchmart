/**
 * REAL OAuth implementation — use this file once you have a native build.
 *
 * To activate:
 *  1. Complete todo.txt steps (Google client IDs + Apple capability)
 *  2. Run: npx expo prebuild --clean && npx expo run:ios
 *  3. Rename this file to oauth.ts (replacing the stub)
 */

import { Platform } from 'react-native';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import * as AppleAuthentication from 'expo-apple-authentication';
import {
  GOOGLE_OAUTH_IOS_CLIENT_ID,
  GOOGLE_OAUTH_WEB_CLIENT_ID,
} from '../constants/config';

export interface GoogleAuthResult { idToken: string }
export interface AppleAuthResult {
  identityToken: string;
  firstName?: string;
  lastName?: string;
}

let _configured = false;
function ensureConfigured() {
  if (_configured) return;
  GoogleSignin.configure({
    iosClientId: GOOGLE_OAUTH_IOS_CLIENT_ID,
    webClientId: GOOGLE_OAUTH_WEB_CLIENT_ID,
    offlineAccess: false,
    scopes: ['profile', 'email'],
  });
  _configured = true;
}

export const googleAuth = {
  isAvailable: () => true,

  async signIn(): Promise<GoogleAuthResult> {
    ensureConfigured();
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const result = await GoogleSignin.signIn();
    const idToken = (result as any)?.data?.idToken ?? (result as any)?.idToken ?? null;
    if (!idToken) throw new Error('Google did not return an idToken');
    return { idToken };
  },

  async signOut() {
    try { await GoogleSignin.signOut(); } catch {}
  },

  statusCodes,
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
