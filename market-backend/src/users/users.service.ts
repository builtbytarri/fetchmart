import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../database';
import {
  UpdateUserDto,
  UpdateNotificationPreferencesDto,
  CreateSavedAddressDto,
  UpdateSavedAddressDto,
} from './dto';

const NOTIFICATION_SELECT = {
  notifyPush: true,
  notifyOrderUpdates: true,
  notifyPromotions: true,
  notifyNewStores: true,
  notifyEmail: true,
} as const;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        name: true,
        phone: true,
        status: true,
        address: true,
        latitude: true,
        longitude: true,
        ...NOTIFICATION_SELECT,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async getNotificationPreferences(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: NOTIFICATION_SELECT,
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateNotificationPreferences(userId: string, dto: UpdateNotificationPreferencesDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.notifyPush !== undefined && { notifyPush: dto.notifyPush }),
        ...(dto.notifyOrderUpdates !== undefined && { notifyOrderUpdates: dto.notifyOrderUpdates }),
        ...(dto.notifyPromotions !== undefined && { notifyPromotions: dto.notifyPromotions }),
        ...(dto.notifyNewStores !== undefined && { notifyNewStores: dto.notifyNewStores }),
        ...(dto.notifyEmail !== undefined && { notifyEmail: dto.notifyEmail }),
      },
      select: NOTIFICATION_SELECT,
    });
  }

  async update(userId: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.phone !== undefined && { phone: dto.phone }),
        ...(dto.address !== undefined && { address: dto.address }),
        ...(dto.latitude !== undefined && { latitude: dto.latitude }),
        ...(dto.longitude !== undefined && { longitude: dto.longitude }),
      },
      select: {
        id: true,
        email: true,
        role: true,
        name: true,
        phone: true,
        status: true,
        address: true,
        latitude: true,
        longitude: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  // ── Saved addresses ─────────────────────────────────────────────────────────

  private async syncUserProfileFromDefault(userId: string) {
    const defaultAddr = await this.prisma.savedAddress.findFirst({
      where: { userId, isDefault: true },
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: defaultAddr
        ? {
            address: defaultAddr.address,
            latitude: defaultAddr.latitude,
            longitude: defaultAddr.longitude,
          }
        : {
            address: null,
            latitude: null,
            longitude: null,
          },
    });
  }

  async listSavedAddresses(userId: string) {
    return this.prisma.savedAddress.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async createSavedAddress(userId: string, dto: CreateSavedAddressDto) {
    const existing = await this.prisma.savedAddress.count({ where: { userId } });
    const makeDefault = dto.isDefault ?? existing === 0;

    return this.prisma.$transaction(async (tx) => {
      if (makeDefault) {
        await tx.savedAddress.updateMany({
          where: { userId },
          data: { isDefault: false },
        });
      }

      const created = await tx.savedAddress.create({
        data: {
          userId,
          label: dto.label,
          address: dto.address,
          latitude: dto.latitude,
          longitude: dto.longitude,
          isDefault: makeDefault,
        },
      });

      if (makeDefault) {
        await tx.user.update({
          where: { id: userId },
          data: {
            address: dto.address,
            latitude: dto.latitude,
            longitude: dto.longitude,
          },
        });
      }

      return created;
    });
  }

  async updateSavedAddress(userId: string, addressId: string, dto: UpdateSavedAddressDto) {
    const existing = await this.prisma.savedAddress.findUnique({ where: { id: addressId } });
    if (!existing) throw new NotFoundException('Address not found');
    if (existing.userId !== userId) throw new ForbiddenException();

    return this.prisma.$transaction(async (tx) => {
      if (dto.isDefault) {
        await tx.savedAddress.updateMany({
          where: { userId },
          data: { isDefault: false },
        });
      }

      const updated = await tx.savedAddress.update({
        where: { id: addressId },
        data: {
          ...(dto.label !== undefined && { label: dto.label }),
          ...(dto.address !== undefined && { address: dto.address }),
          ...(dto.latitude !== undefined && { latitude: dto.latitude }),
          ...(dto.longitude !== undefined && { longitude: dto.longitude }),
          ...(dto.isDefault !== undefined && { isDefault: dto.isDefault }),
        },
      });

      if (dto.isDefault || updated.isDefault) {
        await tx.user.update({
          where: { id: userId },
          data: {
            address: updated.address,
            latitude: updated.latitude,
            longitude: updated.longitude,
          },
        });
      }

      return updated;
    });
  }

  async deleteSavedAddress(userId: string, addressId: string) {
    const existing = await this.prisma.savedAddress.findUnique({ where: { id: addressId } });
    if (!existing) throw new NotFoundException('Address not found');
    if (existing.userId !== userId) throw new ForbiddenException();

    await this.prisma.savedAddress.delete({ where: { id: addressId } });

    if (existing.isDefault) {
      const next = await this.prisma.savedAddress.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });

      if (next) {
        await this.prisma.$transaction(async (tx) => {
          await tx.savedAddress.update({
            where: { id: next.id },
            data: { isDefault: true },
          });
          await tx.user.update({
            where: { id: userId },
            data: {
              address: next.address,
              latitude: next.latitude,
              longitude: next.longitude,
            },
          });
        });
      } else {
        await this.syncUserProfileFromDefault(userId);
      }
    }

    return { success: true };
  }
}
