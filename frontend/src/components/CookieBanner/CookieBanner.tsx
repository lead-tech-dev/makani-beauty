import { Link } from 'react-router-dom';
import { Cookie } from 'lucide-react';
import { useCookieConsent } from '../../context/CookieConsentContext';
import CookiePreferences from '../CookiePreferences/CookiePreferences';
import styles from './CookieBanner.module.scss';

const CookieBanner = () => {
  const { bannerVisible, preferencesOpen, acceptAll, rejectAll, openPreferences } = useCookieConsent();

  return (
    <>
      {bannerVisible && (
        <div className={styles.banner} role="dialog" aria-live="polite" aria-label="Consentement aux cookies">
          <div className={styles.inner}>
            <div className={styles.icon}><Cookie size={20} /></div>
            <div className={styles.text}>
              <strong>Vos préférences cookies</strong>
              <p>
                Nous utilisons des cookies pour faire fonctionner le site, mesurer son audience et améliorer votre
                expérience. Les cookies non essentiels nécessitent votre accord.{' '}
                <Link to="/confidentialite">En savoir plus</Link>
              </p>
            </div>
            <div className={styles.actions}>
              <button type="button" className={styles.linkBtn} onClick={openPreferences}>
                Personnaliser
              </button>
              <button type="button" className={styles.secondary} onClick={rejectAll}>
                Tout refuser
              </button>
              <button type="button" className={styles.primary} onClick={acceptAll}>
                Tout accepter
              </button>
            </div>
          </div>
        </div>
      )}
      {preferencesOpen && <CookiePreferences />}
    </>
  );
};

export default CookieBanner;
