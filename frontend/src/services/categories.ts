import api, { ApiCategory } from '../lib/api';
import { toCategory } from '../lib/adapters';
import { Category } from '../types';

export const categoriesService = {
  async getAll(): Promise<Category[]> {
    const { data } = await api.get<ApiCategory[]>('/categories');
    return data.map(toCategory);
  },

  async getBySlug(slug: string): Promise<Category> {
    const { data } = await api.get<ApiCategory>(`/categories/slug/${slug}`);
    return toCategory(data);
  },
};
