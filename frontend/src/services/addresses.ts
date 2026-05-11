import api from '../lib/api';
import type { Address } from '../types';

export interface AddressInput {
  fullName: string;
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
  phone?: string;
  isDefault?: boolean;
}

export const addressesService = {
  async getAll(): Promise<Address[]> {
    const { data } = await api.get<Address[]>('/addresses');
    return data;
  },

  async create(payload: AddressInput): Promise<Address> {
    const { data } = await api.post<Address>('/addresses', payload);
    return data;
  },

  async update(id: string, payload: Partial<AddressInput>): Promise<Address> {
    const { data } = await api.patch<Address>(`/addresses/${id}`, payload);
    return data;
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/addresses/${id}`);
  },
};
