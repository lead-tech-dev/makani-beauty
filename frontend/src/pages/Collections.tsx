import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { useCategories } from "../hooks/useCategories";
import { useProducts } from "../hooks/useProducts";
import ProductCard from "../components/ProductCard/ProductCard";
import SeoHead from "../components/SeoHead/SeoHead";
import Spinner from "../components/Spinner/Spinner";
import styles from "./Collections.module.scss";

const Collections = () => {
  const { categories, loading: catLoading } = useCategories();
  const { data: products, meta, loading: prodLoading } = useProducts({ limit: 100 });

  return (
    <div className={styles.page} data-testid="collections-page">
      <SeoHead
        title="Toutes les collections"
        description="Explorez l'intégralité de nos collections beauté afro : soins capillaires, soins de la peau, parfums d'Orient, huiles & beurres."
        canonical="/collections"
      />
      <header className={styles.masthead}>
        <div className={styles.mastheadInner}>
          <span className={styles.eyebrow}>
            <span className={styles.issue}>№ 02</span>
            <span className={styles.label}>Le sommaire</span>
          </span>
          <h1 className={styles.title}>
            Toute la <em>boutique</em>,
            <br />
            une seule édition.
          </h1>
          <p className={styles.lede}>
            Plus de 500 produits choisis avec soin pour célébrer la beauté afro
            et métissée — cheveux, peau, fragrance. Sélection éditée à la main,
            pas un algorithme.
          </p>
        </div>
      </header>

      <section className={styles.categories}>
        <div className={styles.sectionHead}>
          <span className={styles.sectionEyebrow}>
            <span className={styles.issue}>01</span>
            <span className={styles.label}>Rayons</span>
          </span>
          <h2 className={styles.sectionTitle}>
            Choisissez votre <em>chapitre</em>.
          </h2>
        </div>

        {catLoading ? (
          <Spinner />
        ) : (
          <div className={styles.categoryGrid}>
            {categories.map((cat, idx) => (
              <Link
                to={`/collections/${cat.slug}`}
                className={styles.catCard}
                key={cat.slug}
                data-testid={`collection-${cat.slug}`}
                style={idx % 2 === 1 ? { transform: "translateY(1.5rem)" } : undefined}
              >
                <span className={styles.catNumber} aria-hidden>
                  №&nbsp;{String(idx + 1).padStart(2, "0")}
                </span>
                <div className={styles.catImg}>
                  <img src={cat.image} alt={cat.name} />
                </div>
                <div className={styles.catBody}>
                  <h3>{cat.name}</h3>
                  <p>{cat.description}</p>
                  <span className={styles.catCta}>
                    Explorer <ArrowUpRight size={14} strokeWidth={1.8} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className={styles.allProducts}>
        <div className={styles.sectionHead}>
          <span className={styles.sectionEyebrow}>
            <span className={styles.issue}>02</span>
            <span className={styles.label}>Catalogue</span>
          </span>
          <div className={styles.sectionHeadRow}>
            <h2 className={styles.sectionTitle}>
              Tous les <em>produits</em>.
            </h2>
            <span className={styles.count}>
              {meta.total} <span>références</span>
            </span>
          </div>
        </div>

        {prodLoading ? (
          <Spinner fullPage />
        ) : products.length === 0 ? (
          <p className={styles.empty}>Aucun produit disponible pour le moment.</p>
        ) : (
          <div className={styles.grid}>
            {products.map((p, idx) => (
              <ProductCard key={p.id} product={p} index={idx} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Collections;
