import { api, apiClient } from './client';
import { AuthTokens, User, UserRole } from '../types';

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  phone?: string;
  role: UserRole;
  address?: string;
  latitude?: number;
  longitude?: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface GoogleSignInRequest {
  idToken: string;
  role?: UserRole;
}

export interface AppleSignInRequest {
  identityToken: string;
  firstName?: string;
  lastName?: string;
  role?: UserRole;
}

interface AuthResponse extends AuthTokens {
  user?: { id: string; email: string; name: string; role: UserRole };
}

export const authApi = {
  register: async (data: RegisterRequest): Promise<AuthTokens> => {
    const response = await api.post<AuthTokens>('/auth/register', data);
    await apiClient.setTokens(response.data);
    return response.data;
  },

  login: async (data: LoginRequest): Promise<AuthTokens> => {
    const response = await api.post<AuthTokens>('/auth/login', data);
    await apiClient.setTokens(response.data);
    return response.data;
  },

  logout: async (): Promise<void> => {
    const tokens = await apiClient.getTokens();
    if (tokens?.refreshToken) {
      try {
        await api.post('/auth/logout', { refreshToken: tokens.refreshToken });
      } catch {
        // Ignore logout errors
      }
    }
    await apiClient.clearTokens();
  },

  forgotPassword: async (data: ForgotPasswordRequest): Promise<void> => {
    await api.post('/auth/forgot-password', data);
  },

  resetPassword: async (data: ResetPasswordRequest): Promise<void> => {
    await api.post('/auth/reset-password', data);
  },

  getMe: async (): Promise<User> => {
    const response = await api.get<User>('/users/me');
    return response.data;
  },

  isAuthenticated: async (): Promise<boolean> => {
    const tokens = await apiClient.getTokens();
    return !!tokens?.accessToken;
  },

  sendOtp: async (phone: string): Promise<{ message: string }> => {
    const response = await api.post<{ message: string }>('/auth/send-otp', { phone });
    return response.data;
  },

  verifyOtp: async (phone: string, code: string): Promise<{ verified: boolean }> => {
    const response = await api.post<{ verified: boolean }>('/auth/verify-otp', { phone, code });
    return response.data;
  },

  googleSignIn: async (data: GoogleSignInRequest): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/google', data);
    await apiClient.setTokens({ accessToken: response.data.accessToken, refreshToken: response.data.refreshToken });
    return response.data;
  },

  appleSignIn: async (data: AppleSignInRequest): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/apple', data);
    await apiClient.setTokens({ accessToken: response.data.accessToken, refreshToken: response.data.refreshToken });
    return response.data;
  },
};
