import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../database';
import { CreateOrderDto } from './dto';
import { OrderStatus, UserRole, Prisma } from '@prisma/client';

const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.CREATED]: [OrderStatus.PAID, OrderStatus.CANCELLED],
  [OrderStatus.PAID]: [OrderStatus.STORE_ACCEPTED, OrderStatus.CANCELLED],
  [OrderStatus.STORE_ACCEPTED]: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
  [OrderStatus.PREPARING]: [OrderStatus.READY],
  [OrderStatus.READY]: [OrderStatus.ASSIGNED, OrderStatus.CANCELLED],
  [OrderStatus.ASSIGNED]: [OrderStatus.PICKED_UP, OrderStatus.CANCELLED],
  [OrderStatus.PICKED_UP]: [OrderStatus.EN_ROUTE],
  [OrderStatus.EN_ROUTE]: [OrderStatus.ARRIVED],
  [OrderStatus.ARRIVED]: [OrderStatus.COMPLETED],
  [OrderStatus.COMPLETED]: [],
  [OrderStatus.CANCELLED]: [],
};

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

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
      if (product.stockQuantity < item.quantity) {
        throw new BadRequestException(
          `Insufficient stock for product: ${product.name}`,
        );
      }
    }

    let totalAmount = new Prisma.Decimal(0);
    const orderItemsData = dto.items.map((item) => {
      const product = productMap.get(item.productId)!;
      const itemTotal = new Prisma.Decimal(product.price.toString()).mul(item.quantity);
      totalAmount = totalAmount.add(itemTotal);

      return {
        productId: item.productId,
        productName: product.name,
        unitPrice: product.price,
        quantity: item.quantity,
      };
    });

    const order = await this.prisma.$transaction(async (tx) => {
      for (const item of dto.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stockQuantity: {
              decrement: item.quantity,
            },
          },
        });
      }

      return tx.order.create({
        data: {
          customerUserId: userId,
          storeId: dto.storeId,
          status: OrderStatus.CREATED,
          totalAmount,
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

    const { store, ...orderData } = order;
    return {
      ...orderData,
      store: {
        id: store.id,
        name: store.name,
      },
    };
  }

  async findMyOrders(userId: string, userRole: UserRole) {
    if (userRole === UserRole.CUSTOMER) {
      return this.prisma.order.findMany({
        where: { customerUserId: userId },
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
    }

    if (userRole === UserRole.STORE) {
      const store = await this.prisma.store.findUnique({
        where: { ownerUserId: userId },
      });

      if (!store) {
        throw new ForbiddenException('User does not have a store');
      }

      return this.prisma.order.findMany({
        where: { storeId: store.id },
        include: {
          orderItems: true,
        },
        orderBy: { createdAt: 'desc' },
      });
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
