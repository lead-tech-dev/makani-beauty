import { useState } from 'react';
import { MailWarning, MailCheck, Send } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/auth';
import RgpdSection from '../components/RgpdSection/RgpdSection';
import styles from './AccountProfile.module.scss';

const AccountProfile = () => {
  const { user } = useAuth();
  const [resendState, setResendState] = useState<'idle' | 'sending' | 'sent'>('idle');

  if (!user) return null;

  const resend = async () => {
    setResendState('sending');
    try {
      await authService.resendVerification(user.email);
      setResendState('sent');
    } catch {
      setResendState('idle');
    }
  };

  return (
    <>
      {!user.emailVerified && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.75rem',
          background: '#fef3cd', border: '1px solid #f5d272',
          borderRadius: '12px', padding: '1rem 1.25rem', marginBottom: '1.5rem',
          color: '#856404',
        }}>
          <MailWarning size={20} style={{ flexShrink: 0 }} />
          <div style={{ flex: 1, fontSize: '0.88rem', lineHeight: 1.4 }}>
            <strong>Confirmez votre adresse email.</strong> Un lien vous a été envoyé à {user.email}.
          </div>
          {resendState === 'sent' ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.82rem', fontWeight: 600 }}>
              <MailCheck size={14} /> Envoyé
            </span>
          ) : (
            <button
              onClick={resend}
              disabled={resendState === 'sending'}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                background: '#856404', color: '#fff', border: 'none',
                borderRadius: '6px', padding: '0.4rem 0.85rem',
                fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
              }}
            >
              <Send size={12} /> {resendState === 'sending' ? 'Envoi…' : 'Renvoyer'}
            </button>
          )}
        </div>
      )}

    <section className={styles.card}>
      <header className={styles.header}>
        <h1 className={styles.title}>Bonjour, {user.fullName.split(' ')[0]}</h1>
        <p className={styles.sub}>Vos informations personnelles.</p>
      </header>

      <dl className={styles.info}>
        <div className={styles.row}>
          <dt>Nom complet</dt>
          <dd>{user.fullName}</dd>
        </div>
        <div className={styles.row}>
          <dt>Email</dt>
          <dd>{user.email}</dd>
        </div>
        <div className={styles.row}>
          <dt>Téléphone</dt>
          <dd>{user.phone || <span className={styles.muted}>—</span>}</dd>
        </div>
        <div className={styles.row}>
          <dt>Rôle</dt>
          <dd className={styles.role}>{user.role}</dd>
        </div>
        <div className={styles.row}>
          <dt>Membre depuis</dt>
          <dd>
            {new Date(user.createdAt).toLocaleDateString('fr-FR', {
              day: 'numeric', month: 'long', year: 'numeric',
            })}
          </dd>
        </div>
      </dl>
    </section>

    <RgpdSection />
    </>
  );
};

export default AccountProfile;
