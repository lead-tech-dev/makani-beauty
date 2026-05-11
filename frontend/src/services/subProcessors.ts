import api from '../lib/api';

export interface SubProcessor {
  id: string;
  name: string;
  purpose: string;
  dataTransmitted: string;
  country: string;
  safeguards: string;
  website: string | null;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SubProcessorInput {
  name: string;
  purpose: string;
  dataTransmitted: string;
  country: string;
  safeguards: string;
  website?: string | null;
  displayOrder?: number;
  isActive?: boolean;
}

export const subProcessorsService = {
  async listPublic(): Promise<SubProcessor[]> {
    const { data } = await api.get<SubProcessor[]>('/sub-processors');
    return data;
  },
  async listAdmin(): Promise<SubProcessor[]> {
    const { data } = await api.get<SubProcessor[]>('/sub-processors/admin/all');
    return data;
  },
  async create(input: SubProcessorInput): Promise<SubProcessor> {
    const { data } = await api.post<SubProcessor>('/sub-processors', input);
    return data;
  },
  async update(id: string, input: Partial<SubProcessorInput>): Promise<SubProcessor> {
    const { data } = await api.patch<SubProcessor>(`/sub-processors/${id}`, input);
    return data;
  },
  async remove(id: string): Promise<void> {
    await api.delete(`/sub-processors/${id}`);
  },
};
