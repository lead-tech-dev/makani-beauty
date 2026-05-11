import { loadStripe, Stripe } from '@stripe/stripe-js';

// Cache the Stripe.js instance per publishable key — Stripe recommends a single
// instance per page lifecycle.
const cache = new Map<string, Promise<Stripe | null>>();

export function getStripe(publishableKey: string): Promise<Stripe | null> {
  let p = cache.get(publishableKey);
  if (!p) {
    p = loadStripe(publishableKey);
    cache.set(publishableKey, p);
  }
  return p;
}
