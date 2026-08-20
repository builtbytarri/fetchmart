import { api } from './client';

export const notificationsApi = {
  registerToken: (token: string) =>
    api.post('/notifications/register-token', { token }),

  clearToken: () =>
    api.delete('/notifications/register-token'),
};
