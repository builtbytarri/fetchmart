import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { AccountStatus, OrderStatus, UserStatus } from '@prisma/client';
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

  /**
   * Permanent, user-initiated account deletion (App Store Guideline 5.1.1(v)).
   *
   * Personal data is erased or anonymised in place rather than the row being
   * dropped: orders, ledger entries and settlements reference the user and are
   * financial records we are required to keep. What remains cannot identify
   * the person — a scrambled email, no name, no phone, no addresses, no bank
   * account, no saved cards, no OAuth links — and the account can never be
   * signed into again.
   */
  async deleteMyAccount(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { store: { select: { id: true } }, rider: { select: { id: true } } },
    });
    if (!user) throw new NotFoundException('User not found');

    // Refuse while money is still in motion. A paid order mid-delivery needs
    // its customer, store or rider to exist in a resolvable state; deleting
    // now would strand a refund or a payout.
    const LIVE: OrderStatus[] = [
      OrderStatus.PAID,
      OrderStatus.STORE_ACCEPTED,
      OrderStatus.PREPARING,
      OrderStatus.READY,
      OrderStatus.ASSIGNED,
      OrderStatus.PICKED_UP,
      OrderStatus.EN_ROUTE,
      OrderStatus.ARRIVED,
    ];
    const liveOrders = await this.prisma.order.count({
      where: {
        status: { in: LIVE },
        OR: [
          { customerUserId: userId },
          ...(user.store ? [{ storeId: user.store.id }] : []),
          ...(user.rider ? [{ riderId: user.rider.id }] : []),
        ],
      },
    });
    if (liveOrders > 0) {
      throw new BadRequestException(
        'You have an order in progress. Please wait for it to complete (or cancel it) before deleting your account.',
      );
    }

    await this.prisma.$transaction([
      // Sessions and sign-in methods — nothing can authenticate as this user again.
      this.prisma.refreshToken.deleteMany({ where: { userId } }),
      this.prisma.passwordResetToken.deleteMany({ where: { userId } }),
      this.prisma.oAuthAccount.deleteMany({ where: { userId } }),
      // Stored personal data.
      this.prisma.savedAddress.deleteMany({ where: { userId } }),
      this.prisma.paymentToken.deleteMany({ where: { userId } }),
      this.prisma.bankAccount.deleteMany({ where: { userId } }),
      this.prisma.favourite.deleteMany({ where: { userId } }),
      ...(user.phone
        ? [this.prisma.phoneOtp.deleteMany({ where: { phone: user.phone } })]
        : []),
      // Their storefront / rider profile, if any (soft delete — orders refer to them).
      ...(user.store
        ? [
            this.prisma.store.update({
              where: { id: user.store.id },
              data: {
                status: AccountStatus.SUSPENDED,
                deletedAt: new Date(),
                isOpen: false,
                isVerified: false,
              },
            }),
          ]
        : []),
      ...(user.rider
        ? [
            this.prisma.rider.update({
              where: { id: user.rider.id },
              data: {
                status: AccountStatus.SUSPENDED,
                deletedAt: new Date(),
                isAvailable: false,
              },
            }),
          ]
        : []),
      // Finally, anonymise the user row itself.
      this.prisma.user.update({
        where: { id: userId },
        data: {
          email: `deleted-${userId}@deleted.invalid`,
          name: 'Deleted User',
          phone: null,
          address: null,
          latitude: null,
          longitude: null,
          passwordHash: null,
          pushToken: null,
          status: UserStatus.SUSPENDED,
          notifyPush: false,
          notifyOrderUpdates: false,
          notifyPromotions: false,
          notifyNewStores: false,
        },
      }),
    ]);

    return { deleted: true };
  }
}
