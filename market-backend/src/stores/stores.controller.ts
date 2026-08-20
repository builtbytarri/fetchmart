import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { StoresService } from './stores.service';
import { ProductsService } from '../products';
import { CreateStoreDto, UpdateStoreDto, NearbyQueryDto, CreateCategoryDto, UpdateCategoryDto } from './dto';
import { JwtAuthGuard, RolesGuard, Roles, CurrentUser } from '../auth';
import { UserRole } from '@prisma/client';

interface TokenPayload {
  userId: string;
  role: UserRole;
}

@Controller('stores')
export class StoresController {
  constructor(
    private readonly storesService: StoresService,
    @Inject(forwardRef(() => ProductsService))
    private readonly productsService: ProductsService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STORE)
  async create(
    @CurrentUser() user: TokenPayload,
    @Body() dto: CreateStoreDto,
  ) {
    return this.storesService.create(user.userId, dto);
  }

  @Get('my-stores')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STORE)
  async getMyStores(@CurrentUser() user: TokenPayload) {
    const store = await this.storesService.findByOwnerId(user.userId);
    return store ? [store] : [];
  }

  @Get('nearby')
  async findNearby(@Query() query: NearbyQueryDto) {
    return this.storesService.findNearby(query);
  }

  @Get('featured')
  async getFeatured() {
    return this.storesService.getFeatured();
  }

  @Get('favourites')
  @UseGuards(JwtAuthGuard)
  async getFavourites(@CurrentUser() user: TokenPayload) {
    return this.storesService.getFavourites(user.userId);
  }

  @Get('favourite-ids')
  @UseGuards(JwtAuthGuard)
  async getFavouriteIds(@CurrentUser() user: TokenPayload) {
    return this.storesService.getFavouriteIds(user.userId);
  }

  @Post(':storeId/favourite')
  @UseGuards(JwtAuthGuard)
  async toggleFavourite(
    @Param('storeId') storeId: string,
    @CurrentUser() user: TokenPayload,
  ) {
    return this.storesService.toggleFavourite(user.userId, storeId);
  }

  @Get(':storeId')
  async findById(@Param('storeId') storeId: string) {
    return this.storesService.findById(storeId);
  }

  @Patch(':storeId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STORE)
  async update(
    @Param('storeId') storeId: string,
    @CurrentUser() user: TokenPayload,
    @Body() dto: UpdateStoreDto,
  ) {
    return this.storesService.update(storeId, user.userId, dto);
  }

  @Get(':storeId/products/suggested')
  async getSuggestedProducts(@Param('storeId') storeId: string) {
    return this.productsService.findSuggested(storeId);
  }

  @Get(':storeId/products')
  async getStoreProducts(@Param('storeId') storeId: string) {
    return this.productsService.findByStoreId(storeId, true);
  }

  // Category endpoints
  @Post(':storeId/categories')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STORE)
  async createCategory(
    @Param('storeId') storeId: string,
    @CurrentUser() user: TokenPayload,
    @Body() dto: CreateCategoryDto,
  ) {
    return this.storesService.createCategory(storeId, user.userId, dto.name);
  }

  @Get(':storeId/categories')
  async getCategories(@Param('storeId') storeId: string) {
    return this.storesService.getCategories(storeId);
  }

  @Patch('categories/:categoryId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STORE)
  async updateCategory(
    @Param('categoryId') categoryId: string,
    @CurrentUser() user: TokenPayload,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.storesService.updateCategory(categoryId, user.userId, dto.name);
  }

  @Delete('categories/:categoryId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STORE)
  async deleteCategory(
    @Param('categoryId') categoryId: string,
    @CurrentUser() user: TokenPayload,
  ) {
    return this.storesService.deleteCategory(categoryId, user.userId);
  }

  // ── Store order management ─────────────────────────────────────────────────

  /** All orders for this store (excluding CANCELLED by default). */
  @Get('my/orders')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STORE)
  async getMyOrders(
    @CurrentUser() user: TokenPayload,
    @Query('status') status?: OrderStatus,
  ) {
    return this.storesService.getMyOrders(user.userId, status);
  }

  /** Accept / mark-preparing / mark-ready for an order. Body: { status } */
  @Patch('my/orders/:orderId/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STORE)
  async updateOrderStatus(
    @Param('orderId') orderId: string,
    @CurrentUser() user: TokenPayload,
    @Body('status') status: OrderStatus,
  ) {
    return this.storesService.updateStoreOrderStatus(orderId, user.userId, status);
  }

  /** Reject (cancel) an order that the store cannot fulfil. */
  @Post('my/orders/:orderId/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STORE)
  async rejectOrder(
    @Param('orderId') orderId: string,
    @CurrentUser() user: TokenPayload,
  ) {
    return this.storesService.rejectOrder(orderId, user.userId);
  }
}
