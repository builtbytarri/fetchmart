export const API_BASE_URL = __DEV__
  ? 'http://localhost:3000'
  : (process.env.EXPO_PUBLIC_API_URL ?? 'https://api.fetchmart.com.ng');

export const SOCKET_URL = __DEV__
  ? 'http://localhost:3000'
  : (process.env.EXPO_PUBLIC_SOCKET_URL ?? 'https://api.fetchmart.com.ng');

export const APP_NAME = 'FetchMart';

export const COLORS = {
  // ── Brand colours — extracted from official logo ──────────────────────────
  // Primary: the vivid fresh green used in the leaf, wordmark and arc
  primary:       '#38B449',
  primaryDark:   '#2A8A37',
  primaryLight:  '#E8F7EB',

  // Accent: warm tomato-coral from the shopping bag body — use sparingly
  accent:        '#E8572C',
  accentDark:    '#C1421C',
  accentLight:   '#FEF0EB',
  // ─────────────────────────────────────────────────────────────────────────

  secondary:     '#FF9800',
  secondaryDark: '#F57C00',
  secondaryLight:'#FFF3E0',
  background:    '#FFFFFF',
  surface:       '#F8F9FA',
  text:          '#1A1A1A',
  textSecondary: '#6C757D',
  border:        '#E4E7EB',
  error:         '#DC3545',
  success:       '#28A745',
  warning:       '#FFC107',
  white:         '#FFFFFF',
  black:         '#000000',
};

export const FONTS = {
  regular: 'System',
  medium: 'System',
  bold: 'System',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

// Mapbox public token — loaded from EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN in .env
export const MAPBOX_ACCESS_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN ?? '';

// Google Sign-In OAuth client IDs from Google Cloud Console.
// Create three "OAuth 2.0 Client ID" entries:
//   iOS     → bundle ID `com.anonymous.FetchMart`
//   Android → package name + SHA-1 fingerprint of the signing key
//   Web     → required by the Android SDK to mint idTokens, even on mobile
export const GOOGLE_OAUTH_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? '';
export const GOOGLE_OAUTH_ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ?? '';
export const GOOGLE_OAUTH_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '';
