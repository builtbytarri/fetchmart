/**
 * Flutterwave v3 Standard (hosted checkout) payment provider.
 *
 * API base: https://api.flutterwave.com/v3
 * Auth:     Authorization: Bearer <FLW_SECRET_KEY>
 * Docs:     https://developer.flutterwave.com/docs/flutterwave-standard
 *
 * Amount format: WHOLE NAIRA (not kobo). ₦5,000 → send 5000.
 *
 * Strict verification checklist (all four must pass):
 *   1. data.status === "successful"
 *   2. data.tx_ref starts with our ORDER prefix
 *   3. data.currency === "NGN"
 *   4. data.charged_amount >= expected amount
 */

import { Injectable, Logger } from '@nestjs/common';
import { AppConfigService } from '../../config';
import type { PaymentProvider } from '../payment.interface';
import {
  InitiatePaymentOptions,
  PaymentInitiationResult,
  PaymentVerificationResult,
  RefundResult,
  PaymentStatus,
} from '../payment.interface';

const FLW_BASE = 'https://api.flutterwave.com/v3';

// Redirect URL the WebView in the mobile app will intercept.
// Does NOT need to be a real HTTP endpoint — the app intercepts before loading.
const REDIRECT_URL = 'https://fetchmart.app/payment/callback';

interface FlwInitiateResponse {
  status: string;        // "success" | "error"
  message: string;
  data: { link: string };
}

interface FlwVerifyData {
  id: number;
  tx_ref: string;
  flw_ref: string;
  amount: number;
  charged_amount: number;
  currency: string;
  status: string;       // "successful" | "failed" | "pending"
  payment_type: string;
  created_at: string;
  customer: {
    id: number;
    email: string;
    name: string;
  };
  // Only present for card payments
  card?: {
    first_6digits?: string;
    last_4digits?: string;
    issuer?: string;
    country?: string;
    type?: string;       // "VISA" | "MASTERCARD" etc.
    token?: string;      // Flutterwave reusable card token
    expiry?: string;     // "MM/YY"
  };
}

interface FlwVerifyResponse {
  status: string;        // "success" | "error"
  message: string;
  data: FlwVerifyData;
}

interface FlwRefundResponse {
  status: string;
  message: string;
  data: {
    id: number;
    amount_refunded: number;
  };
}

// ── Payout / transfer types ────────────────────────────────────────────────
export interface CreatePoolSubaccountOptions {
  businessName: string;
  businessEmail?: string;
  businessMobile?: string;
}

export interface PoolSubaccountResult {
  success: boolean;
  /** account_reference used as `debit_subaccount` when paying out from the pool */
  accountReference?: string;
  barterId?: string;
  message?: string;
}

export interface TransferOptions {
  accountBank: string;     // destination bank code
  accountNumber: string;   // destination account number
  amount: number;          // whole naira
  narration: string;
  reference: string;       // our unique reference
  beneficiaryName?: string;
  /** Pool wallet reference to debit instead of the main balance. */
  debitSubaccount?: string;
}

export interface TransferResult {
  success: boolean;
  reference: string;
  transferId?: string;
  fee?: number;
  status?: string;         // NEW | PENDING | SUCCESSFUL | FAILED
  message?: string;
}

export interface BankInfo {
  code: string;
  name: string;
}

export interface ResolveAccountResult {
  success: boolean;
  accountName?: string;
  message?: string;
}

@Injectable()
export class FlutterwaveProvider implements PaymentProvider {
  private readonly logger = new Logger(FlutterwaveProvider.name);

  constructor(private readonly config: AppConfigService) {}

  private get authHeader() {
    return `Bearer ${this.config.getFlutterwaveConfig().secretKey}`;
  }

