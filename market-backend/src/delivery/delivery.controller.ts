import {
  Controller,
  Post,
  Patch,
  Get,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { DeliveryService } from './delivery.service';
import { AssignRiderDto, UpdateDeliveryStatusDto } from './dto';
import { JwtAuthGuard, RolesGuard, Roles, CurrentUser } from '../auth';
import { UserRole } from '@prisma/client';

interface TokenPayload {
  userId: string;
  role: UserRole;
}

@Controller('delivery')
@UseGuards(JwtAuthGuard)
export class DeliveryController {
  constructor(private readonly deliveryService: DeliveryService) {}

  @Post('orders/:orderId/assign-rider')
  @UseGuards(RolesGuard)
  @Roles(UserRole.STORE)
  async manualAssignRider(
    @Param('orderId') orderId: string,
    @CurrentUser() user: TokenPayload,
    @Body() dto: AssignRiderDto,
  ) {
    return this.deliveryService.manualAssignRider(orderId, dto.riderId, user.userId);
  }

  @Patch('orders/:orderId/status')
  @UseGuards(RolesGuard)
  @Roles(UserRole.RIDER)
  async updateDeliveryStatus(
    @Param('orderId') orderId: string,
    @CurrentUser() user: TokenPayload,
    @Body() dto: UpdateDeliveryStatusDto,
  ) {
    const rider = await this.deliveryService.getRiderByUserId(user.userId);
    return this.deliveryService.updateDeliveryStatus(orderId, dto.status, rider.id);
  }

  @Get('my-deliveries')
  @UseGuards(RolesGuard)
  @Roles(UserRole.RIDER)
  async getMyDeliveries(@CurrentUser() user: TokenPayload) {
    const rider = await this.deliveryService.getRiderByUserId(user.userId);
    return this.deliveryService.getRiderActiveDeliveries(rider.id);
  }

  @Get('my-deliveries/completed')
  @UseGuards(RolesGuard)
  @Roles(UserRole.RIDER)
  async getMyCompletedDeliveries(@CurrentUser() user: TokenPayload) {
    const rider = await this.deliveryService.getRiderByUserId(user.userId);
    return this.deliveryService.getRiderCompletedDeliveries(rider.id);
  }

  @Get('orders/:orderId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.RIDER)
  async getDeliveryDetails(
    @Param('orderId') orderId: string,
    @CurrentUser() user: TokenPayload,
  ) {
    const rider = await this.deliveryService.getRiderByUserId(user.userId);
    return this.deliveryService.getDeliveryDetails(orderId, rider.id);
  }
}
