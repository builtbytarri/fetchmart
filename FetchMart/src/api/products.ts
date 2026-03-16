import { api } from './client';
import { Product } from '../types';

export interface CreateProductRequest {
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  categoryId?: string;
  stockQuantity?: number;
}

export interface UpdateProductRequest {
  name?: string;
  description?: string;
  price?: number;
  imageUrl?: string;
  categoryId?: string | null;
  stockQuantity?: number;
  isAvailable?: boolean;
}

export const productsApi = {
  create: async (data: CreateProductRequest): Promise<Product> => {
    const response = await api.post<Product>('/products', data);
    return response.data;
  },

  getById: async (productId: string): Promise<Product> => {
    const response = await api.get<Product>(`/products/${productId}`);
    return response.data;
  },

  update: async (productId: string, data: UpdateProductRequest): Promise<Product> => {
    const response = await api.patch<Product>(`/products/${productId}`, data);
    return response.data;
  },

  delete: async (productId: string): Promise<void> => {
    await api.delete(`/products/${productId}`);
  },
};
