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
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto, UpdateProductDto } from './dto';
import { JwtAuthGuard, RolesGuard, Roles, CurrentUser } from '../auth';
import { UserRole } from '@prisma/client';

interface TokenPayload {
  userId: string;
  role: UserRole;
}

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STORE)
  async create(
    @CurrentUser() user: TokenPayload,
    @Body() dto: CreateProductDto,
  ) {
    return this.productsService.create(user.userId, dto);
  }

  @Get(':productId')
  async findById(@Param('productId') productId: string) {
    return this.productsService.findById(productId);
  }

  @Patch(':productId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STORE)
  async update(
    @Param('productId') productId: string,
    @CurrentUser() user: TokenPayload,
    @Body() dto: UpdateProductDto,
  ) {
    return this.productsService.update(productId, user.userId, dto);
  }

  @Delete(':productId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STORE)
  async delete(
    @Param('productId') productId: string,
    @CurrentUser() user: TokenPayload,
  ) {
    return this.productsService.delete(productId, user.userId);
  }
}
