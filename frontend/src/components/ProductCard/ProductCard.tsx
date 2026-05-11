import { Link, useNavigate } from "react-router-dom";
import { ShoppingBag, Heart, ArrowUpRight } from "lucide-react";
import { Product } from "../../types";
import { useCart } from "../../context/CartContext";
import { useFavorites } from "../../context/FavoritesContext";
import { useAuth } from "../../context/AuthContext";
import { getStockStatus } from "../../lib/stockStatus";
import { trackAddToWishlist } from "../../lib/analytics";
import ResponsiveImage from "../ResponsiveImage/ResponsiveImage";
import styles from "./ProductCard.module.scss";

interface Props {
  product: Product;
  variant?: "default" | "compact";
  index?: number;
}

const ProductCard = ({ product, variant = "default", index = 0 }: Props) => {
  const { addItem } = useCart();
  const { isFavorite, toggle } = useFavorites();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const hasDiscount =
    product.comparePrice && product.comparePrice > product.price;
  const fav = isFavorite(product.id);
  const stockStatus = getStockStatus(product);
  const isOutOfStock = stockStatus === "out_of_stock";

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) return;
    addItem(product, 1);
  };

  const handleFav = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      navigate("/login", {
        state: { from: { pathname: window.location.pathname } },
      });
      return;
    }
    if (!fav) trackAddToWishlist(product);
    toggle(product.id);
  };

  const discountPct = hasDiscount
    ? Math.round(
        ((product.comparePrice! - product.price) / product.comparePrice!) * 100,
      )
    : 0;

  // Asymmetric grid: every 2nd card offset down for editorial rhythm
  const offset = index % 2 === 1;

  return (
    <article
      className={`${styles.card} ${variant === "compact" ? styles.compact : ""} ${
        offset ? styles.offset : ""
      }`}
      data-testid={`product-card-${product.slug}`}
    >
      <Link
        to={`/products/${product.slug}`}
        className={styles.media}
        data-testid={`product-link-${product.slug}`}
        aria-label={`Voir ${product.name}`}
      >
        <span className={styles.mediaShadow} aria-hidden />
        <span className={styles.archFrame} aria-hidden>
          <ResponsiveImage
            src={product.image}
            srcset={product.imageSrcset}
            lqip={product.imageLqip}
            alt={product.name}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className={styles.imgWrap}
          />
          <span className={styles.archHover} aria-hidden>
            <span className={styles.archHoverText}>
              Voir <ArrowUpRight size={14} strokeWidth={1.8} />
            </span>
          </span>
        </span>

        <span className={styles.cornerNumber} aria-hidden>
          № {String((index % 99) + 1).padStart(2, "0")}
        </span>

        <span className={styles.badges}>
          {product.isNew && <span className={styles.badgeNew}>Nouveau</span>}
          {hasDiscount && (
            <span className={styles.badgeSale}>−{discountPct}%</span>
          )}
          {product.isBestSeller && (
            <span className={styles.badgeBest}>Best</span>
          )}
          {stockStatus === "low_stock" && (
            <span className={styles.badgeLowStock}>Bientôt épuisé</span>
          )}
          {stockStatus === "out_of_stock" && (
            <span className={styles.badgeOutOfStock}>Rupture</span>
          )}
        </span>

        <button
          type="button"
          className={`${styles.favBtn} ${fav ? styles.favActive : ""}`}
          onClick={handleFav}
          aria-label={
            fav
              ? `Retirer ${product.name} des favoris`
              : `Ajouter ${product.name} aux favoris`
          }
          aria-pressed={fav}
          data-testid={`fav-btn-${product.slug}`}
        >
          <Heart size={15} fill={fav ? "currentColor" : "none"} strokeWidth={1.8} />
        </button>
      </Link>

      <div className={styles.body}>
        <div className={styles.bodyTop}>
          <span className={styles.brand} data-testid={`brand-${product.slug}`}>
            {product.brandName || product.brand}
          </span>
          <span className={styles.bodyRule} aria-hidden />
        </div>

        <h3 className={styles.title}>
          <Link to={`/products/${product.slug}`}>{product.name}</Link>
        </h3>

        <div className={styles.priceRow}>
          <div className={styles.priceCluster}>
            <span className={styles.price}>
              {product.currency}
              {product.price.toFixed(2)}
            </span>
            {hasDiscount && (
              <span className={styles.compare}>
                {product.currency}
                {product.comparePrice!.toFixed(2)}
              </span>
            )}
          </div>

          <button
            type="button"
            className={`${styles.addBtn} ${isOutOfStock ? styles.addDisabled : ""}`}
            onClick={handleAdd}
            disabled={isOutOfStock}
            data-testid={`quick-add-${product.slug}`}
            aria-label={
              isOutOfStock
                ? `${product.name} indisponible`
                : `Ajouter ${product.name} au panier`
            }
          >
            <ShoppingBag size={14} strokeWidth={1.8} />
            <span>{isOutOfStock ? "Indispo." : "Ajouter"}</span>
          </button>
        </div>
      </div>
    </article>
  );
};

export default ProductCard;
