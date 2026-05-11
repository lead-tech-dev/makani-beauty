import { useEffect, useState } from "react";
import SeoHead from "../components/SeoHead/SeoHead";
import JsonLd from "../components/SeoHead/JsonLd";
import Hero from "../components/Hero/Hero";
import Marquee from "../components/Marquee/Marquee";
import CategoryGrid from "../components/CategoryGrid/CategoryGrid";
import BrandShowcase from "../components/BrandShowcase/BrandShowcase";
import ProcessSection from "../components/ProcessSection/ProcessSection";
import ProductCarousel from "../components/ProductCarousel/ProductCarousel";
import { productsService } from "../services/products";
import { Product } from "../types";
import { HOME_EDITORIAL } from "../lib/images";
import styles from "./Home.module.scss";

const Home = () => {
  const [featured, setFeatured] = useState<Product[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      productsService.getAll({ featured: true, limit: 10 }),
      productsService.getAll({ limit: 8 }),
    ])
      .then(([featuredRes, allRes]) => {
        if (cancelled) return;
        setFeatured(featuredRes.data);
        setNewArrivals(allRes.data.filter((p) => p.isNew).slice(0, 8));
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, []);

  return (
    <div className={styles.home} data-testid="home-page">
      <SeoHead canonical="/" />
      <JsonLd
        id="organization"
        data={{
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: 'Makani Cosmétique',
          url: process.env.REACT_APP_SITE_URL ?? 'https://makani-cosmetique.com',
          logo: `${process.env.REACT_APP_SITE_URL ?? 'https://makani-cosmetique.com'}/logo512.png`,
          description:
            'Soins capillaires, soins de la peau et parfums orientaux pour la beauté afro et métissée.',
          contactPoint: {
            '@type': 'ContactPoint',
            email: 'contact@makani-cosmetique.com',
            telephone: '+33 7 66 33 12 26',
            contactType: 'customer support',
            availableLanguage: ['French'],
          },
          address: {
            '@type': 'PostalAddress',
            streetAddress: '142 Rue Henri Barbusse',
            postalCode: '93300',
            addressLocality: 'Aubervilliers',
            addressCountry: 'FR',
          },
        }}
      />
      <Hero />
      <Marquee />

      {!loading && featured.length > 0 && (
        <ProductCarousel
          issue="№ 03"
          eyebrow="L'édit de la communauté"
          title="Les coups de cœur"
          products={featured}
          ctaLabel="Tout l'édit"
          ctaTo="/collections"
          testId="bestsellers-carousel"
        />
      )}

      <CategoryGrid />

      <section className={styles.editorial}>
        <div className={styles.editorialInner}>
          <div className={styles.editorialMedia}>
            <img
              src={HOME_EDITORIAL}
              alt="Portrait beauté afro métissée"
            />
          </div>
          <div className={styles.editorialContent}>
            <span className={styles.editorialEyebrow}>Manifeste</span>
            <h2 className={styles.editorialTitle}>
              Pour des gestes <em>vrais</em>, pour des peaux <em>vraies</em>.
            </h2>
            <p>
              500 produits, 30 marques, une seule conviction&nbsp;: la beauté
              afro et métissée mérite une sélection rigoureuse, des
              formulations honnêtes, et un service qui vous regarde dans les
              yeux. Pas de mousse marketing — juste ce qui marche.
            </p>
            <a
              href="/collections"
              className={styles.editorialCta}
              data-testid="editorial-cta"
            >
              Lire la suite
            </a>
          </div>
        </div>
      </section>

      <ProcessSection />

      {!loading && newArrivals.length > 0 && (
        <ProductCarousel
          issue="№ 05"
          eyebrow="Arrivés cette semaine"
          title="Fraîchement édités"
          products={newArrivals}
          ctaLabel="Toute la boutique"
          ctaTo="/collections"
          testId="new-arrivals-carousel"
        />
      )}

      <BrandShowcase />
    </div>
  );
};

export default Home;
