import api, {
  ApiProduct, ApiCategory, ApiBrand, ApiUser, ApiOrder, ApiStockMovement, ApiPaginated,
  ApiPromoCode, ApiShippingZone, ApiShippingTier, ApiPaymentStatus,
} from '../lib/api';

// ── Categories ────────────────────────────────────────────────────────

export interface CategoryInput {
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  isActive?: boolean;
}

export const adminCategories = {
  create(payload: CategoryInput): Promise<ApiCategory> {
    return api.post<ApiCategory>('/categories', payload).then((r) => r.data);
  },
  update(id: string, payload: Partial<CategoryInput>): Promise<ApiCategory> {
    return api.patch<ApiCategory>(`/categories/${id}`, payload).then((r) => r.data);
  },
  remove(id: string): Promise<void> {
    return api.delete(`/categories/${id}`).then(() => undefined);
  },
};

// ── Brands ────────────────────────────────────────────────────────────

export interface BrandInput {
  name: string;
  slug: string;
  description?: string;
  logoUrl?: string;
  website?: string;
  isActive?: boolean;
}

export const adminBrands = {
  create(payload: BrandInput): Promise<ApiBrand> {
    return api.post<ApiBrand>('/brands', payload).then((r) => r.data);
  },
  update(id: string, payload: Partial<BrandInput>): Promise<ApiBrand> {
    return api.patch<ApiBrand>(`/brands/${id}`, payload).then((r) => r.data);
  },
  remove(id: string): Promise<void> {
    return api.delete(`/brands/${id}`).then(() => undefined);
  },
};

// ── Products ──────────────────────────────────────────────────────────

export interface ProductInput {
  name: string;
  slug: string;
  description?: string;
  price: number;
  salePrice?: number;
  currency?: string;
  imageUrl?: string;
  imageSrcset?: string | null;
  imageLqip?: string | null;
  images?: string[];
  sku?: string;
  stock?: number;
  stockAlert?: number;
  isNew?: boolean;
  isFeatured?: boolean;
  vipOnly?: boolean;
  ingredients?: string;
  weight?: string;
  weightGrams?: number | null;
  volume?: string;
  tags?: string[];
  hairType?: string[] | null;
  skinType?: string[] | null;
  keyIngredients?: string[] | null;
  certifications?: string[] | null;
  isActive?: boolean;
  categoryId?: string;
  brandId?: string;
}

export const adminProducts = {
  list(params: { page?: number; limit?: number; search?: string } = {}): Promise<ApiPaginated<ApiProduct>> {
    return api.get<ApiPaginated<ApiProduct>>('/products', { params: { limit: 100, ...params } }).then((r) => r.data);
  },
  getById(id: string): Promise<ApiProduct> {
    return api.get<ApiProduct>(`/products/${id}`).then((r) => r.data);
  },
  create(payload: ProductInput): Promise<ApiProduct> {
    return api.post<ApiProduct>('/products', payload).then((r) => r.data);
  },
  update(id: string, payload: Partial<ProductInput>): Promise<ApiProduct> {
    return api.patch<ApiProduct>(`/products/${id}`, payload).then((r) => r.data);
  },
  remove(id: string): Promise<void> {
    return api.delete(`/products/${id}`).then(() => undefined);
  },
  lowStock(): Promise<ApiProduct[]> {
    return api.get<ApiProduct[]>('/products/low-stock').then((r) => r.data);
  },
};

// ── Stock ─────────────────────────────────────────────────────────────

export interface StockBulkImportResult {
  total: number;
  processed: number;
  errors: { row: number; sku?: string; message: string }[];
}

export const adminStock = {
  history(productId: string): Promise<ApiStockMovement[]> {
    return api.get<ApiStockMovement[]>(`/products/${productId}/stock`).then((r) => r.data);
  },
  addMovement(productId: string, payload: { type: 'in' | 'out' | 'adjustment'; quantity: number; reason?: string }): Promise<ApiStockMovement> {
    return api.post<ApiStockMovement>(`/products/${productId}/stock`, payload).then((r) => r.data);
  },
  bulkImport(file: File): Promise<StockBulkImportResult> {
    const form = new FormData();
    form.append('file', file);
    return api.post<StockBulkImportResult>('/products/stock/bulk-import', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data);
  },
};

// ── Orders ────────────────────────────────────────────────────────────

export const adminOrders = {
  list(
    params: { page?: number; limit?: number; status?: ApiOrder['status']; paymentStatus?: ApiPaymentStatus } = {},
  ): Promise<{ data: ApiOrder[]; total: number }> {
    return api.get<{ data: ApiOrder[]; total: number }>('/orders/admin/all', { params }).then((r) => r.data);
  },
  getById(id: string): Promise<ApiOrder> {
    return api.get<ApiOrder>(`/orders/admin/${id}`).then((r) => r.data);
  },
  updateStatus(id: string, status: ApiOrder['status'], note?: string): Promise<ApiOrder> {
    return api.patch<ApiOrder>(`/orders/admin/${id}/status`, { status, note }).then((r) => r.data);
  },
  refund(id: string, payload?: { amount?: number; reason?: string }): Promise<ApiOrder> {
    return api.post<ApiOrder>(`/payments/admin/orders/${id}/refund`, payload ?? {}).then((r) => r.data);
  },
  ship(id: string, payload: { carrier: 'colissimo' | 'mondial-relay' | 'chronopost'; weightOverrideGrams?: number }): Promise<ApiOrder> {
    return api.post<ApiOrder>(`/orders/admin/${id}/ship`, payload).then((r) => r.data);
  },
  listCarriers(): Promise<{ code: string; displayName: string; isAvailable: boolean }[]> {
    return api.get<any[]>('/orders/admin/carriers/list').then((r) => r.data);
  },
  /** Returns a Blob (PDF) with all selected labels merged. */
  async batchLabels(orderIds: string[]): Promise<Blob> {
    const { data } = await api.post('/orders/admin/labels/batch', { orderIds }, {
      responseType: 'blob',
    });
    return data as Blob;
  },
  async downloadInvoice(id: string): Promise<Blob> {
    const { data } = await api.get(`/orders/admin/${id}/invoice`, { responseType: 'blob' });
    return data as Blob;
  },
};

