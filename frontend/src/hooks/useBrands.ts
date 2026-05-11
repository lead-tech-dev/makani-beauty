import { useState, useEffect } from 'react';
import { Brand } from '../types';
import { brandsService } from '../services/brands';

export function useBrands() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    brandsService
      .getAll()
      .then((data) => { if (!cancelled) setBrands(data); })
      .catch((err) => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return { brands, loading, error };
}