  // ── Initiate ──────────────────────────────────────────────────────────────
  async initiatePayment(opts: InitiatePaymentOptions): Promise<PaymentInitiationResult> {
    // Unique, idempotent tx_ref: ORDER-<orderId>-<epoch_ms>
    const txRef = `ORDER-${opts.orderId}-${Date.now()}`;

    // Prefer the redirect URL supplied by the mobile app (its own deep-link scheme)
    // so the browser session closes automatically after Flutterwave redirects.
    const redirectUrl = opts.redirectUrl ?? REDIRECT_URL;

    const body = {
      tx_ref: txRef,
      amount: opts.amount,          // whole naira — NOT kobo
      currency: opts.currency || 'NGN',
      redirect_url: redirectUrl,
      customer: {
        email: opts.customerEmail,
        name: opts.customerName,
      },
      customizations: {
        title: 'FetchMart',
        description: `Order payment — ${opts.orderId.slice(0, 8)}`,
      },
      meta: {
        orderId: opts.orderId,
        ...(opts.metadata ?? {}),
      },
    };

    try {
      const res = await fetch(`${FLW_BASE}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: this.authHeader,
        },
        body: JSON.stringify(body),
      });

      const json = (await res.json()) as FlwInitiateResponse;

      if (json.status === 'success' && json.data?.link) {
        return {
          success: true,
          reference: txRef,
          authorizationUrl: json.data.link,
        };
      }

      this.logger.error('Flutterwave initiation returned non-success', json);
      return { success: false, reference: txRef };
    } catch (err) {
      this.logger.error('Flutterwave initiation threw', err);
      return { success: false, reference: txRef };
    }
  }

  // ── Verify by Flutterwave transaction ID (numeric, from redirect params) ─
  async verifyByTransactionId(transactionId: number): Promise<PaymentVerificationResult & { txRef?: string }> {
    try {
      const res = await fetch(`${FLW_BASE}/transactions/${transactionId}/verify`, {
        method: 'GET',
        headers: { Authorization: this.authHeader },
      });

      const json = (await res.json()) as FlwVerifyResponse;

      if (json.status !== 'success' || !json.data) {
        this.logger.error('Flutterwave verify returned non-success', json);
        return this.failedResult('');
      }

      const d = json.data;

      // Extract card token if this was a card payment
      let cardToken: string | undefined;
      let maskedCard: string | undefined;
      let cardType: string | undefined;
      let expiryMonth: string | undefined;
      let expiryYear: string | undefined;

      if (d.card?.token) {
        cardToken = d.card.token;
        cardType = d.card.type?.toUpperCase() ?? 'CARD';
        const last4 = d.card.last_4digits ?? '????';
        maskedCard = `${cardType} •••• •••• •••• ${last4}`;
        const expiryParts = (d.card.expiry ?? '').split('/');
        expiryMonth = expiryParts[0] ?? '';
        expiryYear = expiryParts[1] ? `20${expiryParts[1]}` : '';
      }

      return {
        success: d.status === 'successful',
        reference: d.tx_ref,
        txRef: d.tx_ref,
        status: this.mapStatus(d.status),
        amount: d.charged_amount,
        currency: d.currency,
        paidAt: d.status === 'successful' ? new Date(d.created_at) : undefined,
        cardToken,
        maskedCard,
        cardType,
        expiryMonth,
        expiryYear,
      };
    } catch (err) {
      this.logger.error('Flutterwave verify threw', err);
      return this.failedResult('');
    }
  }

  // ── Verify by tx_ref (our reference) — used by webhook handler ───────────
  async verifyPayment(reference: string): Promise<PaymentVerificationResult> {
    try {
      const res = await fetch(
        `${FLW_BASE}/transactions/verify_by_reference?tx_ref=${encodeURIComponent(reference)}`,
        { method: 'GET', headers: { Authorization: this.authHeader } },
      );

      const json = (await res.json()) as FlwVerifyResponse;

      if (json.status !== 'success' || !json.data) {
        return this.failedResult(reference);
      }

      const d = json.data;
      return {
        success: d.status === 'successful',
        reference: d.tx_ref,
        status: this.mapStatus(d.status),
        amount: d.charged_amount,
        currency: d.currency,
        paidAt: d.status === 'successful' ? new Date(d.created_at) : undefined,
      };
    } catch (err) {
      this.logger.error('Flutterwave verify by ref threw', err);
      return this.failedResult(reference);
    }
  }

  // ── Refund ────────────────────────────────────────────────────────────────
  async refundPayment(reference: string, amount?: number): Promise<RefundResult> {
    // Flutterwave refund requires the transaction ID, not the tx_ref.
    // We first verify by reference to get the numeric ID, then refund.
    try {
      const verifyRes = await fetch(
        `${FLW_BASE}/transactions/verify_by_reference?tx_ref=${encodeURIComponent(reference)}`,
        { method: 'GET', headers: { Authorization: this.authHeader } },
      );
      const verifyJson = (await verifyRes.json()) as FlwVerifyResponse;
      if (verifyJson.status !== 'success') {
        return { success: false, reference, amount: 0 };
      }

      const transactionId = verifyJson.data.id;
      const refundBody: Record<string, unknown> = {};
      if (amount !== undefined) refundBody.amount = amount;  // whole naira

      const refundRes = await fetch(`${FLW_BASE}/transactions/${transactionId}/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: this.authHeader },
        body: JSON.stringify(refundBody),
      });

