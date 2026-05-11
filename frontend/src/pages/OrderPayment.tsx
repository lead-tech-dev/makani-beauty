import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Elements } from '@stripe/react-stripe-js';
import { PayPalScriptProvider } from '@paypal/react-paypal-js';
import { CreditCard, ChevronLeft, MapPin, AlertTriangle, Lock } from 'lucide-react';
import { ordersService } from '../services/orders';
import { paymentsService, PaymentConfig } from '../services/payments';
import { getStripe } from '../lib/stripe';
import StripePaymentForm from '../components/StripePaymentForm/StripePaymentForm';
import PaypalPayButton from '../components/PaypalPayButton/PaypalPayButton';
import Spinner from '../components/Spinner/Spinner';
import type { Order } from '../types';
import styles from './OrderPayment.module.scss';

const OrderPayment = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [order, setOrder] = useState<Order | null>(null);
  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    let alive = true;

    (async () => {
      try {
        const [o, cfg] = await Promise.all([
          ordersService.getMyOrder(id),
          paymentsService.getConfig(),
        ]);
        if (!alive) return;
        setOrder(o);
        setPaymentConfig(cfg);

        if (o.paymentStatus === 'paid') {
          navigate(`/order-confirmation/${o.id}`, { replace: true });
          return;
        }
        if (o.paymentStatus === 'refunded' || o.status === 'cancelled') {
          setError('Cette commande ne peut plus être payée.');
          return;
        }
        if (!cfg.stripe.enabled && !cfg.paypal.enabled) {
          setError('Le paiement en ligne est temporairement indisponible.');
          return;
        }

        // Pre-create the Stripe intent if Stripe is enabled (Elements mounts immediately)
        if (cfg.stripe.enabled) {
          const intent = await paymentsService.createIntent(o.id);
          if (!alive) return;
          setClientSecret(intent.clientSecret);
        }
      } catch (err: any) {
        if (alive) setError(err?.response?.data?.message || 'Impossible d initialiser le paiement.');
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => { alive = false; };
  }, [id, navigate]);

  const stripePromise = useMemo(() => {
    const key = paymentConfig?.stripe.publishableKey;
    return key ? getStripe(key) : null;
  }, [paymentConfig?.stripe.publishableKey]);

  const stripeEnabled = paymentConfig?.stripe.enabled === true;
  const paypalEnabled = paymentConfig?.paypal.enabled === true;
  const paypalClientId = paymentConfig?.paypal.clientId ?? null;
  const isoCurrency = (() => {
    if (!order) return 'EUR';
    const m: Record<string, string> = { '€': 'EUR', '$': 'USD', '£': 'GBP' };
    return m[order.currency] ?? order.currency.toUpperCase();
  })();

  if (loading) return <Spinner fullPage />;
  if (!order) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <h1>Commande introuvable</h1>
          <Link to="/account/orders" className={styles.btnSecondary}>Retour à mes commandes</Link>
        </div>
      </div>
    );
  }

  const snap = order.shippingSnapshot;
  const wasFailed = order.paymentStatus === 'failed';

  const handleSuccess = () => {
    navigate(`/order-confirmation/${order.id}`, { replace: true });
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <Link to={`/account/orders/${order.id}`} className={styles.back}>
          <ChevronLeft size={14} /> Retour à la commande
        </Link>

        <header className={styles.header}>
          <h1 className={styles.title}>
            {wasFailed ? 'Réessayer le paiement' : 'Finaliser le paiement'}
          </h1>
          <p className={styles.sub}>
            Commande <strong>{order.orderNumber}</strong>
          </p>
        </header>

        {wasFailed && (
          <div className={styles.alert} role="alert">
            <AlertTriangle size={18} />
            <span>Le paiement précédent n'a pas été finalisé. Vous pouvez utiliser un autre moyen de paiement.</span>
          </div>
        )}

        {error && (
          <div className={styles.errorBox} role="alert">{error}</div>
        )}

        <div className={styles.grid}>
          <section className={styles.paySection}>
            <h2 className={styles.sectionTitle}>
              <CreditCard size={16} /> Paiement
            </h2>

            {!error && stripeEnabled && clientSecret && stripePromise && (
              <Elements
                key={clientSecret}
                stripe={stripePromise}
                options={{
                  clientSecret,
                  appearance: {
                    theme: 'stripe',
                    variables: {
                      colorPrimary: '#C44D3A',
                      colorBackground: '#ffffff',
                      colorText: '#1a1a1a',
                      fontFamily: 'system-ui, sans-serif',
                      borderRadius: '8px',
                    },
                  },
                }}
              >
                <StripePaymentForm
                  orderId={order.id}
                  amountLabel={`${order.currency}${Number(order.total).toFixed(2)}`}
                  returnUrl={`${window.location.origin}/order-confirmation/${order.id}`}
                  onSyncSuccess={handleSuccess}
                />
              </Elements>
            )}

            {!error && stripeEnabled && !clientSecret && (
              <div className={styles.paymentLoading}>
                <Spinner />
                <p>Préparation du paiement…</p>
              </div>
            )}

            {!error && paypalEnabled && paypalClientId && (
              <div style={{ marginTop: stripeEnabled ? '1.25rem' : 0 }}>
                {stripeEnabled && (
                  <div className={styles.divider}><span>ou payer avec</span></div>
                )}
                <PayPalScriptProvider
                  options={{
                    clientId: paypalClientId,
                    currency: isoCurrency,
                    intent: 'capture',
                    components: 'buttons,card-fields',
                  }}
                >
                  <PaypalPayButton
                    orderId={order.id}
                    amountLabel={`${order.currency}${Number(order.total).toFixed(2)}`}
                    onSuccess={handleSuccess}
                  />
                </PayPalScriptProvider>
              </div>
            )}

            <p className={styles.secureNote}>
              <Lock size={12} /> Connexion sécurisée — vos données ne transitent pas par nos serveurs.
            </p>
          </section>

          <aside className={styles.summary}>
            <h2 className={styles.sectionTitle}>Récapitulatif</h2>
            <ul className={styles.miniList}>
              {order.items.map((it) => (
                <li key={it.id}>
                  <span>{it.productName} <em>× {it.quantity}</em></span>
                  <span>{order.currency}{Number(it.subtotal).toFixed(2)}</span>
                </li>
              ))}
            </ul>

            <div className={styles.row}>
              <span>Sous-total</span>
              <span>{order.currency}{Number(order.subtotal).toFixed(2)}</span>
            </div>
            <div className={styles.row}>
              <span>Livraison</span>
              <span>{Number(order.shippingFee) === 0 ? 'Offerte' : `${order.currency}${Number(order.shippingFee).toFixed(2)}`}</span>
            </div>
            {order.discountAmount && Number(order.discountAmount) > 0 && (
              <div className={styles.row} style={{ color: '#0a6640', fontWeight: 600 }}>
                <span>Réduction ({order.discountCode})</span>
                <span>−{order.currency}{Number(order.discountAmount).toFixed(2)}</span>
              </div>
            )}
            <div className={`${styles.row} ${styles.total}`}>
              <span>Total TTC</span>
              <strong>{order.currency}{Number(order.total).toFixed(2)}</strong>
            </div>

            {snap && (
              <div className={styles.shipBlock}>
                <div className={styles.shipHead}>
                  <MapPin size={14} /> Livraison à
                </div>
                <address className={styles.address}>
                  <strong>{snap.fullName}</strong>
                  <span>{snap.line1}{snap.line2 ? `, ${snap.line2}` : ''}</span>
                  <span>{snap.postalCode} {snap.city}</span>
                  <span>{snap.country}</span>
                </address>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
};

export default OrderPayment;
