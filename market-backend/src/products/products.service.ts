import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../database';
import { StoresService } from '../stores';
import { CreateProductDto, UpdateProductDto } from './dto';

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => StoresService))
    private readonly storesService: StoresService,
  ) {}

  async create(userId: string, dto: CreateProductDto) {
    const store = await this.storesService.findByOwnerId(userId);

    if (!store) {
      throw new ForbiddenException('User does not have a store');
    }

    return this.prisma.product.create({
      data: {
        storeId: store.id,
        name: dto.name,
        description: dto.description,
        price: dto.price,
        stockQuantity: dto.stockQuantity ?? 0,
        categoryId: dto.categoryId,
        imageUrl: dto.imageUrl,
        isAvailable: true,
      },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        stockQuantity: true,
        categoryId: true,
        category: { select: { id: true, name: true } },
        imageUrl: true,
        isAvailable: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findByStoreId(storeId: string, availableOnly: boolean = false) {
    await this.storesService.findById(storeId);

    return this.prisma.product.findMany({
      where: {
        storeId,
        ...(availableOnly && { isAvailable: true }),
      },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        stockQuantity: true,
        categoryId: true,
        category: { select: { id: true, name: true } },
        imageUrl: true,
        isAvailable: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findById(productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        storeId: true,
        name: true,
        description: true,
        price: true,
        stockQuantity: true,
        isAvailable: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async update(productId: string, userId: string, dto: UpdateProductDto) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: { store: true },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product.store.ownerUserId !== userId) {
      throw new ForbiddenException('Not authorized to update this product');
    }

    return this.prisma.product.update({
      where: { id: productId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.price !== undefined && { price: dto.price }),
        ...(dto.stockQuantity !== undefined && { stockQuantity: dto.stockQuantity }),
        ...(dto.isAvailable !== undefined && { isAvailable: dto.isAvailable }),
        ...(dto.categoryId !== undefined && { categoryId: dto.categoryId }),
      },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        stockQuantity: true,
        categoryId: true,
        category: { select: { id: true, name: true } },
        isAvailable: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async delete(productId: string, userId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: { store: true },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product.store.ownerUserId !== userId) {
      throw new ForbiddenException('Not authorized to delete this product');
    }

    return this.prisma.product.update({
      where: { id: productId },
      data: { isAvailable: false },
      select: {
        id: true,
        name: true,
        isAvailable: true,
      },
    });
  }
}
