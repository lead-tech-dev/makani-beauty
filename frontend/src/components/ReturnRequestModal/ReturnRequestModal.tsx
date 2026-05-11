import { useEffect, useState } from 'react';
import { X, Minus, Plus, RefreshCw } from 'lucide-react';
import { ordersService } from '../../services/orders';
import type { Order, OrderItem } from '../../types';
import styles from './ReturnRequestModal.module.scss';

interface Props {
  open: boolean;
  order: Order;
  onClose: () => void;
  onSuccess: () => void;
}

const ReturnRequestModal = ({ open, order, onClose, onSuccess }: Props) => {
  // Per-item quantity selected for return (capped at orderItem.quantity).
  const [qty, setQty] = useState<Record<string, number>>({});
  const [reason, setReason] = useState('');
  const [agree, setAgree] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    // Reset state on open
    setQty({});
    setReason('');
    setAgree(false);
    setError(null);
    setSubmitting(false);
  }, [open]);

  if (!open) return null;

  const setItemQty = (item: OrderItem, value: number) => {
    const clamped = Math.max(0, Math.min(item.quantity, value));
    setQty((prev) => ({ ...prev, [item.id]: clamped }));
  };

  const selectedItems = order.items
    .map((it) => ({ orderItemId: it.id, quantity: qty[it.id] ?? 0 }))
    .filter((x) => x.quantity > 0);

  const refundEstimate = selectedItems.reduce((acc, sel) => {
    const it = order.items.find((x) => x.id === sel.orderItemId);
    return acc + Number(it?.unitPrice ?? 0) * sel.quantity;
  }, 0);

  const canSubmit = selectedItems.length > 0 && reason.trim().length >= 5 && agree && !submitting;

  const submit = async () => {
    if (!canSubmit) return;
    setError(null);
    setSubmitting(true);
    try {
      await ordersService.createReturn(order.id, {
        reason: reason.trim(),
        items: selectedItems,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'L envoi de la demande a échoué.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="return-title"
      onClick={(e) => { if (e.target === e.currentTarget && !submitting) onClose(); }}
    >
      <div className={styles.modal}>
        <header className={styles.header}>
          <div>
            <h2 id="return-title"><RefreshCw size={18} /> Demander un retour</h2>
            <p className={styles.sub}>{order.orderNumber}</p>
          </div>
          <button type="button" className={styles.close} onClick={onClose} disabled={submitting} aria-label="Fermer">
            <X size={18} />
          </button>
        </header>

        <div className={styles.body}>
          <div>
            <h3 className={styles.sectionTitle}>Articles à retourner</h3>
            <ul className={styles.itemList}>
              {order.items.map((it) => {
                const selected = qty[it.id] ?? 0;
                return (
                  <li key={it.id} className={`${styles.item} ${selected > 0 ? styles.itemSelected : ''}`}>
                    {it.productImageUrl && (
                      <img src={it.productImageUrl} alt="" className={styles.thumb} />
                    )}
                    <div className={styles.itemInfo}>
                      <strong>{it.productName}</strong>
                      <span>{order.currency}{Number(it.unitPrice).toFixed(2)} · max {it.quantity}</span>
                    </div>
                    <div className={styles.qtyControls}>
                      <button
                        type="button"
                        onClick={() => setItemQty(it, selected - 1)}
                        disabled={selected <= 0 || submitting}
                        aria-label="Diminuer"
                      >
                        <Minus size={14} />
                      </button>
                      <span>{selected}</span>
                      <button
                        type="button"
                        onClick={() => setItemQty(it, selected + 1)}
                        disabled={selected >= it.quantity || submitting}
                        aria-label="Augmenter"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className={styles.field}>
            <label htmlFor="return-reason">Motif du retour</label>
            <textarea
              id="return-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              maxLength={1000}
              placeholder="Ex : produit endommagé à la livraison, ne correspond pas à mes attentes…"
              disabled={submitting}
            />
            <span className={styles.hint}>Minimum 5 caractères · {reason.length}/1000</span>
          </div>

          {refundEstimate > 0 && (
            <div className={styles.estimateBox}>
              <span>Remboursement estimé</span>
              <strong>{order.currency}{refundEstimate.toFixed(2)}</strong>
            </div>
          )}

          <label className={styles.consent}>
            <input
              type="checkbox"
              checked={agree}
              onChange={(e) => setAgree(e.target.checked)}
              disabled={submitting}
            />
            <span>
              Je renverrai les articles dans leur emballage d origine, non ouverts ni utilisés, dans
              un délai de 14 jours après réception. J accepte les <a href="/cgv" target="_blank" rel="noreferrer">conditions générales de vente</a>.
            </span>
          </label>

          {error && <p className={styles.error} role="alert">{error}</p>}
        </div>

        <footer className={styles.footer}>
          <button type="button" className={styles.btnSecondary} onClick={onClose} disabled={submitting}>
            Annuler
          </button>
          <button type="button" className={styles.btnPrimary} onClick={submit} disabled={!canSubmit}>
            {submitting ? 'Envoi…' : 'Envoyer la demande'}
          </button>
        </footer>
      </div>
    </div>
  );
};

export default ReturnRequestModal;
