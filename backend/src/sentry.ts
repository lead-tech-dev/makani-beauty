/**
 * Sentry initialization for the backend.
 *
 * MUST be imported as the very first thing in main.ts so the
 * instrumentation hooks attach before any other module loads.
 *
 * Mock mode (no-op) when SENTRY_DSN is not set.
 */
import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

const dsn = process.env.SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV ?? 'development',
    release: process.env.SENTRY_RELEASE ?? undefined,
    integrations: [nodeProfilingIntegration()],
    // Performance monitoring — sample 10% of transactions in prod, 100% in dev/staging
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    // Only send errors that are actually unhandled — drop noisy validation errors
    beforeSend(event, hint) {
      const err: any = hint.originalException;
      if (err?.status >= 400 && err?.status < 500) return null; // skip 4xx
      return event;
    },
  });
}

export { Sentry };
