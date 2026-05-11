import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, MapPin, Package, User, FileText, CreditCard, RefreshCw, Truck, ExternalLink, Download, Zap, Receipt } from 'lucide-react';
import api, { ApiOrder, ApiPaymentStatus } from '../../lib/api';
import { adminOrders } from '../../services/admin';
import { downloadBlob } from '../../lib/downloadBlob';
import Spinner from '../../components/Spinner/Spinner';
import RefundModal from '../../components/RefundModal/RefundModal';
import ShipModal from '../../components/ShipModal/ShipModal';
import shared from './admin.module.scss';

const STATUS_LABELS: Record<ApiOrder['status'], string> = {
  pending: 'En attente',
  confirmed: 'Confirmée',
  preparing: 'En préparation',
  shipped: 'Expédiée',
  ready_for_pickup: 'Prête à retirer',
  delivered: 'Livrée',
  returned: 'Retournée',
  cancelled: 'Annulée',
};

const PAYMENT_LABELS: Record<ApiPaymentStatus, string> = {
  pending: 'En attente',
  paid: 'Payée',
  failed: 'Échec',
  refunded: 'Remboursée',
};

const PAYMENT_CLASS: Record<ApiPaymentStatus, string> = {
  pending: 'payPending',
  paid: 'payPaid',
  failed: 'payFailed',
  refunded: 'payRefunded',
};

const NEXT_STATUSES_DELIVERY: Record<ApiOrder['status'], ApiOrder['status'][]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['preparing', 'cancelled'],
  preparing: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  ready_for_pickup: [],
  delivered: ['returned'],
  returned: [],
  cancelled: [],
};

const NEXT_STATUSES_PICKUP: Record<ApiOrder['status'], ApiOrder['status'][]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['preparing', 'cancelled'],
  preparing: ['ready_for_pickup', 'cancelled'],
  ready_for_pickup: ['delivered', 'cancelled'],
  shipped: [],
  delivered: ['returned'],
  returned: [],
  cancelled: [],
};

const AdminOrderDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<ApiOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [refundOpen, setRefundOpen] = useState(false);
  const [shipOpen, setShipOpen] = useState(false);
  const [estimatedWeight, setEstimatedWeight] = useState<number>(0);
  const [customerName, setCustomerName] = useState<string>('');

  useEffect(() => {
    if (!id) return;
    adminOrders.getById(id)
      .then(async (found) => {
        setOrder(found);
        if (found) {
          api.get<any>(`/users/${found.userId}`).then((u) => setCustomerName(u.data?.fullName ?? '')).catch(() => {});
          // Compute total estimated weight from products (best-effort, ignores errors)
          try {
            const productIds = [...new Set(found.items.map((i) => i.productId))];
            const products = await Promise.all(
              productIds.map((pid) => api.get<any>(`/products/${pid}`).then((r) => r.data).catch(() => null)),
            );
            const total = found.items.reduce((acc, item) => {
              const p = products.find((pp) => pp?.id === item.productId);
              return acc + (Number(p?.weightGrams) || 0) * item.quantity;
            }, 0);
            setEstimatedWeight(total);
          } catch { /* ignore */ }
        }
      })
      .catch(() => setOrder(null))
      .finally(() => setLoading(false));
  }, [id]);

  const transition = async (status: ApiOrder['status']) => {
    if (!order) return;
    if (!window.confirm(`Marquer cette commande comme "${STATUS_LABELS[status]}" ?`)) return;
    setUpdating(true);
    try {
      const updated = await adminOrders.updateStatus(order.id, status);
      setOrder({ ...order, ...updated });
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Erreur');
    } finally {
      setUpdating(false);
    }
  };

  const handleRefundConfirm = async (payload: { amount?: number; reason?: string }) => {
    if (!order) return;
    const updated = await adminOrders.refund(order.id, payload);
    setOrder({ ...order, ...updated });
  };

  const handleShipConfirm = async (payload: { carrier: any; weightOverrideGrams?: number }) => {
    if (!order) return;
    const updated = await adminOrders.ship(order.id, payload);
    setOrder({ ...order, ...updated });
  };

  if (loading) return <Spinner fullPage />;
  if (!order) return <p>Commande introuvable.</p>;

  const snap = order.shippingSnapshot ?? {};
  const isPickup = order.fulfillmentMethod === 'pickup' || (snap as any)?.kind === 'pickup';
  const isRelay = order.fulfillmentMethod === 'relay' || (snap as any)?.kind === 'relay';
  const next = (isPickup ? NEXT_STATUSES_PICKUP : NEXT_STATUSES_DELIVERY)[order.status];

  return (
    <div>
      <Link to="/admin/orders" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.85rem', color: '#888', textDecoration: 'none', marginBottom: '1rem' }}>
        <ChevronLeft size={16} /> Retour aux commandes
      </Link>

      <header className={shared.pageHeader}>
        <div>
          <h1 className={shared.title}>{order.orderNumber}</h1>
          <p className={shared.sub}>
            Passée le {new Date(order.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {order.shippingSpeed === 'express' && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.78rem', fontWeight: 600, padding: '0.4rem 0.8rem', borderRadius: 999, background: '#fff7e0', color: '#c97a00', border: '1px solid #ffe5a3' }}>
              <Zap size={13} /> Express 24h
            </span>
          )}
          <span className={`${shared.badge} ${shared[order.status]}`} style={{ fontSize: '0.82rem', padding: '0.4rem 1rem' }}>
            {STATUS_LABELS[order.status]}
          </span>
        </div>
      </header>

      {next.length > 0 && (
        <div className={shared.card} style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <strong style={{ fontSize: '0.9rem', marginRight: '0.5rem' }}>Actions :</strong>
          {next.map((s) => {
            // Shipping flow: open the dedicated modal instead of a flat status patch
            if (s === 'shipped') {
              return (
                <button
                  key={s}
                  className={shared.btnPrimary}
                  onClick={() => setShipOpen(true)}
                  disabled={updating}
                >
                  <Truck size={14} /> Expédier…
                </button>
              );
            }
            return (
              <button
                key={s}
                className={s === 'cancelled' ? `${shared.btnSecondary} ${shared.btnDanger}` : shared.btnPrimary}
                onClick={() => transition(s)}
                disabled={updating}
              >
                {s === 'confirmed' && 'Confirmer'}
                {s === 'preparing' && 'Marquer en préparation'}
                {s === 'ready_for_pickup' && 'Marquer prête'}
                {s === 'delivered' && (isPickup ? 'Marquer retirée' : 'Marquer livrée')}
                {s === 'returned' && 'Marquer retournée'}
                {s === 'cancelled' && 'Annuler la commande'}
              </button>
            );
          })}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1.5rem', alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', minWidth: 0 }}>
          <section className={shared.card}>
            <h2 style={{ fontFamily: 'Bricolage Grotesque, Inter, sans-serif', fontSize: '1.1rem', fontWeight: 600, marginTop: 0, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Package size={18} /> Articles ({order.items.length})
            </h2>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {order.items.map((item) => (
                <li key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', paddingBottom: '1rem', borderBottom: '1px solid #f7f3ed' }}>
                  {item.productImageUrl && (
                    <img src={item.productImageUrl} alt="" className={shared.thumb} style={{ width: 56, height: 56 }} />
                  )}
                  <div style={{ flex: 1 }}>
                    <strong style={{ fontSize: '0.9rem' }}>{item.productName}</strong>
                    <div style={{ fontSize: '0.8rem', color: '#888' }}>
                      {order.currency}{Number(item.unitPrice).toFixed(2)} × {item.quantity}
                    </div>
                  </div>
                  <strong style={{ color: '#C44D3A' }}>
                    {order.currency}{Number(item.subtotal).toFixed(2)}
                  </strong>
                </li>
              ))}
            </ul>

            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #f0ebe4', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
                <span>Sous-total</span>
                <span>{order.currency}{Number(order.subtotal).toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
                <span>Livraison</span>
                <span>{Number(order.shippingFee) === 0 ? 'Offerte' : `${order.currency}${Number(order.shippingFee).toFixed(2)}`}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', paddingTop: '0.5rem', borderTop: '1px solid #f0ebe4' }}>
                <strong>Total</strong>
                <strong style={{ color: '#C44D3A' }}>{order.currency}{Number(order.total).toFixed(2)}</strong>
              </div>
            </div>
          </section>

          {order.notes && (
            <section className={shared.card}>
              <h2 style={{ fontFamily: 'Bricolage Grotesque, Inter, sans-serif', fontSize: '1.1rem', fontWeight: 600, marginTop: 0, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileText size={18} /> Note du client
              </h2>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#444' }}>{order.notes}</p>
            </section>
          )}
        </div>

        <aside style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <section className={shared.card}>
            <h2 style={{ fontFamily: 'Bricolage Grotesque, Inter, sans-serif', fontSize: '1.05rem', fontWeight: 600, marginTop: 0, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CreditCard size={16} /> Paiement
            </h2>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', color: '#666', padding: '0.35rem 0' }}>
              <span>Statut</span>
              {order.paymentStatus ? (
                <span className={`${shared.payBadge} ${shared[PAYMENT_CLASS[order.paymentStatus]]}`}>
                  {PAYMENT_LABELS[order.paymentStatus]}
                </span>
              ) : <span>—</span>}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#666', padding: '0.35rem 0' }}>
              <span>Montant</span>
              <strong style={{ color: '#1a1a1a' }}>{order.currency}{Number(order.total).toFixed(2)}</strong>
            </div>
            {order.paidAt && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#666', padding: '0.35rem 0' }}>
                <span>Payée le</span>
                <span style={{ color: '#1a1a1a' }}>{new Date(order.paidAt).toLocaleString('fr-FR')}</span>
              </div>
            )}
            {order.stripePaymentIntentId && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', color: '#888', padding: '0.35rem 0', gap: '0.5rem' }}>
                <span>Stripe</span>
                <code style={{ fontSize: '0.72rem', color: '#444', background: '#f9f5f0', padding: '0.15rem 0.4rem', borderRadius: 4, overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '180px', whiteSpace: 'nowrap' }}>
                  {order.stripePaymentIntentId}
                </code>
              </div>
            )}

            {order.paymentStatus === 'paid' && (
              <>
                {Number(order.refundedAmount ?? 0) > 0 && (
                  <p style={{ margin: '0.6rem 0 0.4rem', padding: '0.55rem 0.75rem', background: '#fff7e6', border: '1px solid #ffe5a3', color: '#8a5d00', fontSize: '0.78rem', borderRadius: 6 }}>
                    Déjà remboursé : <strong>{order.currency}{Number(order.refundedAmount).toFixed(2)}</strong>
                    {' '} sur {order.currency}{Number(order.total).toFixed(2)}
                  </p>
                )}
                <button
                  onClick={() => setRefundOpen(true)}
                  className={`${shared.btnSecondary} ${shared.btnDanger}`}
                  style={{ width: '100%', marginTop: '0.75rem', justifyContent: 'center' }}
                >
                  <RefreshCw size={14} />
                  Rembourser…
                </button>
              </>
            )}
            {(order.paymentStatus === 'paid' || order.paymentStatus === 'refunded') && (
              <button
                onClick={async () => {
                  try {
                    const blob = await adminOrders.downloadInvoice(order.id);
                    downloadBlob(blob, `facture-${order.orderNumber}.pdf`);
                  } catch (err: any) {
                    alert(err?.response?.data?.message || 'Téléchargement impossible');
                  }
                }}
                className={shared.btnSecondary}
                style={{ width: '100%', marginTop: '0.6rem', justifyContent: 'center' }}
              >
                <Receipt size={14} /> Télécharger la facture
              </button>
            )}
            {order.paymentStatus === 'refunded' && (
              <p style={{ margin: '0.75rem 0 0', padding: '0.6rem 0.85rem', background: '#f0eef9', color: '#5b3aa6', fontSize: '0.78rem', borderRadius: 6 }}>
                Remboursée intégralement. Le crédit apparaît sur la carte du client sous 5 à 10 jours ouvrés.
              </p>
            )}
            {order.paymentStatus === 'failed' && (
              <p style={{ margin: '0.75rem 0 0', padding: '0.6rem 0.85rem', background: '#fdf0ef', color: '#c0392b', fontSize: '0.78rem', borderRadius: 6 }}>
                Le client peut réessayer le paiement depuis son espace.
              </p>
            )}
          </section>

          <section className={shared.card}>
            <h2 style={{ fontFamily: 'Bricolage Grotesque, Inter, sans-serif', fontSize: '1.05rem', fontWeight: 600, marginTop: 0, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <User size={16} /> Client
            </h2>
            <p style={{ margin: 0, fontSize: '0.88rem', color: '#444' }}>
              {customerName || <span style={{ color: '#bbb' }}>Chargement…</span>}
            </p>
          </section>

          <section className={shared.card}>
            <h2 style={{ fontFamily: 'Bricolage Grotesque, Inter, sans-serif', fontSize: '1.05rem', fontWeight: 600, marginTop: 0, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MapPin size={16} /> {isPickup ? 'Retrait en boutique' : isRelay ? 'Point relais' : 'Livraison'}
            </h2>
            {(isPickup || isRelay) ? (
              <address style={{ fontStyle: 'normal', display: 'flex', flexDirection: 'column', gap: '0.15rem', fontSize: '0.85rem', color: '#444' }}>
                <strong style={{ color: '#1a1a1a' }}>{(snap as any).name}</strong>
                <span>{(snap as any).line1}</span>
                {(snap as any).line2 && <span>{(snap as any).line2}</span>}
                <span>{(snap as any).postalCode} {(snap as any).city}</span>
                <span>{(snap as any).country}</span>
                {(snap as any).hours && <span style={{ marginTop: '0.4rem', color: '#C44D3A', fontWeight: 600 }}>{(snap as any).hours}</span>}
              </address>
            ) : (
              <address style={{ fontStyle: 'normal', display: 'flex', flexDirection: 'column', gap: '0.15rem', fontSize: '0.85rem', color: '#444' }}>
                <strong style={{ color: '#1a1a1a' }}>{snap.fullName}</strong>
                <span>{snap.line1}</span>
                {snap.line2 && <span>{snap.line2}</span>}
                <span>{snap.postalCode} {snap.city}</span>
                <span>{snap.country}</span>
                {snap.phone && <span style={{ marginTop: '0.4rem', color: '#888' }}>{snap.phone}</span>}
              </address>
            )}
          </section>

          {order.trackingNumber && (
            <section className={shared.card}>
              <h2 style={{ fontFamily: 'Bricolage Grotesque, Inter, sans-serif', fontSize: '1.05rem', fontWeight: 600, marginTop: 0, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Truck size={16} /> Suivi colis
              </h2>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#666', padding: '0.35rem 0' }}>
                <span>Transporteur</span>
                <strong style={{ color: '#1a1a1a', textTransform: 'capitalize' }}>{order.carrier ?? '—'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#888', padding: '0.35rem 0', gap: '0.5rem' }}>
                <span>Numéro</span>
                <code style={{ fontSize: '0.78rem', color: '#444', background: '#f9f5f0', padding: '0.15rem 0.4rem', borderRadius: 4, overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '180px', whiteSpace: 'nowrap' }}>
                  {order.trackingNumber}
                </code>
              </div>
              {order.trackingUrl && (
                <a
                  href={order.trackingUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={shared.btnSecondary}
                  style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%', textDecoration: 'none', marginTop: '0.6rem' }}
                >
                  <ExternalLink size={13} /> Suivre le colis
                </a>
              )}
              {order.labelUrl && (
                <a
                  href={order.labelUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={shared.btnPrimary}
                  style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%', textDecoration: 'none', marginTop: '0.5rem' }}
                >
                  <Download size={13} /> Bordereau d expédition
                </a>
              )}
            </section>
          )}

          {(order.shippedAt || order.deliveredAt) && (
            <section className={shared.card}>
              <h2 style={{ fontFamily: 'Bricolage Grotesque, Inter, sans-serif', fontSize: '1.05rem', fontWeight: 600, marginTop: 0, marginBottom: '0.75rem' }}>
                Chronologie
              </h2>
              <div style={{ fontSize: '0.85rem', color: '#444', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {order.shippedAt && (
                  <div>
                    <strong>Expédiée :</strong> {new Date(order.shippedAt).toLocaleString('fr-FR')}
                  </div>
                )}
                {order.deliveredAt && (
                  <div>
                    <strong>Livrée :</strong> {new Date(order.deliveredAt).toLocaleString('fr-FR')}
                  </div>
                )}
              </div>
            </section>
          )}
        </aside>
      </div>

      <RefundModal
        open={refundOpen}
        orderNumber={order.orderNumber}
        currency={order.currency}
        total={Number(order.total)}
        alreadyRefunded={Number(order.refundedAmount ?? 0)}
        willRestoreStock={order.status === 'pending' || order.status === 'confirmed'}
        onClose={() => setRefundOpen(false)}
        onConfirm={handleRefundConfirm}
      />

      <ShipModal
        open={shipOpen}
        orderNumber={order.orderNumber}
        estimatedWeightGrams={estimatedWeight}
        preferredCarrier={order.shippingSpeed === 'express' ? 'chronopost' : 'colissimo'}
        onClose={() => setShipOpen(false)}
        onConfirm={handleShipConfirm}
      />
    </div>
  );
};

export default AdminOrderDetail;
