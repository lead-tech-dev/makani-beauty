import { createContext, useContext, useState, ReactNode } from 'react';
import type { FulfillmentMethod, RelayPoint, ShippingSpeed } from '../types';

export interface AppliedPromo {
  code: string;
  discount: number;
}

export interface PendingPayment {
  orderId: string;
  /** Stripe — present only when Stripe is enabled. */
  clientSecret?: string;
  paymentIntentId?: string;
}

interface CheckoutContextValue {
  fulfillmentMethod: FulfillmentMethod;
  setFulfillmentMethod: (m: FulfillmentMethod) => void;
  shippingSpeed: ShippingSpeed;
  setShippingSpeed: (s: ShippingSpeed) => void;
  selectedAddressId: string | null;
  setSelectedAddressId: (id: string | null) => void;
  selectedRelayPoint: RelayPoint | null;
  setSelectedRelayPoint: (p: RelayPoint | null) => void;
  notes: string;
  setNotes: (notes: string) => void;
  promo: AppliedPromo | null;
  setPromo: (promo: AppliedPromo | null) => void;
  pendingPayment: PendingPayment | null;
  setPendingPayment: (p: PendingPayment | null) => void;
  reset: () => void;
}

const CheckoutContext = createContext<CheckoutContextValue | undefined>(undefined);

export const CheckoutProvider = ({ children }: { children: ReactNode }) => {
  const [fulfillmentMethod, setFulfillmentMethod] = useState<FulfillmentMethod>('delivery');
  const [shippingSpeed, setShippingSpeed] = useState<ShippingSpeed>('standard');
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [selectedRelayPoint, setSelectedRelayPoint] = useState<RelayPoint | null>(null);
  const [notes, setNotes] = useState('');
  const [promo, setPromo] = useState<AppliedPromo | null>(null);
  const [pendingPayment, setPendingPayment] = useState<PendingPayment | null>(null);

  const reset = () => {
    setFulfillmentMethod('delivery');
    setShippingSpeed('standard');
    setSelectedAddressId(null);
    setSelectedRelayPoint(null);
    setNotes('');
    setPromo(null);
    setPendingPayment(null);
  };

  return (
    <CheckoutContext.Provider value={{
      fulfillmentMethod, setFulfillmentMethod,
      shippingSpeed, setShippingSpeed,
      selectedAddressId, setSelectedAddressId,
      selectedRelayPoint, setSelectedRelayPoint,
      notes, setNotes,
      promo, setPromo,
      pendingPayment, setPendingPayment,
      reset,
    }}>
      {children}
    </CheckoutContext.Provider>
  );
};

export const useCheckout = (): CheckoutContextValue => {
  const ctx = useContext(CheckoutContext);
  if (!ctx) throw new Error('useCheckout must be used within CheckoutProvider');
  return ctx;
};
