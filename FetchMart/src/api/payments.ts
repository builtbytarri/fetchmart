import { api } from './client';
import { PaymentInitResponse, PaymentVerifyResponse } from '../types';

export interface CheckoutRequest {
  storeId: string;
  items: Array<{ productId: string; quantity: number }>;
  destLat?: number;
  destLng?: number;
  redirectUrl?: string;
  couponCode?: string;
}

export interface CheckoutResponse {
  orderId: string;
  reference: string;
  authorizationUrl: string;
}

export interface SavedPaymentMethod {
  id: string;
  maskedCard: string;
  cardType: string;
  expiryMonth: string;
  expiryYear: string;
  isDefault: boolean;
  createdAt: string;
}

export const paymentsApi = {
  /**
   * Atomic checkout — creates the order AND initiates Flutterwave in one call.
   * If payment initiation fails, the order is deleted server-side before the
   * error is returned. No orphan orders are ever created.
   */
  checkout: async (data: CheckoutRequest): Promise<CheckoutResponse> => {
    const response = await api.post<CheckoutResponse>('/payments/checkout', data);
    return response.data;
  },

  /**
   * Verify payment by Flutterwave's numeric transactionId.
   * Called after the WebView intercepts the redirect URL and extracts
   * `transaction_id` from the query params.
   * Returns { success, status, orderId? }.
   */
  verifyByTransactionId: async (
    transactionId: number,
  ): Promise<PaymentVerifyResponse> => {
    const response = await api.get<PaymentVerifyResponse>(
      `/payments/verify/transaction/${transactionId}`,
    );
    return response.data;
  },

  /**
   * Active payment poll — asks the backend to verify the order's payment
   * directly with Flutterwave (outbound), rather than waiting for the inbound
   * webhook. Reliable for bank transfer and in local dev. Returns the current
   * order status.
   */
  verifyOrder: async (orderId: string): Promise<{ orderId: string; status: string }> => {
    const response = await api.get<{ orderId: string; status: string }>(
      `/payments/orders/${orderId}/verify`,
    );
    return response.data;
  },

  getPaymentMethods: async (): Promise<SavedPaymentMethod[]> => {
    const response = await api.get<SavedPaymentMethod[]>('/payments/methods');
    return response.data;
  },

  deletePaymentMethod: async (tokenId: string): Promise<{ success: boolean }> => {
    const response = await api.delete<{ success: boolean }>(`/payments/methods/${tokenId}`);
    return response.data;
  },
};
