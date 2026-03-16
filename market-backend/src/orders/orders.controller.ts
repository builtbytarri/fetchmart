import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto, UpdateOrderStatusDto } from './dto';
import { JwtAuthGuard, RolesGuard, Roles, CurrentUser } from '../auth';
import { UserRole } from '@prisma/client';

interface TokenPayload {
  userId: string;
  role: UserRole;
}

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.CUSTOMER)
  async create(
    @CurrentUser() user: TokenPayload,
    @Body() dto: CreateOrderDto,
  ) {
    return this.ordersService.create(user.userId, dto);
  }

  @Get('my')
  async findMyOrders(@CurrentUser() user: TokenPayload) {
    return this.ordersService.findMyOrders(user.userId, user.role);
  }

  @Get(':orderId')
  async findById(
    @Param('orderId') orderId: string,
    @CurrentUser() user: TokenPayload,
  ) {
    return this.ordersService.findById(orderId, user.userId, user.role);
  }

  @Patch(':orderId/status')
  @UseGuards(RolesGuard)
  @Roles(UserRole.STORE)
  async updateStatus(
    @Param('orderId') orderId: string,
    @CurrentUser() user: TokenPayload,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStatus(
      orderId,
      dto.status,
      user.userId,
      user.role,
    );
  }
}
