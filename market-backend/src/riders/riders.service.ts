import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../database';
import { RedisService } from '../redis';
import { AppWebSocketGateway } from '../websocket';
import { UpdateAvailabilityDto, UpdateLocationDto, UpdateVehicleDto } from './dto';
import { AccountStatus, OrderStatus } from '@prisma/client';

const RIDERS_AVAILABLE_KEY = 'riders:available';

// Statuses where the rider is actively moving toward store or customer
const ACTIVE_DELIVERY_STATUSES: OrderStatus[] = [
  OrderStatus.ASSIGNED,
  OrderStatus.PICKED_UP,
  OrderStatus.EN_ROUTE,
  OrderStatus.ARRIVED,
];

@Injectable()
export class RidersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    @Inject(forwardRef(() => AppWebSocketGateway))
    private readonly wsGateway: AppWebSocketGateway,
  ) {}

  async onboard(userId: string) {
    const existingRider = await this.prisma.rider.findUnique({
      where: { userId },
    });

    if (existingRider) {
      throw new ConflictException('User already has a rider profile');
    }

    return this.prisma.rider.create({
      data: {
        userId,
        isAvailable: false,
      },
      select: {
        id: true,
        userId: true,
        isAvailable: true,
        currentLatitude: true,
        currentLongitude: true,
        lastPingAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async updateAvailability(userId: string, dto: UpdateAvailabilityDto) {
    const rider = await this.prisma.rider.findUnique({
      where: { userId },
    });

    if (!rider) {
      throw new NotFoundException('Rider profile not found');
    }

    // A suspended rider must not be able to put themselves back on the map.
    if (dto.isAvailable && (rider.status !== AccountStatus.ACTIVE || rider.deletedAt)) {
      throw new ForbiddenException(
        rider.suspendedReason
          ? `Your rider account is suspended: ${rider.suspendedReason}`
          : 'Your rider account is suspended. Please contact support.',
      );
    }

    const updatedRider = await this.prisma.rider.update({
      where: { userId },
      data: { isAvailable: dto.isAvailable },
      select: {
        id: true,
        userId: true,
        isAvailable: true,
        currentLatitude: true,
        currentLongitude: true,
        lastPingAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (dto.isAvailable && rider.currentLatitude && rider.currentLongitude) {
      await this.redis.geoAdd(
        RIDERS_AVAILABLE_KEY,
        rider.currentLongitude,
        rider.currentLatitude,
        rider.id,
      );
    } else {
      await this.redis.geoRemove(RIDERS_AVAILABLE_KEY, rider.id);
    }

    return updatedRider;
  }

  async updateLocation(userId: string, dto: UpdateLocationDto) {
    const rider = await this.prisma.rider.findUnique({
      where: { userId },
    });

    if (!rider) {
      throw new NotFoundException('Rider profile not found');
    }

    // Update Redis geo-index (used for nearby-rider queries)
    await this.redis.geoAdd(
      RIDERS_AVAILABLE_KEY,
      dto.longitude,
      dto.latitude,
      rider.id,
    );

    // Persist to database
    const updatedRider = await this.prisma.rider.update({
      where: { userId },
      data: {
        currentLatitude: dto.latitude,
        currentLongitude: dto.longitude,
        lastPingAt: new Date(),
      },
      select: {
        id: true,
        userId: true,
        isAvailable: true,
        currentLatitude: true,
        currentLongitude: true,
        lastPingAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // If the rider has an active delivery, broadcast their location to the
    // order room so the customer's tracking map updates in real time.
    // We only query the DB here — no extra Redis call needed.
    const activeOrder = await this.prisma.order.findFirst({
      where: {
        riderId: rider.id,
        status: { in: ACTIVE_DELIVERY_STATUSES },
      },
      select: { id: true },
    });

    if (activeOrder) {
      this.wsGateway.emitRiderLocationToOrder(
        activeOrder.id,
        rider.id,
        dto.latitude,
        dto.longitude,
      );
    }

    return updatedRider;
  }

  async getMe(userId: string) {
    const rider = await this.prisma.rider.findUnique({
      where: { userId },
      select: {
        id: true,
        userId: true,
        isAvailable: true,
        currentLatitude: true,
        currentLongitude: true,
        lastPingAt: true,
        vehicleType: true,
        vehiclePlate: true,
        vehicleColor: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!rider) {
      throw new NotFoundException('Rider profile not found');
    }

    return rider;
  }

  async updateVehicle(userId: string, dto: UpdateVehicleDto) {
    const rider = await this.prisma.rider.findUnique({ where: { userId } });
    if (!rider) throw new NotFoundException('Rider profile not found');

    return this.prisma.rider.update({
      where: { userId },
      data: {
        ...(dto.vehicleType  !== undefined && { vehicleType:  dto.vehicleType }),
        ...(dto.vehiclePlate !== undefined && { vehiclePlate: dto.vehiclePlate }),
        ...(dto.vehicleColor !== undefined && { vehicleColor: dto.vehicleColor }),
      },
      select: {
        id: true,
        userId: true,
        vehicleType: true,
        vehiclePlate: true,
        vehicleColor: true,
        updatedAt: true,
      },
    });
  }

  async findById(riderId: string) {
    const rider = await this.prisma.rider.findUnique({
      where: { id: riderId },
    });

    if (!rider) {
      throw new NotFoundException('Rider not found');
    }

    return rider;
  }

  /**
   * Find available riders sorted by a composite score:
   *   score = distanceKm + (activeDeliveries * 3)
   *
   * A rider with 0 active deliveries 5 km away scores 5.
   * A rider with 1 active delivery 2 km away scores 5 — same priority.
   * This mirrors Uber Eats / Glovo dispatch: prefer idle riders close by,
   * but a slightly-distant idle rider beats a nearby rider who's already loaded.
   *
   * @param excludeRiderIds  rider IDs to skip (e.g. those who already declined)
   */
  async findNearbyAvailable(
    latitude: number,
    longitude: number,
    radiusKm: number = 10,
    excludeRiderIds: string[] = [],
  ) {
    const nearbyRiderIds = await this.redis.geoRadius(
      RIDERS_AVAILABLE_KEY,
      longitude,
      latitude,
      radiusKm,
      'km',
    );

    if (!nearbyRiderIds || nearbyRiderIds.length === 0) {
      return [];
    }

    const eligible = nearbyRiderIds.filter(id => !excludeRiderIds.includes(id));
    if (eligible.length === 0) return [];

    const riders = await this.prisma.rider.findMany({
      where: {
        id: { in: eligible },
        isAvailable: true,
        // A suspended or removed rider must never be dispatched, even if a
        // stale entry for them is still sitting in the Redis geo index.
        status: AccountStatus.ACTIVE,
        deletedAt: null,
      },
      select: {
        id: true,
        userId: true,
        currentLatitude: true,
        currentLongitude: true,
        user: { select: { name: true, phone: true } },
        orders: {
          where: { status: { in: ACTIVE_DELIVERY_STATUSES } },
          select: { id: true },
        },
      },
    });

    // Compute composite score and sort ascending (lower = better).
    return riders
      .map(r => {
        const distKm = r.currentLatitude != null && r.currentLongitude != null
          ? haversineKm(latitude, longitude, r.currentLatitude, r.currentLongitude)
          : radiusKm; // fallback: push unknowns to back
        const activeCount = r.orders.length;
        return { ...r, distKm, activeCount, score: distKm + activeCount * 3 };
      })
      .sort((a, b) => a.score - b.score);
  }

  /**
   * Return ALL riders for the admin assign-rider modal, split into two tiers:
   *   - available: isAvailable=true, sorted by active delivery count then name
   *   - busy: isAvailable=false OR has active deliveries, sorted by active count (fewest first — closest to free)
   */
  async findAllForAssignment(storeLat?: number, storeLng?: number) {
    const riders = await this.prisma.rider.findMany({
      select: {
        id: true,
        isAvailable: true,
        currentLatitude: true,
        currentLongitude: true,
        user: { select: { id: true, name: true, phone: true } },
        orders: {
          where: { status: { in: ACTIVE_DELIVERY_STATUSES } },
          select: { id: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return riders.map(r => {
      const activeCount = r.orders.length;
      const distKm = storeLat != null && storeLng != null
        && r.currentLatitude != null && r.currentLongitude != null
        ? haversineKm(storeLat, storeLng, r.currentLatitude, r.currentLongitude)
        : null;
      const isBusy = !r.isAvailable || activeCount > 0;
      return { ...r, activeCount, distKm, isBusy };
    }).sort((a, b) => {
      // Available riders first, then sort by activeCount, then by distance
      if (a.isBusy !== b.isBusy) return a.isBusy ? 1 : -1;
      if (a.activeCount !== b.activeCount) return a.activeCount - b.activeCount;
      if (a.distKm != null && b.distKm != null) return a.distKm - b.distKm;
      return 0;
    });
  }
}

// ── Haversine helper ──────────────────────────────────────────────────────────

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
