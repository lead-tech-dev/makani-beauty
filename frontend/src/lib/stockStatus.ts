import type { Product } from '../types';

export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock' | 'unknown';

/**
 * Resolve a product's display-level stock status. `unknown` covers the legacy
 * case where the backend didn't include stock info (we keep "Add to cart"
 * enabled in that case to avoid breaking existing pages).
 */
export function getStockStatus(p: Pick<Product, 'stock' | 'stockAlert'>): StockStatus {
  if (p.stock == null) return 'unknown';
  if (p.stock <= 0) return 'out_of_stock';
  const threshold = p.stockAlert ?? 5;
  if (p.stock <= threshold) return 'low_stock';
  return 'in_stock';
}
