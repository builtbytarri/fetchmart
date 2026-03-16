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
}

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

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token || client.handshake.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        this.logger.warn(`Client ${client.id} connection rejected: No token`);
        client.disconnect();
        return;
      }

      const jwtConfig = this.appConfig.getJwtConfig();
      const payload = jwt.verify(token, jwtConfig.accessSecret!) as unknown as TokenPayload;
      
      client.data.userId = payload.userId;
      client.data.role = payload.role;

      await client.join(`user:${payload.userId}`);

      if (!this.userSockets.has(payload.userId)) {
        this.userSockets.set(payload.userId, new Set());
      }
      this.userSockets.get(payload.userId)!.add(client.id);

      this.logger.log(`Client ${client.id} connected as user ${payload.userId}`);
    } catch (error) {
      this.logger.warn(`Client ${client.id} connection rejected: Invalid token`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
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

  emitDeliveryCompleted(orderId: string) {
    this.emitToOrder(orderId, 'delivery_completed', {
      orderId,
      completedAt: new Date().toISOString(),
    });
  }
}
