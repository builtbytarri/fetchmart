import { api } from './client';

export interface UpdateProfileRequest {
  name?: string;
  phone?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
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
};
