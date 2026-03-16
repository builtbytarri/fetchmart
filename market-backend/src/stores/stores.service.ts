import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../database';
import { CreateStoreDto, UpdateStoreDto, NearbyQueryDto } from './dto';

@Injectable()
export class StoresService {
  constructor(private readonly prisma: PrismaService) {}

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
      where: { isOpen: true },
      select: {
        id: true,
        name: true,
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
      .filter((store) => store.distance <= radius)
      .sort((a, b) => a.distance - b.distance);

    return nearbyStores.map((store) => ({
      id: store.id,
      name: store.name,
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
