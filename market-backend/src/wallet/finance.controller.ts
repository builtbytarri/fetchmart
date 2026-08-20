import { Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { JwtAuthGuard, RolesGuard, Roles } from '../auth';
import { UserRole } from '@prisma/client';

@Controller('admin/finance')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class FinanceController {
  constructor(private readonly walletService: WalletService) {}

  @Get('overview')
  async getOverview() {
    return this.walletService.getFinanceOverview();
  }

  /** Manually retry creation of any missing pool wallets. */
  @Post('ensure-pools')
  async ensurePools() {
    return this.walletService.ensurePoolSubaccounts();
  }

  /**
   * Manually reconcile the pool wallets: top each pool up to the amount the
   * ledger says is owed (recovers from failed inline transfers). Forced — runs
   * regardless of the poolSweepEnabled setting.
   */
  @Post('sweep-pools')
  async sweepPools() {
    return this.walletService.sweepPools({ force: true });
  }

  @Get('withdrawals')
  async getWithdrawals(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.walletService.listWithdrawals(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
  }
}
