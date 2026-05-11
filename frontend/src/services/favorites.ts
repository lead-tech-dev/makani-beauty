import api, { ApiProduct } from '../lib/api';

export const favoritesService = {
  async getProducts(): Promise<ApiProduct[]> {
    const { data } = await api.get<ApiProduct[]>('/favorites');
    return data;
  },

  async getIds(): Promise<string[]> {
    const { data } = await api.get<string[]>('/favorites/ids');
    return data;
  },

  async add(productId: string): Promise<void> {
    await api.post(`/favorites/${productId}`);
  },

  async remove(productId: string): Promise<void> {
    await api.delete(`/favorites/${productId}`);
  },

  async share(note?: string): Promise<{ token: string; shareUrl: string; expiresAt: string }> {
    const { data } = await api.post('/favorites/share', { note });
    return data;
  },

  async revokeShare(): Promise<void> {
    await api.delete('/favorites/share');
  },

  async getPublic(token: string): Promise<{
    ownerFirstName: string;
    ownerInitial: string;
    expiresAt: string;
    note: string | null;
    products: ApiProduct[];
  }> {
    const { data } = await api.get(`/wishlists/${token}`);
    return data;
  },
};
