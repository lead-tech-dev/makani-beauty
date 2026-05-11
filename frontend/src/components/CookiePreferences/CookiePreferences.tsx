import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useCookieConsent } from '../../context/CookieConsentContext';
import styles from './CookiePreferences.module.scss';

interface CategoryDef {
  key: 'necessary' | 'analytics' | 'marketing';
  title: string;
  description: string;
  examples: string;
  required?: boolean;
}

const CATEGORIES: CategoryDef[] = [
  {
    key: 'necessary',
    title: 'Cookies strictement nécessaires',
    description:
      'Indispensables au fonctionnement du site : connexion, panier, sécurité. Ils ne peuvent pas être désactivés.',
    examples: 'Session, JWT, panier, préférences de langue',
    required: true,
  },
  {
    key: 'analytics',
    title: 'Mesure d audience',
    description:
      'Nous aident à comprendre comment vous utilisez le site (pages visitées, durée, parcours) afin de l améliorer. Données anonymisées.',
    examples: 'Plausible, Matomo (en cas d activation)',
  },
  {
    key: 'marketing',
    title: 'Marketing & personnalisation',
    description:
      'Permettent d afficher des contenus et publicités adaptés à vos centres d intérêt sur d autres sites.',
    examples: 'Pixel Meta, Google Ads (en cas d activation)',
  },
];

const CookiePreferences = () => {
  const { consent, savePreferences, closePreferences } = useCookieConsent();
  const [analytics, setAnalytics] = useState(consent?.analytics ?? false);
  const [marketing, setMarketing] = useState(consent?.marketing ?? false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closePreferences();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [closePreferences]);

  return (
    <div className={styles.overlay} onClick={closePreferences} role="dialog" aria-modal="true">
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <header className={styles.header}>
          <h2>Préférences cookies</h2>
          <button type="button" className={styles.close} onClick={closePreferences} aria-label="Fermer">
            <X size={18} />
          </button>
        </header>

        <p className={styles.intro}>
          Vous pouvez à tout moment modifier ces préférences depuis le lien « Gérer les cookies » en bas de page.
        </p>

        <ul className={styles.list}>
          {CATEGORIES.map((cat) => {
            const enabled = cat.key === 'necessary' ? true : cat.key === 'analytics' ? analytics : marketing;
            const onToggle = () => {
              if (cat.required) return;
              if (cat.key === 'analytics') setAnalytics(!analytics);
              if (cat.key === 'marketing') setMarketing(!marketing);
            };
            return (
              <li key={cat.key} className={styles.item}>
                <div className={styles.itemHeader}>
                  <div>
                    <strong>{cat.title}</strong>
                    {cat.required && <span className={styles.badge}>Toujours actif</span>}
                  </div>
                  <button
                    type="button"
                    className={`${styles.toggle} ${enabled ? styles.on : ''} ${cat.required ? styles.disabled : ''}`}
                    onClick={onToggle}
                    aria-pressed={enabled}
                    aria-label={`Activer ${cat.title}`}
                    disabled={cat.required}
                  >
                    <span className={styles.knob} />
                  </button>
                </div>
                <p className={styles.desc}>{cat.description}</p>
                <p className={styles.examples}><em>Exemples :</em> {cat.examples}</p>
              </li>
            );
          })}
        </ul>

        <footer className={styles.footer}>
          <button
            type="button"
            className={styles.secondary}
            onClick={() => savePreferences({ analytics: false, marketing: false })}
          >
            Tout refuser
          </button>
          <button
            type="button"
            className={styles.primary}
            onClick={() => savePreferences({ analytics, marketing })}
          >
            Enregistrer mes choix
          </button>
        </footer>
      </div>
    </div>
  );
};

export default CookiePreferences;
