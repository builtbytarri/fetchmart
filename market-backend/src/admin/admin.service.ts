import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { OrderStatus, UserRole } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

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
    const [stores, riders] = await Promise.all([
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
        where: { isAvailable: true },
        select: {
          id: true,
          currentLatitude: true,
          currentLongitude: true,
          lastPingAt: true,
          user: { select: { name: true } },
        },
      }),
    ]);

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
}
