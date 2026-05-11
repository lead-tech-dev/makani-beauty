import { useEffect, useRef, useState } from 'react';
import api from '../../lib/api';

declare global {
  interface Window {
    hcaptcha?: {
      render: (
        container: HTMLElement,
        opts: { sitekey: string; theme?: 'light' | 'dark'; callback: (token: string) => void; 'expired-callback'?: () => void; 'error-callback'?: () => void },
      ) => string;
      reset: (id?: string) => void;
      execute: (id?: string) => void;
    };
  }
}

const HCAPTCHA_SCRIPT_ID = 'hcaptcha-script';
const HCAPTCHA_SCRIPT_URL = 'https://js.hcaptcha.com/1/api.js?render=explicit&hl=fr';

type CaptchaConfig = { siteKey: string | null; enabled: boolean };

let cachedConfig: CaptchaConfig | null = null;
let configPromise: Promise<CaptchaConfig> | null = null;

const fetchConfig = (): Promise<CaptchaConfig> => {
  if (cachedConfig) return Promise.resolve(cachedConfig);
  if (configPromise) return configPromise;
  configPromise = api
    .get<CaptchaConfig>('/captcha/site-key')
    .then((res) => {
      cachedConfig = res.data;
      return res.data;
    })
    .catch(() => ({ siteKey: null, enabled: false }));
  return configPromise;
};

const loadScript = (): Promise<void> => {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.hcaptcha) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.getElementById(HCAPTCHA_SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('hCaptcha script load failed')));
      return;
    }
    const s = document.createElement('script');
    s.id = HCAPTCHA_SCRIPT_ID;
    s.src = HCAPTCHA_SCRIPT_URL;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('hCaptcha script load failed'));
    document.head.appendChild(s);
  });
};

interface CaptchaProps {
  onVerify: (token: string | null) => void;
  theme?: 'light' | 'dark';
}

const Captcha = ({ onVerify, theme = 'light' }: CaptchaProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchConfig().then((cfg) => {
      if (cancelled) return;
      if (!cfg.enabled || !cfg.siteKey) {
        // Mock mode — backend disabled, signal "ok" so the form proceeds.
        onVerify('mock');
        return;
      }
      setEnabled(true);
      loadScript()
        .then(() => {
          if (cancelled || !containerRef.current || !window.hcaptcha) return;
          widgetIdRef.current = window.hcaptcha.render(containerRef.current, {
            sitekey: cfg.siteKey!,
            theme,
            callback: (token) => onVerify(token),
            'expired-callback': () => onVerify(null),
            'error-callback': () => onVerify(null),
          });
        })
        .catch(() => {
          // Script failed — fail open so legitimate users aren't blocked.
          onVerify('mock');
        });
    });
    return () => {
      cancelled = true;
    };
  }, [onVerify, theme]);

  if (!enabled) return null;
  return <div ref={containerRef} />;
};

export default Captcha;
