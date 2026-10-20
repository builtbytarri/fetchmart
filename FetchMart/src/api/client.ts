import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '../constants/config';

const TOKEN_KEY = 'auth_tokens';
const REFRESH_PATH = '/auth/refresh';

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

class ApiClient {
  private client: AxiosInstance;
  private isRefreshing = false;
  // Requests that arrived mid-refresh. Every entry MUST be settled — resolved
  // with a fresh token or rejected — or the caller's promise hangs forever.
  private refreshSubscribers: {
    resolve: (token: string) => void;
    reject: (error: unknown) => void;
  }[] = [];

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  /** Settle every queued request with a rejection so no caller hangs. */
  private rejectRefreshSubscribers(error: unknown) {
    const waiting = this.refreshSubscribers;
    this.refreshSubscribers = [];
    waiting.forEach(({ reject }) => reject(error));
  }

  private setupInterceptors() {
    this.client.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        const tokens = await this.getTokens();
        if (tokens?.accessToken) {
          config.headers.Authorization = `Bearer ${tokens.accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        // A 401 on the refresh call itself must never be retried or queued: it
        // would wait on the very request that is failing, and nothing would
        // ever settle. Clear the session and let the caller see the error.
        if (originalRequest?.url?.includes(REFRESH_PATH)) {
          await this.clearTokens();
          this.rejectRefreshSubscribers(error);
          this.isRefreshing = false;
          return Promise.reject(error);
        }

        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.isRefreshing) {
            return new Promise((resolve, reject) => {
              this.refreshSubscribers.push({
                resolve: (token: string) => {
                  originalRequest.headers.Authorization = `Bearer ${token}`;
                  resolve(this.client(originalRequest));
                },
                reject,
              });
            });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            const tokens = await this.getTokens();
            if (!tokens?.refreshToken) {
              // Nothing to refresh with — fail fast rather than hang.
              await this.clearTokens();
              this.rejectRefreshSubscribers(error);
              return Promise.reject(error);
            }

            const response = await this.client.post(REFRESH_PATH, {
              refreshToken: tokens.refreshToken,
            });
            const newTokens: AuthTokens = response.data;
            await this.setTokens(newTokens);

            const waiting = this.refreshSubscribers;
            this.refreshSubscribers = [];
            waiting.forEach(({ resolve }) => resolve(newTokens.accessToken));

            originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`;
            return this.client(originalRequest);
          } catch (refreshError) {
            // The refresh token is expired or rejected. Drop the session and
            // settle everyone waiting, so callers fall through to signed-out.
            await this.clearTokens();
            this.rejectRefreshSubscribers(refreshError);
            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;
          }
        }

        return Promise.reject(error);
      }
    );
  }

  async getTokens(): Promise<AuthTokens | null> {
    try {
      const tokensJson = await SecureStore.getItemAsync(TOKEN_KEY);
      return tokensJson ? JSON.parse(tokensJson) : null;
    } catch {
      return null;
    }
  }

  async setTokens(tokens: AuthTokens): Promise<void> {
    await SecureStore.setItemAsync(TOKEN_KEY, JSON.stringify(tokens));
  }

  async clearTokens(): Promise<void> {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  }

  async refreshTokens(): Promise<AuthTokens | null> {
    const tokens = await this.getTokens();
    if (!tokens?.refreshToken) return null;

    try {
      const response = await this.client.post('/auth/refresh', {
        refreshToken: tokens.refreshToken,
      });
      const newTokens: AuthTokens = response.data;
      await this.setTokens(newTokens);
      return newTokens;
    } catch {
      await this.clearTokens();
      return null;
    }
  }

  get instance(): AxiosInstance {
    return this.client;
  }
}

export const apiClient = new ApiClient();
export const api = apiClient.instance;
