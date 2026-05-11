import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3002/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

export default api;

// ─── API response types (matching backend exactly) ────────────────────────────

export interface ApiCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApiBrand {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logoUrl?: string;
  website?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApiProductVariant {
  id: string;
  productId: string;
  attributes: Record<string, string>;
  stock: number;
  sku?: string | null;
  priceOverride?: number | null;
  imageUrl?: string | null;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApiProduct {
  id: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  salePrice?: number;
  currency: string;
  imageUrl?: string;
  imageSrcset?: string | null;
  imageLqip?: string | null;
  images?: string[];
  hairType?: string[] | null;
  skinType?: string[] | null;
  keyIngredients?: string[] | null;
  certifications?: string[] | null;
  sku?: string;
  stock: number;
  stockAlert: number;
  rating: number;
  reviewCount: number;
  isNew: boolean;
  isFeatured: boolean;
  ingredients?: string;
  weight?: string;
  weightGrams?: number | null;
  volume?: string;
  tags?: string[];
  isActive: boolean;
  category?: ApiCategory;
  brand?: ApiBrand;
  variants?: ApiProductVariant[];
  createdAt: string;
  updatedAt: string;
}

export interface ApiPaginated<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ApiUser {
  id: string;
  fullName: string;
  email: string;
  role: 'admin' | 'client';
  phone?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApiOrderItem {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  productImageUrl?: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

export type ApiPaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface ApiOrder {
  id: string;
  orderNumber: string;
  userId: string;
  shippingAddressId?: string;
  shippingSnapshot: Record<string, any>;
  status: 'pending' | 'confirmed' | 'preparing' | 'shipped' | 'ready_for_pickup' | 'delivered' | 'returned' | 'cancelled';
  fulfillmentMethod?: 'delivery' | 'relay' | 'pickup';
  shippingSpeed?: 'standard' | 'express';
  paymentStatus?: ApiPaymentStatus;
  paymentProvider?: 'stripe' | 'paypal' | null;
  stripePaymentIntentId?: string | null;
  paypalOrderId?: string | null;
  paidAt?: string | null;
  refundedAmount?: number;
  items: ApiOrderItem[];
  subtotal: number;
  shippingFee: number;
  taxRate?: number;
  taxAmount?: number;
  discountCode?: string | null;
  discountAmount?: number;
  total: number;
  currency: string;
  notes?: string;
  shippedAt?: string;
  deliveredAt?: string;
  carrier?: string | null;
  trackingNumber?: string | null;
  trackingUrl?: string | null;
  labelUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ApiStockMovement {
  id: string;
  productId: string;
  type: 'in' | 'out' | 'adjustment';
  quantity: number;
  stockAfter: number;
  reason?: string;
  createdAt: string;
}

export interface ApiPromoCode {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  minOrderAmount: number;
  maxUses: number | null;
  usedCount: number;
  validFrom: string | null;
  validUntil: string | null;
  isActive: boolean;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PromoValidation {
  valid: boolean;
  message: string;
  discount: number;
  code?: ApiPromoCode;
}

export interface ApiShippingTier {
  id: string;
  shippingZoneId: string;
  minWeightGrams: number;
  maxWeightGrams: number | null;
  price: number;
  createdAt: string;
  updatedAt: string;
}

export interface ApiShippingZone {
  id: string;
  name: string;
  countries: string[];
  baseRate: number;
  freeShippingThreshold: number;
  taxRate: number;
  isDefault: boolean;
  isActive: boolean;
  tiers?: ApiShippingTier[];
  createdAt: string;
  updatedAt: string;
}

export interface ShippingCalc {
  zoneName: string;
  shippingFee: number;
  taxRate: number;
  taxAmount: number;
  freeShippingApplied: boolean;
  totalWeightGrams?: number;
  tierMatched?: { minWeightGrams: number; maxWeightGrams: number | null; price: number } | null;
}
