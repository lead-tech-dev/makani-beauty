import api, { ApiBrand } from '../lib/api';
import { toBrand } from '../lib/adapters';
import { Brand } from '../types';

export const brandsService = {
  async getAll(): Promise<Brand[]> {
    const { data } = await api.get<ApiBrand[]>('/brands');
    return data.map(toBrand);
  },

  async getBySlug(slug: string): Promise<Brand> {
    const { data } = await api.get<ApiBrand>(`/brands/slug/${slug}`);
    return toBrand(data);
  },
};
