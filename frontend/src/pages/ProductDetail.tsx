import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Star, Truck, ShieldCheck, Leaf, Plus, Minus, Heart, AlertCircle, ArrowUpRight } from "lucide-react";
import { useProduct } from "../hooks/useProduct";
import { trackViewItem } from "../lib/analytics";
import { useCart } from "../context/CartContext";
import { useFavorites } from "../context/FavoritesContext";
import { useAuth } from "../context/AuthContext";
import { getStockStatus } from "../lib/stockStatus";
import SeoHead from "../components/SeoHead/SeoHead";
import JsonLd from "../components/SeoHead/JsonLd";
import ResponsiveImage from "../components/ResponsiveImage/ResponsiveImage";
import Spinner from "../components/Spinner/Spinner";
import styles from "./ProductDetail.module.scss";

const ProductDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { product, loading, error } = useProduct(slug);
  const { addItem } = useCart();
  const { isFavorite, toggle } = useFavorites();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState<"description" | "ingredients">("description");
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);

  useEffect(() => {
    if (!product?.id) return;
    trackViewItem(product);
  }, [product?.id]);

  // Auto-select the first available variant when product loads
  useEffect(() => {
    if (!product?.variants?.length) {
      setSelectedVariantId(null);
      return;
    }
    const firstAvailable = product.variants.find((v) => v.isActive && v.stock > 0);
    setSelectedVariantId(firstAvailable?.id ?? product.variants[0]!.id);
  }, [product?.id, product?.variants]);

  if (loading) return <Spinner fullPage />;

  if (error || !product) {
    return (
      <div className={styles.notFound}>
        <span className={styles.notFoundIssue}>№ 404</span>
        <h1>Produit introuvable.</h1>
        <Link to="/collections" className={styles.btn}>
          Retour à la boutique
          <ArrowUpRight size={16} strokeWidth={1.7} />
        </Link>
      </div>
    );
  }

  const variants = product.variants ?? [];
  const hasVariants = variants.length > 0;
  const selectedVariant = hasVariants
    ? variants.find((v) => v.id === selectedVariantId) ?? null
    : null;

  const effectivePrice = selectedVariant?.priceOverride ?? product.price;
  const effectiveStock = selectedVariant ? selectedVariant.stock : (product.stock ?? 0);
  const hasDiscount = product.comparePrice && product.comparePrice > effectivePrice;
  const stockStatus = hasVariants
    ? effectiveStock <= 0
      ? "out_of_stock"
      : effectiveStock <= 3
        ? "low_stock"
        : "in_stock"
    : getStockStatus(product);
  const isOutOfStock = stockStatus === "out_of_stock";
  const fav = isFavorite(product.id);

  return (
    <div className={styles.page} data-testid={`product-detail-${product.slug}`}>
      <SeoHead
        title={product.name}
        description={
          product.description
            ? product.description.replace(/\s+/g, " ").slice(0, 155)
            : `Découvrez ${product.name} sur Makani Cosmétique.`
        }
        image={product.image}
        type="product"
        canonical={`/products/${product.slug}`}
      />
      <JsonLd
        id="breadcrumb"
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Accueil", item: `${process.env.REACT_APP_SITE_URL ?? "https://makani-cosmetique.com"}/` },
            { "@type": "ListItem", position: 2, name: "Boutique", item: `${process.env.REACT_APP_SITE_URL ?? "https://makani-cosmetique.com"}/collections` },
            ...(product.category
              ? [{ "@type": "ListItem", position: 3, name: product.category.replace(/-/g, " "), item: `${process.env.REACT_APP_SITE_URL ?? "https://makani-cosmetique.com"}/collections/${product.category}` }]
              : []),
            { "@type": "ListItem", position: product.category ? 4 : 3, name: product.name },
          ],
        }}
      />
      <JsonLd
        id={`product-${product.slug}`}
        data={{
          "@context": "https://schema.org",
          "@type": "Product",
          name: product.name,
          image: product.image,
          description: product.description ?? undefined,
          brand: product.brand ? { "@type": "Brand", name: product.brand.replace(/-/g, " ") } : undefined,
          sku: product.id,
          offers: {
            "@type": "Offer",
            url: `${process.env.REACT_APP_SITE_URL ?? "https://makani-cosmetique.com"}/products/${product.slug}`,
            priceCurrency: "EUR",
            price: product.price.toFixed(2),
            availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
            itemCondition: "https://schema.org/NewCondition",
          },
          aggregateRating: product.rating && product.reviewCount
            ? { "@type": "AggregateRating", ratingValue: product.rating.toFixed(1), reviewCount: product.reviewCount }
            : undefined,
        }}
      />

      <nav className={styles.breadcrumb}>
        <Link to="/">Accueil</Link>
        <span>/</span>
        <Link to="/collections">Boutique</Link>
        <span>/</span>
        {product.category && (
          <>
            <Link to={`/collections/${product.category}`}>
              {product.category.replace(/-/g, " ")}
            </Link>
            <span>/</span>
          </>
        )}
        <span aria-current="page">{product.name}</span>
      </nav>

      <div className={styles.layout}>
        <div className={styles.gallery}>
          <div className={styles.archStack}>
            <span className={styles.archShadow} aria-hidden />
            <div className={styles.archImg}>
              <ResponsiveImage
                src={product.image}
                srcset={product.imageSrcset}
                lqip={product.imageLqip}
                alt={product.name}
                loading="eager"
                sizes="(max-width: 880px) 100vw, 50vw"
              />
              {product.isBestSeller && (
                <span className={styles.bestBadge}>Best-Seller</span>
              )}
            </div>
            <span className={styles.archPlate} aria-hidden>
              <small>Édition</small>
              <strong>03</strong>
            </span>
          </div>
        </div>

        <aside className={styles.info}>
          <span className={styles.eyebrow}>
            <span className={styles.issue} data-testid="detail-brand">
              {product.brandName || product.brand}
            </span>
            <span className={styles.dot} aria-hidden />
            <span className={styles.label}>Fiche produit</span>
          </span>

          <h1 className={styles.title}>{product.name}</h1>

          <div className={styles.rating}>
            <span className={styles.stars} aria-label={`${product.rating} étoiles`}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  size={14}
                  fill={i < Math.round(product.rating) ? "currentColor" : "none"}
                  stroke="currentColor"
                  strokeWidth={1.7}
                />
              ))}
            </span>
            <span className={styles.reviewLink}>
              <strong>{product.rating.toFixed(1)}</strong>
              <span> · {product.reviewCount} avis</span>
            </span>
          </div>

          <div className={styles.priceRow}>
            <span className={styles.price}>
              {product.currency}
              {effectivePrice.toFixed(2)}
            </span>
            {hasDiscount && (
              <>
                <span className={styles.compare}>
                  {product.currency}
                  {product.comparePrice!.toFixed(2)}
                </span>
                <span className={styles.discount}>
                  −{Math.round(((product.comparePrice! - effectivePrice) / product.comparePrice!) * 100)}%
                </span>
              </>
            )}
          </div>

          {hasVariants && (
            <div className={styles.variants} role="radiogroup" aria-label="Choisir une variante">
              <span className={styles.variantsLabel}>
                {variants.some((v) => "size" in v.attributes)
                  ? "Taille"
                  : variants.some((v) => "length" in v.attributes)
                    ? "Longueur"
                    : "Variante"}
              </span>
              <div className={styles.variantPills}>
                {variants.map((v) => {
                  const label = Object.values(v.attributes).join(" / ") || "—";
                  const isOut = v.stock <= 0 || !v.isActive;
                  const isSel = v.id === selectedVariantId;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      role="radio"
                      aria-checked={isSel}
                      className={`${styles.variantPill} ${isSel ? styles.variantPillActive : ""} ${isOut ? styles.variantPillOut : ""}`}
                      onClick={() => !isOut && setSelectedVariantId(v.id)}
                      disabled={isOut}
                      data-testid={`variant-${v.id}`}
                    >
                      <span>{label}</span>
                      {isOut && <small>épuisée</small>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {isOutOfStock && (
            <p className={styles.stockOut}>
              <AlertCircle size={14} /> Indisponible — {hasVariants ? "variante en rupture" : "produit en rupture de stock"}.
            </p>
          )}
          {stockStatus === "low_stock" && (
            <p className={styles.stockAlert}>
              ▸ Plus que <strong>{effectiveStock}</strong>{" "}
              {effectiveStock === 1 ? "exemplaire" : "exemplaires"} en stock.
            </p>
          )}

          <p className={styles.shortDesc}>{product.description}</p>

          <div className={styles.actionRow}>
            <div className={styles.qty} aria-label="Quantité">
              <button
                type="button"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                aria-label="Diminuer"
                disabled={isOutOfStock}
                data-testid="detail-qty-minus"
              >
                <Minus size={14} strokeWidth={1.8} />
              </button>
              <span data-testid="detail-qty">{qty}</span>
              <button
                type="button"
                onClick={() => setQty((q) => Math.min(effectiveStock || Infinity, q + 1))}
                aria-label="Augmenter"
                disabled={isOutOfStock || qty >= effectiveStock}
                data-testid="detail-qty-plus"
              >
                <Plus size={14} strokeWidth={1.8} />
              </button>
            </div>

            <button
              type="button"
              className={styles.addBtn}
              onClick={() => addItem(product, qty, selectedVariant)}
              disabled={isOutOfStock || (hasVariants && !selectedVariant)}
              data-testid="detail-add-cart"
            >
              {isOutOfStock
                ? "Indisponible"
                : hasVariants && !selectedVariant
                  ? "Choisissez une variante"
                  : "Ajouter au panier"}
              {!isOutOfStock && <ArrowUpRight size={16} strokeWidth={1.7} />}
            </button>

            <button
              type="button"
              className={`${styles.wishlist} ${fav ? styles.wishlistActive : ""}`}
              aria-label={fav ? "Retirer des favoris" : "Ajouter aux favoris"}
              aria-pressed={fav}
              data-testid="detail-wishlist"
              onClick={() => {
                if (!isAuthenticated) {
                  navigate("/login", { state: { from: { pathname: window.location.pathname } } });
                  return;
                }
                toggle(product.id);
              }}
            >
              <Heart size={16} strokeWidth={1.8} fill={fav ? "currentColor" : "none"} />
            </button>
          </div>

          <ul className={styles.benefits}>
            <li>
              <span className={styles.benefitIcon}><Truck size={16} strokeWidth={1.6} /></span>
              <span>Livraison soignée &amp; rapide</span>
            </li>
            <li>
              <span className={styles.benefitIcon}><ShieldCheck size={16} strokeWidth={1.6} /></span>
              <span>Paiement 100% sécurisé</span>
            </li>
            <li>
              <span className={styles.benefitIcon}><Leaf size={16} strokeWidth={1.6} /></span>
              <span>Sélection naturelle &amp; éthique</span>
            </li>
          </ul>

          <div className={styles.tabs}>
            <div className={styles.tabHead} role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={tab === "description"}
                className={tab === "description" ? styles.active : ""}
                onClick={() => setTab("description")}
                data-testid="tab-description"
              >
                <span className={styles.tabIndex}>01</span>
                <span>Description</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={tab === "ingredients"}
                className={tab === "ingredients" ? styles.active : ""}
                onClick={() => setTab("ingredients")}
                data-testid="tab-ingredients"
              >
                <span className={styles.tabIndex}>02</span>
                <span>Bénéfices</span>
              </button>
            </div>
            <div className={styles.tabBody}>
              {tab === "description" && <p>{product.description}</p>}
              {tab === "ingredients" && (
                <ul className={styles.featList}>
                  {(product.features || [
                    "Sélectionné par notre équipe",
                    "Adapté aux cheveux et peaux afro",
                    "Issu de marques iconiques",
                  ]).map((f, i) => (
                    <li key={i}>
                      <span className={styles.featIndex}>
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default ProductDetail;
