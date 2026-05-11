/**
 * E-commerce analytics — typed helpers that push events to window.dataLayer
 * following the GA4 standard schema (also compatible with Meta Pixel and
 * TikTok Pixel via GTM mappings).
 *
 * Calls are no-op safe when the dataLayer hasn't been initialised
 * (gtm.ts hasn't run yet, or running on the server).
 */

import { Product, CartItem, Order } from '../types';

interface DataLayerItem {
  item_id: string;
  item_name: string;
  price: number;
  quantity?: number;
  item_brand?: string;
  item_category?: string;
  index?: number;
}

const push = (event: Record<string, any>): void => {
  if (typeof window === 'undefined') return;
  window.dataLayer = window.dataLayer ?? [];
  window.dataLayer.push(event);
};

const productToItem = (p: Product, quantity = 1, index?: number): DataLayerItem => ({
  item_id: p.id,
  item_name: p.name,
  price: p.price,
  quantity,
  item_brand: p.brandName,
  item_category: p.category,
  index,
});

const cartToItems = (items: CartItem[]): DataLayerItem[] =>
  items.map((it, i) => productToItem(it, it.quantity, i));

const cartValue = (items: CartItem[]): number =>
  items.reduce((acc, it) => acc + it.price * it.quantity, 0);

// ── Catalogue events ────────────────────────────────────────

export const trackViewItem = (product: Product): void => {
  push({
    event: 'view_item',
    ecommerce: {
      currency: product.currency,
      value: product.price,
      items: [productToItem(product)],
    },
  });
};

export const trackAddToCart = (product: Product, quantity = 1): void => {
  push({
    event: 'add_to_cart',
    ecommerce: {
      currency: product.currency,
      value: product.price * quantity,
      items: [productToItem(product, quantity)],
    },
  });
};

export const trackRemoveFromCart = (product: Product, quantity = 1): void => {
  push({
    event: 'remove_from_cart',
    ecommerce: {
      currency: product.currency,
      value: product.price * quantity,
      items: [productToItem(product, quantity)],
    },
  });
};

export const trackAddToWishlist = (product: Product): void => {
  push({
    event: 'add_to_wishlist',
    ecommerce: {
      currency: product.currency,
      value: product.price,
      items: [productToItem(product)],
    },
  });
};

// ── Checkout events ─────────────────────────────────────────

export const trackViewCart = (items: CartItem[], currency = '€'): void => {
  if (items.length === 0) return;
  push({
    event: 'view_cart',
    ecommerce: {
      currency,
      value: cartValue(items),
      items: cartToItems(items),
    },
  });
};

export const trackBeginCheckout = (items: CartItem[], currency = '€'): void => {
  if (items.length === 0) return;
  push({
    event: 'begin_checkout',
    ecommerce: {
      currency,
      value: cartValue(items),
      items: cartToItems(items),
    },
  });
};

export const trackAddShippingInfo = (
  items: CartItem[],
  shippingTier: string,
  currency = '€',
): void => {
  if (items.length === 0) return;
  push({
    event: 'add_shipping_info',
    ecommerce: {
      currency,
      value: cartValue(items),
      shipping_tier: shippingTier,
      items: cartToItems(items),
    },
  });
};

export const trackAddPaymentInfo = (
  items: CartItem[],
  paymentType: string,
  currency = '€',
): void => {
  if (items.length === 0) return;
  push({
    event: 'add_payment_info',
    ecommerce: {
      currency,
      value: cartValue(items),
      payment_type: paymentType,
      items: cartToItems(items),
    },
  });
};

export const trackPurchase = (order: Order): void => {
  push({
    event: 'purchase',
    ecommerce: {
      transaction_id: order.orderNumber,
      value: order.total,
      tax: order.taxAmount ?? 0,
      shipping: order.shippingFee,
      currency: order.currency,
      coupon: order.discountCode ?? undefined,
      items: order.items.map((it, i) => ({
        item_id: it.productId,
        item_name: it.productName,
        price: it.unitPrice,
        quantity: it.quantity,
        index: i,
      })),
    },
  });
};

// ── Account events ──────────────────────────────────────────

export const trackLogin = (method: 'password' | 'google' = 'password'): void => {
  push({ event: 'login', method });
};

export const trackSignUp = (method: 'password' | 'google' = 'password'): void => {
  push({ event: 'sign_up', method });
};

export const trackSearch = (searchTerm: string): void => {
  push({ event: 'search', search_term: searchTerm });
};

// ── Generic page view (fired by GTM History Listener for SPAs, but
//    a manual nudge helps with route changes that don't update title) ─

export const trackPageView = (path: string, title: string): void => {
  push({
    event: 'page_view',
    page_path: path,
    page_title: title,
    page_location: typeof window !== 'undefined' ? window.location.href : undefined,
  });
};
