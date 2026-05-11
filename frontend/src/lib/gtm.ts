/**
 * Google Tag Manager bootstrap with Consent Mode v2.
 *
 * Loads gtag stub + default-deny consent BEFORE injecting the GTM container.
 * All marketing/analytics tags inside GTM should be configured with consent
 * categories — they automatically respect the consent state set here.
 *
 * Consent categories used:
 *   - analytics_storage    → analytics consent (GA4, Clarity, Hotjar)
 *   - ad_storage           → marketing consent (Meta Pixel, TikTok Pixel, Google Ads)
 *   - ad_user_data         → marketing consent
 *   - ad_personalization   → marketing consent
 *   - functionality_storage → always granted (necessary for the site to work)
 *   - security_storage     → always granted
 */

declare global {
  interface Window {
    dataLayer?: any[];
    gtag?: (...args: any[]) => void;
  }
}

let initialized = false;

const CONTAINER_ID = process.env.REACT_APP_GTM_CONTAINER_ID;

const dataLayer = (): any[] => {
  window.dataLayer = window.dataLayer ?? [];
  return window.dataLayer;
};

/**
 * Must run as early as possible (before GTM injection) so the consent state
 * is set when GTM evaluates tag triggers.
 */
const installGtagStub = () => {
  dataLayer();
  if (!window.gtag) {
    // eslint-disable-next-line prefer-rest-params
    window.gtag = function gtag() { window.dataLayer!.push(arguments); };
  }
};

const setDefaultConsent = () => {
  if (!window.gtag) return;
  // Default = denied for everything that requires consent.
  window.gtag('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'denied',
    functionality_storage: 'granted',
    security_storage: 'granted',
    wait_for_update: 500,
  });
};

const injectGtmScript = () => {
  if (!CONTAINER_ID) return;
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtm.js?id=${CONTAINER_ID}`;
  document.head.appendChild(script);

  // Standard GTM dataLayer init event
  dataLayer().push({ 'gtm.start': Date.now(), event: 'gtm.js' });

  // <noscript> fallback iframe — useful for users without JS, includes basic page views
  const noscript = document.createElement('noscript');
  noscript.innerHTML = `<iframe src="https://www.googletagmanager.com/ns.html?id=${CONTAINER_ID}" height="0" width="0" style="display:none;visibility:hidden"></iframe>`;
  document.body.insertBefore(noscript, document.body.firstChild);
};

/**
 * Bootstrap GTM. Call once from App.tsx on mount.
 * Idempotent — multiple calls are safe.
 */
export const initGtm = (): void => {
  if (initialized) return;
  initialized = true;
  installGtagStub();
  setDefaultConsent();
  if (CONTAINER_ID) {
    injectGtmScript();
  } else {
    // eslint-disable-next-line no-console
    console.info('[GTM] mock mode — set REACT_APP_GTM_CONTAINER_ID to enable');
  }
};

/**
 * Update consent state. Called by CookieConsentContext when the user
 * accepts/refuses or changes their preferences.
 */
export const updateConsent = (params: {
  analytics: boolean;
  marketing: boolean;
}): void => {
  if (!window.gtag) {
    installGtagStub();
  }
  window.gtag!('consent', 'update', {
    ad_storage: params.marketing ? 'granted' : 'denied',
    ad_user_data: params.marketing ? 'granted' : 'denied',
    ad_personalization: params.marketing ? 'granted' : 'denied',
    analytics_storage: params.analytics ? 'granted' : 'denied',
  });
};
