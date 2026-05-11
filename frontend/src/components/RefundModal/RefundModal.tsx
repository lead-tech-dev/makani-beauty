import { useEffect, useState } from 'react';
import { X, RefreshCw } from 'lucide-react';
import styles from './RefundModal.module.scss';

interface Props {
  open: boolean;
  orderNumber: string;
  currency: string;
  total: number;
  alreadyRefunded: number;
  /** 'pending' | 'confirmed' → stock will be restored on full refund */
  willRestoreStock: boolean;
  onClose: () => void;
  onConfirm: (payload: { amount?: number; reason?: string }) => Promise<void>;
}

const RefundModal = ({
  open, orderNumber, currency, total, alreadyRefunded, willRestoreStock, onClose, onConfirm,
}: Props) => {
  const remaining = +(total - alreadyRefunded).toFixed(2);
  const [mode, setMode] = useState<'full' | 'partial'>('full');
  const [amountInput, setAmountInput] = useState<string>(remaining.toFixed(2));
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Reset state when re-opened
  useEffect(() => {
    if (open) {
      setMode('full');
      setAmountInput(remaining.toFixed(2));
      setReason('');
      setError(null);
      setSubmitting(false);
    }
  }, [open, remaining]);

  if (!open) return null;

  const parsedAmount = Number(amountInput);
  const isPartial = mode === 'partial';
  const amountToRefund = isPartial ? parsedAmount : remaining;
  const amountValid = Number.isFinite(amountToRefund) && amountToRefund > 0 && amountToRefund <= remaining + 0.001;
  const willBeFullRefund = !isPartial || Math.abs(amountToRefund - remaining) < 0.01;

  const handleConfirm = async () => {
    if (!amountValid) {
      setError(`Le montant doit être compris entre 0,01 et ${remaining.toFixed(2)} ${currency}`);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onConfirm({
        amount: isPartial ? parsedAmount : undefined,
        reason: reason.trim() || undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Le remboursement a échoué.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="refund-title"
      onClick={(e) => { if (e.target === e.currentTarget && !submitting) onClose(); }}
    >
      <div className={styles.modal}>
        <header className={styles.header}>
          <div>
            <h2 id="refund-title">
              <RefreshCw size={18} /> Rembourser la commande
            </h2>
            <p className={styles.sub}>{orderNumber}</p>
          </div>
          <button
            type="button"
            className={styles.close}
            onClick={onClose}
            disabled={submitting}
            aria-label="Fermer"
          >
            <X size={18} />
          </button>
        </header>

        <div className={styles.body}>
          <div className={styles.summary}>
            <div className={styles.summaryRow}>
              <span>Total commande</span>
              <strong>{currency}{total.toFixed(2)}</strong>
            </div>
            {alreadyRefunded > 0 && (
              <div className={styles.summaryRow}>
                <span>Déjà remboursé</span>
                <span>−{currency}{alreadyRefunded.toFixed(2)}</span>
              </div>
            )}
            <div className={`${styles.summaryRow} ${styles.summaryHighlight}`}>
              <span>Solde remboursable</span>
              <strong>{currency}{remaining.toFixed(2)}</strong>
            </div>
          </div>

          <fieldset className={styles.modeFieldset}>
            <legend className={styles.legend}>Type de remboursement</legend>
            <label className={`${styles.modeOption} ${mode === 'full' ? styles.active : ''}`}>
              <input
                type="radio"
                name="refund-mode"
                checked={mode === 'full'}
                onChange={() => { setMode('full'); setAmountInput(remaining.toFixed(2)); setError(null); }}
                disabled={submitting}
              />
              <div>
                <strong>Intégral</strong>
                <span>{currency}{remaining.toFixed(2)}</span>
              </div>
            </label>
            <label className={`${styles.modeOption} ${mode === 'partial' ? styles.active : ''}`}>
              <input
                type="radio"
                name="refund-mode"
                checked={mode === 'partial'}
                onChange={() => { setMode('partial'); setError(null); }}
                disabled={submitting}
              />
              <div>
                <strong>Partiel</strong>
                <span>Montant personnalisé</span>
              </div>
            </label>
          </fieldset>

          {mode === 'partial' && (
            <div className={styles.field}>
              <label htmlFor="refund-amount">Montant à rembourser</label>
              <div className={styles.amountInput}>
                <input
                  id="refund-amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={remaining}
                  value={amountInput}
                  onChange={(e) => setAmountInput(e.target.value)}
                  disabled={submitting}
                />
                <span>{currency}</span>
              </div>
            </div>
          )}

          <div className={styles.field}>
            <label htmlFor="refund-reason">Raison (interne, facultatif)</label>
            <textarea
              id="refund-reason"
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ex : produit endommagé, erreur de commande…"
              maxLength={500}
              disabled={submitting}
            />
          </div>

          {willBeFullRefund && willRestoreStock && (
            <p className={styles.notice}>
              ℹ︎ Remboursement intégral : le stock sera restauré et la commande passera en <em>annulée</em>.
            </p>
          )}
          {willBeFullRefund && !willRestoreStock && (
            <p className={styles.notice}>
              ℹ︎ La commande étant déjà expédiée/livrée, le stock ne sera pas modifié automatiquement.
            </p>
          )}

          {error && <p className={styles.error} role="alert">{error}</p>}
        </div>

        <footer className={styles.footer}>
          <button
            type="button"
            className={styles.btnSecondary}
            onClick={onClose}
            disabled={submitting}
          >
            Annuler
          </button>
          <button
            type="button"
            className={styles.btnDanger}
            onClick={handleConfirm}
            disabled={submitting || !amountValid}
          >
            {submitting
              ? 'Remboursement…'
              : `Rembourser ${currency}${amountToRefund.toFixed(2)}`}
          </button>
        </footer>
      </div>
    </div>
  );
};

export default RefundModal;