// ── Return requests ──────────────────────────────────────────────────

export const adminReturns = {
  list(params: { status?: 'pending' | 'approved' | 'rejected' } = {}) {
    return api.get<any[]>('/admin/returns', { params }).then((r) => r.data);
  },
  getById(id: string) {
    return api.get<any>(`/admin/returns/${id}`).then((r) => r.data);
  },
  approve(id: string, payload?: { refundAmount?: number }) {
    return api.post<any>(`/admin/returns/${id}/approve`, payload ?? {}).then((r) => r.data);
  },
  reject(id: string, reason: string) {
    return api.post<any>(`/admin/returns/${id}/reject`, { reason }).then((r) => r.data);
  },
};

// ── Users ─────────────────────────────────────────────────────────────

export const adminUsers = {
  list(): Promise<ApiUser[]> {
    return api.get<ApiUser[]>('/users').then((r) => r.data);
  },
  update(id: string, payload: Partial<{ fullName: string; phone: string; role: 'admin' | 'client'; isActive: boolean }>): Promise<ApiUser> {
    return api.patch<ApiUser>(`/users/${id}`, payload).then((r) => r.data);
  },
  remove(id: string): Promise<void> {
    return api.delete(`/users/${id}`).then(() => undefined);
  },
};

// ── Promo codes ───────────────────────────────────────────────────────

export interface PromoCodeInput {
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  minOrderAmount?: number;
  maxUses?: number | null;
  validFrom?: string | null;
  validUntil?: string | null;
  isActive?: boolean;
  description?: string;
}

export const adminPromoCodes = {
  list(): Promise<ApiPromoCode[]> {
    return api.get<ApiPromoCode[]>('/promo-codes').then((r) => r.data);
  },
  create(payload: PromoCodeInput): Promise<ApiPromoCode> {
    return api.post<ApiPromoCode>('/promo-codes', payload).then((r) => r.data);
  },
  update(id: string, payload: Partial<PromoCodeInput>): Promise<ApiPromoCode> {
    return api.patch<ApiPromoCode>(`/promo-codes/${id}`, payload).then((r) => r.data);
  },
  remove(id: string): Promise<void> {
    return api.delete(`/promo-codes/${id}`).then(() => undefined);
  },
};

// ── Shipping zones ────────────────────────────────────────────────────

export interface ShippingZoneInput {
  name: string;
  countries: string[];
  baseRate: number;
  freeShippingThreshold?: number;
  taxRate: number;
  isDefault?: boolean;
  isActive?: boolean;
}

export interface TierInput {
  minWeightGrams: number;
  maxWeightGrams: number | null;
  price: number;
}

export const adminShippingZones = {
  list(): Promise<ApiShippingZone[]> {
    return api.get<ApiShippingZone[]>('/shipping/zones').then((r) => r.data);
  },
  create(payload: ShippingZoneInput): Promise<ApiShippingZone> {
    return api.post<ApiShippingZone>('/shipping/zones', payload).then((r) => r.data);
  },
  update(id: string, payload: Partial<ShippingZoneInput>): Promise<ApiShippingZone> {
    return api.patch<ApiShippingZone>(`/shipping/zones/${id}`, payload).then((r) => r.data);
  },
  remove(id: string): Promise<void> {
    return api.delete(`/shipping/zones/${id}`).then(() => undefined);
  },

  // ── Tiers ────────────────────────────────────────────────────
  listTiers(zoneId: string): Promise<ApiShippingTier[]> {
    return api.get<ApiShippingTier[]>(`/shipping/zones/${zoneId}/tiers`).then((r) => r.data);
  },
  createTier(zoneId: string, payload: TierInput): Promise<ApiShippingTier> {
    return api.post<ApiShippingTier>(`/shipping/zones/${zoneId}/tiers`, payload).then((r) => r.data);
  },
  updateTier(zoneId: string, tierId: string, payload: Partial<TierInput>): Promise<ApiShippingTier> {
    return api.patch<ApiShippingTier>(`/shipping/zones/${zoneId}/tiers/${tierId}`, payload).then((r) => r.data);
  },
  removeTier(zoneId: string, tierId: string): Promise<void> {
    return api.delete(`/shipping/zones/${zoneId}/tiers/${tierId}`).then(() => undefined);
  },
};

// ── Upload ────────────────────────────────────────────────────────────

export interface UploadResponse {
  url: string;
  srcset?: string;
  lqip?: string;
  width?: number;
  height?: number;
}

export const adminUpload = {
  async image(file: File): Promise<UploadResponse> {
    const form = new FormData();
    form.append('file', file);
    const { data } = await api.post<UploadResponse>('/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },
};
