import { useRef } from "react";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import ProductCard from "../ProductCard/ProductCard";
import { Product } from "../../types";
import styles from "./ProductCarousel.module.scss";

interface Props {
  title: string;
  eyebrow?: string;
  issue?: string;
  products: Product[];
  ctaLabel?: string;
  ctaTo?: string;
  testId?: string;
}

const ProductCarousel = ({
  title,
  eyebrow,
  issue,
  products,
  ctaLabel,
  ctaTo,
  testId,
}: Props) => {
  const trackRef = useRef<HTMLDivElement>(null);

  const scrollBy = (delta: number) => {
    trackRef.current?.scrollBy({ left: delta, behavior: "smooth" });
  };

  return (
    <section
      className={styles.section}
      data-testid={testId || "product-carousel"}
    >
      <header className={styles.head}>
        <div className={styles.headLeft}>
          {(issue || eyebrow) && (
            <span className={styles.eyebrowRow}>
              {issue && <span className={styles.issue}>{issue}</span>}
              {eyebrow && <span className={styles.eyebrowText}>{eyebrow}</span>}
            </span>
          )}
          <h2 className={styles.title}>{title}</h2>
        </div>
        <div className={styles.headRight}>
          {ctaTo && (
            <Link to={ctaTo} className={styles.cta}>
              <span>{ctaLabel || "Tout voir"}</span>
              <ArrowUpRight size={16} strokeWidth={1.7} />
            </Link>
          )}
          <div className={styles.controls}>
            <button
              type="button"
              className={styles.ctrl}
              onClick={() => scrollBy(-380)}
              aria-label="Précédent"
              data-testid="carousel-prev"
            >
              <ArrowLeft size={16} strokeWidth={1.7} />
            </button>
            <button
              type="button"
              className={styles.ctrl}
              onClick={() => scrollBy(380)}
              aria-label="Suivant"
              data-testid="carousel-next"
            >
              <ArrowRight size={16} strokeWidth={1.7} />
            </button>
          </div>
        </div>
      </header>

      <div className={styles.track} ref={trackRef}>
        {products.map((p, idx) => (
          <div className={styles.slide} key={p.id}>
            <ProductCard product={p} index={idx} />
          </div>
        ))}
      </div>
    </section>
  );
};

export default ProductCarousel;
