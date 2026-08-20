import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
  Inject,
  forwardRef,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../database';
import { AppWebSocketGateway } from '../websocket';
import { DeliveryService } from '../delivery/delivery.service';
import { NotificationsService } from '../notifications';
import { PaymentsService } from '../payments/payments.service';
import { CreateStoreDto, UpdateStoreDto, NearbyQueryDto } from './dto';
import { JobsService } from '../jobs/jobs.service';
import { AccountStatus, OrderStatus, SettlementType, FaultParty } from '@prisma/client';

/**
 * Customer-facing stores must be neither suspended nor soft-deleted. Spread
 * this into any `where` that a customer can see, so a banned store cannot be
 * browsed, favourited or ordered from.
 */
export const VISIBLE_STORE = {
  status: AccountStatus.ACTIVE,
  deletedAt: null,
} as const;

// Valid store-side status transitions.
// Accepting a paid order moves it straight to PREPARING — there is no separate
// "Start preparing" tap. STORE_ACCEPTED is retained in the enum (and accepted as
// a source state here) only so any legacy in-flight orders can still advance.
const STORE_TRANSITIONS: Partial<Record<OrderStatus, OrderStatus>> = {
  [OrderStatus.PAID]:           OrderStatus.PREPARING,
  [OrderStatus.STORE_ACCEPTED]: OrderStatus.PREPARING,
  [OrderStatus.PREPARING]:      OrderStatus.READY,
};

@Injectable()
export class StoresService {
  private readonly logger = new Logger(StoresService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly wsGateway: AppWebSocketGateway,
    @Inject(forwardRef(() => DeliveryService))
    private readonly deliveryService: DeliveryService,
    private readonly notifications: NotificationsService,
    @Inject(forwardRef(() => PaymentsService))
    private readonly paymentsService: PaymentsService,
    private readonly jobsService: JobsService,
  ) {}

  // ── Store order management ─────────────────────────────────────────────────

