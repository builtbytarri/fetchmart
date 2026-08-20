import { api } from './client';
import { WalletSummary, BankInfo, BankAccount, WithdrawalRecord } from '../types';

export interface SaveBankAccountRequest {
  bankCode: string;
  accountNumber: string;
}

export const walletApi = {
  /** Wallet balance, ledger history, withdrawals and saved bank account. */
  getWallet: async (): Promise<WalletSummary> => {
    const response = await api.get<WalletSummary>('/wallet');
    return response.data;
  },

  /** Supported banks (code + name) for the bank-account form. */
  getBanks: async (): Promise<BankInfo[]> => {
    const response = await api.get<BankInfo[]>('/wallet/banks');
    return response.data;
  },

  /** Resolve + save a payout bank account. */
  saveBankAccount: async (data: SaveBankAccountRequest): Promise<BankAccount> => {
    const response = await api.post<BankAccount>('/wallet/bank-account', data);
    return response.data;
  },

  /** Request a withdrawal of the given amount to the saved bank account. */
  withdraw: async (amount: number): Promise<WithdrawalRecord> => {
    const response = await api.post<WithdrawalRecord>('/wallet/withdraw', { amount });
    return response.data;
  },
};
