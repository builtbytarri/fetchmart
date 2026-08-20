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

// Shared select shape used across all product queries
const PRODUCT_SELECT = {
  id: true,
  storeId: true,
  name: true,
  description: true,
  price: true,
  stockQuantity: true,
  unit: true,
  stepSize: true,
  stockMode: true,
  categoryId: true,
  category: { select: { id: true, name: true } },
  imageUrl: true,
  isAvailable: true,
  isSuggested: true,
  isBulky: true,
  createdAt: true,
  updatedAt: true,
} as const;

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
        ...(dto.unit !== undefined && { unit: dto.unit }),
        ...(dto.stepSize !== undefined && { stepSize: dto.stepSize }),
        ...(dto.stockMode !== undefined && { stockMode: dto.stockMode }),
        categoryId: dto.categoryId,
        imageUrl: dto.imageUrl,
        isBulky: dto.isBulky ?? false,
        isAvailable: true,
      },
      select: PRODUCT_SELECT,
    });
  }

  async findByStoreId(storeId: string, availableOnly: boolean = false) {
    await this.storesService.findById(storeId);

    return this.prisma.product.findMany({
      where: {
        storeId,
        ...(availableOnly && { isAvailable: true }),
      },
      select: PRODUCT_SELECT,
    });
  }

  // Products the store owner has flagged as suggested
  async findSuggested(storeId: string) {
    await this.storesService.findById(storeId);

    return this.prisma.product.findMany({
      where: { storeId, isSuggested: true, isAvailable: true },
      select: PRODUCT_SELECT,
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findById(productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: PRODUCT_SELECT,
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  // Products in the same category, excluding the current product
  async findSimilar(productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { storeId: true, categoryId: true },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // If the product has no category, fall back to other store products
    return this.prisma.product.findMany({
      where: {
        storeId: product.storeId,
        id: { not: productId },
        isAvailable: true,
        ...(product.categoryId
          ? { categoryId: product.categoryId }
          : {}),
      },
      select: PRODUCT_SELECT,
      take: 10,
      orderBy: { createdAt: 'desc' },
    });
  }

  // Store owner: toggle isSuggested on their own product
  async toggleSuggested(productId: string, userId: string) {
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
      data: { isSuggested: !product.isSuggested },
      select: { id: true, name: true, isSuggested: true },
    });
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
        ...(dto.unit !== undefined && { unit: dto.unit }),
        ...(dto.stepSize !== undefined && { stepSize: dto.stepSize }),
        ...(dto.stockMode !== undefined && { stockMode: dto.stockMode }),
        ...(dto.isAvailable !== undefined && { isAvailable: dto.isAvailable }),
        ...(dto.isSuggested !== undefined && { isSuggested: dto.isSuggested }),
        ...(dto.isBulky !== undefined && { isBulky: dto.isBulky }),
        ...(dto.imageUrl !== undefined && { imageUrl: dto.imageUrl }),
        ...(dto.categoryId !== undefined && { categoryId: dto.categoryId }),
      },
      select: PRODUCT_SELECT,
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
      select: { id: true, name: true, isAvailable: true },
    });
  }
}
