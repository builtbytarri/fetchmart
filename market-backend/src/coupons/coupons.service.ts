import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database';
import { Coupon, DiscountType, Prisma } from '@prisma/client';
import { CreateCouponDto, UpdateCouponDto } from './dto';

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export interface CouponValidationResult {
  code: string;
  discountAmount: number;
  discountType: DiscountType;
  discountValue: number;
  description?: string | null;
}

@Injectable()
export class CouponsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Validate a coupon against a subtotal and return the discount amount. */
  async validate(code: string, subtotal: number): Promise<CouponValidationResult> {
    const coupon = await this.findByCode(code);
    const discountAmount = this.computeDiscount(coupon, subtotal);
    return {
      code: coupon.code,
      discountAmount,
      discountType: coupon.discountType,
      discountValue: Number(coupon.discountValue),
      description: coupon.description,
    };
  }

  /** Apply coupon to an order total — throws if invalid. */
  async applyToOrder(code: string, subtotal: number, orderTotal: number) {
    const result = await this.validate(code, subtotal);
    const discountAmount = Math.min(result.discountAmount, orderTotal);
    return {
      ...result,
      discountAmount,
      finalTotal: round2(Math.max(0, orderTotal - discountAmount)),
    };
  }

  computeDiscount(coupon: Coupon, subtotal: number): number {
    this.assertCouponUsable(coupon, subtotal);

    let discount = 0;
    if (coupon.discountType === DiscountType.PERCENT) {
      discount = (subtotal * Number(coupon.discountValue)) / 100;
      if (coupon.maxDiscount != null) {
        discount = Math.min(discount, Number(coupon.maxDiscount));
      }
    } else {
      discount = Number(coupon.discountValue);
    }

    return round2(Math.min(discount, subtotal));
  }

  async incrementUsage(code: string): Promise<void> {
    await this.prisma.coupon.update({
      where: { code: code.toUpperCase() },
      data: { usedCount: { increment: 1 } },
    });
  }

  async findAll() {
    return this.prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async create(dto: CreateCouponDto) {
    const code = dto.code.trim().toUpperCase();
    const existing = await this.prisma.coupon.findUnique({ where: { code } });
    if (existing) throw new BadRequestException('Coupon code already exists');

    return this.prisma.coupon.create({
      data: {
        code,
        description: dto.description,
        discountType: dto.discountType,
        discountValue: new Prisma.Decimal(dto.discountValue),
        minOrderAmount: dto.minOrderAmount != null ? new Prisma.Decimal(dto.minOrderAmount) : null,
        maxDiscount: dto.maxDiscount != null ? new Prisma.Decimal(dto.maxDiscount) : null,
        usageLimit: dto.usageLimit,
        isActive: dto.isActive ?? true,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      },
    });
  }

  async update(id: string, dto: UpdateCouponDto) {
    const coupon = await this.prisma.coupon.findUnique({ where: { id } });
    if (!coupon) throw new NotFoundException('Coupon not found');

    if (dto.code) {
      const code = dto.code.trim().toUpperCase();
      const clash = await this.prisma.coupon.findFirst({
        where: { code, NOT: { id } },
      });
      if (clash) throw new BadRequestException('Coupon code already exists');
    }

    return this.prisma.coupon.update({
      where: { id },
      data: {
        ...(dto.code !== undefined && { code: dto.code.trim().toUpperCase() }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.discountType !== undefined && { discountType: dto.discountType }),
        ...(dto.discountValue !== undefined && { discountValue: new Prisma.Decimal(dto.discountValue) }),
        ...(dto.minOrderAmount !== undefined && {
          minOrderAmount: dto.minOrderAmount != null ? new Prisma.Decimal(dto.minOrderAmount) : null,
        }),
        ...(dto.maxDiscount !== undefined && {
          maxDiscount: dto.maxDiscount != null ? new Prisma.Decimal(dto.maxDiscount) : null,
        }),
        ...(dto.usageLimit !== undefined && { usageLimit: dto.usageLimit }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        ...(dto.expiresAt !== undefined && {
          expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        }),
      },
    });
  }

  async remove(id: string) {
    const coupon = await this.prisma.coupon.findUnique({ where: { id } });
    if (!coupon) throw new NotFoundException('Coupon not found');
    await this.prisma.coupon.delete({ where: { id } });
    return { success: true };
  }

  private async findByCode(code: string): Promise<Coupon> {
    const coupon = await this.prisma.coupon.findUnique({
      where: { code: code.trim().toUpperCase() },
    });
    if (!coupon) throw new BadRequestException('Invalid coupon code');
    return coupon;
  }

  private assertCouponUsable(coupon: Coupon, subtotal: number): void {
    if (!coupon.isActive) throw new BadRequestException('This coupon is no longer active');
    if (coupon.expiresAt && coupon.expiresAt < new Date()) {
      throw new BadRequestException('This coupon has expired');
    }
    if (coupon.usageLimit != null && coupon.usedCount >= coupon.usageLimit) {
      throw new BadRequestException('This coupon has reached its usage limit');
    }
    if (coupon.minOrderAmount != null && subtotal < Number(coupon.minOrderAmount)) {
      throw new BadRequestException(
        `Minimum order of ₦${Number(coupon.minOrderAmount).toLocaleString('en-NG')} required`,
      );
    }
  }
}
