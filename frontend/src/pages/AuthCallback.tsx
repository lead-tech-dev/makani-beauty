import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/Spinner/Spinner';
import styles from './Login.module.scss';

const AuthCallback = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { loginWithToken } = useAuth();
  const [error, setError] = useState('');

  useEffect(() => {
    const token = params.get('token');
    const errParam = params.get('error');

    if (errParam) {
      setError(decodeURIComponent(errParam));
      return;
    }
    if (!token) {
      setError('Token de connexion manquant');
      return;
    }

    loginWithToken(token)
      .then(() => navigate('/account', { replace: true }))
      .catch(() => setError('Connexion échouée. Veuillez réessayer.'));
  }, [params, loginWithToken, navigate]);

  if (error) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <div className={styles.brand}>
            <Link to="/" className={styles.logo}>Makani Cosmétique</Link>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'inline-flex', width: 56, height: 56, borderRadius: '50%', background: '#fdf0ef', color: '#c0392b', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
              <AlertTriangle size={28} />
            </div>
            <h1 className={styles.title}>Connexion impossible</h1>
            <p className={styles.sub}>{error}</p>
            <Link to="/login" className={styles.link} style={{ display: 'inline-block', marginTop: '1rem' }}>
              ← Retour à la connexion
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <Spinner fullPage />
    </div>
  );
};

export default AuthCallback;
