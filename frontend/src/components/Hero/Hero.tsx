import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { HERO_PORTRAIT } from "../../lib/images";
import styles from "./Hero.module.scss";

const Hero = () => {
  return (
    <section className={styles.hero} data-testid="home-hero">
      <div className={styles.arena}>
        <div className={styles.left}>
          <div className={styles.eyebrowRow} data-testid="hero-eyebrow">
            <span className={styles.issue}>№ 01</span>
            <span className={styles.divider} aria-hidden />
            <span className={styles.eyebrowText}>L'édit de la saison</span>
          </div>

          <h1 className={styles.title}>
            <span className={styles.line}>La beauté</span>
            <span className={`${styles.line} ${styles.italic}`}>afro</span>
            <span className={styles.line}>
              à l'état
              <span className={styles.titleStrike}>brut.</span>
            </span>
          </h1>

          <p className={styles.lede}>
            Soins capillaires, soins de la peau, parfums d'Orient. Une sélection
            rigoureuse pour célébrer la richesse de la beauté afro et métissée — au
            quotidien, sans compromis.
          </p>

          <div className={styles.actions}>
            <Link to="/collections" className={styles.cta} data-testid="hero-cta-primary">
              <span>Voir l'édition complète</span>
              <ArrowUpRight size={18} strokeWidth={1.6} />
            </Link>
            <Link to="/about" className={styles.ctaGhost} data-testid="hero-cta-secondary">
              Notre histoire
            </Link>
          </div>

          <dl className={styles.facts} data-testid="hero-trust">
            <div className={styles.fact}>
              <dt>500+</dt>
              <dd>Produits sélectionnés</dd>
            </div>
            <span className={styles.factDivider} aria-hidden />
            <div className={styles.fact}>
              <dt>30</dt>
              <dd>Marques iconiques</dd>
            </div>
            <span className={styles.factDivider} aria-hidden />
            <div className={styles.fact}>
              <dt>1 200+</dt>
              <dd>Avis vérifiés</dd>
            </div>
          </dl>
        </div>

        <div className={styles.right}>
          <div className={styles.archStack}>
            <span className={styles.archShadow} aria-hidden />
            <div className={styles.arch}>
              <img
                src={HERO_PORTRAIT}
                alt="Portrait éditorial — beauté afro lumineuse"
                loading="eager"
                className={styles.archImg}
              />
              <span className={styles.archCaption} aria-hidden>
                <small>Photographie</small>
                <strong>Mireille Z. — Lagos</strong>
              </span>
            </div>
            <span className={styles.archStamp} aria-hidden>
              <span>Édition</span>
              <strong>03</strong>
              <span>Hiver</span>
            </span>
          </div>
        </div>
      </div>

      <div className={styles.feature} aria-hidden>
        <span className={styles.featureLabel}>En une</span>
        <p className={styles.featureText}>
          « Aïsha M. — fondatrice »
          <span className={styles.featureItalic}>
            « La beauté n'est pas une industrie. C'est une mémoire. »
          </span>
        </p>
      </div>
    </section>
  );
};

export default Hero;
