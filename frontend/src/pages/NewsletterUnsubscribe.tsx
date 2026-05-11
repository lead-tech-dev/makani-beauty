import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle, AlertCircle } from 'lucide-react';
import SeoHead from '../components/SeoHead/SeoHead';
import Spinner from '../components/Spinner/Spinner';
import { newsletterService } from '../services/newsletter';
import styles from './NewsletterConfirm.module.scss';

const NewsletterUnsubscribe = () => {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const [state, setState] = useState<'loading' | 'success' | 'error'>('loading');
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    if (!token) { setState('error'); return; }
    newsletterService
      .unsubscribe(token)
      .then((res) => { setEmail(res.email); setState('success'); })
      .catch(() => setState('error'));
  }, [token]);

  return (
    <>
      <SeoHead title="Désinscription newsletter" canonical="/newsletter/unsubscribe" noindex />
      <div className={styles.page}>
        {state === 'loading' && <Spinner fullPage />}

        {state === 'success' && (
          <div className={styles.card}>
            <CheckCircle size={56} className={styles.successIcon} />
            <h1>Désinscription confirmée</h1>
            <p>{email ? <>L adresse <strong>{email}</strong> a été retirée</> : 'Votre adresse a été retirée'} de notre liste de diffusion.</p>
            <p className={styles.codeNote}>Vous ne recevrez plus d emails marketing. Les emails transactionnels (commandes, factures) restent envoyés.</p>
            <div className={styles.actions}>
              <Link to="/" className={styles.btnPrimary}>Retour à l accueil</Link>
            </div>
          </div>
        )}

        {state === 'error' && (
          <div className={styles.card}>
            <AlertCircle size={56} className={styles.errorIcon} />
            <h1>Lien invalide</h1>
            <p>Ce lien de désinscription n est plus valide. Si vous souhaitez vous désinscrire, contactez-nous à contact@makani-cosmetique.com.</p>
            <div className={styles.actions}>
              <Link to="/" className={styles.btnPrimary}>Retour à l accueil</Link>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default NewsletterUnsubscribe;
