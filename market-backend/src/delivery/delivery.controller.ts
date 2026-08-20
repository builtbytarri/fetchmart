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
import { AssignRiderDto, UpdateDeliveryStatusDto, QuoteDto } from './dto';
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

  // ── Customer actions ─────────────────────────────────────────────────────────

  /** Delivery + fee quote for the checkout screen. */
  @Post('quote')
  @UseGuards(RolesGuard)
  @Roles(UserRole.CUSTOMER)
  async getQuote(
    @CurrentUser() user: TokenPayload,
    @Body() dto: QuoteDto,
  ) {
    return this.deliveryService.getQuote(user.userId, dto);
  }

  // ── Rider actions ──────────────────────────────────────────────────────────

  /**
   * Rider explicitly accepts or declines an order that was offered to them.
   * Body: { action: 'ACCEPT' | 'DECLINE' }
   */
  @Post('orders/:orderId/respond')
  @UseGuards(RolesGuard)
  @Roles(UserRole.RIDER)
  async respondToOffer(
    @Param('orderId') orderId: string,
    @CurrentUser() user: TokenPayload,
    @Body('action') action: 'ACCEPT' | 'DECLINE',
  ) {
    const rider = await this.deliveryService.getRiderByUserId(user.userId);
    return this.deliveryService.respondToOffer(orderId, rider.id, action);
  }

  // (continued rider actions below)

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

  /**
   * All READY orders available for any rider to self-assign.
   * Separate from /my-deliveries so the distinction is explicit in the API.
   */
  @Get('available-orders')
  @UseGuards(RolesGuard)
  @Roles(UserRole.RIDER)
  async getAvailableOrders() {
    return this.deliveryService.getAvailableOrders();
  }

  /**
   * Active deliveries assigned to THIS rider (ASSIGNED → ARRIVED).
   * Does NOT include READY orders (those are in /available-orders).
   */
  @Get('my-deliveries')
  @UseGuards(RolesGuard)
  @Roles(UserRole.RIDER)
  async getMyDeliveries(@CurrentUser() user: TokenPayload) {
    const rider = await this.deliveryService.getRiderByUserId(user.userId);
    return this.deliveryService.getRiderActiveDeliveries(rider.id);
  }

  /** Completed deliveries for THIS rider — their personal history. */
  @Get('my-deliveries/completed')
  @UseGuards(RolesGuard)
  @Roles(UserRole.RIDER)
  async getMyCompletedDeliveries(@CurrentUser() user: TokenPayload) {
    const rider = await this.deliveryService.getRiderByUserId(user.userId);
    return this.deliveryService.getRiderCompletedDeliveries(rider.id);
  }

  /**
   * Full delivery details — open to any rider for READY orders,
   * restricted to the assigned rider for in-progress orders.
   */
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
