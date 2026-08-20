import { api } from './client';
import { Product, ProductUnit, StockMode } from '../types';

export interface CreateProductRequest {
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  categoryId?: string;
  stockQuantity?: number;
  /** Unit of sale; PIECE if omitted. */
  unit?: ProductUnit;
  /** Smallest purchasable increment, e.g. 0.5 for half a mudu. */
  stepSize?: number;
  /** IN_STOCK skips exact counting. */
  stockMode?: StockMode;
}

export interface UpdateProductRequest {
  name?: string;
  description?: string;
  price?: number;
  /** null clears the existing image. */
  imageUrl?: string | null;
  categoryId?: string | null;
  stockQuantity?: number;
  isAvailable?: boolean;
  isSuggested?: boolean;
  unit?: ProductUnit;
  stepSize?: number;
  stockMode?: StockMode;
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

  getSimilar: async (productId: string): Promise<Product[]> => {
    const response = await api.get<Product[]>(`/products/${productId}/similar`);
    return response.data;
  },

  toggleSuggested: async (productId: string): Promise<{ id: string; name: string; isSuggested: boolean }> => {
    const response = await api.patch(`/products/${productId}/toggle-suggested`);
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
