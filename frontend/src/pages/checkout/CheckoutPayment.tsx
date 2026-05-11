import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Elements } from '@stripe/react-stripe-js';
import { PayPalScriptProvider } from '@paypal/react-paypal-js';
import {
  CreditCard, ChevronLeft, ChevronRight, Lock, MapPin, Tag, X, Check,
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useCheckout } from '../../context/CheckoutContext';
import { addressesService } from '../../services/addresses';
import { ordersService } from '../../services/orders';
import { promoService } from '../../services/promo';
import { shippingService } from '../../services/shipping';
import { paymentsService, PaymentConfig } from '../../services/payments';
import { trackAddPaymentInfo } from '../../lib/analytics';
import { getStripe } from '../../lib/stripe';
import StripePaymentForm from '../../components/StripePaymentForm/StripePaymentForm';
import PaypalPayButton from '../../components/PaypalPayButton/PaypalPayButton';
import Spinner from '../../components/Spinner/Spinner';
import type { Address } from '../../types';
import type { ShippingCalc } from '../../lib/api';
import styles from './step.module.scss';

const CheckoutPayment = () => {
  const { items, subtotal, clearCart } = useCart();
  const {
    fulfillmentMethod, shippingSpeed,
    selectedAddressId, selectedRelayPoint, notes, promo, setPromo,
    pendingPayment, setPendingPayment,
  } = useCheckout();
  const navigate = useNavigate();
  const currency = items[0]?.currency ?? '€';
  const isPickup = fulfillmentMethod === 'pickup';
  const isRelay = fulfillmentMethod === 'relay';
  const isExpress = shippingSpeed === 'express';
  const expressSurcharge = Number(process.env.REACT_APP_EXPRESS_SURCHARGE ?? 5);

  const [address, setAddress] = useState<Address | null>(null);
  const [shipping, setShipping] = useState<ShippingCalc | null>(null);
  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig | null>(null);
  const [intentLoading, setIntentLoading] = useState(false);
  const [intentError, setIntentError] = useState('');
  const [placing, setPlacing] = useState(false);
  const [apiError, setApiError] = useState('');

  // Promo UI state
  const [promoInput, setPromoInput] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoMsg, setPromoMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // ── Guards ────────────────────────────────────────────────
  useEffect(() => {
    if (isPickup) {
      setAddress(null);
      setShipping({ zoneName: 'Click & Collect', shippingFee: 0, taxRate: 0, taxAmount: 0, freeShippingApplied: false } as any);
      return;
    }
    if (isRelay) {
      setAddress(null);
      if (!selectedRelayPoint) {
        navigate('/checkout/shipping', { replace: true });
      }
      return;
    }
    if (!selectedAddressId) {
      navigate('/checkout/shipping', { replace: true });
      return;
    }
    addressesService.getAll().then((list) => {
      setAddress(list.find((a) => a.id === selectedAddressId) ?? null);
    });
  }, [selectedAddressId, navigate, isPickup, isRelay, selectedRelayPoint]);

  // ── Shipping calc ─────────────────────────────────────────
  useEffect(() => {
    if (isPickup) return;
    if (isRelay && selectedRelayPoint) {
      // Relay shipping fee comes from a flat MONDIAL_RELAY_BASE_RATE on the
      // backend — we recompute via the same endpoint, with the relay's
      // postal-code country as zone hint.
      shippingService.calculate(
        selectedRelayPoint.country,
        subtotal,
        items.map((i) => ({ productId: i.id, quantity: i.quantity, variantId: i.variantId ?? undefined })),
      )
        .then((calc) => {
          // Server doesn't yet split by method here; backend stamp uses 'relay'
          // when the order is created. For UI display we hardcode a flat rate
          // from REACT_APP_RELAY_RATE or default 4.50€.
          const relayFlat = Number(process.env.REACT_APP_RELAY_RATE ?? 4.5);
          setShipping({
            ...calc,
            shippingFee: calc.freeShippingApplied ? 0 : relayFlat,
            zoneName: `${calc.zoneName} (point relais)`,
          });
        })
        .catch(() => setShipping(null));
      return;
    }
    if (!address) return;
    shippingService.calculate(
      address.country,
      subtotal,
      items.map((i) => ({ productId: i.id, quantity: i.quantity, variantId: i.variantId ?? undefined })),
    )
      .then((calc) => {
        if (isExpress) {
          setShipping({
            ...calc,
            shippingFee: (calc.freeShippingApplied ? 0 : calc.shippingFee) + expressSurcharge,
            zoneName: `${calc.zoneName} · Express`,
          });
        } else {
          setShipping(calc);
        }
      })
      .catch(() => setShipping(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, subtotal, isPickup, isRelay, selectedRelayPoint, isExpress]);

  // ── Re-validate promo if subtotal changes ─────────────────
  useEffect(() => {
    if (!promo) return;
    promoService.validate(promo.code, subtotal).then((res) => {
      if (res.valid) setPromo({ code: promo.code, discount: res.discount });
      else { setPromo(null); setPromoMsg({ type: 'err', text: res.message }); }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subtotal]);

  // ── Payment provider config ───────────────────────────────
  useEffect(() => {
    paymentsService.getConfig().then(setPaymentConfig).catch(() => setPaymentConfig(null));
  }, []);

  // ── Create order (and Stripe intent if enabled) ───────────
  // Runs once when fulfillment context is known and at least one provider is enabled.
  useEffect(() => {
    if (!paymentConfig) return;
    const anyProviderEnabled = paymentConfig.stripe.enabled || paymentConfig.paypal.enabled;
    if (!anyProviderEnabled) return;
    const ready = isPickup
      ? !!shipping
      : isRelay
        ? !!selectedRelayPoint && !!shipping
        : (!!selectedAddressId && !!address && !!shipping);
    if (!ready) return;
    if (pendingPayment) return; // Already created — reuse

    setIntentLoading(true);
    setIntentError('');
    (async () => {
      try {
        const order = await ordersService.create({
          fulfillmentMethod,
          shippingSpeed,
          addressId: !isPickup && !isRelay ? selectedAddressId! : undefined,
          relayPoint: isRelay ? (selectedRelayPoint as any) : undefined,
          items: items.map((i) => ({ productId: i.id, quantity: i.quantity, variantId: i.variantId ?? undefined })),
          notes: notes || undefined,
          promoCode: promo?.code,
        });
        // Pre-create the Stripe intent if Stripe is enabled (so Elements can mount immediately)
        if (paymentConfig.stripe.enabled) {
          const intent = await paymentsService.createIntent(order.id);
          setPendingPayment({
            orderId: order.id,
            clientSecret: intent.clientSecret,
            paymentIntentId: intent.paymentIntentId,
          });
        } else {
          setPendingPayment({ orderId: order.id });
        }
        const tier = paymentConfig.stripe.enabled && paymentConfig.paypal.enabled
          ? 'card_or_paypal'
          : paymentConfig.stripe.enabled ? 'card' : 'paypal';
        trackAddPaymentInfo(items, tier, currency);
      } catch (err: any) {
        setIntentError(err?.response?.data?.message || 'Impossible d initialiser le paiement');
      } finally {
        setIntentLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentConfig, address, shipping]);

  // ── Promo handlers ────────────────────────────────────────
  const applyPromo = async () => {
    const code = promoInput.trim();
    if (!code) return;
    setPromoLoading(true);
    setPromoMsg(null);
    try {
      const res = await promoService.validate(code, subtotal);
      if (res.valid) {
        setPromo({ code: res.code!.code, discount: res.discount });
        setPromoMsg({ type: 'ok', text: res.message });
        setPromoInput('');
      } else {
        setPromo(null);
        setPromoMsg({ type: 'err', text: res.message });
      }
    } catch {
      setPromoMsg({ type: 'err', text: 'Erreur lors de la validation du code' });
    } finally {
      setPromoLoading(false);
    }
  };

  const removePromo = () => {
    setPromo(null);
    setPromoMsg(null);
  };

  // ── Computed totals ──────────────────────────────────────
  const shippingFee = shipping?.shippingFee ?? 0;
  const taxRate = shipping?.taxRate ?? 0;
  const discount = promo?.discount ?? 0;
  const total = +(subtotal + shippingFee - discount).toFixed(2);
  const taxAmount = taxRate > 0
    ? +(total * (taxRate / (100 + taxRate))).toFixed(2)
    : 0;

  // ── Stripe instance (memoised on publishable key) ─────────
  const stripePromise = useMemo(() => {
    const key = paymentConfig?.stripe.publishableKey;
    return key ? getStripe(key) : null;
  }, [paymentConfig?.stripe.publishableKey]);

  // ── Fallback: place order without payment (Stripe not configured) ──
  const placeOrderWithoutPayment = async () => {
    if (!isPickup && !isRelay && !selectedAddressId) return;
    if (isRelay && !selectedRelayPoint) return;
    setApiError('');
    setPlacing(true);
    try {
      const order = await ordersService.create({
        fulfillmentMethod,
        addressId: !isPickup && !isRelay ? selectedAddressId! : undefined,
        relayPoint: isRelay ? (selectedRelayPoint as any) : undefined,
        items: items.map((i) => ({ productId: i.id, quantity: i.quantity, variantId: i.variantId ?? undefined })),
        notes: notes || undefined,
        promoCode: promo?.code,
      });
      clearCart();
      navigate(`/order-confirmation/${order.id}`, { replace: true });
    } catch (err: any) {
      setApiError(err?.response?.data?.message || 'Une erreur est survenue.');
    } finally {
      setPlacing(false);
    }
  };

  // After Stripe sync confirmation
  const handleStripeSyncSuccess = () => {
    if (!pendingPayment) return;
    clearCart();
    setPendingPayment(null);
    navigate(`/order-confirmation/${pendingPayment.orderId}`, { replace: true });
  };

  if (!isPickup && !isRelay && !selectedAddressId) return null;

  const stripeEnabled = paymentConfig?.stripe.enabled === true;
  const paypalEnabled = paymentConfig?.paypal.enabled === true;
  const paypalClientId = paymentConfig?.paypal.clientId ?? null;
  const isoCurrency = (() => {
    const m: Record<string, string> = { '€': 'EUR', '$': 'USD', '£': 'GBP' };
    return m[currency] ?? currency.toUpperCase();
  })();

  const handlePaypalSuccess = () => {
    if (!pendingPayment) return;
    clearCart();
    const orderId = pendingPayment.orderId;
    setPendingPayment(null);
    navigate(`/order-confirmation/${orderId}`, { replace: true });
  };

  return (
    <div className={styles.grid}>
      <section className={styles.card}>
        <h2 className={styles.cardTitle}><CreditCard size={18} /> Paiement</h2>

        {/* ── Stripe enabled: live Elements ───────────────── */}
        {stripeEnabled && stripePromise && pendingPayment && (
          <Elements
            key={pendingPayment.clientSecret}
            stripe={stripePromise}
            options={{
              clientSecret: pendingPayment.clientSecret,
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
              orderId={pendingPayment.orderId}
              amountLabel={`${currency}${total.toFixed(2)}`}
              returnUrl={`${window.location.origin}/order-confirmation/${pendingPayment.orderId}`}
              onSyncSuccess={handleStripeSyncSuccess}
            />
          </Elements>
        )}

        {stripeEnabled && intentLoading && (
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <Spinner />
            <p style={{ marginTop: '1rem', color: '#888', fontSize: '0.88rem' }}>
              Préparation du paiement…
            </p>
          </div>
        )}

        {stripeEnabled && intentError && (
          <p className={styles.apiError} role="alert">{intentError}</p>
        )}

        {/* ── PayPal button (alongside Stripe or alone) ───── */}
        {paypalEnabled && pendingPayment && paypalClientId && (
          <div className={styles.paypalBlock}>
            {stripeEnabled && (
              <div className={styles.divider}>
                <span>ou payer avec</span>
              </div>
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
                orderId={pendingPayment.orderId}
                amountLabel={`${currency}${total.toFixed(2)}`}
                onSuccess={handlePaypalSuccess}
              />
            </PayPalScriptProvider>
          </div>
        )}

        {/* ── Aucun provider configuré: dev fallback ──────── */}
        {paymentConfig && !stripeEnabled && !paypalEnabled && (
          <>
            <div className={styles.paymentPlaceholder}>
              <Lock size={32} />
              <h3>Paiement sécurisé indisponible</h3>
              <p>Aucun moyen de paiement n'est configuré sur cette instance.</p>
              <p className={styles.placeholderHint}>
                La commande sera créée en statut <em>en attente de paiement</em>.
                Configurez <code>STRIPE_SECRET_KEY</code> ou <code>PAYPAL_CLIENT_ID</code>
                côté backend pour activer le paiement.
              </p>
            </div>
            {apiError && <p className={styles.apiError} role="alert">{apiError}</p>}
            <button
              className={styles.primaryBtn}
              onClick={placeOrderWithoutPayment}
              disabled={placing}
              style={{ marginTop: '1rem' }}
              data-testid="place-order-btn"
            >
              {placing ? 'Traitement…' : 'Confirmer la commande'}
              <ChevronRight size={18} />
            </button>
          </>
        )}

        {address && !isPickup && !isRelay && (
          <div className={styles.addressRecap} style={{ marginTop: '1.5rem' }}>
            <div className={styles.addressRecapHead}>
              <MapPin size={14} /> Livraison à
              <Link to="/checkout/shipping" className={styles.editLink}>Modifier</Link>
            </div>
            <address>
              <strong>{address.fullName}</strong>
              <span>{address.line1}{address.line2 ? `, ${address.line2}` : ''}</span>
              <span>{address.postalCode} {address.city}, {address.country}</span>
            </address>
          </div>
        )}
        {isPickup && (
          <div className={styles.addressRecap} style={{ marginTop: '1.5rem' }}>
            <div className={styles.addressRecapHead}>
              <MapPin size={14} /> Retrait en boutique
              <Link to="/checkout/shipping" className={styles.editLink}>Modifier</Link>
            </div>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#444' }}>
              Vous recevrez un email dès que votre commande sera prête à être retirée.
            </p>
          </div>
        )}
        {isRelay && selectedRelayPoint && (
          <div className={styles.addressRecap} style={{ marginTop: '1.5rem' }}>
            <div className={styles.addressRecapHead}>
              <MapPin size={14} /> Point relais
              <Link to="/checkout/shipping" className={styles.editLink}>Modifier</Link>
            </div>
            <address>
              <strong>{selectedRelayPoint.name}</strong>
              <span>{selectedRelayPoint.line1}{selectedRelayPoint.line2 ? `, ${selectedRelayPoint.line2}` : ''}</span>
              <span>{selectedRelayPoint.postalCode} {selectedRelayPoint.city}, {selectedRelayPoint.country}</span>
            </address>
          </div>
        )}
      </section>

      <aside className={styles.summary}>
        <h2 className={styles.cardTitle}>Récapitulatif</h2>

        <ul className={styles.miniList}>
          {items.map((it) => (
            <li key={it.id}>
              <span>{it.name} <em>× {it.quantity}</em></span>
              <span>{currency}{(it.price * it.quantity).toFixed(2)}</span>
            </li>
          ))}
        </ul>

        <div className={styles.summaryRow}>
          <span>Sous-total</span>
          <span>{currency}{subtotal.toFixed(2)}</span>
        </div>
        <div className={styles.summaryRow}>
          <span>
            Livraison
            {shipping?.zoneName && (
              <em style={{ color: '#888', fontStyle: 'normal', fontSize: '0.78rem' }}>
                {' · '}{shipping.zoneName}
              </em>
            )}
          </span>
          <span>
            {shipping
              ? (shippingFee === 0 ? 'Offerte' : `${currency}${shippingFee.toFixed(2)}`)
              : '…'}
          </span>
        </div>

        <div className={styles.promoBlock}>
          {promo ? (
            <div className={styles.promoApplied}>
              <Tag size={14} />
              <span>Code <strong>{promo.code}</strong> appliqué</span>
              <button onClick={removePromo} aria-label="Retirer le code"><X size={14} /></button>
            </div>
          ) : (
            <div className={styles.promoForm}>
              <input
                type="text"
                placeholder="Code promo"
                value={promoInput}
                onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), applyPromo())}
                disabled={promoLoading}
                data-testid="promo-input"
              />
              <button
                onClick={applyPromo}
                disabled={promoLoading || !promoInput.trim()}
                data-testid="apply-promo"
              >
                {promoLoading ? '…' : 'Appliquer'}
              </button>
            </div>
          )}
          {promoMsg && !promo && <p className={`${styles.promoMsg} ${styles.promoMsgErr}`}>{promoMsg.text}</p>}
          {promoMsg && promo && (
            <p className={`${styles.promoMsg} ${styles.promoMsgOk}`}>
              <Check size={12} /> {promoMsg.text}
            </p>
          )}
        </div>

        {discount > 0 && (
          <div className={`${styles.summaryRow} ${styles.discountRow}`}>
            <span>Réduction ({promo?.code})</span>
            <span>−{currency}{discount.toFixed(2)}</span>
          </div>
        )}

        <div className={`${styles.summaryRow} ${styles.grandTotal}`}>
          <span>Total TTC</span>
          <strong>{currency}{total.toFixed(2)}</strong>
        </div>
        {taxAmount > 0 && (
          <p className={styles.summaryNote} style={{ textAlign: 'right', marginTop: '-0.25rem' }}>
            dont TVA ({taxRate}%) : {currency}{taxAmount.toFixed(2)}
          </p>
        )}

        <Link to="/checkout/shipping" className={styles.backLink}>
          <ChevronLeft size={14} /> Retour à la livraison
        </Link>
      </aside>
    </div>
  );
};

export default CheckoutPayment;
