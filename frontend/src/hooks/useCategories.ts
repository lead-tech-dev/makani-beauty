import { useState, useEffect } from 'react';
import { Category } from '../types';
import { categoriesService } from '../services/categories';

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    categoriesService
      .getAll()
      .then((data) => { if (!cancelled) setCategories(data); })
      .catch((err) => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return { categories, loading, error };
}
