import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ChevronLeft, RefreshCw, Check, X as XIcon, Package, ExternalLink } from 'lucide-react';
import { adminReturns } from '../../services/admin';
import type { ReturnRequest } from '../../types';
import api from '../../lib/api';
import Spinner from '../../components/Spinner/Spinner';
import shared from './admin.module.scss';

const AdminReturnDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [ret, setRet] = useState<ReturnRequest | null>(null);
  const [orderNumber, setOrderNumber] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [showApprove, setShowApprove] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [refundAmount, setRefundAmount] = useState<string>('');
  const [rejectReason, setRejectReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    adminReturns.getById(id)
      .then(async (r) => {
        setRet(r);
        try {
          const ord = await api.get<any>(`/orders/admin/${r.orderId}`).then((x) => x.data);
          setOrderNumber(ord?.orderNumber ?? '');
        } catch { /* noop */ }
      })
      .catch(() => navigate('/admin/returns'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  if (loading) return <Spinner fullPage />;
  if (!ret) return <p>Demande introuvable.</p>;

  const totalQty = ret.items.reduce((acc, it) => acc + it.quantity, 0);
  const itemsValue = ret.items.reduce((acc, it) => acc + Number(it.unitPrice) * it.quantity, 0);
  const isPending = ret.status === 'pending';

  const openApprove = () => {
    setRefundAmount(itemsValue.toFixed(2));
    setError(null);
    setShowApprove(true);
  };

  const openReject = () => {
    setRejectReason('');
    setError(null);
    setShowReject(true);
  };

  const submitApprove = async () => {
    setError(null);
    setBusy(true);
    try {
      const updated = await adminReturns.approve(ret.id, {
        refundAmount: refundAmount && Number(refundAmount) > 0 ? Number(refundAmount) : undefined,
      });
      setRet(updated);
      setShowApprove(false);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Approbation impossible.');
    } finally {
      setBusy(false);
    }
  };

  const submitReject = async () => {
    if (rejectReason.trim().length < 3) {
      setError('Motif trop court.');
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const updated = await adminReturns.reject(ret.id, rejectReason.trim());
      setRet(updated);
      setShowReject(false);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Refus impossible.');
    } finally {
      setBusy(false);
    }
  };

  const STATUS_LABEL: Record<typeof ret.status, string> = {
    pending: 'En attente',
    approved: 'Approuvée',
    rejected: 'Refusée',
  };
  const STATUS_COLOR: Record<typeof ret.status, { bg: string; fg: string; border: string }> = {
    pending: { bg: '#fff7e6', fg: '#8a5d00', border: '#ffe5a3' },
    approved: { bg: '#e6f7ee', fg: '#0a6640', border: '#b8e2c8' },
    rejected: { bg: '#fdf0ef', fg: '#c0392b', border: '#f4c8c4' },
  };
  const sc = STATUS_COLOR[ret.status];

  return (
    <div>
      <Link to="/admin/returns" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.85rem', color: '#888', textDecoration: 'none', marginBottom: '1rem' }}>
        <ChevronLeft size={16} /> Retour aux demandes
      </Link>

      <header className={shared.pageHeader}>
        <div>
          <h1 className={shared.title}>Demande de retour</h1>
          <p className={shared.sub}>
            Reçue le {new Date(ret.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <span style={{ display: 'inline-flex', alignItems: 'center', fontSize: '0.85rem', fontWeight: 600, padding: '0.4rem 0.95rem', borderRadius: 999, background: sc.bg, color: sc.fg, border: `1px solid ${sc.border}` }}>
          {STATUS_LABEL[ret.status]}
        </span>
      </header>

      {isPending && (
        <div className={shared.card} style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <strong style={{ fontSize: '0.9rem', marginRight: '0.5rem' }}>Actions :</strong>
          <button className={shared.btnPrimary} onClick={openApprove} disabled={busy}>
            <Check size={14} /> Approuver et rembourser
          </button>
          <button className={`${shared.btnSecondary} ${shared.btnDanger}`} onClick={openReject} disabled={busy}>
            <XIcon size={14} /> Refuser avec motif
          </button>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1.5rem', alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <section className={shared.card}>
            <h2 style={{ fontFamily: 'Bricolage Grotesque, Inter, sans-serif', fontSize: '1.1rem', fontWeight: 600, margin: '0 0 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Package size={18} /> Articles concernés ({totalQty})
            </h2>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {ret.items.map((it) => (
                <li key={it.orderItemId} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0.85rem', background: '#fafaf8', borderRadius: 8, fontSize: '0.9rem' }}>
                  <span><strong>{it.productName}</strong> — ×{it.quantity}</span>
                  <span style={{ color: '#C44D3A', fontWeight: 600 }}>{(Number(it.unitPrice) * it.quantity).toFixed(2)} €</span>
                </li>
              ))}
            </ul>
            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #f0ebe4', display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: 600 }}>
              <span>Valeur des articles retournés</span>
              <strong style={{ color: '#C44D3A' }}>{itemsValue.toFixed(2)} €</strong>
            </div>
          </section>

          <section className={shared.card}>
            <h2 style={{ fontFamily: 'Bricolage Grotesque, Inter, sans-serif', fontSize: '1.05rem', fontWeight: 600, margin: '0 0 0.75rem' }}>Motif du client</h2>
            <p style={{ margin: 0, padding: '0.75rem 0.95rem', background: '#fafaf8', borderRadius: 8, fontSize: '0.9rem', color: '#444', lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>
              {ret.reason}
            </p>
          </section>

          {ret.status === 'rejected' && ret.rejectReason && (
            <section className={shared.card}>
              <h2 style={{ fontFamily: 'Bricolage Grotesque, Inter, sans-serif', fontSize: '1.05rem', fontWeight: 600, margin: '0 0 0.75rem', color: '#c0392b' }}>Motif du refus communiqué</h2>
              <p style={{ margin: 0, padding: '0.75rem 0.95rem', background: '#fdf0ef', border: '1px solid #f4c8c4', borderRadius: 8, fontSize: '0.9rem', color: '#a3392b', lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>
                {ret.rejectReason}
              </p>
            </section>
          )}

          {ret.status === 'approved' && ret.refundAmount != null && (
            <section className={shared.card}>
              <h2 style={{ fontFamily: 'Bricolage Grotesque, Inter, sans-serif', fontSize: '1.05rem', fontWeight: 600, margin: '0 0 0.75rem', color: '#0a6640' }}>Remboursement effectué</h2>
              <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: '#0a6640' }}>
                {Number(ret.refundAmount).toFixed(2)} €
              </p>
              {ret.processedAt && (
                <p style={{ margin: '0.3rem 0 0', fontSize: '0.78rem', color: '#888' }}>
                  Traitée le {new Date(ret.processedAt).toLocaleString('fr-FR')}
                </p>
              )}
            </section>
          )}
        </div>

        <aside style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <section className={shared.card}>
            <h2 style={{ fontFamily: 'Bricolage Grotesque, Inter, sans-serif', fontSize: '1.05rem', fontWeight: 600, margin: '0 0 0.75rem' }}>Commande</h2>
            <Link
              to={`/admin/orders/${ret.orderId}`}
              className={shared.btnSecondary}
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%' }}
            >
              <ExternalLink size={13} /> {orderNumber || 'Voir la commande'}
            </Link>
          </section>
        </aside>
      </div>

      {/* Approve modal */}
      {showApprove && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', zIndex: 999 }} onClick={(e) => { if (e.target === e.currentTarget && !busy) setShowApprove(false); }}>
          <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 460, padding: '1.5rem 1.75rem', boxShadow: '0 12px 48px rgba(10,61,49,0.2)' }}>
            <h3 style={{ marginTop: 0, fontFamily: 'Bricolage Grotesque, Inter, sans-serif', fontSize: '1.3rem' }}>Approuver et rembourser</h3>
            <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '1rem' }}>
              Le remboursement sera issu via le moyen de paiement initial (Stripe ou PayPal).
              Le stock sera restauré pour les articles retournés et la commande passera en <strong>Retournée</strong>.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '0.75rem' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#555' }}>Montant à rembourser (€)</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                style={{ border: '1.5px solid #e0d8d0', borderRadius: 8, padding: '0.65rem 0.85rem', fontSize: '0.95rem' }}
                disabled={busy}
              />
              <span style={{ fontSize: '0.75rem', color: '#888' }}>
                Par défaut : valeur des articles retournés ({itemsValue.toFixed(2)} €)
              </span>
            </div>
            {error && <p style={{ background: '#fdf0ef', border: '1px solid #f4c8c4', color: '#c0392b', padding: '0.6rem 0.85rem', borderRadius: 8, fontSize: '0.85rem', margin: '0 0 0.75rem' }}>{error}</p>}
            <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'flex-end' }}>
              <button className={shared.btnSecondary} onClick={() => setShowApprove(false)} disabled={busy}>Annuler</button>
              <button className={shared.btnPrimary} onClick={submitApprove} disabled={busy || Number(refundAmount) <= 0}>
                {busy ? 'Traitement…' : `Rembourser ${Number(refundAmount || 0).toFixed(2)} €`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject modal */}
      {showReject && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', zIndex: 999 }} onClick={(e) => { if (e.target === e.currentTarget && !busy) setShowReject(false); }}>
          <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 460, padding: '1.5rem 1.75rem', boxShadow: '0 12px 48px rgba(10,61,49,0.2)' }}>
            <h3 style={{ marginTop: 0, fontFamily: 'Bricolage Grotesque, Inter, sans-serif', fontSize: '1.3rem' }}>Refuser la demande</h3>
            <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.75rem' }}>
              Le motif sera communiqué au client par email.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
              maxLength={1000}
              placeholder="Ex : produits ouverts ou utilisés, pas conformes à notre politique de retour…"
              style={{ width: '100%', border: '1.5px solid #e0d8d0', borderRadius: 8, padding: '0.65rem 0.85rem', fontSize: '0.9rem', fontFamily: 'inherit', marginBottom: '0.75rem' }}
              disabled={busy}
            />
            {error && <p style={{ background: '#fdf0ef', border: '1px solid #f4c8c4', color: '#c0392b', padding: '0.6rem 0.85rem', borderRadius: 8, fontSize: '0.85rem', margin: '0 0 0.75rem' }}>{error}</p>}
            <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'flex-end' }}>
              <button className={shared.btnSecondary} onClick={() => setShowReject(false)} disabled={busy}>Annuler</button>
              <button className={`${shared.btnSecondary} ${shared.btnDanger}`} onClick={submitReject} disabled={busy || rejectReason.trim().length < 3}>
                {busy ? 'Envoi…' : 'Refuser et notifier'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReturnDetail;
