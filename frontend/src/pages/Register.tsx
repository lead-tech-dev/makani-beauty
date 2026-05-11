import { useCallback, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '../context/AuthContext';
import GoogleButton from '../components/GoogleButton/GoogleButton';
import SeoHead from '../components/SeoHead/SeoHead';
import Captcha from '../components/Captcha/Captcha';
import { trackSignUp } from '../lib/analytics';
import { trackClarityEvent } from '../lib/clarity';
import styles from './Login.module.scss';

const schema = z.object({
  fullName: z.string().min(2, 'Nom complet requis'),
  email: z.string().email('Email invalide'),
  password: z.string().min(8, 'Minimum 8 caractères'),
  confirm: z.string(),
  phone: z.string().optional(),
}).refine((d) => d.password === d.confirm, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirm'],
});
type FormData = z.infer<typeof schema>;

const Register = () => {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [apiError, setApiError] = useState('');
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const onCaptcha = useCallback((token: string | null) => setCaptchaToken(token), []);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setApiError('');
    if (!captchaToken) {
      setApiError('Veuillez compléter le captcha avant de valider.');
      return;
    }
    try {
      await registerUser(data.fullName, data.email, data.password, data.phone, captchaToken);
      trackSignUp('password');
      trackClarityEvent('signup');
      navigate('/account', { replace: true });
    } catch (err: any) {
      setApiError(err?.response?.data?.message || 'Une erreur est survenue.');
    }
  };

  return (
    <div className={styles.page} data-testid="register-page">
      <SeoHead title="Créer un compte" canonical="/register" noindex />
      <div className={styles.card}>
        <div className={styles.brand}>
          <Link to="/" className={styles.logo}>Makani Cosmétique</Link>
        </div>

        <h1 className={styles.title}>Créer un compte</h1>
        <p className={styles.sub}>Rejoignez la communauté Makani Cosmétique.</p>

        <form onSubmit={handleSubmit(onSubmit)} className={styles.form} noValidate>
          <div className={styles.field}>
            <label htmlFor="fullName">Nom complet</label>
            <input id="fullName" type="text" placeholder="Marie Dupont" data-testid="register-fullname" {...register('fullName')} />
            {errors.fullName && <span className={styles.err}>{errors.fullName.message}</span>}
          </div>

          <div className={styles.field}>
            <label htmlFor="email">Email</label>
            <input id="email" type="email" autoComplete="email" placeholder="marie@example.com" data-testid="register-email" {...register('email')} />
            {errors.email && <span className={styles.err}>{errors.email.message}</span>}
          </div>

          <div className={styles.field}>
            <label htmlFor="phone">Téléphone (optionnel)</label>
            <input id="phone" type="tel" placeholder="+33 6 12 34 56 78" {...register('phone')} />
          </div>

          <div className={styles.field}>
            <label htmlFor="password">Mot de passe</label>
            <input id="password" type="password" autoComplete="new-password" placeholder="••••••••" data-testid="register-password" {...register('password')} />
            {errors.password && <span className={styles.err}>{errors.password.message}</span>}
          </div>

          <div className={styles.field}>
            <label htmlFor="confirm">Confirmer le mot de passe</label>
            <input id="confirm" type="password" autoComplete="new-password" placeholder="••••••••" data-testid="register-confirm" {...register('confirm')} />
            {errors.confirm && <span className={styles.err}>{errors.confirm.message}</span>}
          </div>

          <Captcha onVerify={onCaptcha} />

          {apiError && <p className={styles.apiError} role="alert">{apiError}</p>}

          <button type="submit" className={styles.submit} disabled={isSubmitting} data-testid="register-submit">
            {isSubmitting ? 'Création…' : 'Créer mon compte'}
          </button>
        </form>

        <div className={styles.divider}>ou</div>
        <GoogleButton label="S'inscrire avec Google" />

        <p className={styles.footer}>
          Déjà un compte ?{' '}
          <Link to="/login" className={styles.link}>Se connecter</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
