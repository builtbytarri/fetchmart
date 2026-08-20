import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { SaveBankAccountDto, WithdrawDto } from './dto';
import { JwtAuthGuard, RolesGuard, Roles, CurrentUser } from '../auth';
import { UserRole } from '@prisma/client';

interface TokenPayload {
  userId: string;
  role: UserRole;
}

/**
 * Store + rider wallet: balance, history, bank account, withdrawals.
 */
@Controller('wallet')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.STORE, UserRole.RIDER)
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get()
  async getMyWallet(@CurrentUser() user: TokenPayload) {
    return this.walletService.getMyWallet(user.userId, user.role);
  }

  @Get('banks')
  async getBanks() {
    return this.walletService.getBanks();
  }

  @Post('bank-account')
  async saveBankAccount(
    @CurrentUser() user: TokenPayload,
    @Body() dto: SaveBankAccountDto,
  ) {
    return this.walletService.saveBankAccount(user.userId, dto);
  }

  @Post('withdraw')
  async withdraw(
    @CurrentUser() user: TokenPayload,
    @Body() dto: WithdrawDto,
  ) {
    return this.walletService.requestWithdrawal(user.userId, user.role, dto.amount);
  }
}
