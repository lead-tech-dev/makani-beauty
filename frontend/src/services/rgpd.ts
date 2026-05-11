import api from '../lib/api';

export interface DeletionRequest {
  id: string;
  userId: string;
  requestedAt: string;
  scheduledDeletionAt: string;
  status: 'pending' | 'cancelled' | 'executed';
  reason: string | null;
  executedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    email: string;
    fullName: string;
    isActive: boolean;
  };
}

export const rgpdService = {
  async getActiveDeletionRequest(): Promise<DeletionRequest | null> {
    const { data } = await api.get<DeletionRequest | null>('/users/me/deletion-request');
    return data ?? null;
  },

  async requestDeletion(reason?: string): Promise<DeletionRequest> {
    const { data } = await api.post<DeletionRequest>('/users/me/deletion-request', { reason });
    return data;
  },

  async cancelDeletion(): Promise<DeletionRequest> {
    const { data } = await api.delete<DeletionRequest>('/users/me/deletion-request');
    return data;
  },

  async exportMyData(): Promise<Blob> {
    const response = await api.get('/users/me/data-export', { responseType: 'blob' });
    return response.data as Blob;
  },

  async listAllDeletionRequests(): Promise<DeletionRequest[]> {
    const { data } = await api.get<DeletionRequest[]>('/admin/deletion-requests');
    return data;
  },
};
