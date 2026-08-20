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

  getTopStores: async (days = 30) => {
    const response = await api.get(`/admin/analytics/top-stores?days=${days}`);
    return response.data;
  },

  getTopRiders: async (days = 30) => {
    const response = await api.get(`/admin/analytics/top-riders?days=${days}`);
    return response.data;
  },

  getAnalyticsSummary: async (days = 30) => {
    const response = await api.get(`/admin/analytics/summary?days=${days}`);
    return response.data;
  },

  getActiveOrders: async () => {
    const response = await api.get('/admin/orders/active');
    return response.data;
  },

  getAvailableRiders: async (orderId?: string) => {
    const params = orderId ? { orderId } : {};
    const response = await api.get('/admin/riders/available', { params });
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

  settleOrder: async (
    orderId: string,
    body: { reason?: string; faultParty?: string; riderCompensation?: number },
  ) => {
    const response = await api.post(`/admin/orders/${orderId}/settle`, body);
    return response.data;
  },

  getOrderSettlements: async (orderId: string) => {
    const response = await api.get(`/admin/orders/${orderId}/settlements`);
    return response.data;
  },

  notifyRider: async (orderId: string) => {
    const response = await api.post(`/admin/orders/${orderId}/notify-rider`);
    return response.data;
  },

  getAllStores: async () => {
    const response = await api.get('/admin/stores?limit=500');
    return response.data;
  },

  approveStore: async (storeId: string) => {
    const response = await api.post(`/admin/stores/${storeId}/approve`);
    return response.data;
  },

  rejectStore: async (storeId: string, reason?: string) => {
    const response = await api.post(`/admin/stores/${storeId}/reject`, { reason });
    return response.data;
  },

  // ── Moderation ────────────────────────────────────────────────────────────
  suspendStore: async (storeId: string, reason?: string) => {
    const response = await api.post(`/admin/stores/${storeId}/suspend`, { reason });
    return response.data;
  },

  unsuspendStore: async (storeId: string) => {
    const response = await api.post(`/admin/stores/${storeId}/unsuspend`);
    return response.data;
  },

  deleteStore: async (storeId: string) => {
    const response = await api.delete(`/admin/stores/${storeId}`);
    return response.data;
  },

  suspendRider: async (riderId: string, reason?: string) => {
    const response = await api.post(`/admin/riders/${riderId}/suspend`, { reason });
    return response.data;
  },

  unsuspendRider: async (riderId: string) => {
    const response = await api.post(`/admin/riders/${riderId}/unsuspend`);
    return response.data;
  },

  deleteRider: async (riderId: string) => {
    const response = await api.delete(`/admin/riders/${riderId}`);
    return response.data;
  },

  // Featured stores — "Handpicked for you" on the customer home screen
  getFeaturedStores: async () => {
    const response = await api.get('/admin/featured-stores');
    return response.data;
  },

  addFeaturedStore: async (storeId: string, label?: string, sortOrder?: number) => {
    const response = await api.post('/admin/featured-stores', { storeId, label, sortOrder });
    return response.data;
  },

  removeFeaturedStore: async (storeId: string) => {
    const response = await api.delete(`/admin/featured-stores/${storeId}`);
    return response.data;
  },

  // ── Platform settings (pricing / commission params) ──────────────────────
  getSettings: async () => {
    const response = await api.get('/admin/settings');
    return response.data;
  },

  updateSettings: async (settings: Record<string, number | string | boolean>) => {
    const response = await api.patch('/admin/settings', settings);
    return response.data;
  },

  // ── Finance (pools, profit, withdrawals) ─────────────────────────────────
  getFinanceOverview: async () => {
    const response = await api.get('/admin/finance/overview');
    return response.data;
  },

  ensurePools: async () => {
    const response = await api.post('/admin/finance/ensure-pools');
    return response.data;
  },

  sweepPools: async () => {
    const response = await api.post('/admin/finance/sweep-pools');
    return response.data;
  },

  getWithdrawals: async (page = 1, limit = 20) => {
    const response = await api.get(`/admin/finance/withdrawals?page=${page}&limit=${limit}`);
    return response.data;
  },

  search: async (q: string) => {
    const response = await api.get('/admin/search', { params: { q } });
    return response.data;
  },

  // ── Coupons ───────────────────────────────────────────────────────────────
  getCoupons: async () => {
    const response = await api.get('/admin/coupons');
    return response.data;
  },

  createCoupon: async (data: Record<string, unknown>) => {
    const response = await api.post('/admin/coupons', data);
    return response.data;
  },

  updateCoupon: async (id: string, data: Record<string, unknown>) => {
    const response = await api.patch(`/admin/coupons/${id}`, data);
    return response.data;
  },

  deleteCoupon: async (id: string) => {
    const response = await api.delete(`/admin/coupons/${id}`);
    return response.data;
  },
};