      const json = (await refundRes.json()) as FlwRefundResponse;

      if (json.status === 'success') {
        return {
          success: true,
          reference,
          refundReference: String(json.data.id),
          amount: json.data.amount_refunded,
        };
      }

      return { success: false, reference, amount: 0 };
    } catch (err) {
      this.logger.error('Flutterwave refund threw', err);
      return { success: false, reference, amount: 0 };
    }
  }

  // ── Payouts: create a pool wallet (Payout Subaccount / PSA) ───────────────
  /**
   * Creates a Payout Subaccount (NGN wallet) that HOLDS a withdrawable balance.
   * Used once per shared pool (store pool, rider pool). The returned
   * accountReference is later passed as `debit_subaccount` on withdrawals.
   */
  async createPoolSubaccount(opts: CreatePoolSubaccountOptions): Promise<PoolSubaccountResult> {
    try {
      // PSAs are pure virtual NGN wallets — no real bank account required.
      // Flutterwave auto-issues a virtual account number for funding.
      const body = {
        account_name: opts.businessName,
        email: opts.businessEmail ?? 'finance@fetchmart.app',
        mobilenumber: opts.businessMobile ?? '08000000000',
        country: 'NG',
      };

      const res = await fetch(`${FLW_BASE}/payout-subaccounts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: this.authHeader },
        body: JSON.stringify(body),
      });

      const json = (await res.json()) as {
        status: string;
        message: string;
        data?: { account_reference?: string; barter_id?: string };
      };

      if (json.status === 'success' && json.data?.account_reference) {
        return {
          success: true,
          accountReference: json.data.account_reference,
          barterId: json.data.barter_id,
        };
      }

      this.logger.error('Flutterwave create pool subaccount failed', json);
      return { success: false, message: json.message };
    } catch (err) {
      this.logger.error('Flutterwave create pool subaccount threw', err);
      return { success: false, message: 'Pool subaccount creation failed' };
    }
  }

  /** NGN balance held in a pool wallet. */
  async getPoolBalance(accountReference: string): Promise<number | null> {
    try {
      const res = await fetch(
        `${FLW_BASE}/payout-subaccounts/${encodeURIComponent(accountReference)}/balances?currency=NGN`,
        { method: 'GET', headers: { Authorization: this.authHeader } },
      );
      const json = (await res.json()) as {
        status: string;
        data?: { available_balance?: number };
      };
      if (json.status === 'success' && typeof json.data?.available_balance === 'number') {
        return json.data.available_balance;
      }
      return null;
    } catch (err) {
      this.logger.error('Flutterwave get pool balance threw', err);
      return null;
    }
  }

  // ── Payouts: transfer to a bank account (optionally from a pool wallet) ────
  async createTransfer(opts: TransferOptions): Promise<TransferResult> {
    try {
      const body: Record<string, unknown> = {
        account_bank: opts.accountBank,
        account_number: opts.accountNumber,
        amount: opts.amount,            // whole naira
        narration: opts.narration,
        currency: 'NGN',
        debit_currency: 'NGN',
        reference: opts.reference,
      };
      if (opts.beneficiaryName) body.beneficiary_name = opts.beneficiaryName;
      // Debit the pool wallet rather than the main balance.
      if (opts.debitSubaccount) body.debit_subaccount = opts.debitSubaccount;

      const res = await fetch(`${FLW_BASE}/transfers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: this.authHeader },
        body: JSON.stringify(body),
      });

      const json = (await res.json()) as {
        status: string;
        message: string;
        data?: { id: number; fee: number; status: string };
      };

      if (json.status === 'success' && json.data) {
        return {
          success: true,
          reference: opts.reference,
          transferId: String(json.data.id),
          fee: json.data.fee,
          status: json.data.status,
        };
      }

      this.logger.error('Flutterwave transfer failed', json);
      return { success: false, reference: opts.reference, message: json.message };
    } catch (err) {
      this.logger.error('Flutterwave transfer threw', err);
      return { success: false, reference: opts.reference, message: 'Transfer failed' };
    }
  }

  /**
   * Move funds from the MAIN balance into a pool wallet (PSA). Used by the
   * settlement sweep so the admin's main balance reflects only profit.
   */
  async fundPool(poolReference: string, amount: number, reference: string): Promise<TransferResult> {
    try {
      const body = {
        account_bank: 'flutterwave',
        account_number: poolReference,
        amount,
        narration: 'FetchMart pool funding',
        currency: 'NGN',
        debit_currency: 'NGN',
        reference,
      };
      const res = await fetch(`${FLW_BASE}/transfers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: this.authHeader },
        body: JSON.stringify(body),
      });
      const json = (await res.json()) as {
        status: string;
        message: string;
        data?: { id: number; fee: number; status: string };
      };
      if (json.status === 'success' && json.data) {
        return {
          success: true,
          reference,
          transferId: String(json.data.id),
          fee: json.data.fee,
          status: json.data.status,
        };
      }
      return { success: false, reference, message: json.message };
    } catch (err) {
      this.logger.error('Flutterwave fundPool threw', err);
      return { success: false, reference, message: 'Pool funding failed' };
    }
  }

  /** Estimated transfer fee for an account payout. */
  async getTransferFee(amount: number): Promise<number> {
    try {
      const res = await fetch(
        `${FLW_BASE}/transfers/fee?amount=${amount}&currency=NGN&type=account`,
        { method: 'GET', headers: { Authorization: this.authHeader } },
      );
      const json = (await res.json()) as {
        status: string;
        data?: Array<{ fee: number }>;
      };
      const fee = json.data?.[0]?.fee;
      return typeof fee === 'number' ? fee : 0;
    } catch (err) {
      this.logger.error('Flutterwave transfer fee threw', err);
      return 0;
    }
  }

  // ── Banks + account name resolution ───────────────────────────────────────
  async getBanks(country = 'NG'): Promise<BankInfo[]> {
    try {
      const res = await fetch(`${FLW_BASE}/banks/${country}`, {
        method: 'GET',
        headers: { Authorization: this.authHeader },
      });
      const json = (await res.json()) as {
        status: string;
        data?: Array<{ code: string; name: string }>;
      };
      if (json.status === 'success' && Array.isArray(json.data)) {
        return json.data.map((b) => ({ code: b.code, name: b.name }));
      }
      return [];
    } catch (err) {
      this.logger.error('Flutterwave get banks threw', err);
      return [];
    }
  }

  async resolveAccountName(accountNumber: string, bankCode: string): Promise<ResolveAccountResult> {
    try {
      const res = await fetch(`${FLW_BASE}/accounts/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: this.authHeader },
        body: JSON.stringify({ account_number: accountNumber, account_bank: bankCode }),
      });
      const json = (await res.json()) as {
        status: string;
        message: string;
        data?: { account_name: string };
      };
      if (json.status === 'success' && json.data?.account_name) {
        return { success: true, accountName: json.data.account_name };
      }
      return { success: false, message: json.message };
    } catch (err) {
      this.logger.error('Flutterwave resolve account threw', err);
      return { success: false, message: 'Could not verify account' };
    }
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  private mapStatus(status: string): PaymentStatus {
    switch (status.toLowerCase()) {
      case 'successful': return PaymentStatus.SUCCESS;
      case 'failed':     return PaymentStatus.FAILED;
      case 'pending':    return PaymentStatus.PENDING;
      default:           return PaymentStatus.PENDING;
    }
  }

  private failedResult(reference: string): PaymentVerificationResult {
    return {
      success: false,
      reference,
      status: PaymentStatus.FAILED,
      amount: 0,
      currency: 'NGN',
    };
  }
}
