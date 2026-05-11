import { Link } from "react-router-dom";
import { useBrands } from "../hooks/useBrands";
import { useProducts } from "../hooks/useProducts";
import SeoHead from "../components/SeoHead/SeoHead";
import Spinner from "../components/Spinner/Spinner";
import styles from "./Brands.module.scss";

const Brands = () => {
  const { brands, loading } = useBrands();
  const { data: products } = useProducts({ limit: 100 });

  const countByBrand = (slug: string) =>
    products.filter((p) => p.brand === slug).length;

  const sorted = [...brands].sort((a, b) => a.name.localeCompare(b.name));
  const grouped = sorted.reduce<Record<string, typeof brands>>((acc, b) => {
    const letter = b.name[0].toUpperCase();
    if (!acc[letter]) acc[letter] = [];
    acc[letter].push(b);
    return acc;
  }, {});

  if (loading) return <Spinner fullPage />;

  return (
    <div className={styles.page} data-testid="brands-page">
      <SeoHead
        title="Toutes les marques"
        description="Découvrez les maisons de beauté distribuées par Makani Cosmétique : marques afro, parfumeries d'Orient, soins capillaires premium."
        canonical="/brands"
      />
      <header className={styles.header}>
        <span className={styles.eyebrow}>Catalogue</span>
        <h1 className={styles.title}>
          Toutes nos <em>marques</em>
        </h1>
        <p className={styles.subtitle}>
          De Paris à Dubaï, des États-Unis à Lagos — découvrez les maisons que
          nous distribuons pour vous offrir une beauté singulière.
        </p>
      </header>

      <nav className={styles.alphabet} aria-label="Lettres">
        {Object.keys(grouped).map((letter) => (
          <a key={letter} href={`#letter-${letter}`} className={styles.letter}>
            {letter}
          </a>
        ))}
      </nav>

      <section className={styles.list}>
        {Object.entries(grouped).map(([letter, items]) => (
          <div key={letter} className={styles.group} id={`letter-${letter}`}>
            <h2>{letter}</h2>
            <div className={styles.grid}>
              {items.map((b) => (
                <Link
                  to={`/collections#brand-${b.slug}`}
                  key={b.slug}
                  className={styles.brand}
                  data-testid={`brand-card-${b.slug}`}
                  id={b.slug}
                >
                  <div>
                    <h3>{b.name}</h3>
                    {b.origin && <span>{b.origin}</span>}
                  </div>
                  <span className={styles.count}>
                    {countByBrand(b.slug)} produit{countByBrand(b.slug) !== 1 ? "s" : ""}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
};

export default Brands;
