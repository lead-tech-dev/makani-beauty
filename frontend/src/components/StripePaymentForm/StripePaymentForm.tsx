import { useState } from 'react';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { ChevronRight, Lock } from 'lucide-react';
import styles from './StripePaymentForm.module.scss';

interface Props {
  orderId: string;
  amountLabel: string;     // e.g. "€65.99" — already formatted
  /** Absolute URL Stripe redirects to after 3DS / async confirmation */
  returnUrl: string;
  /** Called when payment confirms synchronously (no redirect needed) */
  onSyncSuccess: () => void;
}

const StripePaymentForm = ({ orderId, amountLabel, returnUrl, onSyncSuccess }: Props) => {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setSubmitting(true);
    setError(null);

    const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: returnUrl },
      // Most cards (no 3DS) confirm synchronously — only redirect when required
      redirect: 'if_required',
    });

    if (stripeError) {
      // payment_method validation failures or auth issues
      setError(stripeError.message || 'Le paiement a échoué.');
      setSubmitting(false);
      return;
    }

    if (paymentIntent?.status === 'succeeded') {
      onSyncSuccess();
      return;
    }

    if (paymentIntent?.status === 'processing') {
      // Async confirmation in progress (e.g. SEPA). Move to confirmation page;
      // the webhook will mark as paid when it lands.
      onSyncSuccess();
      return;
    }

    setError('Le paiement n a pas été confirmé. Réessayez ou utilisez un autre moyen.');
    setSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <PaymentElement options={{ layout: 'tabs' }} />

      {error && (
        <p className={styles.error} role="alert">{error}</p>
      )}

      <button
        type="submit"
        className={styles.payBtn}
        disabled={!stripe || !elements || submitting}
        data-testid="stripe-pay-btn"
      >
        <Lock size={14} />
        {submitting ? 'Traitement…' : `Payer ${amountLabel}`}
        <ChevronRight size={18} />
      </button>
      <p className={styles.note}>
        Paiement sécurisé via Stripe · Apple Pay · Google Pay
      </p>
    </form>
  );
};

export default StripePaymentForm;