  async getMyOrders(userId: string, status?: OrderStatus) {
    const store = await this.prisma.store.findUnique({ where: { ownerUserId: userId } });
    if (!store) throw new NotFoundException('Store not found');

    const where: Record<string, unknown> = { storeId: store.id };
    if (status) {
      where.status = status;
    } else {
      // Exclude terminal statuses by default
      where.status = { notIn: [OrderStatus.CANCELLED] };
    }

    return this.prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: { select: { id: true, name: true, phone: true, address: true } },
        rider: { select: { id: true, user: { select: { name: true, phone: true } } } },
        orderItems: { select: { productName: true, quantity: true, unitPrice: true } },
      },
    });
  }

  async updateStoreOrderStatus(orderId: string, userId: string, newStatus: OrderStatus) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { store: true },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.store.ownerUserId !== userId) {
      throw new ForbiddenException('Not authorized to update this order');
    }

    const expected = STORE_TRANSITIONS[order.status];
    if (expected !== newStatus) {
      throw new BadRequestException(
        `Cannot move order from ${order.status} to ${newStatus}`,
      );
    }

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: { status: newStatus },
      include: {
        customer: { select: { id: true, name: true, phone: true, address: true } },
        rider: { select: { id: true, user: { select: { name: true, phone: true } } } },
        orderItems: { select: { productName: true, quantity: true, unitPrice: true } },
      },
    });

    this.wsGateway.emitOrderStatusChanged(orderId, newStatus);
    this.wsGateway.emitToStore(order.storeId, 'order_status_changed', { orderId, newStatus });

    const customerId = updated.customer?.id;
    const storeName  = order.store.name;

    // The store accepting a paid order: PAID → PREPARING. Confirm to the customer
    // and start looking for a rider immediately (early dispatch).
    const justAccepted =
      order.status === OrderStatus.PAID && newStatus === OrderStatus.PREPARING;

    if (justAccepted) {
      // Cancel the auto-cancel timeout now that the store has responded.
      this.jobsService
        .cancelStoreAcceptTimeout(orderId)
        .catch(() => undefined);
      if (customerId) {
        this.notifications.notifyCustomerOrderConfirmed(customerId, orderId, storeName);
      }
      setImmediate(() => {
        this.deliveryService.autoAssignRider(orderId).catch(() => {
          // Suppress — admin is notified via WebSocket if no rider is found.
        });
      });
    }

    if (newStatus === OrderStatus.READY) {
      if (customerId) this.notifications.notifyCustomerOrderReady(customerId, orderId);
      // Retry rider assignment if none was found at accept time (e.g. no riders
      // were available then). No-op if a rider is already assigned.
      if (!updated.riderId) {
        setImmediate(() => {
          this.deliveryService.autoAssignRider(orderId).catch(() => undefined);
        });
      }
    }

    return updated;
  }

  async rejectOrder(orderId: string, userId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { store: true, orderItems: true },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.store.ownerUserId !== userId) {
      throw new ForbiddenException('Not authorized to reject this order');
    }
    if (order.status !== OrderStatus.PAID) {
      throw new BadRequestException('Only PAID orders can be rejected by the store');
    }

    // The store has responded — cancel the pending auto-cancel timeout.
    this.jobsService.cancelStoreAcceptTimeout(orderId).catch(() => undefined);

    this.wsGateway.emitToAdmin('order_rejected_by_store', {
      orderId,
      storeId: order.storeId,
    });

    // Restock + cancel + reverse the store credit + refund the customer + audit.
    await this.paymentsService.settleOrder(orderId, {
      type: SettlementType.STORE_DECLINE,
      faultParty: FaultParty.STORE,
      reason: 'Store declined the order',
    });

    return { success: true, orderId, status: OrderStatus.CANCELLED };
  }

  async create(userId: string, dto: CreateStoreDto) {
    const existingStore = await this.prisma.store.findUnique({
      where: { ownerUserId: userId },
    });

    if (existingStore) {
      throw new ConflictException('User already has a store');
    }

    return this.prisma.store.create({
      data: {
        ownerUserId: userId,
        name: dto.name,
        description: dto.description,
        latitude: dto.latitude,
        longitude: dto.longitude,
        isOpen: false,
      },
      select: {
        id: true,
        name: true,
        description: true,
        latitude: true,
        longitude: true,
        isOpen: true,
        openingHours: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findNearby(query: NearbyQueryDto) {
    const { latitude, longitude, radius = 10 } = query;

    const stores = await this.prisma.store.findMany({
      where: { isVerified: true, ...VISIBLE_STORE },
      // No isOpen filter — closed stores are still shown so customers
      // can browse and schedule orders. The isOpen flag is surfaced
      // as a badge on the card, not used to hide the store entirely.
      select: {
        id: true,
        name: true,
        description: true,
        latitude: true,
        longitude: true,
        isOpen: true,
      },
    });

    const nearbyStores = stores
      .map((store) => {
        const distance = this.calculateDistance(
          latitude,
          longitude,
          store.latitude,
          store.longitude,
        );
        return { ...store, distance };
      })
      .sort((a, b) => a.distance - b.distance);

    // Prefer stores within the requested radius; if none match, still return all
    // verified stores so newly approved stores are discoverable during early rollout.
    const withinRadius = nearbyStores.filter((store) => store.distance <= radius);
    const results = withinRadius.length > 0 ? withinRadius : nearbyStores;

    return results.map((store) => ({
      id: store.id,
      name: store.name,
      description: store.description,
      distance: Math.round(store.distance * 100) / 100,
      isOpen: store.isOpen,
    }));
  }

  async findById(storeId: string) {
    const store = await this.prisma.store.findUnique({
      where: { id: storeId },
      select: {
        id: true,
        name: true,
        description: true,
        latitude: true,
        longitude: true,
        isOpen: true,
        openingHours: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!store) {
      throw new NotFoundException('Store not found');
    }

    return store;
  }

  async update(storeId: string, userId: string, dto: UpdateStoreDto) {
    const store = await this.prisma.store.findUnique({
      where: { id: storeId },
    });

    if (!store) {
      throw new NotFoundException('Store not found');
    }

    if (store.ownerUserId !== userId) {
      throw new ForbiddenException('Not authorized to update this store');
    }

    return this.prisma.store.update({
      where: { id: storeId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.isOpen !== undefined && { isOpen: dto.isOpen }),
        ...(dto.openingHours !== undefined && { openingHours: dto.openingHours as object }),
        ...(dto.latitude !== undefined && { latitude: dto.latitude }),
        ...(dto.longitude !== undefined && { longitude: dto.longitude }),
      },
      select: {
        id: true,
        name: true,
        description: true,
        latitude: true,
        longitude: true,
        isOpen: true,
        openingHours: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  // ── Favourites ────────────────────────────────────────────────────────────

  async toggleFavourite(userId: string, storeId: string) {
    const store = await this.prisma.store.findUnique({ where: { id: storeId } });
    if (!store) throw new NotFoundException('Store not found');

    const existing = await this.prisma.favourite.findUnique({
      where: { userId_storeId: { userId, storeId } },
    });

    if (existing) {
      await this.prisma.favourite.delete({ where: { id: existing.id } });
      return { isFavourite: false };
    }

    await this.prisma.favourite.create({ data: { userId, storeId } });
    return { isFavourite: true };
  }

  async getFavourites(userId: string) {
    const favs = await this.prisma.favourite.findMany({
      where: { userId, store: { isVerified: true, ...VISIBLE_STORE } },
      include: {
        store: {
          select: { id: true, name: true, description: true, latitude: true, longitude: true, isOpen: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return favs.map(f => f.store);
  }

  async getFavouriteIds(userId: string): Promise<string[]> {
    const favs = await this.prisma.favourite.findMany({
      where: { userId },
      select: { storeId: true },
    });
    return favs.map(f => f.storeId);
  }

  // ── Featured stores (admin-curated "Handpicked for you") ──────────────────

  async getFeatured() {
    const featured = await this.prisma.featuredStore.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        store: {
          select: { id: true, name: true, description: true, latitude: true, longitude: true, isOpen: true, isVerified: true },
        },
      },
    });
    return featured
      .filter(f => f.store.isVerified)
      .map(f => ({ ...f.store, label: f.label }));
  }

  async addFeatured(storeId: string, label?: string, sortOrder?: number) {
    const store = await this.prisma.store.findUnique({ where: { id: storeId } });
    if (!store) throw new NotFoundException('Store not found');

    return this.prisma.featuredStore.upsert({
      where: { storeId },
      update: { label, sortOrder: sortOrder ?? 0 },
      create: { storeId, label, sortOrder: sortOrder ?? 0 },
    });
  }

  async removeFeatured(storeId: string) {
    const existing = await this.prisma.featuredStore.findUnique({ where: { storeId } });
    if (!existing) throw new NotFoundException('Store is not featured');
    await this.prisma.featuredStore.delete({ where: { storeId } });
    return { message: 'Removed from featured' };
  }

  async findByOwnerId(userId: string) {
    return this.prisma.store.findUnique({
      where: { ownerUserId: userId },
    });
  }

  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371;
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  // Category methods
  async createCategory(storeId: string, userId: string, name: string) {
    const store = await this.prisma.store.findUnique({
      where: { id: storeId },
    });

    if (!store) {
      throw new NotFoundException('Store not found');
    }

    if (store.ownerUserId !== userId) {
      throw new ForbiddenException('Not authorized to manage this store');
    }

    const existing = await this.prisma.category.findUnique({
      where: { storeId_name: { storeId, name } },
    });

    if (existing) {
      throw new ConflictException('Category already exists');
    }

    return this.prisma.category.create({
      data: { storeId, name },
    });
  }

  async getCategories(storeId: string) {
    return this.prisma.category.findMany({
      where: { storeId },
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { products: true } },
      },
    });
  }

  async deleteCategory(categoryId: string, userId: string) {
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
      include: { store: true },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    if (category.store.ownerUserId !== userId) {
      throw new ForbiddenException('Not authorized to manage this category');
    }

    await this.prisma.category.delete({
      where: { id: categoryId },
    });

    return { message: 'Category deleted' };
  }

  async updateCategory(categoryId: string, userId: string, name: string) {
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
      include: { store: true },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    if (category.store.ownerUserId !== userId) {
      throw new ForbiddenException('Not authorized to manage this category');
    }

    return this.prisma.category.update({
      where: { id: categoryId },
      data: { name },
    });
  }
}
