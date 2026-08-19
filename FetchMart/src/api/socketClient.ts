import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from '../constants/config';
import { apiClient } from './client';

type EventHandler = (data: unknown) => void;

class SocketClient {
  private socket: Socket | null = null;
  private handlers: Map<string, Set<EventHandler>> = new Map();

  connect() {
    if (this.socket?.connected) return;

    this.socket = io(SOCKET_URL, {
      // Callback form ensures every (re)connection attempt uses the latest stored token,
      // so a reconnect after a network drop automatically picks up a refreshed token.
      auth: async (cb: (data: { token: string }) => void) => {
        const tokens = await apiClient.getTokens();
        cb({ token: tokens?.accessToken ?? '' });
      },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
    });

    this.socket.on('connect', () => this.reattachHandlers());

    this.socket.on('disconnect', (reason) => {
      console.log(`[Socket] Disconnected: ${reason}`);
    });

    this.socket.on('connect_error', (err) => {
      console.warn('[Socket] Connection error:', err.message);
    });

    // Backend fires this ~1 min before the access token expires
    this.socket.on('token_expiring', () => this.handleTokenExpiring());

    this.socket.on('reauth_error', () => {
      console.error('[Socket] Re-auth failed');
      this.disconnect();
    });

    this.reattachHandlers();
  }

  private async handleTokenExpiring() {
    const fresh = await apiClient.refreshTokens();
    if (fresh) {
      this.socket?.emit('reauth', { token: fresh.accessToken });
    } else {
      this.disconnect();
    }
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
  }

  on(event: string, handler: EventHandler) {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler);
    this.socket?.on(event, handler);
  }

  off(event: string, handler: EventHandler) {
    this.handlers.get(event)?.delete(handler);
    this.socket?.off(event, handler);
  }

  emit(event: string, data?: unknown) {
    this.socket?.emit(event, data);
  }

  get isConnected() {
    return this.socket?.connected ?? false;
  }

  // Called after (re)connect to restore all app-level listeners
  private reattachHandlers() {
    this.handlers.forEach((set, event) => {
      set.forEach((handler) => {
        this.socket?.off(event, handler);
        this.socket?.on(event, handler);
      });
    });
  }
}

export const socketClient = new SocketClient();
