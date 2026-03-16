import { api } from './client';
import { Store, Product } from '../types';

export interface CreateStoreRequest {
  name: string;
  description?: string;
  latitude: number;
  longitude: number;
  address?: string;
  phone?: string;
  openingHours?: Record<string, string>;
}

export interface UpdateStoreRequest {
  name?: string;
  description?: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  phone?: string;
  logoUrl?: string;
  isOpen?: boolean;
  openingHours?: Record<string, string>;
}

export interface NearbyStoresParams {
  latitude: number;
  longitude: number;
  radius?: number;
}

export const storesApi = {
  create: async (data: CreateStoreRequest): Promise<Store> => {
    const response = await api.post<Store>('/stores', data);
    return response.data;
  },

  getNearby: async (params: NearbyStoresParams): Promise<Store[]> => {
    const response = await api.get<Store[]>('/stores/nearby', { params });
    return response.data;
  },

  getById: async (storeId: string): Promise<Store> => {
    const response = await api.get<Store>(`/stores/${storeId}`);
    return response.data;
  },

  update: async (storeId: string, data: UpdateStoreRequest): Promise<Store> => {
    const response = await api.patch<Store>(`/stores/${storeId}`, data);
    return response.data;
  },

  getProducts: async (storeId: string): Promise<Product[]> => {
    const response = await api.get<Product[]>(`/stores/${storeId}/products`);
    return response.data;
  },

  getMyStores: async (): Promise<Store[]> => {
    const response = await api.get<Store[]>('/stores/my-stores');
    return response.data;
  },

  // Category methods
  getCategories: async (storeId: string): Promise<Category[]> => {
    const response = await api.get<Category[]>(`/stores/${storeId}/categories`);
    return response.data;
  },

  createCategory: async (storeId: string, name: string): Promise<Category> => {
    const response = await api.post<Category>(`/stores/${storeId}/categories`, { name });
    return response.data;
  },

  updateCategory: async (categoryId: string, name: string): Promise<Category> => {
    const response = await api.patch<Category>(`/stores/categories/${categoryId}`, { name });
    return response.data;
  },

  deleteCategory: async (categoryId: string): Promise<void> => {
    await api.delete(`/stores/categories/${categoryId}`);
  },
};

export interface Category {
  id: string;
  storeId: string;
  name: string;
  createdAt: string;
  _count?: { products: number };
}
