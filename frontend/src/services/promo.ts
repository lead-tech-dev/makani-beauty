import api, { PromoValidation } from '../lib/api';

export const promoService = {
  async validate(code: string, subtotal: number): Promise<PromoValidation> {
    const { data } = await api.post<PromoValidation>('/promo-codes/validate', { code, subtotal });
    return data;
  },
};
