import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database';

const EXPO_PUSH_URL = 'https://exp.host/--/exponent-push-notifications/api/send';

interface ExpoPushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: 'default';
  badge?: number;
  channelId?: string;
}

interface ExpoTicket {
  status: 'ok' | 'error';
  id?: string;
  message?: string;
  details?: { error?: string };
}

export type NotificationCategory = 'order' | 'promotion' | 'new_store' | 'general';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ── Token registration ────────────────────────────────────────────────────

  async registerToken(userId: string, token: string): Promise<void> {
    await this.prisma.user.update({ where: { id: userId }, data: { pushToken: token } });
  }

  async clearToken(userId: string): Promise<void> {
    await this.prisma.user.update({ where: { id: userId }, data: { pushToken: null } });
  }

  // ── Core send helpers ─────────────────────────────────────────────────────

  async sendToUser(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, unknown>,
    category: NotificationCategory = 'general',
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        pushToken: true,
        notifyPush: true,
        notifyOrderUpdates: true,
        notifyPromotions: true,
        notifyNewStores: true,
      },
    });
    if (!user?.pushToken || !user.notifyPush) return;
    if (category === 'order' && !user.notifyOrderUpdates) return;
    if (category === 'promotion' && !user.notifyPromotions) return;
    if (category === 'new_store' && !user.notifyNewStores) return;
    await this.sendRaw([{ to: user.pushToken, title, body, data, sound: 'default' }]);
  }

  async sendToUsers(
    userIds: string[],
    title: string,
    body: string,
    data?: Record<string, unknown>,
  ): Promise<void> {
    if (userIds.length === 0) return;
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds }, pushToken: { not: null }, notifyPush: true },
      select: { pushToken: true },
    });
    const messages: ExpoPushMessage[] = users
      .filter((u) => u.pushToken)
      .map((u) => ({ to: u.pushToken!, title, body, data, sound: 'default' }));
    if (messages.length > 0) await this.sendRaw(messages);
  }

  // ── Typed event helpers ───────────────────────────────────────────────────

  /** Store owner: a new paid order just came in */
  async notifyStoreNewOrder(storeOwnerUserId: string, orderId: string, total: number) {
    await this.sendToUser(
      storeOwnerUserId,
      'New order!',
      `You have a new order — ₦${total.toLocaleString('en-NG')}. Tap to review.`,
      { screen: 'StoreOrders', orderId },
      'order',
    );
  }

  /** Customer: store confirmed the order */
  async notifyCustomerOrderConfirmed(customerId: string, orderId: string, storeName: string) {
    await this.sendToUser(
      customerId,
      'Order confirmed',
      `${storeName} accepted your order and is preparing it.`,
      { screen: 'OrderDetails', orderId },
      'order',
    );
  }

  /** Rider: new delivery offer (push backup alongside WebSocket) */
  async notifyRiderOffer(riderUserId: string, orderId: string, storeName: string) {
    await this.sendToUser(
      riderUserId,
      'New delivery offer',
      `Pickup from ${storeName}. Tap to accept or decline.`,
      { screen: 'RiderDashboard', orderId },
      'order',
    );
  }

  /** Customer: order is ready and rider is heading to the store */
  async notifyCustomerOrderReady(customerId: string, orderId: string) {
    await this.sendToUser(
      customerId,
      'Order ready!',
      'Your order is packed and a rider is heading to pick it up.',
      { screen: 'OrderDetails', orderId },
      'order',
    );
  }

  /** Customer: order was cancelled and refunded */
  async notifyCustomerOrderCancelled(customerId: string, orderId: string) {
    await this.sendToUser(
      customerId,
      'Order cancelled',
      'Your order was cancelled and a refund is on its way to your account.',
      { screen: 'OrderDetails', orderId },
      'order',
    );
  }

  /** Customer: rider picked up the order */
  async notifyCustomerPickedUp(customerId: string, orderId: string) {
    await this.sendToUser(
      customerId,
      'On the way!',
      'Your rider picked up your order and is heading to you.',
      { screen: 'OrderDetails', orderId },
      'order',
    );
  }

  /** Customer: order delivered */
  async notifyCustomerDelivered(customerId: string, orderId: string) {
    await this.sendToUser(
      customerId,
      'Delivered!',
      'Your order has been delivered. Enjoy!',
      { screen: 'OrderDetails', orderId },
      'order',
    );
  }

  // ── Expo push API ─────────────────────────────────────────────────────────

  private async sendRaw(messages: ExpoPushMessage[]): Promise<void> {
    // Expo accepts up to 100 messages per request — chunk if needed.
    const chunks = this.chunk(messages, 100);
    for (const chunk of chunks) {
      try {
        const res = await fetch(EXPO_PUSH_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify(chunk),
        });

        if (!res.ok) {
          this.logger.warn(`Expo push HTTP ${res.status}: ${await res.text()}`);
          return;
        }

        const json = (await res.json()) as { data: ExpoTicket[] };
        for (const ticket of json.data ?? []) {
          if (ticket.status === 'error') {
            this.logger.warn(`Expo push error: ${ticket.message} (${ticket.details?.error})`);
          }
        }
      } catch (err) {
        this.logger.error('Expo push threw', err);
      }
    }
  }

  private chunk<T>(arr: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size));
    return chunks;
  }
}
