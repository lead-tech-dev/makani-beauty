import {
  createContext, useContext, useState, useEffect, useCallback, ReactNode,
} from 'react';
import { favoritesService } from '../services/favorites';
import { useAuth } from './AuthContext';

interface FavoritesContextValue {
  ids: Set<string>;
  count: number;
  isFavorite: (productId: string) => boolean;
  toggle: (productId: string) => Promise<void>;
  add: (productId: string) => Promise<void>;
  remove: (productId: string) => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextValue | undefined>(undefined);

export const FavoritesProvider = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated } = useAuth();
  const [ids, setIds] = useState<Set<string>>(new Set());

  // Sync with backend when auth state changes
  useEffect(() => {
    if (!isAuthenticated) {
      setIds(new Set());
      return;
    }
    favoritesService.getIds()
      .then((list) => setIds(new Set(list)))
      .catch(() => setIds(new Set()));
  }, [isAuthenticated]);

  const isFavorite = useCallback((productId: string) => ids.has(productId), [ids]);

  const add = useCallback(async (productId: string) => {
    // Optimistic update
    setIds((prev) => new Set(prev).add(productId));
    try {
      await favoritesService.add(productId);
    } catch {
      // Rollback on failure
      setIds((prev) => {
        const next = new Set(prev);
        next.delete(productId);
        return next;
      });
    }
  }, []);

  const remove = useCallback(async (productId: string) => {
    setIds((prev) => {
      const next = new Set(prev);
      next.delete(productId);
      return next;
    });
    try {
      await favoritesService.remove(productId);
    } catch {
      setIds((prev) => new Set(prev).add(productId));
    }
  }, []);

  const toggle = useCallback(async (productId: string) => {
    if (ids.has(productId)) await remove(productId);
    else await add(productId);
  }, [ids, add, remove]);

  return (
    <FavoritesContext.Provider value={{
      ids, count: ids.size, isFavorite, toggle, add, remove,
    }}>
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = (): FavoritesContextValue => {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites must be used within FavoritesProvider');
  return ctx;
};
