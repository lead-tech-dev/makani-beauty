/** Common types shared across all carrier implementations. */

export type CarrierCode = 'colissimo';

export interface RelayPoint {
  id: string;
  name: string;
  line1: string;
  line2?: string;
  postalCode: string;
  city: string;
  country: string;
  hours?: string;
  distance?: number; // meters from query point, optional
}

export interface ShipmentRequest {
  /** Total weight of the shipment, in grams. */
  weightGrams: number;
  /** Order number used as merchant reference on the label. */
  orderNumber: string;
  /** Recipient address — pulled from the order's shippingSnapshot. */
  recipient: {
    fullName: string;
    line1: string;
    line2?: string;
    postalCode: string;
    city: string;
    country: string;
    phone?: string;
    email?: string;
  };
}

export interface ShipmentResult {
  /** Unique tracking identifier provided by the carrier. */
  trackingNumber: string;
  /** Public URL the customer can hit to track the parcel. */
  trackingUrl: string;
  /** Public URL (relative to backend host) where the PDF label is served. */
  labelUrl: string;
  /** Concrete carrier code used (matches CarrierCode). */
  carrier: CarrierCode;
}

export type ShipmentStatus =
  | 'pre_transit'        // label created, not yet collected
  | 'in_transit'         // picked up, en route
  | 'out_for_delivery'   // last-mile, expected today
  | 'delivered'          // confirmed delivered
  | 'exception'          // problem — held, damaged, refused
  | 'unknown';           // carrier could not resolve

export interface TrackingStatus {
  status: ShipmentStatus;
  /** Optional human-readable carrier message (FR), e.g. "Pris en charge". */
  message?: string;
  /** Optional timestamp from the carrier; defaults to "now" upstream. */
  occurredAt?: Date;
}

export interface CarrierService {
  /** Stable identifier — used by the registry and stored on Order.carrier. */
  readonly code: CarrierCode;
  /** Human label for admin UI (e.g. "Colissimo Domicile"). */
  readonly displayName: string;
  /** Whether this carrier is currently usable (creds present or mock enabled). */
  readonly isAvailable: boolean;
  /** Create a shipment, return tracking + label info. */
  createShipment(req: ShipmentRequest): Promise<ShipmentResult>;
  /** Public tracker URL for a known tracking number. */
  buildTrackingUrl(trackingNumber: string): string;
  /** Fetch current tracking status — mock implementations may simulate progression. */
  getTrackingStatus(trackingNumber: string, shippedAt?: Date): Promise<TrackingStatus>;
}
