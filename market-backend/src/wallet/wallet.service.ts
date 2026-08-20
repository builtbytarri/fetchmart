import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from '@nestjs/common';
import {
  LedgerEntryType,
  Prisma,
  UserRole,
  Wallet,
  WalletOwnerType,
  WithdrawalStatus,
} from '@prisma/client';
import { PrismaService } from '../database';
import { SettingsService } from '../settings';
import { FlutterwaveProvider } from '../payments/providers/flutterwave.provider';
import { SaveBankAccountDto } from './dto';

// How often the background reconciliation sweep runs (it is a cheap no-op
// while poolSweepEnabled is off).
const POOL_SWEEP_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes

@Injectable()
export class WalletService implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly logger = new Logger(WalletService.name);
  private sweepTimer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly settingsService: SettingsService,
    private readonly flw: FlutterwaveProvider,
  ) {}

  /**
   * Ensure both shared pool PSAs exist in Flutterwave (one-time setup).
   * Each pool uses a unique email so Flutterwave accepts both accounts.
   * IDs are persisted immediately after each successful creation.
   */
  async ensurePoolSubaccounts(): Promise<{
    storePoolSubaccountId: string | null;
    riderPoolSubaccountId: string | null;
    errors: string[];
  }> {
    const settings = await this.settingsService.getSettings();
    const errors: string[] = [];
    let storePoolSubaccountId = settings.storePoolSubaccountId;
    let riderPoolSubaccountId = settings.riderPoolSubaccountId;

    if (!storePoolSubaccountId) {
      const result = await this.flw.createPoolSubaccount({
        businessName: 'FetchMart Store Pool',
        businessEmail: 'store-pool@fetchmart.app',
        businessMobile: '08000000001',
      });
      if (result.success && result.accountReference) {
        storePoolSubaccountId = result.accountReference;
        await this.settingsService.updateSettings({ storePoolSubaccountId });
        this.logger.log(`Store pool PSA created: ${storePoolSubaccountId}`);
      } else {
        errors.push(`Store pool: ${result.message ?? 'creation failed'}`);
        this.logger.warn(`Could not create store pool PSA: ${result.message}`);
      }
    }

    if (!riderPoolSubaccountId) {
      const result = await this.flw.createPoolSubaccount({
        businessName: 'FetchMart Rider Pool',
        businessEmail: 'rider-pool@fetchmart.app',
        businessMobile: '08000000002',
      });
      if (result.success && result.accountReference) {
        riderPoolSubaccountId = result.accountReference;
        await this.settingsService.updateSettings({ riderPoolSubaccountId });
        this.logger.log(`Rider pool PSA created: ${riderPoolSubaccountId}`);
      } else {
        errors.push(`Rider pool: ${result.message ?? 'creation failed'}`);
        this.logger.warn(`Could not create rider pool PSA: ${result.message}`);
      }
    }

    return { storePoolSubaccountId, riderPoolSubaccountId, errors };
  }

  async onApplicationBootstrap() {
    try {
      await this.ensurePoolSubaccounts();
    } catch (err) {
      this.logger.error('Pool PSA auto-init failed', err);
    }

    // Periodic reconciliation sweep — recovers pool funding if an inline
    // transfer failed. Gated by poolSweepEnabled, so it's a cheap no-op until
    // the Flutterwave Transfers API is configured.
    this.sweepTimer = setInterval(() => {
      this.sweepPools().catch((err) =>
        this.logger.warn('Scheduled pool sweep failed', err),
      );
    }, POOL_SWEEP_INTERVAL_MS);
    // Don't keep the event loop alive just for this timer.
    this.sweepTimer.unref?.();
  }

  onModuleDestroy() {
    if (this.sweepTimer) clearInterval(this.sweepTimer);
  }

  // ── Wallet resolution ──────────────────────────────────────────────────────
  async getOrCreateStoreWallet(storeId: string): Promise<Wallet> {
    return this.prisma.wallet.upsert({
      where: { storeId },
      update: {},
      create: { storeId, ownerType: WalletOwnerType.STORE },
    });
  }

  async getOrCreateRiderWallet(riderId: string): Promise<Wallet> {
    return this.prisma.wallet.upsert({
      where: { riderId },
      update: {},
      create: { riderId, ownerType: WalletOwnerType.RIDER },
    });
  }

  // ── Ledger postings ─────────────────────────────────────────────────────────

  /**
   * Credit the store's payout for an order into its *pending* balance, then
   * push that amount into the store pool PSA so a later withdrawal can debit it.
   *
   * This runs at PAID — before the store has accepted, let alone fulfilled, the
   * order — so the money is provisional and deliberately not withdrawable. It
   * is promoted into the withdrawable balance by settleStoreForOrder() once the
   * delivery completes, or clawed back by reverseOrderCredits() if the order is
   * declined, times out, or is settled by an admin.
   *
   * Idempotent via order.storeCredited.
   */
  async creditStoreForOrder(orderId: string): Promise<void> {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order || order.storeCredited) return;
    const amount = order.storePayout;
    if (!amount || Number(amount) <= 0) return;

    const wallet = await this.getOrCreateStoreWallet(order.storeId);

    await this.prisma.$transaction([
      this.prisma.ledgerEntry.create({
        data: {
          walletId: wallet.id,
          orderId: order.id,
          type: LedgerEntryType.CREDIT,
          amount,
          reason: 'Store payout for order (pending delivery)',
        },
      }),
      this.prisma.wallet.update({
        where: { id: wallet.id },
        data: { pendingBalance: { increment: amount } },
      }),
      this.prisma.order.update({
        where: { id: order.id },
        data: { storeCredited: true },
      }),
    ]);

    // Immediately fund the store PSA — no cron needed.
    await this.pushToPool('store', Number(amount), orderId);
    this.logger.log(
      `Credited store wallet ${wallet.id} pending balance with ${amount} for order ${order.id}`,
    );
  }

  /**
   * Promote a store's provisional payout into its withdrawable balance once the
   * order has actually been delivered. No money enters or leaves the platform
   * here — it only moves between the two columns of the same wallet.
   *
   * Idempotent via order.storeSettled, and a no-op if the credit was already
   * reversed (a cancelled order must never become withdrawable).
   */
  async settleStoreForOrder(orderId: string): Promise<void> {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order || !order.storeCredited || order.storeSettled || order.storeReversed) return;
    const amount = order.storePayout;
    if (!amount || Number(amount) <= 0) return;

    const wallet = await this.getOrCreateStoreWallet(order.storeId);

    // Guard against a pending balance that has drifted below the amount owed
    // (should not happen, but never move more than is actually held).
    const movable = Prisma.Decimal.min(
      new Prisma.Decimal(amount),
      new Prisma.Decimal(wallet.pendingBalance),
    );
    if (movable.lessThanOrEqualTo(0)) {
      this.logger.warn(
        `Order ${order.id}: nothing to settle — pending balance is ${wallet.pendingBalance}`,
      );
      await this.prisma.order.update({
        where: { id: order.id },
        data: { storeSettled: true },
      });
      return;
    }

    await this.prisma.$transaction([
      this.prisma.wallet.update({
        where: { id: wallet.id },
        data: {
          pendingBalance: { decrement: movable },
          balance: { increment: movable },
        },
      }),
      this.prisma.order.update({
        where: { id: order.id },
        data: { storeSettled: true },
      }),
    ]);

    this.logger.log(
      `Settled ${movable} from pending to available for store wallet ${wallet.id} (order ${order.id})`,
    );
  }

  /**
   * Credit the assigned rider's wallet with their delivery earnings, then
   * immediately push that amount into the rider pool PSA.
   * Idempotent via order.riderCredited.
   */
  async creditRiderForOrder(orderId: string): Promise<void> {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order || order.riderCredited || !order.riderId) return;
    const amount = order.riderPayout;
    if (!amount || Number(amount) <= 0) return;

    const wallet = await this.getOrCreateRiderWallet(order.riderId);

    await this.prisma.$transaction([
      this.prisma.ledgerEntry.create({
        data: {
          walletId: wallet.id,
          orderId: order.id,
          type: LedgerEntryType.CREDIT,
          amount,
          reason: 'Rider earnings for delivery',
        },
      }),
      this.prisma.wallet.update({
        where: { id: wallet.id },
        data: { balance: { increment: amount } },
      }),
      this.prisma.order.update({
        where: { id: order.id },
        data: { riderCredited: true },
      }),
    ]);

    // Immediately fund the rider PSA — no cron needed.
    await this.pushToPool('rider', Number(amount), orderId);
    this.logger.log(`Credited rider wallet ${wallet.id} with ${amount} for order ${order.id}`);
  }

  /**
   * Reverse the store (and, if any, rider) wallet credits for an order that is
   * being cancelled/settled after payment. Without this, a store that declines
   * a paid order would keep its payout in its wallet and could withdraw money
   * for an order it never fulfilled.
   *
   * Idempotent via order.storeReversed / order.riderReversed so it is safe to
   * call from every cancellation path (store decline, admin cancel, timeout,
   * admin settlement). Returns the amounts actually clawed back.
   *
   * Note: the DB ledger is the source of truth for what is owed; the pool PSAs
   * self-correct over time (any shortfall is covered by the main balance), so
   * we intentionally do not attempt to pull funds back out of the pool here.
   */
  async reverseOrderCredits(
    orderId: string,
  ): Promise<{ storeReversal: number; riderReversal: number }> {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return { storeReversal: 0, riderReversal: 0 };

    let storeReversal = 0;
    let riderReversal = 0;

    // ── Reverse the store credit ──────────────────────────────────────────────
    if (order.storeCredited && !order.storeReversed) {
      const amount = order.storePayout;
      if (amount && Number(amount) > 0) {
        const wallet = await this.getOrCreateStoreWallet(order.storeId);

        // Debit whichever column the money is sitting in: pending while the
        // order is still in flight, available once it has been settled.
        // Clamp to what is actually held so a wallet can never go negative —
        // if the amounts disagree we log the shortfall rather than manufacture
        // a negative balance the store could never repay.
        const held = order.storeSettled ? wallet.balance : wallet.pendingBalance;
        const debit = Prisma.Decimal.min(new Prisma.Decimal(amount), new Prisma.Decimal(held));
        const shortfall = new Prisma.Decimal(amount).minus(debit);
        if (shortfall.greaterThan(0)) {
          this.logger.error(
            `Order ${order.id}: could only claw back ${debit} of ${amount} from store ` +
              `wallet ${wallet.id} (${order.storeSettled ? 'available' : 'pending'} = ${held}). ` +
              `Shortfall of ${shortfall} must be recovered manually.`,
          );
        }

        await this.prisma.$transaction([
          this.prisma.ledgerEntry.create({
            data: {
              walletId: wallet.id,
              orderId: order.id,
              type: LedgerEntryType.DEBIT,
              amount: debit,
              reason: 'Reversal — order cancelled/settled',
            },
          }),
          this.prisma.wallet.update({
            where: { id: wallet.id },
            data: order.storeSettled
              ? { balance: { decrement: debit } }
              : { pendingBalance: { decrement: debit } },
          }),
          this.prisma.order.update({
            where: { id: order.id },
            data: { storeReversed: true },
          }),
        ]);
        storeReversal = Number(debit);
        this.logger.log(`Reversed store payout ${debit} for cancelled order ${order.id}`);
      } else {
        await this.prisma.order.update({
          where: { id: order.id },
          data: { storeReversed: true },
        });
      }
    }

    // ── Reverse the rider credit (only set once an order is COMPLETED) ─────────
    if (order.riderCredited && !order.riderReversed && order.riderId) {
      const amount = order.riderPayout;
      if (amount && Number(amount) > 0) {
        const wallet = await this.getOrCreateRiderWallet(order.riderId);

        // Rider earnings are credited straight to the withdrawable balance
        // (they are only ever posted at COMPLETED), so claw back from there —
        // clamped, for the same reason as the store reversal above.
        const debit = Prisma.Decimal.min(
          new Prisma.Decimal(amount),
          new Prisma.Decimal(wallet.balance),
        );
        const shortfall = new Prisma.Decimal(amount).minus(debit);
        if (shortfall.greaterThan(0)) {
          this.logger.error(
            `Order ${order.id}: could only claw back ${debit} of ${amount} from rider ` +
              `wallet ${wallet.id} (available = ${wallet.balance}). ` +
              `Shortfall of ${shortfall} must be recovered manually.`,
          );
        }

        await this.prisma.$transaction([
          this.prisma.ledgerEntry.create({
            data: {
              walletId: wallet.id,
              orderId: order.id,
              type: LedgerEntryType.DEBIT,
              amount: debit,
              reason: 'Reversal — order cancelled/settled',
            },
          }),
          this.prisma.wallet.update({
            where: { id: wallet.id },
            data: { balance: { decrement: debit } },
          }),
          this.prisma.order.update({
            where: { id: order.id },
            data: { riderReversed: true },
          }),
        ]);
        riderReversal = Number(debit);
        this.logger.log(`Reversed rider payout ${debit} for cancelled order ${order.id}`);
      } else {
        await this.prisma.order.update({
          where: { id: order.id },
          data: { riderReversed: true },
        });
      }
    }

    return { storeReversal, riderReversal };
  }

  /**
   * Pay a goodwill / cancellation compensation to the order's assigned rider out
   * of platform funds (e.g. the rider already travelled before the order was
   * cancelled). Credits the rider wallet and funds the rider pool PSA.
   */
  async creditRiderCompensation(orderId: string, amount: number): Promise<number> {
    if (amount <= 0) return 0;
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order?.riderId) return 0;

    const wallet = await this.getOrCreateRiderWallet(order.riderId);
    const dec = new Prisma.Decimal(amount);

    await this.prisma.$transaction([
      this.prisma.ledgerEntry.create({
        data: {
          walletId: wallet.id,
          orderId: order.id,
          type: LedgerEntryType.CREDIT,
          amount: dec,
          reason: 'Cancellation compensation',
        },
      }),
      this.prisma.wallet.update({
        where: { id: wallet.id },
        data: { balance: { increment: dec } },
      }),
    ]);

    await this.pushToPool('rider', amount, orderId);
    this.logger.log(`Paid rider compensation ${amount} for order ${order.id}`);
    return amount;
  }

  /**
   * Push an exact amount into the store or rider pool PSA immediately after
   * a credit event. Fire-and-forget on failure — the pool will self-correct
   * on the next payment (shortfall is always covered by the main balance).
   */
  private async pushToPool(pool: 'store' | 'rider', amount: number, orderId: string): Promise<void> {
    try {
      const settings = await this.settingsService.getSettings();
      const poolRef = pool === 'store' ? settings.storePoolSubaccountId : settings.riderPoolSubaccountId;
      if (!poolRef) return; // PSA not yet created (first boot race) — skip

      const reference = `POOL-${pool}-${orderId.slice(0, 8)}-${Date.now()}`;
      const result = await this.flw.fundPool(poolRef, amount, reference);
      if (!result.success) {
        this.logger.warn(`PSA fund failed for ${pool} pool (order ${orderId}): ${result.message}`);
      }
    } catch (err) {
      this.logger.error(`PSA fund threw for ${pool} pool (order ${orderId})`, err);
    }
  }

  // ── Customer-facing (store / rider) wallet view ─────────────────────────────
  async getMyWallet(userId: string, role: UserRole) {
    const wallet = await this.resolveWalletForUser(userId, role);

    const [entries, bankAccount, withdrawals] = await Promise.all([
      this.prisma.ledgerEntry.findMany({
        where: { walletId: wallet.id },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      this.prisma.bankAccount.findUnique({ where: { userId } }),
      this.prisma.withdrawal.findMany({
        where: { walletId: wallet.id },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
    ]);

    return {
      // Withdrawable now.
      balance: wallet.balance,
      // Earned but held until the corresponding orders are delivered.
      pendingBalance: wallet.pendingBalance,
      ownerType: wallet.ownerType,
      ledger: entries,
      withdrawals,
      bankAccount,
    };
  }

  // ── Bank accounts ───────────────────────────────────────────────────────────
  async getBanks() {
    return this.flw.getBanks('NG');
  }

  async saveBankAccount(userId: string, dto: SaveBankAccountDto) {
    const resolved = await this.flw.resolveAccountName(dto.accountNumber, dto.bankCode);
    if (!resolved.success || !resolved.accountName) {
      throw new BadRequestException(
        resolved.message ?? 'Could not verify this bank account. Check the details and try again.',
      );
    }

    const banks = await this.flw.getBanks('NG');
    const bankName = banks.find((b) => b.code === dto.bankCode)?.name;

    return this.prisma.bankAccount.upsert({
      where: { userId },
      update: {
        bankCode: dto.bankCode,
        bankName,
        accountNumber: dto.accountNumber,
        accountName: resolved.accountName,
      },
      create: {
        userId,
        bankCode: dto.bankCode,
        bankName,
        accountNumber: dto.accountNumber,
        accountName: resolved.accountName,
      },
    });
  }

  // ── Withdrawals ─────────────────────────────────────────────────────────────
  async requestWithdrawal(userId: string, role: UserRole, amount: number) {
    if (amount <= 0) throw new BadRequestException('Amount must be greater than zero');

    const wallet = await this.resolveWalletForUser(userId, role);
    if (Number(wallet.balance) < amount) {
      throw new BadRequestException('Insufficient balance');
    }

    const bankAccount = await this.prisma.bankAccount.findUnique({ where: { userId } });
    if (!bankAccount) {
      throw new BadRequestException('Add a bank account before withdrawing');
    }

    const settings = await this.settingsService.getSettings();
    const minAmount = Number(settings.withdrawalMinAmount);
    if (amount < minAmount) {
      throw new BadRequestException(
        `Minimum withdrawal amount is ₦${minAmount.toLocaleString('en-NG')}`,
      );
    }

    const feePercent = Number(settings.withdrawalFeePercent);
    const fee = Math.round((amount * feePercent) / 100 * 100) / 100;
    const netAmount = Math.round((amount - fee) * 100) / 100;
    if (netAmount <= 0) {
      throw new BadRequestException('Withdrawal amount is too small after processing fee');
    }

    const poolRef =
      wallet.ownerType === WalletOwnerType.STORE
        ? settings.storePoolSubaccountId
        : settings.riderPoolSubaccountId;

    const reference = `WD-${wallet.id.slice(0, 8)}-${Date.now()}`;

    // Record the withdrawal up-front so we have an audit trail even if the transfer fails.
    const withdrawal = await this.prisma.withdrawal.create({
      data: {
        walletId: wallet.id,
        amount: new Prisma.Decimal(amount),
        fee: new Prisma.Decimal(fee),
        status: WithdrawalStatus.PENDING,
        reference,
        bankCode: bankAccount.bankCode,
        accountNumber: bankAccount.accountNumber,
        accountName: bankAccount.accountName,
      },
    });

    // Debit the shared pool PSA so the admin's main balance reflects only profit.
    // Falls back to main balance if the PSA hasn't been created yet (e.g. first boot).
    const transfer = await this.flw.createTransfer({
      accountBank: bankAccount.bankCode,
      accountNumber: bankAccount.accountNumber,
      amount: netAmount,
      narration: `FetchMart payout ${reference}`,
      reference,
      beneficiaryName: bankAccount.accountName,
      ...(poolRef ? { debitSubaccount: poolRef } : {}),
    });

    if (!transfer.success) {
      await this.prisma.withdrawal.update({
        where: { id: withdrawal.id },
        data: { status: WithdrawalStatus.FAILED, failureReason: transfer.message },
      });
      throw new BadRequestException(transfer.message ?? 'Withdrawal failed. Please try again.');
    }

    // Transfer queued — debit the wallet ledger and mark the withdrawal processing.
    // The transfer webhook later flips it to COMPLETED or FAILED (re-crediting on failure).
    await this.prisma.$transaction([
      this.prisma.ledgerEntry.create({
        data: {
          walletId: wallet.id,
          type: LedgerEntryType.DEBIT,
          amount: new Prisma.Decimal(amount),
          reason: `Withdrawal ${reference}`,
        },
      }),
      this.prisma.wallet.update({
        where: { id: wallet.id },
        data: { balance: { decrement: new Prisma.Decimal(amount) } },
      }),
      this.prisma.withdrawal.update({
        where: { id: withdrawal.id },
        data: {
          status: WithdrawalStatus.PROCESSING,
          flwTransferId: transfer.transferId,
          fee: new Prisma.Decimal(transfer.fee ?? fee),
        },
      }),
    ]);

    return this.prisma.withdrawal.findUnique({ where: { id: withdrawal.id } });
  }

  /**
   * Handle a Flutterwave transfer.* webhook: finalize the withdrawal. On
   * failure, re-credit the wallet so funds are not lost.
   */
  async handleTransferWebhook(reference: string, status: string) {
    const withdrawal = await this.prisma.withdrawal.findUnique({ where: { reference } });
    // Already in a terminal state — ignore duplicate webhooks (a second FAILED
    // event must not re-credit the wallet twice).
    if (
      !withdrawal ||
      withdrawal.status === WithdrawalStatus.COMPLETED ||
      withdrawal.status === WithdrawalStatus.FAILED
    ) {
      return;
    }

    const normalized = status.toUpperCase();
    if (normalized === 'SUCCESSFUL' || normalized === 'COMPLETED') {
      await this.prisma.withdrawal.update({
        where: { id: withdrawal.id },
        data: { status: WithdrawalStatus.COMPLETED },
      });
      return;
    }

    if (normalized === 'FAILED') {
      await this.prisma.$transaction([
        this.prisma.ledgerEntry.create({
          data: {
            walletId: withdrawal.walletId,
            type: LedgerEntryType.CREDIT,
            amount: withdrawal.amount,
            reason: `Reversal of failed withdrawal ${withdrawal.reference}`,
          },
        }),
        this.prisma.wallet.update({
          where: { id: withdrawal.walletId },
          data: { balance: { increment: withdrawal.amount } },
        }),
        this.prisma.withdrawal.update({
          where: { id: withdrawal.id },
          data: { status: WithdrawalStatus.FAILED, failureReason: 'Transfer failed at provider' },
        }),
      ]);
    }
  }

  // ── Admin: finance overview ──────────────────────────────────────────────────
  async getFinanceOverview() {
    // Reconcile the pools first so the balances shown are corrected if an inline
    // transfer had failed. No-op unless poolSweepEnabled is on.
    await this.sweepPools().catch((err) =>
      this.logger.warn('Pool sweep during finance overview failed', err),
    );
    // Create any missing pool wallets (one-time) before reading balances
    await this.ensurePoolSubaccounts();

    const settings = await this.settingsService.getSettings();

    const [storeOwed, riderOwed, adminProfitAgg, recentWithdrawals] = await Promise.all([
      this.prisma.wallet.aggregate({
        _sum: { balance: true, pendingBalance: true },
        where: { ownerType: WalletOwnerType.STORE },
      }),
      this.prisma.wallet.aggregate({
        _sum: { balance: true, pendingBalance: true },
        where: { ownerType: WalletOwnerType.RIDER },
      }),
      this.prisma.order.aggregate({
        _sum: { adminProfit: true },
        where: { status: { notIn: ['CREATED', 'CANCELLED'] } },
      }),
      this.prisma.withdrawal.findMany({
        orderBy: { createdAt: 'desc' },
        take: 25,
        include: {
          wallet: {
            include: {
              store: { select: { name: true } },
              rider: { include: { user: { select: { name: true } } } },
            },
          },
        },
      }),
    ]);

    const [storePoolBalance, riderPoolBalance] = await Promise.all([
      settings.storePoolSubaccountId
        ? this.flw.getPoolBalance(settings.storePoolSubaccountId)
        : Promise.resolve(null),
      settings.riderPoolSubaccountId
        ? this.flw.getPoolBalance(settings.riderPoolSubaccountId)
        : Promise.resolve(null),
    ]);

    return {
      adminProfitTotal: adminProfitAgg._sum.adminProfit ?? 0,
      storeOwedTotal: storeOwed._sum.balance ?? 0,
      riderOwedTotal: riderOwed._sum.balance ?? 0,
      // Provisional payouts on orders that are paid but not yet delivered.
      storePendingTotal: storeOwed._sum.pendingBalance ?? 0,
      riderPendingTotal: riderOwed._sum.pendingBalance ?? 0,
      pools: {
        storePoolSubaccountId: settings.storePoolSubaccountId,
        riderPoolSubaccountId: settings.riderPoolSubaccountId,
        storePoolBalance,
        riderPoolBalance,
      },
      recentWithdrawals,
    };
  }

  // ── Reconciliation sweep ──────────────────────────────────────────────────
  /**
   * Self-heals pool funding. For each pool it compares what the DB ledger says
   * is owed (sum of wallet balances) against the live Flutterwave PSA balance.
   * If the pool is short — e.g. an inline `fundPool` failed because the Transfers
   * API wasn't reachable (IP whitelisting) — it tops the pool up by the
   * shortfall so withdrawals can still be paid out of it.
   *
   * Gated by PlatformSettings.poolSweepEnabled so it stays dormant until the
   * Flutterwave Transfers API is configured. `force: true` (admin-triggered)
   * runs it regardless. Always safe to call — failures are logged, not thrown.
   */
  async sweepPools(opts: { force?: boolean } = {}): Promise<{
    enabled: boolean;
    pools: Array<{
      pool: 'store' | 'rider';
      owed: number;
      poolBalance: number;
      shortfall: number;
      funded: boolean;
      message?: string;
    }>;
  }> {
    const settings = await this.settingsService.getSettings();
    if (!opts.force && !settings.poolSweepEnabled) {
      return { enabled: false, pools: [] };
    }

    // Make sure the pools exist first (refs may be created here).
    await this.ensurePoolSubaccounts();
    const fresh = await this.settingsService.getSettings();

    const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
    const pools: Array<{
      pool: 'store' | 'rider';
      owed: number;
      poolBalance: number;
      shortfall: number;
      funded: boolean;
      message?: string;
    }> = [];

    for (const pool of ['store', 'rider'] as const) {
      const ownerType = pool === 'store' ? WalletOwnerType.STORE : WalletOwnerType.RIDER;
      const poolRef = pool === 'store' ? fresh.storePoolSubaccountId : fresh.riderPoolSubaccountId;
      if (!poolRef) continue;

      // The pool is funded at credit time, which happens before an order is
      // delivered — so what the pool must cover is the withdrawable balance
      // *plus* the provisional pending balance, not just the former.
      const owedAgg = await this.prisma.wallet.aggregate({
        _sum: { balance: true, pendingBalance: true },
        where: { ownerType },
      });
      const owed = round2(
        Number(owedAgg._sum.balance ?? 0) + Number(owedAgg._sum.pendingBalance ?? 0),
      );
      const poolBalance = (await this.flw.getPoolBalance(poolRef)) ?? 0;
      const shortfall = round2(owed - poolBalance);

      let funded = false;
      let message: string | undefined;
      if (shortfall > 0) {
        const reference = `SWEEP-${pool}-${Date.now()}`;
        const result = await this.flw.fundPool(poolRef, shortfall, reference);
        funded = result.success;
        if (result.success) {
          this.logger.log(`Sweep topped up ${pool} pool by ${shortfall} (owed ${owed})`);
        } else {
          message = result.message;
          this.logger.warn(`Sweep could not fund ${pool} pool (${shortfall}): ${result.message}`);
        }
      }

      pools.push({ pool, owed, poolBalance, shortfall, funded, message });
    }

    return { enabled: true, pools };
  }

  async listWithdrawals(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [withdrawals, total] = await Promise.all([
      this.prisma.withdrawal.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          wallet: {
            include: {
              store: { select: { name: true } },
              rider: { include: { user: { select: { name: true } } } },
            },
          },
        },
      }),
      this.prisma.withdrawal.count(),
    ]);
    return { withdrawals, total, page, totalPages: Math.ceil(total / limit) };
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────
  private async resolveWalletForUser(userId: string, role: UserRole): Promise<Wallet> {
    if (role === UserRole.STORE) {
      const store = await this.prisma.store.findUnique({ where: { ownerUserId: userId } });
      if (!store) throw new NotFoundException('Store not found for this user');
      return this.getOrCreateStoreWallet(store.id);
    }
    if (role === UserRole.RIDER) {
      const rider = await this.prisma.rider.findUnique({ where: { userId } });
      if (!rider) throw new NotFoundException('Rider profile not found');
      return this.getOrCreateRiderWallet(rider.id);
    }
    throw new ForbiddenException('Only stores and riders have wallets');
  }
}
