export const API_BASE_URL = __DEV__ 
  ? 'http://localhost:3000' 
  : 'https://api.fetchmart.com';

export const SOCKET_URL = __DEV__
  ? 'http://localhost:3000'
  : 'https://api.fetchmart.com';

export const APP_NAME = 'FetchMart';

export const COLORS = {
  primary: '#4CAF50',
  primaryDark: '#388E3C',
  primaryLight: '#E8F5E9',
  secondary: '#FF9800',
  secondaryDark: '#F57C00',
  secondaryLight: '#FFF3E0',
  accent: '#2EC4B6',
  background: '#FFFFFF',
  surface: '#F8F9FA',
  text: '#212529',
  textSecondary: '#6C757D',
  border: '#DEE2E6',
  error: '#DC3545',
  success: '#28A745',
  warning: '#FFC107',
  white: '#FFFFFF',
  black: '#000000',
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

// Google Maps API Key - Replace with your actual key
export const GOOGLE_MAPS_API_KEY = 'YOUR_GOOGLE_MAPS_API_KEY';
