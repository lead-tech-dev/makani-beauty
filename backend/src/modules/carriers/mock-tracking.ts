import { TrackingStatus, ShipmentStatus } from './carrier.types';

/**
 * Deterministic mock progression based on time elapsed since shipment.
 * Used by all carriers when running in mock mode so the cron poller can show
 * meaningful timeline events while testing.
 *
 *   < 1 h    : pre_transit       — "Étiquette créée, en attente de collecte"
 *   < 6 h    : in_transit        — "Pris en charge par le transporteur"
 *   < 24 h   : in_transit        — "En cours d acheminement"
 *   < 36 h   : out_for_delivery  — "En cours de livraison"
 *   ≥ 36 h   : delivered         — "Livré"
 */
export function buildMockTrackingStatus(shippedAt?: Date): TrackingStatus {
  const ageHours = shippedAt ? (Date.now() - shippedAt.getTime()) / 3_600_000 : 0;

  let status: ShipmentStatus;
  let message: string;
  if (ageHours < 1) {
    status = 'pre_transit';
    message = 'Étiquette créée — en attente de collecte';
  } else if (ageHours < 6) {
    status = 'in_transit';
    message = 'Pris en charge par le transporteur';
  } else if (ageHours < 24) {
    status = 'in_transit';
    message = 'En cours d acheminement';
  } else if (ageHours < 36) {
    status = 'out_for_delivery';
    message = 'En cours de livraison';
  } else {
    status = 'delivered';
    message = 'Livré';
  }

  return { status, message, occurredAt: new Date() };
}
