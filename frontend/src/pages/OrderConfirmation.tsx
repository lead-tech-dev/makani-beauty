import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import {
  CheckCircle2, Package, MapPin, ChevronRight, Clock, AlertTriangle,
} from 'lucide-react';
import { ordersService } from '../services/orders';
import { paymentsService } from '../services/payments';
import { trackPurchase } from '../lib/analytics';
import { trackClarityEvent, setClarityVar, upgradeClaritySession } from '../lib/clarity';
import { useCart } from '../context/CartContext';
import type { Order } from '../types';
import Spinner from '../components/Spinner/Spinner';
import styles from './OrderConfirmation.module.scss';

const OrderConfirmation = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const { clearCart } = useCart();

  // Stripe redirect query params: payment_intent, payment_intent_client_secret, redirect_status
  const stripeStatus = searchParams.get('redirect_status');

  // Fetch + poll the order until paymentStatus settles. We hit /payments/stripe/sync
  // first so that even if the webhook is late or unreachable (dev without stripe-cli),
  // the order is reconciled directly from Stripe before we read it back.
  useEffect(() => {
    if (!id) return;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let attempts = 0;
    const MAX_POLLS = 8; // ~16 seconds total at 2s interval

    const tick = async () => {
      try {
        // Best-effort sync from both providers — silently no-op if it fails.
        // We don't know which one applies until we look at the order, so we try both.
        try { await paymentsService.syncStatus(id); } catch { /* ignore */ }
        try { await paymentsService.syncPaypal(id); } catch { /* ignore */ }
        const o = await ordersService.getMyOrder(id);
        if (stopped) return;
        setOrder(o);
        setLoading(false);

        // Fire purchase event once per order (idempotent across polls + page reloads via sessionStorage)
        if (o.paymentStatus === 'paid') {
          const firedKey = `gtm-purchase-${o.id}`;
          if (!sessionStorage.getItem(firedKey)) {
            sessionStorage.setItem(firedKey, '1');
            trackPurchase(o);
            // Tag the Clarity session as a conversion + flag it for prioritised upload
            trackClarityEvent('purchase');
            setClarityVar('order_value', String(o.total));
            setClarityVar('order_id', o.orderNumber);
            upgradeClaritySession('purchase');
            clearCart();
          }
        }

        const stillPending = o.paymentStatus === 'pending' || (o as any).paymentStatus == null;
        if (stillPending && attempts < MAX_POLLS) {
          attempts++;
          timer = setTimeout(tick, 2000);
        }
      } catch {
        if (!stopped) setLoading(false);
      }
    };
    tick();
    return () => { stopped = true; if (timer) clearTimeout(timer); };
  }, [id]);


  if (loading) return <Spinner fullPage />;
  if (!order) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <h1>Commande introuvable</h1>
          <Link to="/account/orders" className={styles.btnSecondary}>Voir mes commandes</Link>
        </div>
      </div>
    );
  }

  const snap = order.shippingSnapshot;
  const paymentStatus = (order as any).paymentStatus as string | undefined;
  const isPaid = paymentStatus === 'paid';
  const isFailed = paymentStatus === 'failed' || stripeStatus === 'failed';
  const isPending = paymentStatus === 'pending' || paymentStatus == null;

  // Visual state derived from payment status
  const statusUI = isFailed
    ? { icon: <AlertTriangle size={42} />, color: '#c0392b', bg: '#fdf0ef',
        title: 'Paiement non finalisé', sub: 'Votre carte a été refusée ou le paiement a été interrompu. La commande reste réservée — vous pouvez réessayer avec un autre moyen de paiement.' }
    : isPaid
      ? { icon: <CheckCircle2 size={42} />, color: '#0a6640', bg: '#d1f0e0',
          title: 'Merci pour votre commande !', sub: `Un email de confirmation vous a été envoyé. Votre numéro : ${order.orderNumber}` }
      : { icon: <Clock size={42} />, color: '#856404', bg: '#fef3cd',
          title: 'Commande enregistrée', sub: `Numéro ${order.orderNumber}. Le paiement est en cours de validation — vous serez notifié dès la confirmation.` };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.iconCircle} style={{ background: statusUI.bg, color: statusUI.color }}>
          {statusUI.icon}
        </div>
        <h1 className={styles.title}>{statusUI.title}</h1>
        <p className={styles.sub}>{statusUI.sub}</p>
        {isPending && (
          <p className={styles.sub} style={{ fontSize: '0.82rem', marginTop: '-1.5rem' }}>
            Cette page se met à jour automatiquement.
          </p>
        )}

        <div className={styles.grid}>
          <section className={styles.section}>
            <h2><Package size={18} /> Articles ({order.items.length})</h2>
            <ul className={styles.itemList}>
              {order.items.map((item) => (
                <li key={item.id}>
                  {item.productImageUrl && (
                    <img src={item.productImageUrl} alt="" className={styles.thumb} />
                  )}
                  <div className={styles.itemInfo}>
                    <span className={styles.itemName}>{item.productName}</span>
                    <span className={styles.itemMeta}>
                      {order.currency}{Number(item.unitPrice).toFixed(2)} × {item.quantity}
                    </span>
                  </div>
                  <strong>{order.currency}{Number(item.subtotal).toFixed(2)}</strong>
                </li>
              ))}
            </ul>

            <div className={styles.totals}>
              <div className={styles.row}><span>Sous-total</span><span>{order.currency}{Number(order.subtotal).toFixed(2)}</span></div>
              <div className={styles.row}><span>Livraison</span><span>{Number(order.shippingFee) === 0 ? 'Offerte' : `${order.currency}${Number(order.shippingFee).toFixed(2)}`}</span></div>
              {order.discountAmount && Number(order.discountAmount) > 0 && (
                <div className={styles.row} style={{ color: '#0a6640', fontWeight: 600 }}>
                  <span>Réduction ({order.discountCode})</span>
                  <span>−{order.currency}{Number(order.discountAmount).toFixed(2)}</span>
                </div>
              )}
              <div className={`${styles.row} ${styles.totalRow}`}>
                <span>Total TTC</span>
                <strong>{order.currency}{Number(order.total).toFixed(2)}</strong>
              </div>
              {order.taxAmount && Number(order.taxAmount) > 0 && (
                <p style={{ fontSize: '0.78rem', color: '#888', margin: '0.25rem 0 0', textAlign: 'right' }}>
                  dont TVA ({Number(order.taxRate).toFixed(0)}%) : {order.currency}{Number(order.taxAmount).toFixed(2)}
                </p>
              )}
            </div>
          </section>

          {snap && (
            <section className={styles.section}>
              <h2>
                <MapPin size={18} />
                {snap.kind === 'pickup'
                  ? 'Retrait en boutique'
                  : snap.kind === 'relay'
                    ? 'Point relais'
                    : 'Livraison'}
              </h2>
              <address className={styles.address}>
                {(snap.kind === 'pickup' || snap.kind === 'relay') ? (
                  <>
                    <strong>{snap.name}</strong>
                    <span>{snap.line1}</span>
                    {snap.line2 && <span>{snap.line2}</span>}
                    <span>{snap.postalCode} {snap.city}</span>
                    <span>{snap.country}</span>
                    {snap.hours && <span style={{ marginTop: '0.5rem', color: '#C44D3A', fontWeight: 600 }}>{snap.hours}</span>}
                    {snap.notes && <span className={styles.phone} style={{ fontStyle: 'italic' }}>{snap.notes}</span>}
                  </>
                ) : (
                  <>
                    <strong>{snap.fullName}</strong>
                    <span>{snap.line1}</span>
                    {snap.line2 && <span>{snap.line2}</span>}
                    <span>{snap.postalCode} {snap.city}</span>
                    <span>{snap.country}</span>
                    {snap.phone && <span className={styles.phone}>{snap.phone}</span>}
                  </>
                )}
              </address>
            </section>
          )}
        </div>

        <div className={styles.actions}>
          {isFailed ? (
            <>
              <Link to={`/account/orders/${order.id}/pay`} className={styles.btnPrimary}>
                Réessayer le paiement <ChevronRight size={16} />
              </Link>
              <Link to={`/account/orders/${order.id}`} className={styles.btnSecondary}>
                Voir ma commande
              </Link>
            </>
          ) : (
            <>
              <Link to={`/account/orders/${order.id}`} className={styles.btnPrimary}>
                Voir ma commande <ChevronRight size={16} />
              </Link>
              <Link to="/collections" className={styles.btnSecondary}>
                Continuer mes achats
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation;
