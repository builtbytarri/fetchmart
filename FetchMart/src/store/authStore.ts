import { create } from 'zustand';
import { User, UserRole } from '../types';
import { authApi, LoginRequest, RegisterRequest, googleAuth, appleAuth, notificationsApi } from '../api';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  /**
   * Browsing without an account (App Store Guideline 5.1.1(v)): catalogue
   * browsing must be open; only account-based features require sign-in.
   */
  isGuest: boolean;
  error: string | null;

  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  signInWithGoogle: (role?: UserRole) => Promise<void>;
  signInWithApple: (role?: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  continueAsGuest: () => void;
  /** Leave guest mode and return to the auth screens (e.g. to sign in). */
  exitGuest: () => void;
  loadUser: () => Promise<void>;
  clearError: () => void;
  /** Merge partial updates into the cached user without a round-trip to the server */
  patchUser: (partial: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  isAuthenticated: false,
  isGuest: false,
  error: null,

  continueAsGuest: () => set({ isGuest: true }),
  exitGuest: () => set({ isGuest: false }),

  login: async (data: LoginRequest) => {
    set({ isLoading: true, error: null });
    try {
      await authApi.login(data);
      const user = await authApi.getMe();
      set({ user, isAuthenticated: true, isGuest: false, isLoading: false });
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
      set({ user, isAuthenticated: true, isGuest: false, isLoading: false });
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
      set({ user, isAuthenticated: true, isGuest: false, isLoading: false });
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
      set({ user, isAuthenticated: true, isGuest: false, isLoading: false });
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
      // Deregister push token before logging out so this device stops receiving
      // notifications for this account.
      await notificationsApi.clearToken().catch(() => {});
      await authApi.logout();
      await googleAuth.signOut();
    } finally {
      set({ user: null, isAuthenticated: false, isGuest: false, isLoading: false });
    }
  },

  loadUser: async () => {
    set({ isLoading: true });
    try {
      const isAuth = await authApi.isAuthenticated();
      if (isAuth) {
        const user = await authApi.getMe();
        set({ user, isAuthenticated: true, isGuest: false, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },

  clearError: () => set({ error: null }),

  patchUser: (partial: Partial<User>) =>
    set((state) => ({
      user: state.user ? { ...state.user, ...partial } : state.user,
    })),
}));
