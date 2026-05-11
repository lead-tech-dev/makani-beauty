import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useMemo,
  useCallback,
  useEffect,
} from "react";
import { CartItem, Product, ProductVariant } from "../types";
import { trackAddToCart, trackRemoveFromCart } from "../lib/analytics";

const STORAGE_KEY = "makani_cosmetique_cart";

// Composite key for cart lines: same product + different variant = 2 lines
const lineKey = (productId: string, variantId?: string | null) =>
  variantId ? `${productId}:${variantId}` : productId;

/** Public helper — cart UIs use this to get the line id for an item. */
export const cartLineId = (item: { id: string; variantId?: string | null }) =>
  lineKey(item.id, item.variantId);

const variantLabel = (v?: ProductVariant | null) =>
  v ? Object.values(v.attributes ?? {}).join(" / ") || null : null;

function loadCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

interface CartContextValue {
  items: CartItem[];
  addItem: (product: Product, qty?: number, variant?: ProductVariant | null) => void;
  removeItem: (lineId: string) => void;
  updateQty: (lineId: string, qty: number) => void;
  clearCart: () => void;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  totalItems: number;
  subtotal: number;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>(loadCart);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = useCallback(
    (product: Product, qty: number = 1, variant: ProductVariant | null = null) => {
      const key = lineKey(product.id, variant?.id);
      const price = variant?.priceOverride ?? product.price;
      setItems((prev) => {
        const existing = prev.find(
          (p) => lineKey(p.id, p.variantId) === key,
        );
        if (existing) {
          return prev.map((p) =>
            lineKey(p.id, p.variantId) === key
              ? { ...p, quantity: p.quantity + qty }
              : p,
          );
        }
        return [
          ...prev,
          {
            ...product,
            quantity: qty,
            price,
            variantId: variant?.id ?? null,
            variantLabel: variantLabel(variant),
            image: variant?.imageUrl || product.image,
          },
        ];
      });
      setIsOpen(true);
      trackAddToCart(product, qty);
    },
    [],
  );

  const removeItem = useCallback((lineId: string) => {
    setItems((prev) => {
      const removed = prev.find((p) => lineKey(p.id, p.variantId) === lineId);
      if (removed) trackRemoveFromCart(removed, removed.quantity);
      return prev.filter((p) => lineKey(p.id, p.variantId) !== lineId);
    });
  }, []);

  const updateQty = useCallback((lineId: string, qty: number) => {
    setItems((prev) =>
      prev
        .map((p) =>
          lineKey(p.id, p.variantId) === lineId
            ? { ...p, quantity: Math.max(1, qty) }
            : p,
        )
        .filter((p) => p.quantity > 0),
    );
  }, []);

  const clearCart = useCallback(() => setItems([]), []);
  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  const totalItems = useMemo(
    () => items.reduce((acc, p) => acc + p.quantity, 0),
    [items]
  );
  const subtotal = useMemo(
    () => items.reduce((acc, p) => acc + p.price * p.quantity, 0),
    [items]
  );

  const value: CartContextValue = {
    items,
    addItem,
    removeItem,
    updateQty,
    clearCart,
    isOpen,
    openCart,
    closeCart,
    totalItems,
    subtotal,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = (): CartContextValue => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
};
