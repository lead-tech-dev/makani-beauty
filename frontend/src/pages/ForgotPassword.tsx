import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, MailCheck } from 'lucide-react';
import { authService } from '../services/auth';
import Captcha from '../components/Captcha/Captcha';
import styles from './Login.module.scss';

const schema = z.object({
  email: z.string().email('Email invalide'),
});
type FormData = z.infer<typeof schema>;

const ForgotPassword = () => {
  const [submitted, setSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaError, setCaptchaError] = useState('');
  const onCaptcha = useCallback((token: string | null) => setCaptchaToken(token), []);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    if (!captchaToken) {
      setCaptchaError('Veuillez compléter le captcha avant de valider.');
      return;
    }
    setCaptchaError('');
    try {
      await authService.forgotPassword(data.email, captchaToken);
    } finally {
      // Always show success — don't leak whether email exists
      setSubmittedEmail(data.email);
      setSubmitted(true);
    }
  };

  return (
    <div className={styles.page} data-testid="forgot-password-page">
      <div className={styles.card}>
        <div className={styles.brand}>
          <Link to="/" className={styles.logo}>Makani Cosmétique</Link>
        </div>

        {submitted ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'inline-flex', width: 56, height: 56, borderRadius: '50%', background: '#d4ede6', color: '#C44D3A', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
              <MailCheck size={28} />
            </div>
            <h1 className={styles.title}>Vérifiez votre boîte mail</h1>
            <p className={styles.sub}>
              Si un compte est associé à <strong>{submittedEmail}</strong>, vous allez recevoir un lien pour réinitialiser votre mot de passe d'ici quelques minutes.
            </p>
            <p className={styles.sub} style={{ marginTop: '0.75rem', fontSize: '0.82rem' }}>
              Le lien est valable 1 heure. Pensez à vérifier vos spams.
            </p>
            <Link
              to="/login"
              className={styles.link}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', marginTop: '1.5rem' }}
            >
              <ArrowLeft size={14} /> Retour à la connexion
            </Link>
          </div>
        ) : (
          <>
            <h1 className={styles.title}>Mot de passe oublié ?</h1>
            <p className={styles.sub}>Saisissez votre email — nous vous enverrons un lien pour le réinitialiser.</p>

            <form onSubmit={handleSubmit(onSubmit)} className={styles.form} noValidate>
              <div className={styles.field}>
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="marie@example.com"
                  data-testid="forgot-email"
                  {...register('email')}
                />
                {errors.email && <span className={styles.err}>{errors.email.message}</span>}
              </div>

              <Captcha onVerify={onCaptcha} />

              {captchaError && <span className={styles.err}>{captchaError}</span>}

              <button
                type="submit"
                className={styles.submit}
                disabled={isSubmitting}
                data-testid="forgot-submit"
              >
                {isSubmitting ? 'Envoi…' : 'Envoyer le lien'}
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

export default ForgotPassword;
