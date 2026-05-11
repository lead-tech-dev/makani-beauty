import { useEffect, useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import styles from './WhatsAppButton.module.scss';

const PHONE = process.env.REACT_APP_WHATSAPP_NUMBER ?? '33766331226';
const DEFAULT_MESSAGE = process.env.REACT_APP_WHATSAPP_DEFAULT_MESSAGE
  ?? 'Bonjour, j\'aimerais avoir des conseils sur vos produits Makani Cosmétique';

const STORAGE_KEY = 'mb-wa-prompt-dismissed';
const PROMPT_DELAY_MS = 12_000;

const buildHref = () => {
  const text = encodeURIComponent(DEFAULT_MESSAGE);
  return `https://wa.me/${PHONE.replace(/\D/g, '')}?text=${text}`;
};

const WhatsAppButton = () => {
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(STORAGE_KEY) === '1') return;
    const t = setTimeout(() => setShowPrompt(true), PROMPT_DELAY_MS);
    return () => clearTimeout(t);
  }, []);

  const dismissPrompt = () => {
    setShowPrompt(false);
    sessionStorage.setItem(STORAGE_KEY, '1');
  };

  const onCtaClick = () => {
    dismissPrompt();
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'whatsapp_click', { event_category: 'engagement' });
    }
  };

  return (
    <div className={styles.wrap} aria-live="polite">
      {showPrompt && (
        <div className={styles.prompt} role="dialog" aria-label="Discuter sur WhatsApp">
          <button type="button" className={styles.close} onClick={dismissPrompt} aria-label="Fermer">
            <X size={14} />
          </button>
          <strong>Une question ?</strong>
          <span>Notre équipe répond sur WhatsApp en moins de 5 min.</span>
        </div>
      )}
      <a
        href={buildHref()}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.fab}
        aria-label="Discuter avec un conseiller sur WhatsApp"
        onClick={onCtaClick}
        data-testid="whatsapp-fab"
      >
        <MessageCircle size={24} />
      </a>
    </div>
  );
};

export default WhatsAppButton;
