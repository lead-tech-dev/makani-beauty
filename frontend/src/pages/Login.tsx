import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '../context/AuthContext';
import GoogleButton from '../components/GoogleButton/GoogleButton';
import SeoHead from '../components/SeoHead/SeoHead';
import { trackLogin } from '../lib/analytics';
import styles from './Login.module.scss';

const schema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
});
type FormData = z.infer<typeof schema>;

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname || '/';
  const [apiError, setApiError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setApiError('');
    try {
      await login(data.email, data.password);
      trackLogin('password');
      navigate(from, { replace: true });
    } catch {
      setApiError('Email ou mot de passe incorrect.');
    }
  };

  return (
    <div className={styles.page} data-testid="login-page">
      <SeoHead title="Connexion" canonical="/login" noindex />
      <div className={styles.card}>
        <div className={styles.brand}>
          <Link to="/" className={styles.logo}>Makani Cosmétique</Link>
        </div>

        <h1 className={styles.title}>Connexion</h1>
        <p className={styles.sub}>Bienvenue ! Connectez-vous à votre compte.</p>

        <form onSubmit={handleSubmit(onSubmit)} className={styles.form} noValidate>
          <div className={styles.field}>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="marie@example.com"
              data-testid="login-email"
              {...register('email')}
            />
            {errors.email && <span className={styles.err}>{errors.email.message}</span>}
          </div>

          <div className={styles.field}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <label htmlFor="password">Mot de passe</label>
              <Link to="/forgot-password" className={styles.link} style={{ fontSize: '0.78rem' }}>
                Mot de passe oublié ?
              </Link>
            </div>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              data-testid="login-password"
              {...register('password')}
            />
            {errors.password && <span className={styles.err}>{errors.password.message}</span>}
          </div>

          {apiError && <p className={styles.apiError} role="alert">{apiError}</p>}

          <button
            type="submit"
            className={styles.submit}
            disabled={isSubmitting}
            data-testid="login-submit"
          >
            {isSubmitting ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>

        <div className={styles.divider}>ou</div>
        <GoogleButton label="Se connecter avec Google" />

        <p className={styles.footer}>
          Pas encore de compte ?{' '}
          <Link to="/register" className={styles.link}>Créer un compte</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
