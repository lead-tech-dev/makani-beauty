import api from '../lib/api';

export interface PaymentConfig {
  stripe: {
    enabled: boolean;
    publishableKey: string | null;
  };
  paypal: {
    enabled: boolean;
    clientId: string | null;
    mode: 'sandbox' | 'live';
  };
}

export interface PaymentIntentResult {
  clientSecret: string;
  paymentIntentId: string;
}

export interface PaypalCreateResult {
  paypalOrderId: string;
  status: string;
}

export interface PaypalCaptureResult {
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  status: string;
  paypalStatus?: string;
}

export const paymentsService = {
  async getConfig(): Promise<PaymentConfig> {
    const { data } = await api.get<PaymentConfig>('/payments/config');
    return data;
  },

  async createIntent(orderId: string): Promise<PaymentIntentResult> {
    const { data } = await api.post<PaymentIntentResult>('/payments/stripe/create-intent', { orderId });
    return data;
  },

  /**
   * Force-sync an order's payment status from Stripe. Used as a fallback when
   * the webhook is delayed — the response reflects the up-to-date status from
   * Stripe, applied via the same transitions as the webhook handler.
   */
  async syncStatus(orderId: string): Promise<{ paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded'; status: string }> {
    const { data } = await api.post<{ paymentStatus: any; status: any }>(`/payments/stripe/sync/${orderId}`);
    return data;
  },

  // ── PayPal ──────────────────────────────────────────────

  async createPaypalOrder(orderId: string): Promise<PaypalCreateResult> {
    const { data } = await api.post<PaypalCreateResult>('/payments/paypal/create-order', { orderId });
    return data;
  },

  async capturePaypalOrder(paypalOrderId: string): Promise<PaypalCaptureResult> {
    const { data } = await api.post<PaypalCaptureResult>('/payments/paypal/capture', { paypalOrderId });
    return data;
  },

  async syncPaypal(orderId: string): Promise<{ paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded'; status: string }> {
    const { data } = await api.post<{ paymentStatus: any; status: any }>(`/payments/paypal/sync/${orderId}`);
    return data;
  },
};
