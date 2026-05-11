export interface ProductVariant {
  id: string;
  attributes: Record<string, string>; // {size:"M",color:"noir"} | {length:"16″",texture:"deep-curl"}
  stock: number;
  sku?: string | null;
  priceOverride?: number | null;
  imageUrl?: string | null;
  displayOrder: number;
  isActive: boolean;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  brand: string; // brand slug (for filtering)
  brandName?: string; // brand display name (from API)
  category: string; // category slug
  price: number;
  comparePrice?: number;
  currency: string;
  image: string;
  imageSrcset?: string;
  imageLqip?: string;
  images?: string[];
  rating: number;
  reviewCount: number;
  description: string;
  features?: string[];
  ingredients?: string;
  isBestSeller?: boolean;
  isNew?: boolean;
  stock?: number;
  stockAlert?: number;
  hairType?: string[] | null;
  skinType?: string[] | null;
  keyIngredients?: string[] | null;
  certifications?: string[] | null;
  variants?: ProductVariant[];
}

export interface Category {
  id?: string;
  slug: string;
  name: string;
  description: string;
  image: string;
}

export interface Brand {
  slug: string;
  name: string;
  origin?: string;
  description?: string;
}

export interface CartItem extends Product {
  quantity: number;
  /** When set, this cart line targets a specific variant (size/color/...) */
  variantId?: string | null;
  variantLabel?: string | null;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'shipped' | 'ready_for_pickup' | 'delivered' | 'returned' | 'cancelled';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type FulfillmentMethod = 'delivery' | 'relay' | 'pickup';
export type ShippingSpeed = 'standard' | 'express';

export type ShipmentStatus = 'pre_transit' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'exception' | 'unknown';

export interface ShipmentEvent {
  id: string;
  orderId: string;
  status: ShipmentStatus;
  message: string;
  occurredAt: string;
  createdAt: string;
  updatedAt: string;
}

export type ReturnStatus = 'pending' | 'approved' | 'rejected';

export interface ReturnedItem {
  orderItemId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
}

export interface ReturnRequest {
  id: string;
  orderId: string;
  userId: string;
  status: ReturnStatus;
  reason: string;
  items: ReturnedItem[];
  refundAmount: number | null;
  rejectReason: string | null;
  processedAt: string | null;
  processedByUserId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RelayPoint {
  id: string;
  name: string;
  line1: string;
  line2?: string;
  postalCode: string;
  city: string;
  country: string;
  hours?: string;
  distance?: number;
}

export interface PickupLocation {
  id: string;
  name: string;
  line1: string;
  line2?: string;
  postalCode: string;
  city: string;
  country: string;
  phone?: string;
  email?: string;
  hours: string;
  notes?: string;
}

export interface Address {
  id: string;
  fullName: string;
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
  phone?: string;
  isDefault: boolean;
  createdAt: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productImageUrl?: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  fulfillmentMethod?: FulfillmentMethod;
  shippingSpeed?: ShippingSpeed;
  shippingSnapshot: Partial<Address> & { kind?: 'delivery' | 'pickup' | 'relay'; name?: string; hours?: string; notes?: string };
  status: OrderStatus;
  paymentStatus?: PaymentStatus;
  stripePaymentIntentId?: string | null;
  paidAt?: string | null;
  items: OrderItem[];
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

export interface ProductFilters {
  search?: string;
  categoryId?: string;
  brandId?: string;
  minPrice?: number;
  maxPrice?: number;
  featured?: boolean;
  hairType?: string[];
  skinType?: string[];
  ingredients?: string[];
  certifications?: string[];
  sort?: 'newest' | 'price_asc' | 'price_desc' | 'name_asc' | 'popularity' | 'rating' | 'discount';
  page?: number;
  limit?: number;
}

export interface FacetCounts {
  hairType: Record<string, number>;
  skinType: Record<string, number>;
  ingredients: Record<string, number>;
  certifications: Record<string, number>;
  priceRange: { min: number; max: number };
}
