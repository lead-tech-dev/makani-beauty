import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { useCategories } from "../../hooks/useCategories";
import Spinner from "../Spinner/Spinner";
import styles from "./CategoryGrid.module.scss";

const CategoryGrid = () => {
  const { categories, loading } = useCategories();

  if (loading) return <Spinner />;

  return (
    <section className={styles.section} data-testid="category-grid">
      <div className={styles.head}>
        <span className={styles.eyebrow}>Catégories</span>
        <h2 className={styles.title}>
          Explorez par <em>univers</em>
        </h2>
        <p className={styles.subtitle}>
          De la racine jusqu'aux pointes, du visage jusqu'à la peau, de la
          fragrance la plus douce à la plus envoûtante.
        </p>
      </div>

      <div className={styles.grid}>
        {categories.map((cat, idx) => (
          <Link
            to={`/collections/${cat.slug}`}
            className={`${styles.card} ${styles[`card${idx}`] || ""}`}
            key={cat.slug}
            data-testid={`category-card-${cat.slug}`}
          >
            <div className={styles.media}>
              <img src={cat.image} alt={cat.name} loading="lazy" />
              <span className={styles.arrow}>
                <ArrowUpRight size={20} />
              </span>
            </div>
            <div className={styles.content}>
              <h3 className={styles.cardTitle}>{cat.name}</h3>
              <p className={styles.cardDesc}>{cat.description}</p>
              <span className={styles.cardCta}>Voir la sélection</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default CategoryGrid;
