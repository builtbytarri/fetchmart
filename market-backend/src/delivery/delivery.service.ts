import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../database';
import { RidersService } from '../riders';
import { AppWebSocketGateway } from '../websocket';
import { OrderStatus } from '@prisma/client';

@Injectable()
export class DeliveryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ridersService: RidersService,
    private readonly wsGateway: AppWebSocketGateway,
  ) {}

  async autoAssignRider(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { store: true },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.status !== OrderStatus.READY) {
      throw new BadRequestException('Order must be in READY status for assignment');
    }

    const nearbyRiders = await this.ridersService.findNearbyAvailable(
      order.store.latitude,
      order.store.longitude,
      10,
    );

    if (nearbyRiders.length === 0) {
      return { assigned: false, message: 'No available riders nearby' };
    }

    const selectedRider = nearbyRiders[0];

    const updatedOrder = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        riderId: selectedRider.id,
        status: OrderStatus.ASSIGNED,
        assignedAt: new Date(),
      },
      include: {
        store: { select: { id: true, name: true } },
        rider: {
          select: {
            id: true,
            user: { select: { name: true, phone: true } },
          },
        },
      },
    });

    this.wsGateway.emitOrderStatusChanged(orderId, OrderStatus.ASSIGNED);
    this.wsGateway.emitRiderAssigned(orderId, {
      id: selectedRider.id,
      name: selectedRider.user.name,
      phone: selectedRider.user.phone,
    });

    this.wsGateway.emitToRider(selectedRider.id, 'new_order_assigned', {
      orderId,
      store: updatedOrder.store,
    });

    return { assigned: true, rider: selectedRider, order: updatedOrder };
  }

  async manualAssignRider(orderId: string, riderId: string, storeOwnerId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { store: true },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.store.ownerUserId !== storeOwnerId) {
      throw new ForbiddenException('Not authorized to assign rider to this order');
    }

    if (order.status !== OrderStatus.READY) {
      throw new BadRequestException('Order must be in READY status for assignment');
    }

    const rider = await this.ridersService.findById(riderId);

    if (!rider.isAvailable) {
      throw new BadRequestException('Rider is not available');
    }

    const updatedOrder = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        riderId: rider.id,
        status: OrderStatus.ASSIGNED,
        assignedAt: new Date(),
      },
      include: {
        store: { select: { id: true, name: true } },
        rider: {
          select: {
            id: true,
            user: { select: { name: true, phone: true } },
          },
        },
      },
    });

    this.wsGateway.emitOrderStatusChanged(orderId, OrderStatus.ASSIGNED);
    this.wsGateway.emitRiderAssigned(orderId, {
      id: rider.id,
      name: updatedOrder.rider?.user.name,
      phone: updatedOrder.rider?.user.phone,
    });

    this.wsGateway.emitToRider(rider.id, 'new_order_assigned', {
      orderId,
      store: updatedOrder.store,
    });

    return updatedOrder;
  }

  async updateDeliveryStatus(
    orderId: string,
    newStatus: OrderStatus,
    riderId: string,
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { rider: true },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // For now, allow any rider to update delivery status
    // Later we'll implement proper authorization
    // if (!order.rider || order.rider.id !== riderId) {
    //   throw new ForbiddenException('Not authorized to update this delivery');
    // }

    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.READY]: [OrderStatus.ASSIGNED],
      [OrderStatus.ASSIGNED]: [OrderStatus.PICKED_UP],
      [OrderStatus.PICKED_UP]: [OrderStatus.EN_ROUTE],
      [OrderStatus.EN_ROUTE]: [OrderStatus.ARRIVED],
      [OrderStatus.ARRIVED]: [OrderStatus.COMPLETED],
      [OrderStatus.CREATED]: [],
      [OrderStatus.PAID]: [],
      [OrderStatus.STORE_ACCEPTED]: [],
      [OrderStatus.PREPARING]: [],
      [OrderStatus.COMPLETED]: [],
      [OrderStatus.CANCELLED]: [],
    };

    if (!validTransitions[order.status]?.includes(newStatus)) {
      throw new BadRequestException(
        `Invalid status transition from ${order.status} to ${newStatus}`,
      );
    }

    // If accepting a READY order, assign the rider
    const updateData: any = { status: newStatus };
    if (order.status === OrderStatus.READY && newStatus === OrderStatus.ASSIGNED) {
      updateData.riderId = riderId;
      updateData.assignedAt = new Date();
    }

    const updatedOrder = await this.prisma.order.update({
      where: { id: orderId },
      data: updateData,
      include: {
        store: { select: { id: true, name: true, latitude: true, longitude: true } },
        customer: { select: { id: true, name: true, phone: true, address: true, latitude: true, longitude: true } },
        orderItems: true,
      },
    });

    this.wsGateway.emitOrderStatusChanged(orderId, newStatus);

    if (newStatus === OrderStatus.COMPLETED) {
      this.wsGateway.emitDeliveryCompleted(orderId);
    }

    return updatedOrder;
  }

  async getRiderByUserId(userId: string) {
    let rider = await this.prisma.rider.findUnique({
      where: { userId },
    });

    if (!rider) {
      // Auto-create rider profile if user is a rider but profile doesn't exist
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user || user.role !== 'RIDER') {
        throw new NotFoundException('Rider profile not found');
      }

      rider = await this.prisma.rider.create({
        data: {
          userId,
          isAvailable: true,
        },
      });
    }

    return rider;
  }

  async getRiderActiveDeliveries(riderId: string) {
    // For now, fetch all available deliveries (READY status or assigned to this rider)
    // Later we'll implement proper rider assignment logic
    return this.prisma.order.findMany({
      where: {
        OR: [
          // Orders assigned to this rider that are in progress
          {
            riderId,
            status: {
              in: [
                OrderStatus.ASSIGNED,
                OrderStatus.PICKED_UP,
                OrderStatus.EN_ROUTE,
                OrderStatus.ARRIVED,
              ],
            },
          },
          // Orders ready for pickup (available for any rider)
          {
            status: OrderStatus.READY,
          },
          // Also show ASSIGNED orders without a specific rider check for now
          {
            status: OrderStatus.ASSIGNED,
          },
        ],
      },
      include: {
        store: { select: { id: true, name: true, latitude: true, longitude: true } },
        customer: { select: { id: true, name: true, phone: true, address: true, latitude: true, longitude: true } },
        orderItems: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getRiderCompletedDeliveries(riderId: string) {
    // For now, show all completed deliveries (not just rider-specific)
    return this.prisma.order.findMany({
      where: {
        status: OrderStatus.COMPLETED,
      },
      include: {
        store: { select: { id: true, name: true } },
        customer: { select: { name: true } },
        orderItems: true,
      },
      orderBy: { updatedAt: 'desc' },
      take: 20,
    });
  }

  async getDeliveryDetails(orderId: string, riderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        store: { 
          select: { 
            id: true, 
            name: true, 
            latitude: true, 
            longitude: true,
            owner: { select: { phone: true, address: true } },
          } 
        },
        customer: { 
          select: { 
            id: true, 
            name: true, 
            phone: true, 
            address: true, 
            latitude: true, 
            longitude: true 
          } 
        },
        orderItems: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // For now, allow any rider to view available deliveries
    // Later we'll implement proper authorization
    // if (order.riderId && order.riderId !== riderId) {
    //   throw new ForbiddenException('Not authorized to view this delivery');
    // }

    return order;
  }
}
