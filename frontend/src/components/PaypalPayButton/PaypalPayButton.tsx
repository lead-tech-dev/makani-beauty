import { useState } from 'react';
import {
  PayPalButtons,
  PayPalCardFieldsProvider,
  PayPalNameField,
  PayPalNumberField,
  PayPalExpiryField,
  PayPalCVVField,
  usePayPalCardFields,
  usePayPalScriptReducer,
  FUNDING,
} from '@paypal/react-paypal-js';
import { Lock, ChevronRight, CreditCard as CardIcon } from 'lucide-react';
import { paymentsService } from '../../services/payments';
import styles from './PaypalPayButton.module.scss';

interface Props {
  /** Internal makani-cosmetique order id (uuid). */
  orderId: string;
  /** Pre-formatted total e.g. "€65.99" — used for the card-form submit button. */
  amountLabel?: string;
  /** Called when capture confirms server-side (paymentStatus = paid). */
  onSuccess: () => void;
  /** Optional callback for soft errors (declined, network) — surfaced inline. */
  onError?: (message: string) => void;
}

const cardFieldStyle = {
  input: {
    'font-family': "'Inter', system-ui, -apple-system, sans-serif",
    'font-size': '0.95rem',
    color: '#1a1a1a',
    padding: '0',
  },
  '.invalid': {
    color: '#c0392b',
  },
  ':focus': {
    color: '#C44D3A',
  },
  '::placeholder': {
    color: '#bbb',
  },
};

const SubmitCardButton = ({
  amountLabel,
  busy,
  setBusy,
}: {
  amountLabel: string;
  busy: boolean;
  setBusy: (b: boolean) => void;
}) => {
  const { cardFieldsForm } = usePayPalCardFields();
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    if (!cardFieldsForm) return;
    setError(null);
    setBusy(true);
    try {
      const state = await cardFieldsForm.getState();
      if (!state.isFormValid) {
        setError('Veuillez vérifier les informations de votre carte.');
        setBusy(false);
        return;
      }
      await cardFieldsForm.submit();
      // onApprove of the provider handles the rest. setBusy(false) happens in the parent.
    } catch (err: any) {
      setError(err?.message || 'Le paiement par carte a échoué.');
      setBusy(false);
    }
  };

  return (
    <>
      {error && <p className={styles.error} role="alert">{error}</p>}
      <button
        type="button"
        onClick={handleClick}
        disabled={busy}
        className={styles.payBtn}
      >
        <Lock size={14} />
        {busy ? 'Traitement…' : `Payer ${amountLabel}`}
        <ChevronRight size={16} />
      </button>
    </>
  );
};

const PaypalPayButton = ({ orderId, amountLabel, onSuccess, onError }: Props) => {
  const [{ isPending, isResolved, isRejected }] = usePayPalScriptReducer();
  const [error, setError] = useState<string | null>(null);
  const [cardBusy, setCardBusy] = useState(false);

  const handleError = (msg: string) => {
    setError(msg);
    onError?.(msg);
  };

  const createOrder = async (): Promise<string> => {
    setError(null);
    try {
      const res = await paymentsService.createPaypalOrder(orderId);
      return res.paypalOrderId;
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Impossible de créer la commande PayPal.';
      handleError(msg);
      throw err;
    }
  };

  const onApprove = async (data: { orderID: string }) => {
    try {
      const res = await paymentsService.capturePaypalOrder(data.orderID);
      if (res.paymentStatus === 'paid') {
        onSuccess();
      } else if (res.paymentStatus === 'failed') {
        handleError('Le paiement a été refusé.');
      } else {
        onSuccess();
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'La capture du paiement a échoué.';
      handleError(msg);
    } finally {
      setCardBusy(false);
    }
  };

  if (isRejected) {
    return (
      <p className={styles.error}>
        Le module PayPal n'a pas pu se charger. Vérifiez votre connexion ou utilisez Stripe.
      </p>
    );
  }

  return (
    <div className={styles.wrap}>
      {isPending && <div className={styles.loading}>Chargement de PayPal…</div>}

      {isResolved && (
        <>
          {/* Yellow PayPal button only — card funding is replaced by hosted card fields below */}
          <PayPalButtons
            fundingSource={FUNDING.PAYPAL}
            style={{
              shape: 'rect',
              color: 'gold',
              layout: 'vertical',
              label: 'paypal',
              height: 44,
            }}
            createOrder={createOrder}
            onApprove={onApprove}
            onCancel={() => setError(null)}
            onError={(err) =>
              handleError(typeof err === 'string' ? err : 'Erreur PayPal')
            }
          />

          {/* Inline card fields styled with the app's design system */}
          {amountLabel && (
            <>
              <div className={styles.divider}><span>ou avec votre carte</span></div>
              <PayPalCardFieldsProvider
                createOrder={createOrder}
                onApprove={onApprove}
                onError={(err) =>
                  handleError(typeof err === 'string' ? err : 'Erreur de paiement par carte')
                }
                style={cardFieldStyle}
              >
                <div className={styles.cardForm}>
                  <div className={styles.cardHeader}>
                    <CardIcon size={16} />
                    <span>Carte bancaire</span>
                  </div>

                  <label className={styles.label}>
                    <span>Titulaire</span>
                    <div className={styles.fieldShell}>
                      <PayPalNameField
                        placeholder="Nom du titulaire"
                        style={cardFieldStyle}
                      />
                    </div>
                  </label>

                  <label className={styles.label}>
                    <span>Numéro de carte</span>
                    <div className={styles.fieldShell}>
                      <PayPalNumberField
                        placeholder="1234 5678 9012 3456"
                        style={cardFieldStyle}
                      />
                    </div>
                  </label>

                  <div className={styles.row}>
                    <label className={styles.label}>
                      <span>Expiration</span>
                      <div className={styles.fieldShell}>
                        <PayPalExpiryField
                          placeholder="MM/AA"
                          style={cardFieldStyle}
                        />
                      </div>
                    </label>

                    <label className={styles.label}>
                      <span>CVV</span>
                      <div className={styles.fieldShell}>
                        <PayPalCVVField
                          placeholder="123"
                          style={cardFieldStyle}
                        />
                      </div>
                    </label>
                  </div>

                  <SubmitCardButton
                    amountLabel={amountLabel}
                    busy={cardBusy}
                    setBusy={setCardBusy}
                  />

                  <p className={styles.note}>
                    <Lock size={11} /> Données protégées · 3D Secure pris en charge
                  </p>
                </div>
              </PayPalCardFieldsProvider>
            </>
          )}
        </>
      )}

      {error && <p className={styles.error} role="alert">{error}</p>}
    </div>
  );
};

export default PaypalPayButton;
