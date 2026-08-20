import { api } from './client';
import { Order, OrderStatus, OrderQuote } from '../types';

export interface UpdateDeliveryStatusRequest {
  status: OrderStatus;
}

export interface QuoteRequest {
  storeId: string;
  items: Array<{ productId: string; quantity: number }>;
  destLat?: number;
  destLng?: number;
}

export const deliveryApi = {
  /** Delivery + fee quote for the checkout screen. */
  getQuote: async (data: QuoteRequest): Promise<OrderQuote> => {
    const response = await api.post<OrderQuote>('/delivery/quote', data);
    return response.data;
  },

  /**
   * READY orders available for any rider to self-assign.
   * Used on the Dashboard to show the incoming order feed.
   */
  getAvailableOrders: async (): Promise<Order[]> => {
    const response = await api.get<Order[]>('/delivery/available-orders');
    return response.data;
  },

  /**
   * Active deliveries assigned to THIS rider (ASSIGNED → ARRIVED).
   * Does NOT include READY orders.
   */
  getMyDeliveries: async (): Promise<Order[]> => {
    const response = await api.get<Order[]>('/delivery/my-deliveries');
    return response.data;
  },

  /** Completed deliveries — this rider's personal history only. */
  getCompletedDeliveries: async (): Promise<Order[]> => {
    const response = await api.get<Order[]>('/delivery/my-deliveries/completed');
    return response.data;
  },

  /** Full order details for a specific delivery. */
  getDeliveryDetails: async (orderId: string): Promise<Order> => {
    const response = await api.get<Order>(`/delivery/orders/${orderId}`);
    return response.data;
  },

  /** Advance the order through its status machine (ASSIGNED → PICKED_UP → … → COMPLETED). */
  updateStatus: async (orderId: string, data: UpdateDeliveryStatusRequest): Promise<Order> => {
    const response = await api.patch<Order>(`/delivery/orders/${orderId}/status`, data);
    return response.data;
  },

  /** Rider explicitly accepts or declines an order that was offered to them. */
  respondToOffer: async (orderId: string, action: 'ACCEPT' | 'DECLINE'): Promise<{ accepted: boolean }> => {
    const response = await api.post<{ accepted: boolean }>(`/delivery/orders/${orderId}/respond`, { action });
    return response.data;
  },
};
