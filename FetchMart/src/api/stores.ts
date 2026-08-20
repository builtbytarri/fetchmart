import { api } from './client';
import { Store, Product, Order, OrderStatus } from '../types';

export interface CreateStoreRequest {
  name: string;
  description?: string;
  latitude: number;
  longitude: number;
  address?: string;
  imageUrl?: string;
}

export interface UpdateStoreRequest {
  name?: string;
  description?: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  imageUrl?: string;
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

  getSuggestedProducts: async (storeId: string): Promise<Product[]> => {
    const response = await api.get<Product[]>(`/stores/${storeId}/products/suggested`);
    return response.data;
  },

  getMyStores: async (): Promise<Store[]> => {
    const response = await api.get<Store[]>('/stores/my-stores');
    return response.data;
  },

  getFeatured: async (): Promise<Store[]> => {
    const response = await api.get<Store[]>('/stores/featured');
    return response.data;
  },

  getFavourites: async (): Promise<Store[]> => {
    const response = await api.get<Store[]>('/stores/favourites');
    return response.data;
  },

  getFavouriteIds: async (): Promise<string[]> => {
    const response = await api.get<string[]>('/stores/favourite-ids');
    return response.data;
  },

  toggleFavourite: async (storeId: string): Promise<{ isFavourite: boolean }> => {
    const response = await api.post<{ isFavourite: boolean }>(`/stores/${storeId}/favourite`);
    return response.data;
  },

  // ── Store order management ────────────────────────────────────────────────

  /** Fetch all orders for the logged-in store. */
  getMyOrders: async (status?: OrderStatus): Promise<Order[]> => {
    const params = status ? { status } : {};
    const response = await api.get<Order[]>('/stores/my/orders', { params });
    return response.data;
  },

  /** Accept, mark-preparing, or mark-ready for an order. */
  updateOrderStatus: async (orderId: string, status: OrderStatus): Promise<Order> => {
    const response = await api.patch<Order>(`/stores/my/orders/${orderId}/status`, { status });
    return response.data;
  },

  /** Reject (cancel) an order the store cannot fulfil. */
  rejectOrder: async (orderId: string): Promise<Order> => {
    const response = await api.post<Order>(`/stores/my/orders/${orderId}/reject`);
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
