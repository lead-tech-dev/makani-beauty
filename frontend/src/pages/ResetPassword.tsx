import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2, AlertTriangle } from 'lucide-react';
import { authService } from '../services/auth';
import styles from './Login.module.scss';

const schema = z.object({
  password: z.string().min(8, 'Minimum 8 caractères'),
  confirm: z.string(),
}).refine((d) => d.password === d.confirm, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirm'],
});
type FormData = z.infer<typeof schema>;

const ResetPassword = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token');
  const [apiError, setApiError] = useState('');
  const [success, setSuccess] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    if (!token) return;
    setApiError('');
    try {
      await authService.resetPassword(token, data.password);
      setSuccess(true);
      setTimeout(() => navigate('/login', { replace: true }), 2500);
    } catch (err: any) {
      setApiError(err?.response?.data?.message || 'Une erreur est survenue.');
    }
  };

  if (!token) {
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
            <h1 className={styles.title}>Lien invalide</h1>
            <p className={styles.sub}>Le lien de réinitialisation est manquant ou invalide.</p>
            <Link to="/forgot-password" className={styles.link} style={{ display: 'inline-block', marginTop: '1rem' }}>
              Demander un nouveau lien
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page} data-testid="reset-password-page">
      <div className={styles.card}>
        <div className={styles.brand}>
          <Link to="/" className={styles.logo}>Makani Cosmétique</Link>
        </div>

        {success ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'inline-flex', width: 56, height: 56, borderRadius: '50%', background: '#d1f0e0', color: '#0a6640', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
              <CheckCircle2 size={28} />
            </div>
            <h1 className={styles.title}>Mot de passe mis à jour</h1>
            <p className={styles.sub}>Vous allez être redirigé vers la connexion…</p>
          </div>
        ) : (
          <>
            <h1 className={styles.title}>Nouveau mot de passe</h1>
            <p className={styles.sub}>Choisissez un nouveau mot de passe pour votre compte.</p>

            <form onSubmit={handleSubmit(onSubmit)} className={styles.form} noValidate>
              <div className={styles.field}>
                <label htmlFor="password">Nouveau mot de passe</label>
                <input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  data-testid="reset-password"
                  {...register('password')}
                />
                {errors.password && <span className={styles.err}>{errors.password.message}</span>}
              </div>

              <div className={styles.field}>
                <label htmlFor="confirm">Confirmer le mot de passe</label>
                <input
                  id="confirm"
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  data-testid="reset-confirm"
                  {...register('confirm')}
                />
                {errors.confirm && <span className={styles.err}>{errors.confirm.message}</span>}
              </div>

              {apiError && <p className={styles.apiError} role="alert">{apiError}</p>}

              <button type="submit" className={styles.submit} disabled={isSubmitting} data-testid="reset-submit">
                {isSubmitting ? 'Mise à jour…' : 'Réinitialiser le mot de passe'}
              </button>
            </form>

            <p className={styles.footer}>
              <Link to="/login" className={styles.link}>← Retour à la connexion</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
