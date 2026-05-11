import { Sparkles, Heart, Globe, Leaf } from "lucide-react";
import { Link } from "react-router-dom";
import SeoHead from "../components/SeoHead/SeoHead";
import { ABOUT_PORTRAIT } from "../lib/images";
import styles from "./About.module.scss";

const About = () => {
  return (
    <div className={styles.page} data-testid="about-page">
      <SeoHead
        title="Notre histoire"
        description="Makani Cosmétique célèbre la beauté afro et métissée. Découvrez notre mission, nos valeurs et l'équipe derrière la marque."
        canonical="/about"
      />
      <header className={styles.hero}>
        <div className={styles.heroInner}>
          <span className={styles.eyebrow}>Notre histoire</span>
          <h1 className={styles.title}>
            Célébrer la beauté <em>afro et métissée</em>, chaque jour.
          </h1>
          <p className={styles.lede}>
            Makani Cosmétique est née d'une conviction simple : nous méritons une
            beauté qui nous ressemble, des produits qui prennent soin de nos
            cheveux, de notre peau et de notre identité — sans compromis.
          </p>
        </div>
        <div className={styles.heroMedia}>
          <img
            src={ABOUT_PORTRAIT}
            alt="Portrait beauté afro métissée"
          />
        </div>
      </header>

      <section className={styles.mission}>
        <div className={styles.missionInner}>
          <div className={styles.missionText}>
            <span className={styles.smallEyebrow}>Notre mission</span>
            <h2>Une routine qui célèbre vos racines</h2>
            <p>
              Nous sélectionnons les meilleures marques internationales —
              américaines, françaises, africaines, du Moyen-Orient — pour vous
              offrir des produits efficaces, honnêtes et accessibles. Nos soins
              capillaires conviennent à tous les types de cheveux 3A à 4C, nos
              soins peau sont formulés pour les peaux mates et foncées, et nos
              fragrances racontent un voyage des oasis aux marchés d'Orient.
            </p>
          </div>
          <div className={styles.stats}>
            <div className={styles.stat}>
              <span>500+</span>
              <small>Produits</small>
            </div>
            <div className={styles.stat}>
              <span>30+</span>
              <small>Marques</small>
            </div>
            <div className={styles.stat}>
              <span>10K+</span>
              <small>Clientes ravies</small>
            </div>
            <div className={styles.stat}>
              <span>4.9★</span>
              <small>Trustpilot</small>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.values}>
        <div className={styles.valuesHead}>
          <span className={styles.smallEyebrow}>Nos valeurs</span>
          <h2>Ce qui nous anime</h2>
        </div>
        <div className={styles.valuesGrid}>
          <div className={styles.value} data-testid="value-1">
            <Sparkles size={28} strokeWidth={1.4} />
            <h3>Excellence</h3>
            <p>
              Nous testons et choisissons chaque produit avec exigence — efficacité,
              composition, éthique de marque.
            </p>
          </div>
          <div className={styles.value} data-testid="value-2">
            <Heart size={28} strokeWidth={1.4} />
            <h3>Représentation</h3>
            <p>
              Nous mettons en lumière les talents, fondateurs et marques issus
              de la diaspora et au-delà.
            </p>
          </div>
          <div className={styles.value} data-testid="value-3">
            <Leaf size={28} strokeWidth={1.4} />
            <h3>Naturel</h3>
            <p>
              Une priorité aux ingrédients issus de la nature, sans
              compromission sur la performance.
            </p>
          </div>
          <div className={styles.value} data-testid="value-4">
            <Globe size={28} strokeWidth={1.4} />
            <h3>Communauté mondiale</h3>
            <p>
              Une boutique pensée pour la France, l'Europe et nos sœurs &
              frères partout dans le monde.
            </p>
          </div>
        </div>
      </section>

      <section className={styles.cta}>
        <div className={styles.ctaInner}>
          <h2>
            Prête à composer votre <em>routine</em> ?
          </h2>
          <p>
            Naviguez parmi 500+ produits sélectionnés et trouvez ceux qui
            sublimeront vos cheveux et votre peau.
          </p>
          <Link to="/collections" className={styles.ctaBtn}>
            Découvrir la boutique
          </Link>
        </div>
      </section>
    </div>
  );
};

export default About;
