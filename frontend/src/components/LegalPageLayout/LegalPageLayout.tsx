import { ReactNode, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import styles from './LegalPageLayout.module.scss';

export interface TocItem {
  id: string;
  label: string;
}

interface Props {
  title: string;
  /** ISO date string ("2026-05-04"). Displayed as "Dernière mise à jour : 4 mai 2026". */
  lastUpdated: string;
  /** Optional intro paragraph below the title. */
  intro?: ReactNode;
  /** Sections list — each section in `children` should have a matching <section id={item.id}>. */
  toc: TocItem[];
  children: ReactNode;
}

const LegalPageLayout = ({ title, lastUpdated, intro, toc, children }: Props) => {
  const [activeId, setActiveId] = useState<string | null>(toc[0]?.id ?? null);

  useEffect(() => {
    // Highlight the section currently in view via IntersectionObserver.
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActiveId(visible.target.id);
      },
      { rootMargin: '-30% 0px -60% 0px', threshold: [0.1, 0.5, 1] },
    );
    toc.forEach((item) => {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [toc]);

  const formattedDate = new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric',
  }).format(new Date(lastUpdated));

  return (
    <div className={styles.page}>
      <nav className={styles.breadcrumb} aria-label="Fil d'Ariane">
        <Link to="/">Accueil</Link>
        <ChevronRight size={14} />
        <span>{title}</span>
      </nav>

      <div className={styles.layout}>
        <aside className={styles.sidebar}>
          <h2 className={styles.tocTitle}>Sommaire</h2>
          <ol className={styles.tocList}>
            {toc.map((item) => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  className={`${styles.tocLink} ${activeId === item.id ? styles.tocLinkActive : ''}`}
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ol>
        </aside>

        <article className={styles.content}>
          <header className={styles.header}>
            <h1 className={styles.title}>{title}</h1>
            <p className={styles.lastUpdated}>
              Dernière mise à jour : {formattedDate}
            </p>
            {intro && <div className={styles.intro}>{intro}</div>}
          </header>
          {children}
        </article>
      </div>
    </div>
  );
};

export default LegalPageLayout;
