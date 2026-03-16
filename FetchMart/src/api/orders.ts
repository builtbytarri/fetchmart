import { api } from './client';
import { Order, OrderStatus } from '../types';

export interface CreateOrderRequest {
  storeId: string;
  items: {
    productId: string;
    quantity: number;
  }[];
}

export interface UpdateOrderStatusRequest {
  status: OrderStatus;
}

export const ordersApi = {
  create: async (data: CreateOrderRequest): Promise<Order> => {
    const response = await api.post<Order>('/orders', data);
    return response.data;
  },

  getMyOrders: async (): Promise<Order[]> => {
    const response = await api.get<Order[]>('/orders/my');
    return response.data;
  },

  getById: async (orderId: string): Promise<Order> => {
    const response = await api.get<Order>(`/orders/${orderId}`);
    return response.data;
  },

  updateStatus: async (orderId: string, data: UpdateOrderStatusRequest): Promise<Order> => {
    const response = await api.patch<Order>(`/orders/${orderId}/status`, data);
    return response.data;
  },
};
