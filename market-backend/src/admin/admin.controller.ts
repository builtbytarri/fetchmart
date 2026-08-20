import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth';
import { UserRole, OrderStatus, FaultParty } from '@prisma/client';
import { CreateCouponDto, UpdateCouponDto } from '../coupons/dto';

interface AdminTokenPayload {
  userId: string;
  role: UserRole;
}

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  async getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  @Get('search')
  async search(@Query('q') q?: string) {
    return this.adminService.search(q ?? '');
  }

  // ── Orders — static routes MUST come before parameterised :orderId ─────────

  @Get('orders/recent')
  async getRecentOrders(@Query('limit') limit?: string) {
    return this.adminService.getRecentOrders(limit ? parseInt(limit) : 10);
  }

  @Get('orders/active')
  async getActiveOrders() {
    return this.adminService.getActiveOrders();
  }

  @Get('orders')
  async getAllOrders(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: OrderStatus,
  ) {
    return this.adminService.getAllOrders(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
      status,
    );
  }

  @Post('orders/:orderId/assign-rider')
  async assignRiderToOrder(
    @Param('orderId') orderId: string,
    @Body('riderId') riderId: string,
  ) {
    return this.adminService.assignRiderToOrder(orderId, riderId);
  }

  @Patch('orders/:orderId/status')
  async updateOrderStatus(
    @Param('orderId') orderId: string,
    @Body('status') status: OrderStatus,
  ) {
    return this.adminService.updateOrderStatus(orderId, status);
  }

  @Post('orders/:orderId/cancel')
  async cancelOrder(@Param('orderId') orderId: string) {
    return this.adminService.cancelOrder(orderId);
  }

  @Post('orders/:orderId/settle')
  async settleOrder(
    @Param('orderId') orderId: string,
    @CurrentUser() user: AdminTokenPayload,
    @Body()
    body: { reason?: string; faultParty?: FaultParty; riderCompensation?: number },
  ) {
    return this.adminService.settleOrder(orderId, {
      reason: body.reason,
      faultParty: body.faultParty,
      riderCompensation: body.riderCompensation,
      adminUserId: user.userId,
    });
  }

  @Get('orders/:orderId/settlements')
  async getOrderSettlements(@Param('orderId') orderId: string) {
    return this.adminService.getOrderSettlements(orderId);
  }

  @Post('orders/:orderId/notify-rider')
  async notifyRider(@Param('orderId') orderId: string) {
    return this.adminService.notifyRider(orderId);
  }

  // ── Stores — static routes MUST come before parameterised :id ─────────────

  @Get('stores')
  async getAllStores(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.getAllStores(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
  }

  @Get('stores/:id')
  async getStoreById(@Param('id') id: string) {
    return this.adminService.getStoreById(id);
  }

  // ── Riders — static routes MUST come before parameterised :id ────────────

  @Get('riders')
  async getAllRiders(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.getAllRiders(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
  }

  /** All riders for the assign-rider modal — available first, busy after. */
  @Get('riders/available')
  async getAvailableRiders(@Query('orderId') orderId?: string) {
    return this.adminService.getAvailableRiders(orderId);
  }

  @Get('riders/locations')
  async getRiderLocations() {
    return this.adminService.getRiderLocations();
  }

  // Parameterised route LAST so it doesn't shadow the static ones above.
  @Get('riders/:id')
  async getRiderById(@Param('id') id: string) {
    return this.adminService.getRiderById(id);
  }

  // ── Users ─────────────────────────────────────────────────────────────────

  @Get('users')
  async getAllUsers(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('role') role?: UserRole,
  ) {
    return this.adminService.getAllUsers(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
      role,
    );
  }

  // ── Map & analytics ───────────────────────────────────────────────────────

  @Get('map')
  async getMapData() {
    return this.adminService.getMapData();
  }

  @Get('analytics/orders')
  async getOrdersOverTime(@Query('days') days?: string) {
    return this.adminService.getOrdersOverTime(days ? parseInt(days) : 7);
  }

  @Post('stores/:storeId/approve')
  async approveStore(@Param('storeId') storeId: string) {
    return this.adminService.approveStore(storeId);
  }

  @Post('stores/:storeId/reject')
  async rejectStore(
    @Param('storeId') storeId: string,
    @Body('reason') reason?: string,
  ) {
    return this.adminService.rejectStore(storeId, reason);
  }

  // ── Moderation ─────────────────────────────────────────────────────────────

  @Post('stores/:storeId/suspend')
  async suspendStore(
    @Param('storeId') storeId: string,
    @Body('reason') reason?: string,
  ) {
    return this.adminService.suspendStore(storeId, reason);
  }

  @Post('stores/:storeId/unsuspend')
  async unsuspendStore(@Param('storeId') storeId: string) {
    return this.adminService.unsuspendStore(storeId);
  }

  @Delete('stores/:storeId')
  async deleteStore(@Param('storeId') storeId: string) {
    return this.adminService.deleteStore(storeId);
  }

  @Post('riders/:riderId/suspend')
  async suspendRider(
    @Param('riderId') riderId: string,
    @Body('reason') reason?: string,
  ) {
    return this.adminService.suspendRider(riderId, reason);
  }

  @Post('riders/:riderId/unsuspend')
  async unsuspendRider(@Param('riderId') riderId: string) {
    return this.adminService.unsuspendRider(riderId);
  }

  @Delete('riders/:riderId')
  async deleteRider(@Param('riderId') riderId: string) {
    return this.adminService.deleteRider(riderId);
  }

  @Get('analytics/top-stores')
  async getTopStores(@Query('days') days?: string) {
    return this.adminService.getTopStores(days ? parseInt(days) : 30);
  }

  @Get('analytics/top-riders')
  async getTopRiders(@Query('days') days?: string) {
    return this.adminService.getTopRiders(days ? parseInt(days) : 30);
  }

  @Get('analytics/summary')
  async getAnalyticsSummary(@Query('days') days?: string) {
    return this.adminService.getAnalyticsSummary(days ? parseInt(days) : 30);
  }

  // ── Featured stores ───────────────────────────────────────────────────────

  @Get('featured-stores')
  async getFeaturedStores() {
    return this.adminService.getFeaturedStores();
  }

  @Post('featured-stores')
  async addFeaturedStore(
    @Body('storeId') storeId: string,
    @Body('label') label?: string,
    @Body('sortOrder') sortOrder?: number,
  ) {
    return this.adminService.addFeaturedStore(storeId, label, sortOrder);
  }

  @Delete('featured-stores/:storeId')
  async removeFeaturedStore(@Param('storeId') storeId: string) {
    return this.adminService.removeFeaturedStore(storeId);
  }

  // ── Coupons ───────────────────────────────────────────────────────────────

  @Get('coupons')
  async getCoupons() {
    return this.adminService.getCoupons();
  }

  @Post('coupons')
  async createCoupon(@Body() dto: CreateCouponDto) {
    return this.adminService.createCoupon(dto);
  }

  @Patch('coupons/:id')
  async updateCoupon(@Param('id') id: string, @Body() dto: UpdateCouponDto) {
    return this.adminService.updateCoupon(id, dto);
  }

  @Delete('coupons/:id')
  async deleteCoupon(@Param('id') id: string) {
    return this.adminService.deleteCoupon(id);
  }
}
