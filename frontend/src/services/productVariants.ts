import api, { ApiProductVariant } from '../lib/api';

export interface VariantPayload {
  attributes: Record<string, string>;
  stock: number;
  sku?: string;
  priceOverride?: number;
  imageUrl?: string;
  displayOrder?: number;
  isActive?: boolean;
}

export const productVariantsService = {
  async list(productId: string): Promise<ApiProductVariant[]> {
    const { data } = await api.get<ApiProductVariant[]>(`/products/${productId}/variants`);
    return data;
  },

  async create(productId: string, payload: VariantPayload): Promise<ApiProductVariant> {
    const { data } = await api.post<ApiProductVariant>(`/products/${productId}/variants`, payload);
    return data;
  },

  async update(productId: string, variantId: string, payload: VariantPayload): Promise<ApiProductVariant> {
    const { data } = await api.patch<ApiProductVariant>(`/products/${productId}/variants/${variantId}`, payload);
    return data;
  },

  async remove(productId: string, variantId: string): Promise<void> {
    await api.delete(`/products/${productId}/variants/${variantId}`);
  },
};
