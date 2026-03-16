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
}
