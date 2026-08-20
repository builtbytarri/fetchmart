import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../database';
import { PricingService } from '../pricing';
import { CouponsService } from '../coupons';
import { CreateOrderDto } from './dto';
import { OrderStatus, UserRole, Prisma, StockMode } from '@prisma/client';

const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.CREATED]: [OrderStatus.PAID, OrderStatus.CANCELLED],
  // Accepting a paid order jumps straight to PREPARING (no STORE_ACCEPTED tap).
  [OrderStatus.PAID]: [OrderStatus.PREPARING, OrderStatus.STORE_ACCEPTED, OrderStatus.CANCELLED],
  [OrderStatus.STORE_ACCEPTED]: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
  [OrderStatus.PREPARING]: [OrderStatus.READY, OrderStatus.ASSIGNED, OrderStatus.CANCELLED],
  [OrderStatus.READY]: [OrderStatus.ASSIGNED, OrderStatus.CANCELLED],
  [OrderStatus.ASSIGNED]: [OrderStatus.PICKED_UP, OrderStatus.CANCELLED],
  [OrderStatus.PICKED_UP]: [OrderStatus.EN_ROUTE],
  [OrderStatus.EN_ROUTE]: [OrderStatus.ARRIVED],
  [OrderStatus.ARRIVED]: [OrderStatus.COMPLETED],
  [OrderStatus.COMPLETED]: [],
  [OrderStatus.CANCELLED]: [],
};

