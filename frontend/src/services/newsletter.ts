import api from '../lib/api';

export const newsletterService = {
  async subscribe(email: string, source?: string): Promise<{ status: 'pending' | 'already-confirmed'; alreadySubscribed: boolean }> {
    const { data } = await api.post('/newsletter/subscribe', { email, source });
    return data;
  },

  async confirm(token: string): Promise<{ email: string; promoCode: string | null }> {
    const { data } = await api.get('/newsletter/confirm', { params: { token } });
    return data;
  },

  async unsubscribe(token: string): Promise<{ email: string }> {
    const { data } = await api.get('/newsletter/unsubscribe', { params: { token } });
    return data;
  },
};
