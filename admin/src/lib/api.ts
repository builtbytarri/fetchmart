import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('admin_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('admin_token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },
};

// Admin API
export const adminApi = {
  getDashboard: async () => {
    const response = await api.get('/admin/dashboard');
    return response.data;
  },
  
  getRecentOrders: async (limit = 10) => {
    const response = await api.get(`/admin/orders/recent?limit=${limit}`);
    return response.data;
  },
  
  getOrders: async (page = 1, limit = 20, status?: string) => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (status) params.append('status', status);
    const response = await api.get(`/admin/orders?${params}`);
    return response.data;
  },
  
  getStores: async (page = 1, limit = 20) => {
    const response = await api.get(`/admin/stores?page=${page}&limit=${limit}`);
    return response.data;
  },
  
  getStoreById: async (id: string) => {
    const response = await api.get(`/admin/stores/${id}`);
    return response.data;
  },
  
  getRiders: async (page = 1, limit = 20) => {
    const response = await api.get(`/admin/riders?page=${page}&limit=${limit}`);
    return response.data;
  },
  
  getRiderById: async (id: string) => {
    const response = await api.get(`/admin/riders/${id}`);
    return response.data;
  },
  
  getRiderLocations: async () => {
    const response = await api.get('/admin/riders/locations');
    return response.data;
  },
  
  getUsers: async (page = 1, limit = 20, role?: string) => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (role) params.append('role', role);
    const response = await api.get(`/admin/users?${params}`);
    return response.data;
  },
  
  getMapData: async () => {
    const response = await api.get('/admin/map');
    return response.data;
  },
  
  getOrdersAnalytics: async (days = 7) => {
    const response = await api.get(`/admin/analytics/orders?days=${days}`);
    return response.data;
  },

  getActiveOrders: async () => {
    const response = await api.get('/admin/orders/active');
    return response.data;
  },

  getAvailableRiders: async () => {
    const response = await api.get('/admin/riders/available');
    return response.data;
  },

  assignRiderToOrder: async (orderId: string, riderId: string) => {
    const response = await api.post(`/admin/orders/${orderId}/assign-rider`, { riderId });
    return response.data;
  },

  updateOrderStatus: async (orderId: string, status: string) => {
    const response = await api.patch(`/admin/orders/${orderId}/status`, { status });
    return response.data;
  },

  cancelOrder: async (orderId: string) => {
    const response = await api.post(`/admin/orders/${orderId}/cancel`);
    return response.data;
  },
};
