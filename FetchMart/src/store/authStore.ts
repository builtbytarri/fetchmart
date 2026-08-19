import { create } from 'zustand';
import { User, UserRole } from '../types';
import { authApi, LoginRequest, RegisterRequest, googleAuth, appleAuth } from '../api';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;

  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  signInWithGoogle: (role?: UserRole) => Promise<void>;
  signInWithApple: (role?: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  isAuthenticated: false,
  error: null,

  login: async (data: LoginRequest) => {
    set({ isLoading: true, error: null });
    try {
      await authApi.login(data);
      const user = await authApi.getMe();
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (error: any) {
      const message = error.response?.data?.message || 'Login failed';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  register: async (data: RegisterRequest) => {
    set({ isLoading: true, error: null });
    try {
      await authApi.register(data);
      const user = await authApi.getMe();
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (error: any) {
      const message = error.response?.data?.message || 'Registration failed';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  signInWithGoogle: async (role?: UserRole) => {
    set({ isLoading: true, error: null });
    try {
      const { idToken } = await googleAuth.signIn();
      await authApi.googleSignIn({ idToken, role });
      const user = await authApi.getMe();
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (error: any) {
      // Google's SDK throws specific status codes on user cancel — surface those silently.
      const code = error?.code;
      if (
        code === googleAuth.statusCodes.SIGN_IN_CANCELLED ||
        code === googleAuth.statusCodes.IN_PROGRESS
      ) {
        set({ isLoading: false });
        return;
      }
      const message = error.response?.data?.message || error.message || 'Google sign-in failed';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  signInWithApple: async (role?: UserRole) => {
    set({ isLoading: true, error: null });
    try {
      const result = await appleAuth.signIn();
      await authApi.appleSignIn({
        identityToken: result.identityToken,
        firstName: result.firstName,
        lastName: result.lastName,
        role,
      });
      const user = await authApi.getMe();
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (error: any) {
      // Apple throws ERR_REQUEST_CANCELED when the user dismisses the sheet.
      if (error?.code === 'ERR_REQUEST_CANCELED') {
        set({ isLoading: false });
        return;
      }
      const message = error.response?.data?.message || error.message || 'Apple sign-in failed';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await authApi.logout();
      // Clear native Google session too so the next sign-in shows the account picker.
      await googleAuth.signOut();
    } finally {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  loadUser: async () => {
    set({ isLoading: true });
    try {
      const isAuth = await authApi.isAuthenticated();
      if (isAuth) {
        const user = await authApi.getMe();
        set({ user, isAuthenticated: true, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
