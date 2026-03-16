import { api } from './client';
import { Order, OrderStatus } from '../types';

export interface AssignRiderRequest {
  riderId: string;
}

export interface UpdateDeliveryStatusRequest {
  status: OrderStatus;
}

export const deliveryApi = {
  assignRider: async (orderId: string, data: AssignRiderRequest): Promise<Order> => {
    const response = await api.post<Order>(`/delivery/orders/${orderId}/assign-rider`, data);
    return response.data;
  },

  updateStatus: async (orderId: string, data: UpdateDeliveryStatusRequest): Promise<Order> => {
    const response = await api.patch<Order>(`/delivery/orders/${orderId}/status`, data);
    return response.data;
  },

  getMyDeliveries: async (): Promise<Order[]> => {
    const response = await api.get<Order[]>('/delivery/my-deliveries');
    return response.data;
  },

  getCompletedDeliveries: async (): Promise<Order[]> => {
    const response = await api.get<Order[]>('/delivery/my-deliveries/completed');
    return response.data;
  },

  getDeliveryDetails: async (orderId: string): Promise<Order> => {
    const response = await api.get<Order>(`/delivery/orders/${orderId}`);
    return response.data;
  },
};
