import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { updateConsent as updateGtmConsent } from '../lib/gtm';

export type CookieCategory = 'necessary' | 'analytics' | 'marketing';

export interface CookieConsent {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
  decidedAt: string;
  version: number;
}

const STORAGE_KEY = 'fb-cookie-consent';
const CURRENT_VERSION = 1;

interface ContextValue {
  consent: CookieConsent | null;
  bannerVisible: boolean;
  preferencesOpen: boolean;
  acceptAll: () => void;
  rejectAll: () => void;
  savePreferences: (prefs: { analytics: boolean; marketing: boolean }) => void;
  openPreferences: () => void;
  closePreferences: () => void;
  isAccepted: (category: CookieCategory) => boolean;
}

const CookieConsentContext = createContext<ContextValue | null>(null);

const readStored = (): CookieConsent | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CookieConsent;
    if (parsed.version !== CURRENT_VERSION) return null;
    return parsed;
  } catch {
    return null;
  }
};

const writeStored = (consent: CookieConsent) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(consent));
};

export const CookieConsentProvider = ({ children }: { children: React.ReactNode }) => {
  const [consent, setConsent] = useState<CookieConsent | null>(() => readStored());
  const [preferencesOpen, setPreferencesOpen] = useState(false);

  useEffect(() => {
    if (consent) {
      writeStored(consent);
      updateGtmConsent({ analytics: consent.analytics, marketing: consent.marketing });
    }
  }, [consent]);

  // Sync the persisted consent on first load (in case the user already decided
  // in a prior session — GTM was loaded with default-deny but should now match).
  useEffect(() => {
    if (consent) updateGtmConsent({ analytics: consent.analytics, marketing: consent.marketing });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const persist = useCallback((analytics: boolean, marketing: boolean) => {
    const next: CookieConsent = {
      necessary: true,
      analytics,
      marketing,
      decidedAt: new Date().toISOString(),
      version: CURRENT_VERSION,
    };
    setConsent(next);
    setPreferencesOpen(false);
  }, []);

  const value = useMemo<ContextValue>(() => ({
    consent,
    bannerVisible: consent === null,
    preferencesOpen,
    acceptAll: () => persist(true, true),
    rejectAll: () => persist(false, false),
    savePreferences: ({ analytics, marketing }) => persist(analytics, marketing),
    openPreferences: () => setPreferencesOpen(true),
    closePreferences: () => setPreferencesOpen(false),
    isAccepted: (category) => {
      if (category === 'necessary') return true;
      return Boolean(consent?.[category]);
    },
  }), [consent, preferencesOpen, persist]);

  return (
    <CookieConsentContext.Provider value={value}>{children}</CookieConsentContext.Provider>
  );
};

export const useCookieConsent = () => {
  const ctx = useContext(CookieConsentContext);
  if (!ctx) throw new Error('useCookieConsent must be used within CookieConsentProvider');
  return ctx;
};
