import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import {
  OrderStatus,
  UserRole,
  UserStatus,
  AccountStatus,
  SettlementType,
  FaultParty,
} from '@prisma/client';
import { DeliveryService } from '../delivery/delivery.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PaymentsService } from '../payments/payments.service';
import { CouponsService } from '../coupons/coupons.service';
import { CreateCouponDto, UpdateCouponDto } from '../coupons/dto';
import { WalletService } from '../wallet/wallet.service';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private deliveryService: DeliveryService,
    private notifications: NotificationsService,
    private paymentsService: PaymentsService,
    private couponsService: CouponsService,
    private walletService: WalletService,
  ) {}

  async getDashboardStats() {
    const [
      totalUsers,
      totalStores,
      totalRiders,
      totalOrders,
      activeOrders,
      completedOrders,
      totalRevenue,
    ] = await Promise.all([
      this.prisma.user.count({ where: { role: UserRole.CUSTOMER } }),
      this.prisma.store.count(),
      this.prisma.rider.count(),
      this.prisma.order.count(),
      this.prisma.order.count({
        where: {
          status: {
            in: [
              OrderStatus.CREATED,
              OrderStatus.PAID,
              OrderStatus.STORE_ACCEPTED,
              OrderStatus.PREPARING,
              OrderStatus.READY,
              OrderStatus.ASSIGNED,
              OrderStatus.PICKED_UP,
              OrderStatus.EN_ROUTE,
              OrderStatus.ARRIVED,
            ],
          },
        },
      }),
      this.prisma.order.count({ where: { status: OrderStatus.COMPLETED } }),
      this.prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: { status: OrderStatus.COMPLETED },
      }),
    ]);

    return {
      totalUsers,
      totalStores,
      totalRiders,
      totalOrders,
      activeOrders,
      completedOrders,
      totalRevenue: totalRevenue._sum.totalAmount || 0,
    };
  }

  async getRecentOrders(limit = 10) {
    return this.prisma.order.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: { select: { id: true, name: true, email: true } },
        store: { select: { id: true, name: true } },
        rider: {
          select: {
            id: true,
            user: { select: { name: true } },
          },
        },
      },
    });
  }

  async getAllOrders(page = 1, limit = 20, status?: OrderStatus) {
    const skip = (page - 1) * limit;
    const where = status ? { status } : {};

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { id: true, name: true, email: true, phone: true } },
          store: { select: { id: true, name: true } },
          rider: {
            select: {
              id: true,
              user: { select: { name: true, phone: true } },
            },
          },
          orderItems: true,
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      orders,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getAllStores(page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [stores, total] = await Promise.all([
      this.prisma.store.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          owner: { select: { id: true, name: true, email: true, phone: true } },
          _count: { select: { products: true, orders: true } },
        },
      }),
      this.prisma.store.count(),
    ]);

    return {
      stores,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async approveStore(storeId: string) {
    const store = await this.prisma.store.findUnique({
      where: { id: storeId },
      include: { owner: { select: { id: true, name: true } } },
    });
    if (!store) throw new NotFoundException('Store not found');

    await this.prisma.store.update({ where: { id: storeId }, data: { isVerified: true } });

    // Push notify the store owner
    await this.notifications.sendToUser(
      store.owner.id,
      'Store Approved!',
      `Your store "${store.name}" has been approved. You can now start accepting orders!`,
      { type: 'store_approved', storeId },
    );

    return { success: true, storeId, approved: true };
  }

  async rejectStore(storeId: string, reason?: string) {
    const store = await this.prisma.store.findUnique({
      where: { id: storeId },
      include: { owner: { select: { id: true, name: true } } },
    });
    if (!store) throw new NotFoundException('Store not found');

    await this.prisma.store.update({ where: { id: storeId }, data: { isVerified: false } });

    await this.notifications.sendToUser(
      store.owner.id,
      'Store Application Update',
      reason
        ? `Your store "${store.name}" was not approved: ${reason}`
        : `Your store "${store.name}" application requires changes. Please contact support.`,
      { type: 'store_rejected', storeId },
    );

    return { success: true, storeId, approved: false };
  }

  // ── Moderation: suspend / restore / remove ─────────────────────────────────
  //
  // Suspending an account does two things: it flips the entity's own status so
  // it disappears from the marketplace, and it suspends the owning user so they
  // are stopped at login (User.status is already enforced by the auth service).
  // Deletion is soft — orders, ledger entries and withdrawals all reference
  // these rows, so removing them would destroy financial history.

  async suspendStore(storeId: string, reason?: string) {
    const store = await this.prisma.store.findUnique({
      where: { id: storeId },
      include: { owner: { select: { id: true } } },
    });
    if (!store) throw new NotFoundException('Store not found');
    if (store.deletedAt) throw new BadRequestException('This store has been deleted');

    await this.prisma.$transaction([
      this.prisma.store.update({
        where: { id: storeId },
        data: {
          status: AccountStatus.SUSPENDED,
          suspendedReason: reason ?? null,
          suspendedAt: new Date(),
          // Close the storefront so it cannot appear as open anywhere.
          isOpen: false,
        },
      }),
      this.prisma.user.update({
        where: { id: store.ownerUserId },
        data: { status: UserStatus.SUSPENDED },
      }),
    ]);

    await this.notifications.sendToUser(
      store.owner.id,
      'Store Suspended',
      reason
        ? `Your store "${store.name}" has been suspended: ${reason}`
        : `Your store "${store.name}" has been suspended. Please contact support.`,
      { type: 'store_suspended', storeId },
    );

    return { success: true, storeId, status: AccountStatus.SUSPENDED };
  }

  async unsuspendStore(storeId: string) {
    const store = await this.prisma.store.findUnique({
      where: { id: storeId },
      include: { owner: { select: { id: true } } },
    });
    if (!store) throw new NotFoundException('Store not found');
    if (store.deletedAt) throw new BadRequestException('This store has been deleted');

    await this.prisma.$transaction([
      this.prisma.store.update({
        where: { id: storeId },
        data: {
          status: AccountStatus.ACTIVE,
          suspendedReason: null,
          suspendedAt: null,
        },
      }),
      this.prisma.user.update({
        where: { id: store.ownerUserId },
        data: { status: UserStatus.ACTIVE },
      }),
    ]);

    await this.notifications.sendToUser(
      store.owner.id,
      'Store Reinstated',
      `Your store "${store.name}" is active again. You can resume accepting orders.`,
      { type: 'store_unsuspended', storeId },
    );

    return { success: true, storeId, status: AccountStatus.ACTIVE };
  }

  async deleteStore(storeId: string) {
    const store = await this.prisma.store.findUnique({ where: { id: storeId } });
    if (!store) throw new NotFoundException('Store not found');

    // Refuse while money is still in flight — deleting here would strand the
    // customer's payment with no one able to fulfil or settle the order.
    const liveOrders = await this.prisma.order.count({
      where: {
        storeId,
        status: { notIn: [OrderStatus.COMPLETED, OrderStatus.CANCELLED, OrderStatus.CREATED] },
      },
    });
    if (liveOrders > 0) {
      throw new BadRequestException(
        `This store has ${liveOrders} order(s) in progress. Settle or cancel them before deleting.`,
      );
    }

    await this.prisma.$transaction([
      this.prisma.store.update({
        where: { id: storeId },
        data: {
          deletedAt: new Date(),
          status: AccountStatus.SUSPENDED,
          isOpen: false,
          isVerified: false,
        },
      }),
      this.prisma.user.update({
        where: { id: store.ownerUserId },
        data: { status: UserStatus.SUSPENDED },
      }),
    ]);

    return { success: true, storeId, deleted: true };
  }

  async suspendRider(riderId: string, reason?: string) {
    const rider = await this.prisma.rider.findUnique({
      where: { id: riderId },
      include: { user: { select: { id: true, name: true } } },
    });
    if (!rider) throw new NotFoundException('Rider not found');
    if (rider.deletedAt) throw new BadRequestException('This rider has been deleted');

    await this.prisma.$transaction([
      this.prisma.rider.update({
        where: { id: riderId },
        data: {
          status: AccountStatus.SUSPENDED,
          suspendedReason: reason ?? null,
          suspendedAt: new Date(),
          // Take them out of the dispatch pool immediately.
          isAvailable: false,
        },
      }),
      this.prisma.user.update({
        where: { id: rider.userId },
        data: { status: UserStatus.SUSPENDED },
      }),
    ]);

    await this.notifications.sendToUser(
      rider.user.id,
      'Account Suspended',
      reason
        ? `Your rider account has been suspended: ${reason}`
        : 'Your rider account has been suspended. Please contact support.',
      { type: 'rider_suspended', riderId },
    );

    return { success: true, riderId, status: AccountStatus.SUSPENDED };
  }

  async unsuspendRider(riderId: string) {
    const rider = await this.prisma.rider.findUnique({
      where: { id: riderId },
      include: { user: { select: { id: true } } },
    });
    if (!rider) throw new NotFoundException('Rider not found');
    if (rider.deletedAt) throw new BadRequestException('This rider has been deleted');

    await this.prisma.$transaction([
      this.prisma.rider.update({
        where: { id: riderId },
        data: {
          status: AccountStatus.ACTIVE,
          suspendedReason: null,
          suspendedAt: null,
        },
      }),
      this.prisma.user.update({
        where: { id: rider.userId },
        data: { status: UserStatus.ACTIVE },
      }),
    ]);

    await this.notifications.sendToUser(
      rider.user.id,
      'Account Reinstated',
      'Your rider account is active again. You can go online and accept deliveries.',
      { type: 'rider_unsuspended', riderId },
    );

    return { success: true, riderId, status: AccountStatus.ACTIVE };
  }

  async deleteRider(riderId: string) {
    const rider = await this.prisma.rider.findUnique({ where: { id: riderId } });
    if (!rider) throw new NotFoundException('Rider not found');

    const liveOrders = await this.prisma.order.count({
      where: {
        riderId,
        status: { notIn: [OrderStatus.COMPLETED, OrderStatus.CANCELLED, OrderStatus.CREATED] },
      },
    });
    if (liveOrders > 0) {
      throw new BadRequestException(
        `This rider has ${liveOrders} delivery/deliveries in progress. Reassign or cancel them before deleting.`,
      );
    }

    await this.prisma.$transaction([
      this.prisma.rider.update({
        where: { id: riderId },
        data: {
          deletedAt: new Date(),
          status: AccountStatus.SUSPENDED,
          isAvailable: false,
        },
      }),
      this.prisma.user.update({
        where: { id: rider.userId },
        data: { status: UserStatus.SUSPENDED },
      }),
    ]);

    return { success: true, riderId, deleted: true };
  }

  async getStoreById(storeId: string) {
    return this.prisma.store.findUnique({
      where: { id: storeId },
      include: {
        owner: { select: { id: true, name: true, email: true, phone: true } },
        products: true,
        orders: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            customer: { select: { name: true } },
          },
        },
        _count: { select: { products: true, orders: true } },
      },
    });
  }

  async getAllRiders(page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [riders, total] = await Promise.all([
      this.prisma.rider.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, email: true, phone: true } },
          _count: { select: { orders: true } },
        },
      }),
      this.prisma.rider.count(),
    ]);

    return {
      riders,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getRiderById(riderId: string) {
    return this.prisma.rider.findUnique({
      where: { id: riderId },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        orders: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            store: { select: { name: true } },
            customer: { select: { name: true } },
          },
        },
        _count: { select: { orders: true } },
      },
    });
    // vehicleType, vehiclePlate, vehicleColor are part of Rider and returned by default
  }

  async getRiderLocations() {
    return this.prisma.rider.findMany({
      where: { isAvailable: true },
      select: {
        id: true,
        currentLatitude: true,
        currentLongitude: true,
        lastPingAt: true,
        user: { select: { name: true } },
      },
    });
  }

  async getAllUsers(page = 1, limit = 20, role?: UserRole) {
    const skip = (page - 1) * limit;
    const where = role ? { role } : { role: { not: UserRole.ADMIN } };

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          role: true,
          status: true,
          createdAt: true,
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      users,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getMapData() {
    const activeStatuses = [
      OrderStatus.ASSIGNED, OrderStatus.PICKED_UP,
      OrderStatus.EN_ROUTE, OrderStatus.ARRIVED,
    ];

    const [stores, ridersRaw] = await Promise.all([
      this.prisma.store.findMany({
        select: {
          id: true,
          name: true,
          latitude: true,
          longitude: true,
          isOpen: true,
        },
      }),
      this.prisma.rider.findMany({
        select: {
          id: true,
          isAvailable: true,
          currentLatitude: true,
          currentLongitude: true,
          lastPingAt: true,
          user: { select: { name: true, phone: true } },
          orders: {
            where: { status: { in: activeStatuses } },
            select: { id: true },
          },
        },
      }),
    ]);

    const riders = ridersRaw
      .filter((r) => r.currentLatitude && r.currentLongitude)
      .map((r) => ({
        id: r.id,
        isAvailable: r.isAvailable,
        currentLatitude: r.currentLatitude,
        currentLongitude: r.currentLongitude,
        lastPingAt: r.lastPingAt,
        user: r.user,
        activeDeliveries: r.orders.length,
        isBusy: !r.isAvailable || r.orders.length > 0,
      }));

    return { stores, riders };
  }

  async getOrdersOverTime(days = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const orders = await this.prisma.order.findMany({
      where: { createdAt: { gte: startDate } },
      select: { createdAt: true, totalAmount: true, status: true },
    });

    const dailyStats: Record<string, { orders: number; revenue: number }> = {};

    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const key = date.toISOString().split('T')[0];
      dailyStats[key] = { orders: 0, revenue: 0 };
    }

    orders.forEach((order) => {
      const key = order.createdAt.toISOString().split('T')[0];
      if (dailyStats[key]) {
        dailyStats[key].orders++;
        if (order.status === OrderStatus.COMPLETED) {
          dailyStats[key].revenue += Number(order.totalAmount);
        }
      }
    });

    return Object.entries(dailyStats)
      .map(([date, stats]) => ({ date, ...stats }))
      .reverse();
  }

  async getActiveOrders() {
    return this.prisma.order.findMany({
      where: {
        status: {
          notIn: [OrderStatus.COMPLETED, OrderStatus.CANCELLED],
        },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        customer: { select: { id: true, name: true, email: true, phone: true } },
        store: { select: { id: true, name: true } },
        rider: {
          select: {
            id: true,
            user: { select: { name: true, phone: true } },
          },
        },
        orderItems: true,
      },
    });
  }

  /**
   * Returns ALL riders for the admin assign-rider modal, split into:
   * - available (isAvailable=true, 0 active deliveries) — shown first
   * - busy (on active delivery or marked offline) — shown after with active count
   * Optionally sorted by proximity to the order's store.
   */
  async getAvailableRiders(orderId?: string) {
    let storeLat: number | undefined;
    let storeLng: number | undefined;

    if (orderId) {
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
        include: { store: { select: { latitude: true, longitude: true } } },
      });
      storeLat = order?.store?.latitude ?? undefined;
      storeLng = order?.store?.longitude ?? undefined;
    }

    const activeStatuses = [
      OrderStatus.ASSIGNED, OrderStatus.PICKED_UP,
      OrderStatus.EN_ROUTE, OrderStatus.ARRIVED,
    ];

    const riders = await this.prisma.rider.findMany({
      include: {
        user: { select: { id: true, name: true, phone: true } },
        orders: {
          where: { status: { in: activeStatuses } },
          select: { id: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return riders.map(r => {
      const activeCount = r.orders.length;
      const isBusy = !r.isAvailable || activeCount > 0;
      let distKm: number | null = null;
      if (storeLat != null && storeLng != null && r.currentLatitude != null && r.currentLongitude != null) {
        const R = 6371;
        const dLat = ((r.currentLatitude - storeLat) * Math.PI) / 180;
        const dLng = ((r.currentLongitude - storeLng) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) ** 2 +
          Math.cos((storeLat * Math.PI) / 180) * Math.cos((r.currentLatitude * Math.PI) / 180) *
          Math.sin(dLng / 2) ** 2;
        distKm = Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10;
      }
      return { ...r, activeCount, isBusy, distKm };
    }).sort((a, b) => {
      if (a.isBusy !== b.isBusy) return a.isBusy ? 1 : -1;
      if (a.activeCount !== b.activeCount) return a.activeCount - b.activeCount;
      if (a.distKm != null && b.distKm != null) return a.distKm - b.distKm;
      return 0;
    });
  }

  /**
   * Admin can assign any rider (even if busy) — delegates to DeliveryService
   * so WebSocket and push notifications fire correctly.
   */
  async assignRiderToOrder(orderId: string, riderId: string) {
    return this.deliveryService.manualAssignRider(orderId, riderId);
  }

  /** Notify a specific rider about their assigned order via push notification. */
  async notifyRider(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        rider: { include: { user: { select: { id: true } } } },
        store: { select: { name: true } },
      },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (!order.rider?.user?.id) throw new NotFoundException('No rider assigned to this order');
    await this.notifications.notifyRiderOffer(order.rider.user.id, orderId, order.store.name);
    return { success: true };
  }

  async updateOrderStatus(orderId: string, status: OrderStatus) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Completing an order from the admin panel must have the same financial
    // effect as a rider completing it in the app: pay the rider, and promote
    // the store's provisional payout into its withdrawable balance. Both calls
    // are idempotent, so a repeated status update is harmless.
    if (status === OrderStatus.COMPLETED && order.status !== OrderStatus.COMPLETED) {
      await this.walletService.creditRiderForOrder(orderId);
      await this.walletService.settleStoreForOrder(orderId);
    }

    return this.prisma.order.update({
      where: { id: orderId },
      data: { status },
      include: {
        customer: { select: { id: true, name: true, email: true, phone: true } },
        store: { select: { id: true, name: true } },
        rider: {
          select: {
            id: true,
            user: { select: { name: true, phone: true } },
          },
        },
      },
    });
  }

  async cancelOrder(orderId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');

    // Full unwind: restock + cancel + reverse wallet credits + refund + audit.
    const settlement = await this.paymentsService.settleOrder(orderId, {
      type: SettlementType.ADMIN_CANCEL,
      reason: 'Cancelled by admin',
    });

    return { success: true, orderId, settlement };
  }

  /**
   * Admin settlement: unwind an order with explicit fault attribution, an
   * optional reason, and optional goodwill compensation paid to the rider.
   * Works on live orders (cancels + refunds) and after-the-fact (records the
   * settlement; reversals are idempotent).
   */
  async settleOrder(
    orderId: string,
    opts: {
      reason?: string;
      faultParty?: FaultParty;
      riderCompensation?: number;
      adminUserId?: string;
    },
  ) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');

    const settlement = await this.paymentsService.settleOrder(orderId, {
      type: SettlementType.ADMIN_SETTLE,
      reason: opts.reason,
      faultParty: opts.faultParty,
      riderCompensation: opts.riderCompensation,
      createdByUserId: opts.adminUserId,
    });

    return { success: true, orderId, settlement };
  }

  async getOrderSettlements(orderId: string) {
    return this.prisma.settlement.findMany({
      where: { orderId },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ── Featured stores ("Handpicked for you") ────────────────────────────────

  // ── Enhanced Analytics ────────────────────────────────────────────────────

  async getTopStores(days = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const result = await this.prisma.order.groupBy({
      by: ['storeId'],
      where: {
        status: OrderStatus.COMPLETED,
        createdAt: { gte: since },
      },
      _count: { id: true },
      _sum: { totalAmount: true },
      orderBy: { _sum: { totalAmount: 'desc' } },
      take: 10,
    });

    const storeIds = result.map(r => r.storeId);
    const stores = await this.prisma.store.findMany({
      where: { id: { in: storeIds } },
      select: { id: true, name: true },
    });
    const storeMap = Object.fromEntries(stores.map(s => [s.id, s.name]));

    return result.map(r => ({
      storeId: r.storeId,
      name: storeMap[r.storeId] ?? 'Unknown',
      orders: r._count.id,
      revenue: Number(r._sum.totalAmount ?? 0),
    }));
  }

  async getTopRiders(days = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const result = await this.prisma.order.groupBy({
      by: ['riderId'],
      where: {
        status: OrderStatus.COMPLETED,
        riderId: { not: null },
        createdAt: { gte: since },
      },
      _count: { id: true },
      _sum: { riderPayout: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    });

    const riderIds = result.map(r => r.riderId).filter(Boolean) as string[];
    const riders = await this.prisma.rider.findMany({
      where: { id: { in: riderIds } },
      select: { id: true, user: { select: { name: true } } },
    });
    const riderMap = Object.fromEntries(riders.map(r => [r.id, r.user.name]));

    return result.map(r => ({
      riderId: r.riderId,
      name: riderMap[r.riderId!] ?? 'Unknown',
      deliveries: r._count.id,
      earnings: Number(r._sum.riderPayout ?? 0),
    }));
  }

  async getAnalyticsSummary(days = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const [completed, cancelled, avgResult, hourlyData] = await Promise.all([
      this.prisma.order.count({ where: { status: OrderStatus.COMPLETED, createdAt: { gte: since } } }),
      this.prisma.order.count({ where: { status: OrderStatus.CANCELLED, createdAt: { gte: since } } }),
      this.prisma.order.aggregate({
        where: { status: OrderStatus.COMPLETED, createdAt: { gte: since } },
        _avg: { totalAmount: true },
      }),
      this.prisma.order.findMany({
        where: { createdAt: { gte: since } },
        select: { createdAt: true },
      }),
    ]);

    const total = completed + cancelled;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    const avgOrderValue = Math.round(Number(avgResult._avg.totalAmount ?? 0));

    // Count orders by hour-of-day to find peak hour
    const hourCounts: number[] = new Array(24).fill(0);
    hourlyData.forEach(o => {
      hourCounts[o.createdAt.getHours()]++;
    });
    const peakHour = hourCounts.indexOf(Math.max(...hourCounts));

    return { completionRate, avgOrderValue, peakHour, completedOrders: completed, cancelledOrders: cancelled };
  }

  async getFeaturedStores() {
    return this.prisma.featuredStore.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        store: {
          select: { id: true, name: true, description: true, isOpen: true, latitude: true, longitude: true },
        },
      },
    });
  }

  async addFeaturedStore(storeId: string, label?: string, sortOrder?: number) {
    return this.prisma.featuredStore.upsert({
      where: { storeId },
      update: { label, sortOrder: sortOrder ?? 0 },
      create: { storeId, label, sortOrder: sortOrder ?? 0 },
      include: { store: { select: { id: true, name: true } } },
    });
  }

  async removeFeaturedStore(storeId: string) {
    await this.prisma.featuredStore.delete({ where: { storeId } });
    return { message: 'Removed from featured' };
  }

  // ── Global search ─────────────────────────────────────────────────────────

  async search(query: string) {
    const q = query.trim();
    if (q.length < 2) {
      return { orders: [], stores: [], users: [], riders: [] };
    }

    const [orders, stores, users, riders] = await Promise.all([
      this.prisma.order.findMany({
        where: {
          OR: [
            { id: { contains: q, mode: 'insensitive' } },
            { paymentReference: { contains: q, mode: 'insensitive' } },
            { customer: { name: { contains: q, mode: 'insensitive' } } },
            { customer: { email: { contains: q, mode: 'insensitive' } } },
            { store: { name: { contains: q, mode: 'insensitive' } } },
          ],
        },
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          status: true,
          totalAmount: true,
          createdAt: true,
          store: { select: { name: true } },
          customer: { select: { name: true, email: true } },
        },
      }),
      this.prisma.store.findMany({
        where: {
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
            { owner: { name: { contains: q, mode: 'insensitive' } } },
            { owner: { email: { contains: q, mode: 'insensitive' } } },
          ],
        },
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          isOpen: true,
          isVerified: true,
          owner: { select: { name: true, email: true } },
        },
      }),
      this.prisma.user.findMany({
        where: {
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { email: { contains: q, mode: 'insensitive' } },
            { phone: { contains: q, mode: 'insensitive' } },
          ],
        },
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { id: true, name: true, email: true, role: true, phone: true },
      }),
      this.prisma.rider.findMany({
        where: {
          OR: [
            { user: { name: { contains: q, mode: 'insensitive' } } },
            { user: { email: { contains: q, mode: 'insensitive' } } },
            { user: { phone: { contains: q, mode: 'insensitive' } } },
            { vehiclePlate: { contains: q, mode: 'insensitive' } },
          ],
        },
        take: 5,
        include: {
          user: { select: { id: true, name: true, email: true, phone: true } },
        },
      }),
    ]);

    return { orders, stores, users, riders };
  }

  // ── Coupons ───────────────────────────────────────────────────────────────

  getCoupons() {
    return this.couponsService.findAll();
  }

  createCoupon(dto: CreateCouponDto) {
    return this.couponsService.create(dto);
  }

  updateCoupon(id: string, dto: UpdateCouponDto) {
    return this.couponsService.update(id, dto);
  }

  deleteCoupon(id: string) {
    return this.couponsService.remove(id);
  }
}
