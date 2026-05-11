import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle, AlertCircle, Copy, Check } from 'lucide-react';
import SeoHead from '../components/SeoHead/SeoHead';
import Spinner from '../components/Spinner/Spinner';
import { newsletterService } from '../services/newsletter';
import styles from './NewsletterConfirm.module.scss';

const NewsletterConfirm = () => {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const [state, setState] = useState<'loading' | 'success' | 'error'>('loading');
  const [promoCode, setPromoCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!token) { setState('error'); return; }
    newsletterService
      .confirm(token)
      .then((res) => {
        setPromoCode(res.promoCode);
        setState('success');
      })
      .catch(() => setState('error'));
  }, [token]);

  const copy = () => {
    if (!promoCode) return;
    navigator.clipboard.writeText(promoCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <>
      <SeoHead title="Confirmation newsletter" canonical="/newsletter/confirm" noindex />
      <div className={styles.page}>
        {state === 'loading' && <Spinner fullPage />}

        {state === 'success' && (
          <div className={styles.card}>
            <CheckCircle size={56} className={styles.successIcon} />
            <h1>Inscription confirmée !</h1>
            <p>Bienvenue dans la communauté Makani Cosmétique.</p>
            {promoCode && (
              <>
                <p className={styles.codeIntro}>Voici votre code <strong>-5%</strong> à utiliser sur votre prochaine commande :</p>
                <div className={styles.codeBox}>
                  <code>{promoCode}</code>
                  <button onClick={copy} type="button">
                    {copied ? <><Check size={14} /> Copié</> : <><Copy size={14} /> Copier</>}
                  </button>
                </div>
                <p className={styles.codeNote}>Valable 30 jours, à usage unique.</p>
              </>
            )}
            <div className={styles.actions}>
              <Link to="/collections" className={styles.btnPrimary}>Découvrir les produits</Link>
              <Link to="/" className={styles.btnSecondary}>Retour à l accueil</Link>
            </div>
          </div>
        )}

        {state === 'error' && (
          <div className={styles.card}>
            <AlertCircle size={56} className={styles.errorIcon} />
            <h1>Lien invalide ou expiré</h1>
            <p>
              Ce lien de confirmation n est plus valide. Inscrivez-vous à nouveau depuis le pied de page du site
              pour recevoir un nouveau lien.
            </p>
            <div className={styles.actions}>
              <Link to="/" className={styles.btnPrimary}>Retour à l accueil</Link>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default NewsletterConfirm;
