/**
 * Microsoft Clarity helpers.
 *
 * The Clarity script itself is loaded by GTM (built-in "Microsoft Clarity" tag
 * template). This file provides typed wrappers around `window.clarity()` for
 * custom events, user identification, and session tagging.
 *
 * No-op safe: when Clarity hasn't been loaded yet (no GTM container, consent
 * denied, or running on the server), all calls silently return.
 *
 * RGPD note: Clarity auto-masks all form `<input type="password">` and any
 * element with `data-clarity-mask="true"`. Use that attribute on sensitive
 * fields like address line 1, phone numbers, etc. Email fields are auto-masked.
 */

declare global {
  interface Window {
    clarity?: (...args: any[]) => void;
  }
}

const isReady = (): boolean =>
  typeof window !== 'undefined' && typeof window.clarity === 'function';

/**
 * Tag the current session with a custom event. Useful for filtering sessions
 * in the Clarity dashboard (e.g. "show me only sessions where users purchased").
 */
export const trackClarityEvent = (name: string): void => {
  if (!isReady()) return;
  try {
    window.clarity!('event', name);
  } catch {
    /* no-op */
  }
};

/**
 * Set a custom variable on the session. Surfaces as a filter in the Clarity
 * dashboard. Common uses:
 *   - setClarityVar('user_tier', 'gold')
 *   - setClarityVar('order_value', '49.90')
 *   - setClarityVar('cart_items', String(count))
 */
export const setClarityVar = (key: string, value: string): void => {
  if (!isReady()) return;
  try {
    window.clarity!('set', key, value);
  } catch {
    /* no-op */
  }
};

/**
 * Identify the user. The `userId` is hashed by Clarity automatically.
 * `friendlyName` is optional and helps you find sessions by name in the dashboard.
 */
export const identifyClarityUser = (userId: string, friendlyName?: string): void => {
  if (!isReady()) return;
  try {
    // Signature: clarity('identify', user_id, [session_id], [page_id], [friendly_name])
    window.clarity!('identify', userId, undefined, undefined, friendlyName);
  } catch {
    /* no-op */
  }
};

/**
 * Mark the current session as one to prioritise in the upgrade buffer.
 * Useful for high-value sessions (large orders, errors observed, etc.).
 */
export const upgradeClaritySession = (reason: string): void => {
  if (!isReady()) return;
  try {
    window.clarity!('upgrade', reason);
  } catch {
    /* no-op */
  }
};
