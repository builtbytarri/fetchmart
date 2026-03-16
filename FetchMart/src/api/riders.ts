import { api } from './client';
import { Rider } from '../types';

export interface UpdateLocationRequest {
  latitude: number;
  longitude: number;
}

export interface UpdateAvailabilityRequest {
  isAvailable: boolean;
}

export const ridersApi = {
  onboard: async (): Promise<Rider> => {
    const response = await api.post<Rider>('/riders/onboard');
    return response.data;
  },

  updateAvailability: async (data: UpdateAvailabilityRequest): Promise<Rider> => {
    const response = await api.patch<Rider>('/riders/availability', data);
    return response.data;
  },

  updateLocation: async (data: UpdateLocationRequest): Promise<Rider> => {
    const response = await api.post<Rider>('/riders/location', data);
    return response.data;
  },

  getMe: async (): Promise<Rider> => {
    const response = await api.get<Rider>('/riders/me');
    return response.data;
  },
};
