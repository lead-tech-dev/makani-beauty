/**
 * Sentry initialization for the frontend.
 *
 * Loaded once from index.tsx (or App on first mount).
 * Mock mode (no-op) when REACT_APP_SENTRY_DSN is not set.
 */
import * as Sentry from '@sentry/react';

let initialized = false;

export const initSentry = (): void => {
  if (initialized) return;
  const dsn = process.env.REACT_APP_SENTRY_DSN;
  if (!dsn) return;
  initialized = true;

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV ?? 'development',
    release: process.env.REACT_APP_SENTRY_RELEASE ?? undefined,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: false,
      }),
    ],
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    replaysSessionSampleRate: 0, // no random session replay (privacy)
    replaysOnErrorSampleRate: 1.0, // record only when an error occurs
    beforeSend(event) {
      // Drop known noisy errors (browser extensions, network blips)
      const msg = event.message ?? event.exception?.values?.[0]?.value ?? '';
      if (/ResizeObserver loop/.test(msg)) return null;
      if (/Network Error|Failed to fetch/.test(msg)) return null;
      return event;
    },
  });
};

export const setSentryUser = (user: { id: string; email?: string } | null): void => {
  if (!initialized) return;
  Sentry.setUser(user ? { id: user.id } : null); // no email — privacy
};

export const SentryErrorBoundary = Sentry.ErrorBoundary;
