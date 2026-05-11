import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  Package, MapPin, Clock, CheckCircle, Truck, XCircle, ChevronRight, CreditCard,
  AlertTriangle, RefreshCw, ExternalLink, FileText,
} from 'lucide-react';
import { downloadBlob } from '../lib/downloadBlob';
import { useMemo } from 'react';
import { ordersService } from '../services/orders';
import type { Order, OrderStatus, PaymentStatus, ReturnRequest } from '../types';
import Spinner from '../components/Spinner/Spinner';
import ShipmentTimeline from '../components/ShipmentTimeline/ShipmentTimeline';
import ReturnRequestModal from '../components/ReturnRequestModal/ReturnRequestModal';
import styles from './OrderDetail.module.scss';

const RETURN_WINDOW_DAYS = 14;

const PAYMENT_LABEL: Record<PaymentStatus, string> = {
  pending: 'En attente',
  paid: 'Payée',
  failed: 'Échec',
  refunded: 'Remboursée',
};

const PAYMENT_CLASS: Record<PaymentStatus, string> = {
  pending: 'payPending',
  paid: 'payPaid',
  failed: 'payFailed',
  refunded: 'payRefunded',
};

const PAYMENT_ICON: Record<PaymentStatus, React.ReactNode> = {
  pending: <Clock size={12} />,
  paid: <CheckCircle size={12} />,
  failed: <AlertTriangle size={12} />,
  refunded: <RefreshCw size={12} />,
};

const STATUS_STEPS_DELIVERY: OrderStatus[] = ['pending', 'confirmed', 'preparing', 'shipped', 'delivered'];
const STATUS_STEPS_PICKUP: OrderStatus[] = ['pending', 'confirmed', 'preparing', 'ready_for_pickup', 'delivered'];

const STATUS_META: Record<OrderStatus, { label: string; icon: React.ReactNode; color: string }> = {
  pending: { label: 'En attente', icon: <Clock size={16} />, color: 'orange' },
  confirmed: { label: 'Confirmée', icon: <CheckCircle size={16} />, color: 'blue' },
  preparing: { label: 'En préparation', icon: <Package size={16} />, color: 'orange' },
  shipped: { label: 'Expédiée', icon: <Truck size={16} />, color: 'purple' },
  ready_for_pickup: { label: 'Prête à retirer', icon: <CheckCircle size={16} />, color: 'purple' },
  delivered: { label: 'Livrée', icon: <CheckCircle size={16} />, color: 'green' },
  returned: { label: 'Retournée', icon: <RefreshCw size={16} />, color: 'red' },
  cancelled: { label: 'Annulée', icon: <XCircle size={16} />, color: 'red' },
};

const OrderDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [returnOpen, setReturnOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      ordersService.getMyOrder(id),
      ordersService.listReturns(id).catch(() => [] as ReturnRequest[]),
    ])
      .then(([o, rets]) => { setOrder(o); setReturns(rets); })
      .catch(() => navigate('/account/orders'))
      .finally(() => setLoading(false));
  }, [id]);

  const reloadReturns = () => {
    if (!id) return;
    ordersService.listReturns(id).then(setReturns).catch(() => {});
  };

  const returnEligibility = useMemo(() => {
    if (!order) return { eligible: false, reason: '' };
    if (order.status !== 'delivered') return { eligible: false, reason: 'La commande doit être livrée pour demander un retour.' };
    if (!order.deliveredAt) return { eligible: false, reason: 'Date de livraison introuvable.' };
    const ageDays = (Date.now() - new Date(order.deliveredAt).getTime()) / 86_400_000;
    const daysLeft = RETURN_WINDOW_DAYS - ageDays;
    if (daysLeft <= 0) return { eligible: false, reason: `Le délai de ${RETURN_WINDOW_DAYS} jours est dépassé.` };
    const hasPending = returns.some((r) => r.status === 'pending');
    if (hasPending) return { eligible: false, reason: 'Une demande est déjà en cours.' };
    return { eligible: true, reason: '', daysLeft: Math.ceil(daysLeft) };
  }, [order, returns]);

  const handleCancel = async () => {
    if (!order || !window.confirm('Confirmer l annulation de cette commande ?')) return;
    setCancelling(true);
    try {
      const updated = await ordersService.cancel(order.id);
      setOrder(updated);
    } finally {
      setCancelling(false);
    }
  };

  if (loading) return <Spinner fullPage />;
  if (!order) return null;

  const meta = STATUS_META[order.status];
  const snap = order.shippingSnapshot;
  const isPickup = order.fulfillmentMethod === 'pickup' || snap?.kind === 'pickup';
  const isRelay = order.fulfillmentMethod === 'relay' || snap?.kind === 'relay';
  const STATUS_STEPS = isPickup ? STATUS_STEPS_PICKUP : STATUS_STEPS_DELIVERY;
  const isCancelled = order.status === 'cancelled';
  const currentStep = isCancelled ? -1 : STATUS_STEPS.indexOf(order.status);

  return (
    <div className={styles.wrapper}>
        <nav className={styles.breadcrumb}>
          <Link to="/account/orders">Mes commandes</Link>
          <ChevronRight size={14} />
          <span>{order.orderNumber}</span>
        </nav>

        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>{order.orderNumber}</h1>
            <p className={styles.date}>
              Passée le {new Date(order.createdAt).toLocaleDateString('fr-FR', {
                day: 'numeric', month: 'long', year: 'numeric',
              })}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {order.shippingSpeed === 'express' && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.78rem', fontWeight: 600, padding: '0.4rem 0.8rem', borderRadius: 999, background: '#fff7e0', color: '#c97a00', border: '1px solid #ffe5a3' }}>
                ⚡ Express 24h
              </span>
            )}
            <span className={`${styles.statusBadge} ${styles[meta.color]}`}>
              {meta.icon} {meta.label}
            </span>
          </div>
        </header>

        {/* Progress bar */}
        {!isCancelled && (
          <div className={styles.progress}>
            {STATUS_STEPS.map((step, i) => (
              <div key={step} className={`${styles.step} ${i <= currentStep ? styles.done : ''}`}>
                <div className={styles.dot} />
                <span>{STATUS_META[step].label}</span>
                {i < STATUS_STEPS.length - 1 && <div className={styles.line} />}
              </div>
            ))}
          </div>
        )}

        <div className={styles.grid}>
          {/* Items */}
          <section className={styles.card}>
            <h2 className={styles.cardTitle}><Package size={18} /> Articles commandés</h2>
            <ul className={styles.itemList}>
              {order.items.map((item) => (
                <li key={item.id} className={styles.item}>
                  {item.productImageUrl && (
                    <img src={item.productImageUrl} alt={item.productName} className={styles.thumb} />
                  )}
                  <div className={styles.itemInfo}>
                    <span className={styles.itemName}>{item.productName}</span>
                    <span className={styles.itemMeta}>
                      {order.currency}{Number(item.unitPrice).toFixed(2)} × {item.quantity}
                    </span>
                  </div>
                  <span className={styles.itemTotal}>
                    {order.currency}{Number(item.subtotal).toFixed(2)}
                  </span>
                </li>
              ))}
            </ul>

            <div className={styles.totals}>
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
              {order.taxAmount && Number(order.taxAmount) > 0 && (
                <p style={{ fontSize: '0.78rem', color: '#888', margin: '0.25rem 0 0', textAlign: 'right' }}>
                  dont TVA ({Number(order.taxRate).toFixed(0)}%) : {order.currency}{Number(order.taxAmount).toFixed(2)}
                </p>
              )}
            </div>
          </section>

          {/* Payment */}
          <section className={styles.card}>
            <h2 className={styles.cardTitle}><CreditCard size={18} /> Paiement</h2>
            <div className={`${styles.payRow} ${styles.first}`}>
              <span>Statut</span>
              {order.paymentStatus ? (
                <span className={`${styles.payBadge} ${styles[PAYMENT_CLASS[order.paymentStatus]]}`}>
                  {PAYMENT_ICON[order.paymentStatus]} {PAYMENT_LABEL[order.paymentStatus]}
                </span>
              ) : <span>—</span>}
            </div>
            <div className={styles.payRow}>
              <span>Montant</span>
              <span>{order.currency}{Number(order.total).toFixed(2)}</span>
            </div>
            {order.paidAt && (
              <div className={styles.payRow}>
                <span>Payée le</span>
                <span>{new Date(order.paidAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              </div>
            )}

            {order.paymentStatus === 'failed' && order.status !== 'cancelled' && (
              <Link to={`/account/orders/${order.id}/pay`} className={styles.retryBtn}>
                <CreditCard size={14} /> Réessayer le paiement
              </Link>
            )}
            {order.paymentStatus === 'pending' && order.status !== 'cancelled' && (
              <Link to={`/account/orders/${order.id}/pay`} className={styles.retryBtn} style={{ background: '#C44D3A' }}>
                <CreditCard size={14} /> Finaliser le paiement
              </Link>
            )}
            {(order.paymentStatus === 'paid' || order.paymentStatus === 'refunded') && (
              <button
                type="button"
                className={styles.retryBtn}
                style={{ background: '#fff', color: '#C44D3A', border: '1.5px solid #C44D3A', marginTop: '0.75rem' }}
                onClick={async () => {
                  try {
                    const blob = await ordersService.downloadInvoice(order.id);
                    downloadBlob(blob, `facture-${order.orderNumber}.pdf`);
                  } catch (err: any) {
                    alert(err?.response?.data?.message || 'Téléchargement de la facture impossible');
                  }
                }}
              >
                <FileText size={14} /> Télécharger la facture
              </button>
            )}
            {order.paymentStatus === 'refunded' && (
              <p className={styles.refundedNote}>
                Cette commande a été remboursée. Le crédit apparaît sur votre relevé sous 5 à 10 jours ouvrés.
              </p>
            )}
          </section>

          {/* Returns section */}
          {(returnEligibility.eligible || returns.length > 0) && (
            <section className={styles.card}>
              <h2 className={styles.cardTitle}><RefreshCw size={18} /> Retours</h2>

              {returnEligibility.eligible && (
                <>
                  <p className={styles.payRow} style={{ paddingTop: 0, color: '#555' }}>
                    Vous avez {returnEligibility.daysLeft} jour{(returnEligibility.daysLeft ?? 0) > 1 ? 's' : ''} restants pour demander un retour
                    sur cette commande.
                  </p>
                  <button
                    type="button"
                    className={styles.retryBtn}
                    style={{ background: '#C44D3A', marginTop: '0.5rem' }}
                    onClick={() => setReturnOpen(true)}
                  >
                    <RefreshCw size={14} /> Demander un retour
                  </button>
                </>
              )}

              {returns.length > 0 && (
                <ul style={{ listStyle: 'none', margin: returnEligibility.eligible ? '1rem 0 0' : 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {returns.map((r) => {
                    const badgeStyle =
                      r.status === 'approved' ? { background: '#e6f7ee', color: '#0a6640', border: '1px solid #b8e2c8' }
                      : r.status === 'rejected' ? { background: '#fdf0ef', color: '#c0392b', border: '1px solid #f4c8c4' }
                      : { background: '#fff7e6', color: '#8a5d00', border: '1px solid #ffe5a3' };
                    const label =
                      r.status === 'approved' ? 'Approuvée'
                      : r.status === 'rejected' ? 'Refusée'
                      : 'En cours d examen';
                    return (
                      <li key={r.id} style={{ padding: '0.75rem 0.85rem', background: '#fafaf8', border: '1px solid #f0ebe4', borderRadius: 8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                          <span style={{ fontSize: '0.78rem', color: '#888' }}>
                            {new Date(r.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                            · {r.items.reduce((acc, it) => acc + it.quantity, 0)} article{r.items.reduce((acc, it) => acc + it.quantity, 0) > 1 ? 's' : ''}
                          </span>
                          <span style={{ display: 'inline-flex', alignItems: 'center', fontSize: '0.72rem', fontWeight: 600, padding: '0.2rem 0.55rem', borderRadius: 999, ...badgeStyle }}>
                            {label}
                          </span>
                        </div>
                        <p style={{ fontSize: '0.82rem', color: '#444', margin: '0 0 0.3rem' }}>{r.reason}</p>
                        {r.status === 'approved' && r.refundAmount != null && (
                          <p style={{ fontSize: '0.82rem', color: '#0a6640', margin: 0, fontWeight: 600 }}>
                            Remboursement : {order.currency}{Number(r.refundAmount).toFixed(2)}
                          </p>
                        )}
                        {r.status === 'rejected' && r.rejectReason && (
                          <p style={{ fontSize: '0.82rem', color: '#c0392b', margin: 0, fontStyle: 'italic' }}>
                            Motif : {r.rejectReason}
                          </p>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          )}

          {/* Tracking (delivery only) */}
          {order.trackingNumber && !isPickup && (
            <section className={styles.card}>
              <h2 className={styles.cardTitle}><Truck size={18} /> Suivi de votre colis</h2>
              <div className={styles.payRow} style={{ paddingTop: 0 }}>
                <span>Transporteur</span>
                <span style={{ textTransform: 'capitalize' }}>{order.carrier ?? '—'}</span>
              </div>
              <div className={styles.payRow}>
                <span>Numéro</span>
                <code style={{ fontSize: '0.82rem', background: '#f9f5f0', padding: '0.15rem 0.5rem', borderRadius: 4 }}>{order.trackingNumber}</code>
              </div>
              {order.trackingUrl && (
                <a
                  href={order.trackingUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={styles.retryBtn}
                  style={{ background: '#C44D3A', margin: '0.75rem 0 1rem' }}
                >
                  <ExternalLink size={14} /> Suivre sur le site du transporteur
                </a>
              )}
              <div style={{ borderTop: '1px solid #f0ebe4', paddingTop: '0.85rem' }}>
                <ShipmentTimeline orderId={order.id} />
              </div>
            </section>
          )}

          {/* Address / Pickup / Relay */}
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>
              <MapPin size={18} />
              {isPickup ? 'Retrait en boutique' : isRelay ? 'Point relais' : 'Adresse de livraison'}
            </h2>
            {snap && (isPickup || isRelay) && (
              <address className={styles.address}>
                <strong>{snap.name}</strong>
                <span>{snap.line1}</span>
                {snap.line2 && <span>{snap.line2}</span>}
                <span>{snap.postalCode} {snap.city}</span>
                <span>{snap.country}</span>
                {snap.hours && <span style={{ marginTop: '0.4rem', color: '#C44D3A', fontWeight: 600 }}>{snap.hours}</span>}
                {snap.notes && <span style={{ fontStyle: 'italic', marginTop: '0.3rem' }}>{snap.notes}</span>}
              </address>
            )}
            {snap && !isPickup && !isRelay && (
              <address className={styles.address}>
                <strong>{snap.fullName}</strong>
                <span>{snap.line1}</span>
                {snap.line2 && <span>{snap.line2}</span>}
                <span>{snap.postalCode} {snap.city}</span>
                <span>{snap.country}</span>
                {snap.phone && <span>{snap.phone}</span>}
              </address>
            )}

            {order.notes && (
              <div className={styles.notesBox}>
                <strong>Note :</strong>
                <p>{order.notes}</p>
              </div>
            )}

            {order.status === 'pending' && (
              <button
                className={styles.cancelBtn}
                onClick={handleCancel}
                disabled={cancelling}
              >
                {cancelling ? 'Annulation…' : 'Annuler la commande'}
              </button>
            )}
          </section>
        </div>

      <Link to="/account/orders" className={styles.back}>← Retour à mes commandes</Link>

      <ReturnRequestModal
        open={returnOpen}
        order={order}
        onClose={() => setReturnOpen(false)}
        onSuccess={reloadReturns}
      />
    </div>
  );
};

export default OrderDetail;
