import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Minus, Trash2, ShoppingBag, ChevronRight, AlertTriangle, RefreshCw, Check } from 'lucide-react';
import { useCart, cartLineId } from '../../context/CartContext';
import { productsService } from '../../services/products';
import { trackViewCart } from '../../lib/analytics';
import styles from './step.module.scss';

interface StockIssue {
  itemId: string;
  name: string;
  type: 'out_of_stock' | 'insufficient';
  available?: number;
  inCart: number;
}

const CheckoutCart = () => {
  const { items, subtotal, removeItem, updateQty } = useCart();
  const navigate = useNavigate();
  const currency = items[0]?.currency ?? '€';

  const [stockMap, setStockMap] = useState<Record<string, number>>({});
  const [revalidating, setRevalidating] = useState(false);

  useEffect(() => {
    if (items.length > 0) trackViewCart(items, currency);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-validate stock on cart open + whenever the cart changes (defensive).
  useEffect(() => {
    let alive = true;
    if (items.length === 0) { setStockMap({}); return; }
    setRevalidating(true);
    Promise.all(items.map((it) => productsService.getById(it.id).catch(() => null)))
      .then((results) => {
        if (!alive) return;
        const map: Record<string, number> = {};
        results.forEach((p, i) => {
          if (p) map[items[i].id] = p.stock ?? Number.POSITIVE_INFINITY;
        });
        setStockMap(map);
      })
      .finally(() => alive && setRevalidating(false));
    return () => { alive = false; };
  }, [items]);

  const issues: StockIssue[] = useMemo(() => {
    const out: StockIssue[] = [];
    for (const it of items) {
      const available = stockMap[it.id];
      if (available === undefined) continue; // not yet revalidated
      if (available <= 0) {
        out.push({ itemId: cartLineId(it), name: it.name, type: 'out_of_stock', inCart: it.quantity, available });
      } else if (available < it.quantity) {
        out.push({ itemId: cartLineId(it), name: it.name, type: 'insufficient', inCart: it.quantity, available });
      }
    }
    return out;
  }, [items, stockMap]);

  const hasBlockingIssues = issues.length > 0;

  return (
    <div className={styles.grid}>
      <section className={styles.card}>
        <h2 className={styles.cardTitle}>
          <ShoppingBag size={18} /> Votre panier ({items.length} article{items.length !== 1 ? 's' : ''})
        </h2>

        {hasBlockingIssues && (
          <div className={styles.stockAlertBanner} role="alert">
            <div className={styles.stockAlertHead}>
              <AlertTriangle size={16} />
              <strong>Disponibilité de votre panier</strong>
            </div>
            <ul>
              {issues.map((iss) => (
                <li key={iss.itemId}>
                  <span className={styles.stockAlertName}>{iss.name}</span>
                  {iss.type === 'out_of_stock' ? (
                    <>
                      <em>indisponible</em>
                      <button
                        type="button"
                        className={styles.stockAlertAction}
                        onClick={() => removeItem(iss.itemId)}
                      >
                        <Trash2 size={12} /> Retirer
                      </button>
                    </>
                  ) : (
                    <>
                      <em>seulement {iss.available} disponible{(iss.available ?? 0) > 1 ? 's' : ''} (vous en avez {iss.inCart})</em>
                      <button
                        type="button"
                        className={styles.stockAlertAction}
                        onClick={() => updateQty(iss.itemId, iss.available!)}
                      >
                        <RefreshCw size={12} /> Ajuster à {iss.available}
                      </button>
                    </>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        <ul className={styles.cartList}>
          {items.map((it) => {
            const available = stockMap[it.id];
            const isOut = available !== undefined && available <= 0;
            const overCart = available !== undefined && available < it.quantity;
            const lineId = cartLineId(it);
            return (
              <li key={lineId} className={`${styles.cartItem} ${isOut ? styles.cartItemUnavailable : ''}`}>
                <Link to={`/products/${it.slug}`} className={styles.cartThumb}>
                  <img src={it.image} alt={it.name} />
                </Link>
                <div className={styles.cartInfo}>
                  {it.brandName && <span className={styles.cartBrand}>{it.brandName}</span>}
                  <Link to={`/products/${it.slug}`} className={styles.cartName}>{it.name}</Link>
                  {it.variantLabel && (
                    <span className={styles.cartBrand} style={{ color: '#C44D3A' }}>{it.variantLabel}</span>
                  )}
                  <div className={styles.cartFooter}>
                    <div className={styles.qtyControl}>
                      <button onClick={() => updateQty(lineId, it.quantity - 1)} aria-label="Diminuer" disabled={isOut}><Minus size={14} /></button>
                      <span>{it.quantity}</span>
                      <button
                        onClick={() => updateQty(lineId, it.quantity + 1)}
                        aria-label="Augmenter"
                        disabled={isOut || (available !== undefined && it.quantity >= available)}
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    <span className={styles.cartPrice}>{currency}{(it.price * it.quantity).toFixed(2)}</span>
                  </div>
                  {isOut && <span className={styles.cartStockLine}>Produit en rupture</span>}
                  {!isOut && overCart && (
                    <span className={styles.cartStockLine}>Plus que {available} en stock — pensez à ajuster</span>
                  )}
                </div>
                <button
                  className={styles.removeBtn}
                  onClick={() => removeItem(lineId)}
                  aria-label={`Retirer ${it.name}`}
                >
                  <Trash2 size={16} />
                </button>
              </li>
            );
          })}
        </ul>

      </section>

      <aside className={styles.summary}>
        <h2 className={styles.cardTitle}>Récapitulatif</h2>
        <div className={styles.summaryRow}>
          <span>Sous-total</span>
          <span>{currency}{subtotal.toFixed(2)}</span>
        </div>
        <p className={styles.summaryNote}>
          Les frais de livraison seront calculés à l'étape suivante.
        </p>

        <button
          className={styles.primaryBtn}
          onClick={() => navigate('/checkout/shipping')}
          disabled={hasBlockingIssues || revalidating || items.length === 0}
          data-testid="continue-to-shipping"
        >
          {revalidating ? 'Vérification du stock…' : <>Continuer vers la livraison <ChevronRight size={18} /></>}
        </button>
        {hasBlockingIssues && (
          <p className={styles.summaryWarn}>
            <AlertTriangle size={13} /> Résolvez les alertes de stock ci-dessus pour continuer.
          </p>
        )}
        <Link to="/collections" className={styles.backLink}>← Continuer mes achats</Link>
      </aside>
    </div>
  );
};

export default CheckoutCart;
