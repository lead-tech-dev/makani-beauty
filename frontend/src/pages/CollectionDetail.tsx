import { useEffect, useState, useCallback } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import ProductCard from "../components/ProductCard/ProductCard";
import SeoHead from "../components/SeoHead/SeoHead";
import Spinner from "../components/Spinner/Spinner";
import FilterSidebar, { ActiveFilters } from "../components/FilterSidebar/FilterSidebar";
import { categoriesService } from "../services/categories";
import { productsService } from "../services/products";
import { Category, Product, FacetCounts } from "../types";
import styles from "./CollectionDetail.module.scss";

type SortKey = "newest" | "popularity" | "rating" | "price_asc" | "price_desc" | "discount";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "popularity", label: "Popularité" },
  { value: "newest", label: "Nouveautés" },
  { value: "rating", label: "Mieux notés" },
  { value: "price_asc", label: "Prix croissant" },
  { value: "price_desc", label: "Prix décroissant" },
  { value: "discount", label: "Promotions" },
];

const parseList = (s: string | null): string[] =>
  s ? s.split(',').map((x) => x.trim()).filter(Boolean) : [];

const CollectionDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const [params, setParams] = useSearchParams();

  const [category, setCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [facets, setFacets] = useState<FacetCounts | null>(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const sort = (params.get('sort') as SortKey) ?? 'popularity';
  const active: ActiveFilters = {
    hairType: parseList(params.get('hairType')),
    skinType: parseList(params.get('skinType')),
    ingredients: parseList(params.get('ingredients')),
    certifications: parseList(params.get('certifications')),
    minPrice: params.get('minPrice') ? Number(params.get('minPrice')) : undefined,
    maxPrice: params.get('maxPrice') ? Number(params.get('maxPrice')) : undefined,
  };

  const updateParams = useCallback((updater: (sp: URLSearchParams) => void) => {
    const next = new URLSearchParams(params);
    updater(next);
    setParams(next, { replace: true });
  }, [params, setParams]);

  const onFiltersChange = (next: ActiveFilters) => {
    updateParams((sp) => {
      const setOrDel = (k: string, v: string[] | string | undefined) => {
        const val = Array.isArray(v) ? v.join(',') : (v ?? '');
        if (val) sp.set(k, val); else sp.delete(k);
      };
      setOrDel('hairType', next.hairType);
      setOrDel('skinType', next.skinType);
      setOrDel('ingredients', next.ingredients);
      setOrDel('certifications', next.certifications);
      setOrDel('minPrice', next.minPrice !== undefined ? String(next.minPrice) : undefined);
      setOrDel('maxPrice', next.maxPrice !== undefined ? String(next.maxPrice) : undefined);
    });
  };

  const reset = () => {
    updateParams((sp) => {
      ['hairType', 'skinType', 'ingredients', 'certifications', 'minPrice', 'maxPrice'].forEach((k) => sp.delete(k));
    });
  };

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    setLoading(true);
    setNotFound(false);

    categoriesService
      .getBySlug(slug)
      .then((cat) => {
        if (cancelled) return;
        setCategory(cat);
        return Promise.all([
          productsService.getAll({
            categoryId: cat.id ?? undefined,
            hairType: active.hairType,
            skinType: active.skinType,
            ingredients: active.ingredients,
            certifications: active.certifications,
            minPrice: active.minPrice,
            maxPrice: active.maxPrice,
            sort,
            limit: 100,
          }),
          productsService.getFacets({ categoryId: cat.id ?? undefined }),
        ]).then(([listed, fac]) => {
          if (cancelled) return;
          // The categories service used to return a slug-only object; if id is missing we still rely on the slug match below.
          const filteredByCategory = listed.data.filter((p) => p.category === cat.slug);
          setProducts(filteredByCategory);
          setTotal(filteredByCategory.length);
          setFacets(fac);
        });
      })
      .catch(() => { if (!cancelled) setNotFound(true); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [
    slug, sort,
    params.get('hairType'),
    params.get('skinType'),
    params.get('ingredients'),
    params.get('certifications'),
    params.get('minPrice'),
    params.get('maxPrice'),
  ]);

  if (loading && !category) return <Spinner fullPage />;

  if (notFound || !category) {
    return (
      <div className={styles.notFound} data-testid="collection-not-found">
        <h1>Collection introuvable</h1>
        <Link to="/collections" className={styles.btn}>Retour à la boutique</Link>
      </div>
    );
  }

  return (
    <div className={styles.page} data-testid={`collection-detail-${category.slug}`}>
      <SeoHead
        title={category.name}
        description={
          category.description?.slice(0, 155) ??
          `Découvrez notre sélection ${category.name.toLowerCase()} sur Makani Cosmétique.`
        }
        image={category.image}
        canonical={`/collections/${category.slug}`}
      />
      <header className={styles.banner}>
        <div className={styles.bannerInner}>
          <nav className={styles.breadcrumb}>
            <Link to="/">Accueil</Link>
            <span>/</span>
            <Link to="/collections">Boutique</Link>
            <span>/</span>
            <span aria-current="page">{category.name}</span>
          </nav>
          <div className={styles.bannerLayout}>
            <div className={styles.bannerText}>
              <span className={styles.eyebrow}>
                <span className={styles.issue}>Chapitre</span>
                <span className={styles.label}>Catégorie</span>
              </span>
              <h1 className={styles.title}>{category.name}</h1>
              {category.description && (
                <p className={styles.subtitle}>{category.description}</p>
              )}
            </div>
            <div className={styles.bannerArch} aria-hidden>
              <img src={category.image} alt="" />
            </div>
          </div>
        </div>
      </header>

      <div className={styles.layout}>
        <FilterSidebar
          facets={facets}
          active={active}
          onChange={onFiltersChange}
          onReset={reset}
        />

        <section className={styles.products}>
          <div className={styles.toolbar}>
            <div className={styles.count}>
              <strong>{total}</strong> produit{total !== 1 ? "s" : ""}
            </div>
            <div className={styles.sort}>
              <label htmlFor="sort">Trier</label>
              <select
                id="sort"
                value={sort}
                onChange={(e) => updateParams((sp) => sp.set("sort", e.target.value))}
                data-testid="sort-select"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <Spinner />
          ) : (
            <div className={styles.grid}>
              {products.map((p, idx) => (
                <ProductCard key={p.id} product={p} index={idx} />
              ))}
            </div>
          )}
          {!loading && products.length === 0 && (
            <div className={styles.empty}>
              <p>Aucun produit ne correspond à vos filtres.</p>
              <button className={styles.btn} onClick={reset}>
                Réinitialiser
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default CollectionDetail;
