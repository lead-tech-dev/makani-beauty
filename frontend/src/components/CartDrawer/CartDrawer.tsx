import { X, Plus, Minus, Trash2, ShoppingBag } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useCart, cartLineId } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import styles from "./CartDrawer.module.scss";

const CartDrawer = () => {
  const {
    items,
    isOpen,
    closeCart,
    removeItem,
    updateQty,
    subtotal,
    totalItems,
  } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleCheckout = () => {
    closeCart();
    if (isAuthenticated) navigate('/checkout');
    else navigate('/login', { state: { from: { pathname: '/checkout' } } });
  };

  return (
    <>
      <div
        className={`${styles.backdrop} ${isOpen ? styles.show : ""}`}
        onClick={closeCart}
        aria-hidden
      />
      <aside
        className={`${styles.drawer} ${isOpen ? styles.open : ""}`}
        aria-hidden={!isOpen}
        data-testid="cart-drawer"
      >
        <header className={styles.header}>
          <div>
            <span className={styles.eyebrow}>Votre panier</span>
            <h3>{totalItems} article{totalItems > 1 ? "s" : ""}</h3>
          </div>
          <button
            className={styles.close}
            onClick={closeCart}
            aria-label="Fermer le panier"
            data-testid="close-cart-btn"
          >
            <X size={22} />
          </button>
        </header>

        {items.length === 0 ? (
          <div className={styles.empty} data-testid="empty-cart-message">
            <div className={styles.emptyIcon}>
              <ShoppingBag size={42} />
            </div>
            <h4>Votre panier est vide</h4>
            <p>Découvrez nos meilleures ventes et soins essentiels.</p>
            <Link
              to="/collections"
              className={styles.emptyCta}
              onClick={closeCart}
              data-testid="empty-cart-shop-link"
            >
              Découvrir la boutique
            </Link>
          </div>
        ) : (
          <>
            <ul className={styles.list}>
              {items.map((it) => {
                const lineId = cartLineId(it);
                return (
                <li
                  key={lineId}
                  className={styles.item}
                  data-testid={`cart-item-${it.slug}`}
                >
                  <Link
                    to={`/products/${it.slug}`}
                    onClick={closeCart}
                    className={styles.thumb}
                  >
                    <img src={it.image} alt={it.name} />
                  </Link>
                  <div className={styles.info}>
                    <span className={styles.brand}>
                      {it.brandName || it.brand}
                    </span>
                    <Link
                      to={`/products/${it.slug}`}
                      onClick={closeCart}
                      className={styles.name}
                    >
                      {it.name}
                    </Link>
                    {it.variantLabel && (
                      <span className={styles.brand} style={{ color: "#C44D3A" }}>
                        {it.variantLabel}
                      </span>
                    )}

                    <div className={styles.itemFooter}>
                      <div className={styles.qty}>
                        <button
                          aria-label="Diminuer la quantité"
                          onClick={() => updateQty(lineId, it.quantity - 1)}
                          data-testid={`decrease-qty-${it.slug}`}
                        >
                          <Minus size={14} />
                        </button>
                        <span data-testid={`qty-${it.slug}`}>
                          {it.quantity}
                        </span>
                        <button
                          aria-label="Augmenter la quantité"
                          onClick={() => updateQty(lineId, it.quantity + 1)}
                          data-testid={`increase-qty-${it.slug}`}
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <span className={styles.price}>
                        {it.currency}
                        {(it.price * it.quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <button
                    className={styles.remove}
                    onClick={() => removeItem(lineId)}
                    aria-label="Retirer du panier"
                    data-testid={`remove-item-${it.slug}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </li>
                );
              })}
            </ul>

            <footer className={styles.footer}>
              <div className={styles.subtotal}>
                <span>Sous-total</span>
                <span data-testid="cart-subtotal">${subtotal.toFixed(2)}</span>
              </div>
              <p className={styles.note}>
                Livraison et taxes calculées à l'étape suivante.
              </p>
              <button
                className={styles.checkout}
                onClick={handleCheckout}
                data-testid="checkout-btn"
              >
                Passer à la caisse
              </button>
              <button
                className={styles.continue}
                onClick={closeCart}
                data-testid="continue-shopping-btn"
              >
                Continuer mes achats
              </button>
            </footer>
          </>
        )}
      </aside>
    </>
  );
};

export default CartDrawer;
