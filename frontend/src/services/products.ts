import api, { ApiProduct, ApiPaginated } from '../lib/api';
import { toProduct } from '../lib/adapters';
import { Product, PaginatedResult, ProductFilters, FacetCounts } from '../types';

export const productsService = {
  async getAll(filters: ProductFilters = {}): Promise<PaginatedResult<Product>> {
    const params: Record<string, any> = { ...filters };
    // Repeat-style params for axios (foo=a&foo=b)
    if (Array.isArray(filters.hairType)) params.hairType = filters.hairType.join(',');
    if (Array.isArray(filters.skinType)) params.skinType = filters.skinType.join(',');
    if (Array.isArray(filters.ingredients)) params.ingredients = filters.ingredients.join(',');
    if (Array.isArray(filters.certifications)) params.certifications = filters.certifications.join(',');
    const { data } = await api.get<ApiPaginated<ApiProduct>>('/products', { params });
    return {
      data: data.data.map(toProduct),
      meta: data.meta,
    };
  },

  async getFacets(filters: { categoryId?: string; brandId?: string; search?: string } = {}): Promise<FacetCounts> {
    const { data } = await api.get<FacetCounts>('/products/facets', { params: filters });
    return data;
  },

  async getBySlug(slug: string): Promise<Product> {
    const { data } = await api.get<ApiProduct>(`/products/slug/${slug}`);
    return toProduct(data);
  },

  async getById(id: string): Promise<Product> {
    const { data } = await api.get<ApiProduct>(`/products/${id}`);
    return toProduct(data);
  },

  async getFeatured(limit = 8): Promise<Product[]> {
    const { data } = await api.get<ApiPaginated<ApiProduct>>('/products', {
      params: { featured: true, limit },
    });
    return data.data.map(toProduct);
  },

  async getByCategory(categoryId: string, limit = 100): Promise<Product[]> {
    const { data } = await api.get<ApiPaginated<ApiProduct>>('/products', {
      params: { categoryId, limit },
    });
    return data.data.map(toProduct);
  },

  async getLowStock(): Promise<Product[]> {
    const { data } = await api.get<ApiProduct[]>('/products/low-stock');
    return data.map(toProduct);
  },

  async search(q: string, limit = 8): Promise<Product[]> {
    if (!q || q.trim().length < 2) return [];
    const { data } = await api.get<ApiProduct[]>('/products/search', {
      params: { q, limit },
    });
    return data.map(toProduct);
  },

  async listVip(): Promise<Product[]> {
    const { data } = await api.get<ApiProduct[]>('/products/vip');
    return data.map(toProduct);
  },
};
