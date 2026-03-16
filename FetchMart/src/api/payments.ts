import { api } from './client';
import { PaymentInitResponse } from '../types';

export interface PaymentVerifyResponse {
  success: boolean;
  reference: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'ABANDONED' | 'REFUNDED';
  amount: number;
  currency: string;
  paidAt: string | null;
}

export const paymentsApi = {
  initiate: async (orderId: string): Promise<PaymentInitResponse> => {
    const response = await api.post<PaymentInitResponse>(`/payments/orders/${orderId}/initiate`);
    return response.data;
  },

  verify: async (reference: string): Promise<PaymentVerifyResponse> => {
    const response = await api.get<PaymentVerifyResponse>(`/payments/verify/${reference}`);
    return response.data;
  },
};
