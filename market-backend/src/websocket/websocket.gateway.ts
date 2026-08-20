import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { AppConfigService } from '../config';

interface TokenPayload {
  userId: string;
  role: string;
  exp: number;
}

// Warn client this many ms before its token expires so it can refresh without dropping
const TOKEN_EXPIRY_WARNING_MS = 60 * 1000;

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class AppWebSocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(AppWebSocketGateway.name);
  private userSockets: Map<string, Set<string>> = new Map();

  constructor(private readonly appConfig: AppConfigService) {}

  private verifyToken(token: string): TokenPayload | null {
    try {
      const jwtConfig = this.appConfig.getJwtConfig();
      return jwt.verify(token, jwtConfig.accessSecret!) as unknown as TokenPayload;
    } catch {
      return null;
    }
  }

  private scheduleExpiryWarning(client: Socket, expiresAtMs: number): ReturnType<typeof setTimeout> | null {
    const delay = expiresAtMs - Date.now() - TOKEN_EXPIRY_WARNING_MS;
    if (delay <= 0) {
      // Token already near expiry — warn right away
      client.emit('token_expiring', { expiresAt: expiresAtMs });
      return null;
    }
    return setTimeout(() => {
      client.emit('token_expiring', { expiresAt: expiresAtMs });
    }, delay);
  }

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token || client.handshake.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        this.logger.warn(`Client ${client.id} connection rejected: No token`);
        client.disconnect();
        return;
      }

      const payload = this.verifyToken(token);
      if (!payload) {
        this.logger.warn(`Client ${client.id} connection rejected: Invalid token`);
        client.disconnect();
        return;
      }

      client.data.userId = payload.userId;
      client.data.role = payload.role;

      await client.join(`user:${payload.userId}`);
      // Admins join a shared room so we can broadcast admin-level events.
      if (payload.role === 'ADMIN') {
        await client.join('role:ADMIN');
      }

      if (!this.userSockets.has(payload.userId)) {
        this.userSockets.set(payload.userId, new Set());
      }
      this.userSockets.get(payload.userId)!.add(client.id);

      client.data.expiryWarningTimer = this.scheduleExpiryWarning(client, payload.exp * 1000);

      this.logger.log(`Client ${client.id} connected as user ${payload.userId}`);
    } catch (error) {
      this.logger.warn(`Client ${client.id} connection rejected: ${error}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    if (client.data.expiryWarningTimer) {
      clearTimeout(client.data.expiryWarningTimer);
    }

    const userId = client.data.userId;
    if (userId) {
      const sockets = this.userSockets.get(userId);
      if (sockets) {
        sockets.delete(client.id);
        if (sockets.size === 0) {
          this.userSockets.delete(userId);
        }
      }
    }
    this.logger.log(`Client ${client.id} disconnected`);
  }

  @SubscribeMessage('reauth')
  async handleReauth(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { token: string },
  ) {
    if (!data?.token) {
      client.disconnect();
      return { event: 'reauth_error', data: { message: 'No token provided' } };
    }

    const payload = this.verifyToken(data.token);
    if (!payload) {
      client.disconnect();
      return { event: 'reauth_error', data: { message: 'Invalid token' } };
    }

    if (client.data.expiryWarningTimer) {
      clearTimeout(client.data.expiryWarningTimer);
    }

    const previousUserId = client.data.userId;
    client.data.userId = payload.userId;
    client.data.role = payload.role;

    // Handles the edge case where a token belongs to a different user (should never happen in practice)
    if (previousUserId && previousUserId !== payload.userId) {
      await client.leave(`user:${previousUserId}`);
      await client.join(`user:${payload.userId}`);
    }

    client.data.expiryWarningTimer = this.scheduleExpiryWarning(client, payload.exp * 1000);

    this.logger.log(`Client ${client.id} re-authenticated as user ${payload.userId}`);
    return { event: 'reauth_success', data: { userId: payload.userId } };
  }

  @SubscribeMessage('subscribe:order')
  async handleSubscribeOrder(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { orderId: string },
  ) {
    await client.join(`order:${data.orderId}`);
    return { event: 'subscribed', data: { channel: `order:${data.orderId}` } };
  }

  @SubscribeMessage('subscribe:store')
  async handleSubscribeStore(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { storeId: string },
  ) {
    if (client.data.role !== 'STORE') {
      return { event: 'error', data: { message: 'Unauthorized' } };
    }
    await client.join(`store:${data.storeId}`);
    return { event: 'subscribed', data: { channel: `store:${data.storeId}` } };
  }

  @SubscribeMessage('subscribe:rider')
  async handleSubscribeRider(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { riderId: string },
  ) {
    if (client.data.role !== 'RIDER') {
      return { event: 'error', data: { message: 'Unauthorized' } };
    }
    await client.join(`rider:${data.riderId}`);
    return { event: 'subscribed', data: { channel: `rider:${data.riderId}` } };
  }

  emitToUser(userId: string, event: string, data: unknown) {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  emitToOrder(orderId: string, event: string, data: unknown) {
    this.server.to(`order:${orderId}`).emit(event, data);
  }

  emitToStore(storeId: string, event: string, data: unknown) {
    this.server.to(`store:${storeId}`).emit(event, data);
  }

  emitToRider(riderId: string, event: string, data: unknown) {
    this.server.to(`rider:${riderId}`).emit(event, data);
  }

  emitOrderStatusChanged(orderId: string, newStatus: string, additionalData?: Record<string, unknown>) {
    this.emitToOrder(orderId, 'order_status_changed', {
      orderId,
      newStatus,
      ...(additionalData || {}),
    });
  }

  emitRiderAssigned(orderId: string, riderSummary: unknown) {
    this.emitToOrder(orderId, 'rider_assigned', {
      orderId,
      rider: riderSummary,
    });
  }

  emitRiderLocationUpdate(riderId: string, latitude: number, longitude: number) {
    this.emitToRider(riderId, 'rider_location_update', {
      riderId,
      latitude,
      longitude,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Broadcast rider position to everyone subscribed to the order room.
   * Called by RidersService.updateLocation() whenever a rider with an
   * active delivery pings their GPS. The customer's tracking screen
   * listens on this event to update the live map marker.
   */
  emitRiderLocationToOrder(
    orderId: string,
    riderId: string,
    latitude: number,
    longitude: number,
  ) {
    this.emitToOrder(orderId, 'rider_location_update', {
      riderId,
      latitude,
      longitude,
      timestamp: new Date().toISOString(),
    });
  }

  emitDeliveryCompleted(orderId: string) {
    this.emitToOrder(orderId, 'delivery_completed', {
      orderId,
      completedAt: new Date().toISOString(),
    });
  }

  /** Broadcast an event to all connected admin users. */
  emitToAdmin(event: string, data: unknown) {
    this.server.to('role:ADMIN').emit(event, data);
  }
}
