import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../database';
import { RedisService } from '../redis';
import { UpdateAvailabilityDto, UpdateLocationDto } from './dto';

const RIDERS_AVAILABLE_KEY = 'riders:available';

@Injectable()
export class RidersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
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

    await this.redis.geoAdd(
      RIDERS_AVAILABLE_KEY,
      dto.longitude,
      dto.latitude,
      rider.id,
    );

    if (rider.isAvailable) {
      await this.redis.geoAdd(
        RIDERS_AVAILABLE_KEY,
        dto.longitude,
        dto.latitude,
        rider.id,
      );
    }

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
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!rider) {
      throw new NotFoundException('Rider profile not found');
    }

    return rider;
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

  async findNearbyAvailable(latitude: number, longitude: number, radiusKm: number = 10) {
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

    const riders = await this.prisma.rider.findMany({
      where: {
        id: { in: nearbyRiderIds },
        isAvailable: true,
      },
      select: {
        id: true,
        userId: true,
        currentLatitude: true,
        currentLongitude: true,
        user: {
          select: {
            name: true,
            phone: true,
          },
        },
      },
    });

    return riders;
  }
}
