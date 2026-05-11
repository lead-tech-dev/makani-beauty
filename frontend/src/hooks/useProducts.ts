import { useState, useEffect } from 'react';
import { Product, PaginatedResult, ProductFilters } from '../types';
import { productsService } from '../services/products';

const EMPTY: PaginatedResult<Product> = {
  data: [],
  meta: { total: 0, page: 1, limit: 20, totalPages: 0 },
};

export function useProducts(filters: ProductFilters = {}) {
  const [result, setResult] = useState<PaginatedResult<Product>>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const key = JSON.stringify(filters);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    productsService
      .getAll(filters)
      .then((data) => { if (!cancelled) setResult(data); })
      .catch((err) => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return { ...result, loading, error };
}
