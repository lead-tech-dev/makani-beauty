import api from '../lib/api';

export interface LegalPage {
  id: string;
  slug: string;
  title: string;
  intro: string | null;
  body: string;
  lastUpdated: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateLegalPageInput {
  title?: string;
  intro?: string | null;
  body?: string;
  lastUpdated?: string;
}

export const legalPagesService = {
  async list(): Promise<LegalPage[]> {
    const { data } = await api.get<LegalPage[]>('/legal-pages');
    return data;
  },

  async getBySlug(slug: string): Promise<LegalPage> {
    const { data } = await api.get<LegalPage>(`/legal-pages/${slug}`);
    return data;
  },

  async update(slug: string, input: UpdateLegalPageInput): Promise<LegalPage> {
    const { data } = await api.put<LegalPage>(`/legal-pages/${slug}`, input);
    return data;
  },
};
