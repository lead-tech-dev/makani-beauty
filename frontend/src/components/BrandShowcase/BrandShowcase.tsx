import { Link } from "react-router-dom";
import { useBrands } from "../../hooks/useBrands";
import styles from "./BrandShowcase.module.scss";

const BrandShowcase = () => {
  const { brands } = useBrands();

  return (
    <section className={styles.section} data-testid="brand-showcase">
      <div className={styles.head}>
        <span className={styles.eyebrow}>Nos marques</span>
        <h2 className={styles.title}>
          30+ maisons de <em>confiance</em>
        </h2>
        <Link to="/brands" className={styles.viewAll}>
          Toutes les marques →
        </Link>
      </div>

      <div className={styles.grid}>
        {brands.map((b) => (
          <Link
            to={`/brands#${b.slug}`}
            key={b.slug}
            className={styles.brand}
            data-testid={`brand-${b.slug}`}
          >
            <span className={styles.brandName}>{b.name}</span>
            {b.origin && <span className={styles.origin}>{b.origin}</span>}
          </Link>
        ))}
      </div>
    </section>
  );
};

export default BrandShowcase;
