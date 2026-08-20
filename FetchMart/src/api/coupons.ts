import { api } from './client';

export interface CouponValidation {
  code: string;
  discountAmount: number;
  discountType: 'PERCENT' | 'FIXED';
  discountValue: number;
  description?: string | null;
}

export const couponsApi = {
  validate: async (code: string, subtotal: number): Promise<CouponValidation> => {
    const response = await api.post<CouponValidation>('/coupons/validate', { code, subtotal });
    return response.data;
  },
};
