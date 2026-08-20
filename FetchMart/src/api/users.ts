import { api } from './client';

export interface NotificationPreferences {
  notifyPush: boolean;
  notifyOrderUpdates: boolean;
  notifyPromotions: boolean;
  notifyNewStores: boolean;
  notifyEmail: boolean;
}

export interface UpdateProfileRequest {
  name?: string;
  phone?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
}

export interface SavedAddress {
  id: string;
  label: string;
  address: string;
  latitude: number;
  longitude: number;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSavedAddressRequest {
  label: string;
  address: string;
  latitude: number;
  longitude: number;
  isDefault?: boolean;
}

export interface UpdateSavedAddressRequest {
  label?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  isDefault?: boolean;
}

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: string;
  address?: string;
  latitude?: number;
  longitude?: number;
}

export const usersApi = {
  updateProfile: async (data: UpdateProfileRequest): Promise<User> => {
    const response = await api.patch<User>('/users/me', data);
    return response.data;
  },

  getProfile: async (): Promise<User> => {
    const response = await api.get<User>('/users/me');
    return response.data;
  },

  getNotificationPreferences: async (): Promise<NotificationPreferences> => {
    const response = await api.get<NotificationPreferences>('/users/me/notifications');
    return response.data;
  },

  updateNotificationPreferences: async (
    data: Partial<NotificationPreferences>,
  ): Promise<NotificationPreferences> => {
    const response = await api.patch<NotificationPreferences>('/users/me/notifications', data);
    return response.data;
  },

  listSavedAddresses: async (): Promise<SavedAddress[]> => {
    const response = await api.get<SavedAddress[]>('/users/me/addresses');
    return response.data;
  },

  createSavedAddress: async (data: CreateSavedAddressRequest): Promise<SavedAddress> => {
    const response = await api.post<SavedAddress>('/users/me/addresses', data);
    return response.data;
  },

  updateSavedAddress: async (
    id: string,
    data: UpdateSavedAddressRequest,
  ): Promise<SavedAddress> => {
    const response = await api.patch<SavedAddress>(`/users/me/addresses/${id}`, data);
    return response.data;
  },

  deleteSavedAddress: async (id: string): Promise<void> => {
    await api.delete(`/users/me/addresses/${id}`);
  },
};
