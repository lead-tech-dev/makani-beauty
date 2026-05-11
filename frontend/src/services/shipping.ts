import api, { ShippingCalc } from '../lib/api';
import type { RelayPoint } from '../types';

export interface ShippingCalcItem {
  productId: string;
  quantity: number;
}

export const shippingService = {
  async calculate(country: string, subtotal: number, items?: ShippingCalcItem[]): Promise<ShippingCalc> {
    const { data } = await api.post<ShippingCalc>('/shipping/calculate', { country, subtotal, items });
    return data;
  },

  async searchRelayPoints(postalCode: string, country: string = 'France', limit: number = 5): Promise<RelayPoint[]> {
    const { data } = await api.get<RelayPoint[]>('/shipping/relay-points', {
      params: { postalCode, country, limit },
    });
    return data;
  },
};
