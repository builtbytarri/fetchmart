import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../database';
import { RidersService } from '../riders';
import { AppWebSocketGateway } from '../websocket';
import { PricingService } from '../pricing';
import { WalletService } from '../wallet';
import { NotificationsService } from '../notifications';
import { JobsService } from '../jobs';
import { QuoteDto } from './dto';
import { OrderStatus } from '@prisma/client';

// Statuses a rider can still act on (not yet terminal)
const ACTIVE_STATUSES: OrderStatus[] = [
  OrderStatus.ASSIGNED,
  OrderStatus.PICKED_UP,
  OrderStatus.EN_ROUTE,
  OrderStatus.ARRIVED,
];

interface DeclineRecord {
  riderId: string;
  name: string;
  declinedAt: string;
}

@Injectable()
export class DeliveryService {
  private readonly logger = new Logger(DeliveryService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ridersService: RidersService,
    private readonly wsGateway: AppWebSocketGateway,
    private readonly pricingService: PricingService,
    private readonly walletService: WalletService,
    private readonly notifications: NotificationsService,
    private readonly jobsService: JobsService,
  ) {}

  // ── Quote ──────────────────────────────────────────────────────────────────

  async getQuote(userId: string, dto: QuoteDto) {
    let destLat = dto.destLat;
    let destLng = dto.destLng;

    if (destLat == null || destLng == null) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { latitude: true, longitude: true },
      });
      if (user?.latitude == null || user?.longitude == null) {
        throw new BadRequestException(
          'No delivery location available. Please set your delivery address.',
        );
      }
      destLat = user.latitude;
      destLng = user.longitude;
    }

    return this.pricingService.getQuote({
      storeId: dto.storeId,
      destLat,
      destLng,
      items: dto.items,
    });
  }

  // ── Assignment ─────────────────────────────────────────────────────────────

  /**
   * Try to assign the nearest available rider to an order that has just been
   * accepted by the store (STORE_ACCEPTED).  The rider is sent an offer
   * notification and has 60 s to accept or decline via respondToOffer().
   *
   * Riders who already declined this order are excluded from selection.
   * If no available riders are found, the admin is notified.
   */
  async autoAssignRider(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { store: true },
    });

    if (!order) throw new NotFoundException('Order not found');

    // Allow auto-assign once the store has accepted (PREPARING — early dispatch)
    // or when it marks the order READY (fallback). STORE_ACCEPTED kept for any
    // legacy in-flight orders.
    if (
      order.status !== OrderStatus.STORE_ACCEPTED &&
      order.status !== OrderStatus.PREPARING &&
      order.status !== OrderStatus.READY
    ) {
      throw new BadRequestException(
        'Order must be accepted (PREPARING) or READY before rider assignment',
      );
    }

    const declines: DeclineRecord[] = Array.isArray(order.riderDeclines)
      ? (order.riderDeclines as unknown as DeclineRecord[])
      : [];
    const excludeIds = declines.map(d => d.riderId);

    const nearbyRiders = await this.ridersService.findNearbyAvailable(
      order.store.latitude,
      order.store.longitude,
      15, // 15 km radius
      excludeIds,
    );

    if (!nearbyRiders.length) {
      // Notify admin — no available rider found (or all have declined).
      this.wsGateway.emitToAdmin('no_rider_available', {
        orderId,
        declineCount: declines.length,
        message: declines.length
          ? `All ${declines.length} nearest rider(s) declined order #${orderId.slice(0, 8)}`
          : `No available riders within 15 km for order #${orderId.slice(0, 8)}`,
      });
      return { assigned: false, message: 'No available riders nearby' };
    }

    // Pick the top-scored rider (already sorted by DeliveryService).
    const selectedRider = nearbyRiders[0];

    // Update order to ASSIGNED immediately.
    const updatedOrder = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        riderId: selectedRider.id,
        status: OrderStatus.ASSIGNED,
        assignedAt: new Date(),
      },
      include: {
        store: { select: { id: true, name: true, latitude: true, longitude: true } },
        customer: { select: { id: true, name: true, phone: true, address: true, latitude: true, longitude: true } },
        rider: { select: { id: true, user: { select: { id: true, name: true, phone: true } } } },
        orderItems: { select: { productName: true, quantity: true, unitPrice: true } },
      },
    });

    // Notify rider to accept or decline within 60 s (WebSocket + push backup).
    this.wsGateway.emitToRider(selectedRider.id, 'order_offered', {
      orderId,
      store: { id: updatedOrder.store.id, name: updatedOrder.store.name },
      riderPayout: order.riderPayout,
      timeoutSeconds: 60,
    });
    this.notifications.notifyRiderOffer(selectedRider.userId, orderId, updatedOrder.store.name);

    // Notify everyone on the order channel.
    this.wsGateway.emitOrderStatusChanged(orderId, OrderStatus.ASSIGNED);
    this.wsGateway.emitRiderAssigned(orderId, {
      id: selectedRider.id,
      name: selectedRider.user.name,
      phone: selectedRider.user.phone,
    });

    // Start the 60-second server-side enforcement timer.
    this.jobsService
      .scheduleRiderOfferTimeout(orderId, selectedRider.id, selectedRider.userId, selectedRider.user.name)
      .catch(err => this.logger.warn(`Failed to schedule offer timeout: ${err}`));

    return { assigned: true, rider: selectedRider, order: updatedOrder };
  }

  /**
   * Handle a rider's explicit ACCEPT or DECLINE response to an order offer.
   *
   * ACCEPT: keeps the ASSIGNED status.
   * DECLINE: unassigns the rider, records the decline, tries the next nearest rider.
   */
  async respondToOffer(
    orderId: string,
    riderId: string,
    action: 'ACCEPT' | 'DECLINE',
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { store: true, rider: { include: { user: true } } },
    });

    if (!order) throw new NotFoundException('Order not found');
    if (order.riderId !== riderId) {
      throw new ForbiddenException('This order was not offered to you');
    }
    if (order.status !== OrderStatus.ASSIGNED) {
      throw new BadRequestException('Order is no longer in an offerable state');
    }

    if (action === 'ACCEPT') {
      // Cancel the server-side 60s timeout since the rider responded in time.
      this.jobsService
        .cancelRiderOfferTimeout(orderId, riderId)
        .catch(() => {}); // non-critical — timeout may have already cleared

      this.wsGateway.emitToRider(riderId, 'offer_accepted', { orderId });
      this.wsGateway.emitOrderStatusChanged(orderId, OrderStatus.ASSIGNED);
      return { accepted: true };
    }

    // DECLINE — record it, unassign, try next rider.
    const declines: DeclineRecord[] = Array.isArray(order.riderDeclines)
      ? (order.riderDeclines as unknown as DeclineRecord[])
      : [];

    declines.push({
      riderId,
      name: order.rider?.user?.name ?? 'Unknown',
      declinedAt: new Date().toISOString(),
    });

    await this.prisma.order.update({
      where: { id: orderId },
      data: {
        riderId: null,
        status: OrderStatus.PREPARING, // revert to pre-assignment (store still preparing)
        riderDeclines: declines as any,
      },
    });

    this.wsGateway.emitOrderStatusChanged(orderId, OrderStatus.PREPARING);

    // Notify admin about the decline.
    this.wsGateway.emitToAdmin('rider_declined_order', {
      orderId,
      riderId,
      riderName: order.rider?.user?.name,
      totalDeclines: declines.length,
    });

    // Immediately try the next nearest available rider.
    try {
      await this.autoAssignRider(orderId);
    } catch (err) {
      this.logger.warn(`Re-assignment after decline failed for order ${orderId}: ${err}`);
    }

    return { accepted: false, declineCount: declines.length };
  }

  /**
   * Admin or store manually assigns a specific rider.
   * Works even if the rider is currently busy (admin override).
   */
  async manualAssignRider(orderId: string, riderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { store: true },
    });
    if (!order) throw new NotFoundException('Order not found');

    const rider = await this.prisma.rider.findUnique({
      where: { id: riderId },
      include: { user: { select: { name: true, phone: true } } },
    });
    if (!rider) throw new NotFoundException('Rider not found');

    const updatedOrder = await this.prisma.order.update({
      where: { id: orderId },
      data: { riderId: rider.id, status: OrderStatus.ASSIGNED, assignedAt: new Date() },
      include: {
        store: { select: { id: true, name: true, latitude: true, longitude: true } },
        customer: { select: { id: true, name: true, phone: true, address: true, latitude: true, longitude: true } },
        rider: { select: { id: true, user: { select: { id: true, name: true, phone: true } } } },
        orderItems: { select: { productName: true, quantity: true, unitPrice: true } },
      },
    });

    this.wsGateway.emitOrderStatusChanged(orderId, OrderStatus.ASSIGNED);
    this.wsGateway.emitRiderAssigned(orderId, {
      id: rider.id,
      name: rider.user.name,
      phone: rider.user.phone,
    });
    this.wsGateway.emitToRider(rider.id, 'order_offered', {
      orderId,
      store: { id: updatedOrder.store.id, name: updatedOrder.store.name },
      riderPayout: order.riderPayout,
      timeoutSeconds: 60,
    });
    if (updatedOrder.rider?.user?.id) {
      this.notifications.notifyRiderOffer(updatedOrder.rider.user.id, orderId, updatedOrder.store.name);
    }

    // Schedule the 60-second enforcement timer for manually-assigned riders too.
    if (updatedOrder.rider?.user?.id) {
      this.jobsService
        .scheduleRiderOfferTimeout(orderId, rider.id, updatedOrder.rider.user.id, rider.user.name)
        .catch(err => this.logger.warn(`Failed to schedule offer timeout (manual): ${err}`));
    }

    return updatedOrder;
  }

  // ── Status update ──────────────────────────────────────────────────────────

  async updateDeliveryStatus(orderId: string, newStatus: OrderStatus, riderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { rider: true },
    });

    if (!order) throw new NotFoundException('Order not found');
    if (!order.riderId || order.riderId !== riderId) {
      throw new ForbiddenException('Not authorized to update this delivery');
    }

    const VALID: Partial<Record<OrderStatus, OrderStatus>> = {
      [OrderStatus.ASSIGNED]: OrderStatus.PICKED_UP,
      [OrderStatus.PICKED_UP]: OrderStatus.EN_ROUTE,
      [OrderStatus.EN_ROUTE]:  OrderStatus.ARRIVED,
      [OrderStatus.ARRIVED]:   OrderStatus.COMPLETED,
    };

    if (VALID[order.status] !== newStatus) {
      throw new BadRequestException(
        `Invalid transition: ${order.status} → ${newStatus}`,
      );
    }

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: { status: newStatus },
      include: {
        store:      { select: { id: true, name: true, latitude: true, longitude: true } },
        customer:   { select: { id: true, name: true, phone: true, address: true, latitude: true, longitude: true } },
        orderItems: true,
      },
    });

    this.wsGateway.emitOrderStatusChanged(orderId, newStatus);

    const customerId = updated.customer?.id;
    if (newStatus === OrderStatus.PICKED_UP && customerId) {
      this.notifications.notifyCustomerPickedUp(customerId, orderId);
    }
    if (newStatus === OrderStatus.COMPLETED) {
      await this.walletService.creditRiderForOrder(orderId);
      // The store was credited provisionally at PAID; delivery is what makes
      // that payout earned, so move it into the withdrawable balance now.
      await this.walletService.settleStoreForOrder(orderId);
      this.wsGateway.emitDeliveryCompleted(orderId);
      if (customerId) this.notifications.notifyCustomerDelivered(customerId, orderId);
    }

    return updated;
  }

  // ── Queries ────────────────────────────────────────────────────────────────

  /** Orders being prepared / ready but not yet assigned — riders see these as incoming. */
  async getAvailableOrders() {
    return this.prisma.order.findMany({
      where: {
        status: { in: [OrderStatus.STORE_ACCEPTED, OrderStatus.PREPARING, OrderStatus.READY] },
        riderId: null,
      },
      include: {
        store:      { select: { id: true, name: true, latitude: true, longitude: true } },
        orderItems: { select: { productName: true, quantity: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  /** Active deliveries for THIS rider only. */
  async getRiderActiveDeliveries(riderId: string) {
    return this.prisma.order.findMany({
      where: {
        riderId,
        status: { in: ACTIVE_STATUSES },
      },
      include: {
        store:      { select: { id: true, name: true, latitude: true, longitude: true } },
        customer:   { select: { id: true, name: true, phone: true, address: true, latitude: true, longitude: true } },
        orderItems: true,
      },
      orderBy: { assignedAt: 'desc' },
    });
  }

  /** Completed deliveries for THIS rider only. */
  async getRiderCompletedDeliveries(riderId: string) {
    return this.prisma.order.findMany({
      where: { riderId, status: OrderStatus.COMPLETED },
      include: {
        store:    { select: { id: true, name: true } },
        customer: { select: { name: true } },
        orderItems: true,
      },
      orderBy: { updatedAt: 'desc' },
      take: 50,
    });
  }

  async getDeliveryDetails(orderId: string, riderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        store: {
          select: {
            id: true, name: true, latitude: true, longitude: true,
            owner: { select: { phone: true, address: true } },
          },
        },
        customer: {
          select: { id: true, name: true, phone: true, address: true, latitude: true, longitude: true },
        },
        orderItems: true,
      },
    });

    if (!order) throw new NotFoundException('Order not found');

    // Assigned rider, or orders being prepared / ready (rider browsing) can view.
    if (
      order.status !== OrderStatus.STORE_ACCEPTED &&
      order.status !== OrderStatus.PREPARING &&
      order.status !== OrderStatus.READY &&
      order.riderId !== riderId
    ) {
      throw new ForbiddenException('Not authorized to view this delivery');
    }

    return order;
  }

  async getRiderByUserId(userId: string) {
    const rider = await this.prisma.rider.findUnique({ where: { userId } });
    if (!rider) throw new NotFoundException('Rider profile not found. Please complete onboarding.');
    return rider;
  }
}