/** Coerce Prisma Decimal fields to plain numbers for JSON responses. */
function serializeOrder<T extends Record<string, unknown>>(order: T) {
  const num = (v: unknown) => (v == null ? null : Number(v));
  return {
    ...order,
    totalAmount: Number(order.totalAmount),
    subtotal: num(order.subtotal),
    serviceFee: num(order.serviceFee),
    deliveryFee: num(order.deliveryFee),
    commissionAmount: num(order.commissionAmount),
    storePayout: num(order.storePayout),
    riderPayout: num(order.riderPayout),
    adminProfit: num(order.adminProfit),
    distanceKm: num(order.distanceKm),
    discountAmount: num(order.discountAmount),
    orderItems: Array.isArray(order.orderItems)
      ? order.orderItems.map((item: Record<string, unknown>) => ({
          ...item,
          unitPrice: Number(item.unitPrice),
          quantity: Number(item.quantity),
        }))
      : order.orderItems,
  };
}

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pricingService: PricingService,
    private readonly couponsService: CouponsService,
  ) {}

  async create(userId: string, dto: CreateOrderDto) {
    const store = await this.prisma.store.findUnique({
      where: { id: dto.storeId },
    });

    if (!store) {
      throw new NotFoundException('Store not found');
    }

    if (!store.isOpen) {
      throw new BadRequestException('Store is not open');
    }

    if (!store.isVerified) {
      throw new BadRequestException('This store is not yet available for orders');
    }

    const productIds = dto.items.map((item) => item.productId);
    const products = await this.prisma.product.findMany({
      where: {
        id: { in: productIds },
        storeId: dto.storeId,
        isAvailable: true,
      },
    });

    if (products.length !== productIds.length) {
      throw new BadRequestException('One or more products are not available');
    }

    const productMap = new Map(products.map((p) => [p.id, p]));

    for (const item of dto.items) {
      const product = productMap.get(item.productId)!;
      const qty = new Prisma.Decimal(item.quantity);

      if (qty.lessThanOrEqualTo(0)) {
        throw new BadRequestException(`Invalid quantity for product: ${product.name}`);
      }

      // Measured goods may only be bought in whole multiples of their step
      // (e.g. a mudu sold in halves accepts 0.5, 1, 1.5 — but not 0.7).
      const step = new Prisma.Decimal(product.stepSize);
      if (step.greaterThan(0) && !qty.dividedBy(step).equals(qty.dividedBy(step).floor())) {
        throw new BadRequestException(
          `${product.name} is sold in multiples of ${step.toString()} ${product.unit.toLowerCase()}`,
        );
      }

      // IN_STOCK products are not counted, so there is nothing to check
      // against — availability is governed by isAvailable, filtered above.
      if (
        product.stockMode === StockMode.COUNTED &&
        new Prisma.Decimal(product.stockQuantity).lessThan(qty)
      ) {
        throw new BadRequestException(
          `Insufficient stock for product: ${product.name}`,
        );
      }
    }

    const orderItemsData = dto.items.map((item) => {
      const product = productMap.get(item.productId)!;
      return {
        productId: item.productId,
        productName: product.name,
        unitPrice: product.price,
        quantity: new Prisma.Decimal(item.quantity),
        // Snapshot the unit so order history survives later product edits.
        unit: product.unit,
      };
    });

    // ── Resolve delivery destination (dto → customer's saved location) ──────
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

    // ── Full money breakdown (subtotal, service fee, delivery, payouts) ─────
    const quote = await this.pricingService.getQuote({
      storeId: dto.storeId,
      destLat,
      destLng,
      items: dto.items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
    });

    let total = quote.total;
    let adminProfit = quote.adminProfit;
    let discountAmount = 0;
    let couponCode: string | undefined;

    if (dto.couponCode?.trim()) {
      const applied = await this.couponsService.applyToOrder(
        dto.couponCode,
        quote.subtotal,
        quote.total,
      );
      discountAmount = applied.discountAmount;
      couponCode = applied.code;
      total = applied.finalTotal;
      adminProfit = Math.max(0, quote.adminProfit - discountAmount);
    }

    const order = await this.prisma.$transaction(async (tx) => {
      for (const item of dto.items) {
        // Only COUNTED products carry a meaningful stock figure — decrementing
        // an IN_STOCK product would drive it negative for no reason.
        if (productMap.get(item.productId)!.stockMode !== StockMode.COUNTED) continue;
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stockQuantity: {
              decrement: new Prisma.Decimal(item.quantity),
            },
          },
        });
      }

      return tx.order.create({
        data: {
          customerUserId: userId,
          storeId: dto.storeId,
          status: OrderStatus.CREATED,
          totalAmount: new Prisma.Decimal(total),
          subtotal: new Prisma.Decimal(quote.subtotal),
          serviceFee: new Prisma.Decimal(quote.serviceFee),
          deliveryFee: new Prisma.Decimal(quote.deliveryFee),
          commissionAmount: new Prisma.Decimal(quote.commissionAmount),
          storePayout: new Prisma.Decimal(quote.storePayout),
          riderPayout: new Prisma.Decimal(quote.riderPayout),
          adminProfit: new Prisma.Decimal(adminProfit),
          distanceKm: new Prisma.Decimal(quote.distanceKm),
          couponCode,
          discountAmount: discountAmount > 0 ? new Prisma.Decimal(discountAmount) : null,
          orderItems: {
            create: orderItemsData,
          },
        },
        include: {
          orderItems: true,
          store: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
    });

    return order;
  }

  async findById(orderId: string, userId: string, userRole: UserRole) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        orderItems: true,
        store: {
          select: {
            id: true,
            name: true,
            ownerUserId: true,
            latitude: true,
            longitude: true,
          },
        },
        // Include rider's current location for live tracking map
        rider: {
          include: {
            user: { select: { name: true, phone: true } },
          },
        },
        // Include customer location for routing target
        customer: {
          select: {
            id: true,
            name: true,
            latitude: true,
            longitude: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (userRole === UserRole.CUSTOMER && order.customerUserId !== userId) {
      throw new ForbiddenException('Not authorized to view this order');
    }

    if (userRole === UserRole.STORE && order.store.ownerUserId !== userId) {
      throw new ForbiddenException('Not authorized to view this order');
    }

    const { store, rider, customer, ...orderData } = order;
    return serializeOrder({
      ...orderData,
      store: {
        id: store.id,
        name: store.name,
        latitude: store.latitude,
        longitude: store.longitude,
      },
      // Rider info — only exposed to the order's customer or the store
      rider: rider ? {
        id: rider.id,
        name: rider.user.name,
        phone: rider.user.phone,
        latitude: rider.currentLatitude,
        longitude: rider.currentLongitude,
        lastPingAt: rider.lastPingAt,
      } : null,
      // Customer delivery coordinates — used by rider app for routing
      deliveryLocation: {
        latitude: customer.latitude,
        longitude: customer.longitude,
      },
    });
  }

  async findMyOrders(userId: string, userRole: UserRole) {
    if (userRole === UserRole.CUSTOMER) {
      const orders = await this.prisma.order.findMany({
        // Hide unpaid checkout drafts — only show real order history
        where: {
          customerUserId: userId,
          status: { not: OrderStatus.CREATED },
        },
        include: {
          orderItems: true,
          store: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
      return orders.map(serializeOrder);
    }

    if (userRole === UserRole.STORE) {
      const store = await this.prisma.store.findUnique({
        where: { ownerUserId: userId },
      });

      if (!store) {
        throw new ForbiddenException('User does not have a store');
      }

      const orders = await this.prisma.order.findMany({
        where: { storeId: store.id },
        include: {
          orderItems: true,
        },
        orderBy: { createdAt: 'desc' },
      });
      return orders.map(serializeOrder);
    }

    throw new ForbiddenException('Invalid role for this operation');
  }

  async updateStatus(
    orderId: string,
    newStatus: OrderStatus,
    userId: string,
    userRole: UserRole,
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        store: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (userRole === UserRole.STORE && order.store.ownerUserId !== userId) {
      throw new ForbiddenException('Not authorized to update this order');
    }

    const allowedTransitions = VALID_TRANSITIONS[order.status];
    if (!allowedTransitions.includes(newStatus)) {
      throw new BadRequestException(
        `Invalid status transition from ${order.status} to ${newStatus}`,
      );
    }

    return this.prisma.order.update({
      where: { id: orderId },
      data: { status: newStatus },
      include: {
        orderItems: true,
        store: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }
}
