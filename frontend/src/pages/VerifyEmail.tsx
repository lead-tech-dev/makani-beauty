import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, AlertTriangle } from 'lucide-react';
import { authService } from '../services/auth';
import Spinner from '../components/Spinner/Spinner';
import styles from './Login.module.scss';

const VerifyEmail = () => {
  const [params] = useSearchParams();
  const token = params.get('token');
  const [state, setState] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) { setState('error'); setError('Lien de vérification manquant'); return; }
    authService.verifyEmail(token)
      .then(() => setState('success'))
      .catch((err) => {
        setState('error');
        setError(err?.response?.data?.message || 'Une erreur est survenue.');
      });
  }, [token]);

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.brand}>
          <Link to="/" className={styles.logo}>Makani Cosmétique</Link>
        </div>

        {state === 'loading' && <Spinner />}

        {state === 'success' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'inline-flex', width: 56, height: 56, borderRadius: '50%', background: '#d1f0e0', color: '#0a6640', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
              <CheckCircle2 size={28} />
            </div>
            <h1 className={styles.title}>Email vérifié !</h1>
            <p className={styles.sub}>Votre adresse email est maintenant confirmée. Vous pouvez accéder à toutes les fonctionnalités de votre compte.</p>
            <Link to="/account" className={styles.link} style={{ display: 'inline-block', marginTop: '1rem' }}>
              Aller à mon compte →
            </Link>
          </div>
        )}

        {state === 'error' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'inline-flex', width: 56, height: 56, borderRadius: '50%', background: '#fdf0ef', color: '#c0392b', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
              <AlertTriangle size={28} />
            </div>
            <h1 className={styles.title}>Vérification impossible</h1>
            <p className={styles.sub}>{error}</p>
            <Link to="/account" className={styles.link} style={{ display: 'inline-block', marginTop: '1rem' }}>
              ← Retour à mon compte
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
