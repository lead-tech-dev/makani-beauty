import { useEffect, useState } from 'react';
import { X, Package, ArrowDownToLine, ArrowUpFromLine, Settings2 } from 'lucide-react';
import { adminStock } from '../../services/admin';
import styles from './StockMovementModal.module.scss';

type MovementType = 'in' | 'out' | 'adjustment';

interface Props {
  open: boolean;
  productId: string;
  productName: string;
  currentStock: number;
  onClose: () => void;
  onSuccess: () => void;
}

const PRESET_REASONS: Record<MovementType, string[]> = {
  in: ['Réapprovisionnement fournisseur', 'Retour client', 'Inventaire physique (surplus)'],
  out: ['Casse / produit endommagé', 'Échantillonnage / cadeau', 'Inventaire physique (manque)'],
  adjustment: ['Correction d inventaire', 'Erreur de saisie', 'Régularisation comptable'],
};

const StockMovementModal = ({ open, productId, productName, currentStock, onClose, onSuccess }: Props) => {
  const [type, setType] = useState<MovementType>('in');
  const [quantity, setQuantity] = useState<string>('1');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setType('in');
    setQuantity('1');
    setReason('');
    setError(null);
    setSubmitting(false);
  }, [open]);

  if (!open) return null;

  const qtyValue = Math.max(1, Number(quantity) || 0);
  const newStock = type === 'in' ? currentStock + qtyValue
                 : type === 'out' ? currentStock - qtyValue
                 : qtyValue; // adjustment = absolute value

  const willGoNegative = newStock < 0;
  const canSubmit = qtyValue > 0 && !willGoNegative && reason.trim().length >= 3 && !submitting;

  const submit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      // For 'adjustment' the backend expects the delta; we compute it.
      const payload: { type: MovementType; quantity: number; reason: string } =
        type === 'adjustment'
          ? { type, quantity: qtyValue - currentStock, reason: reason.trim() }
          : { type, quantity: qtyValue, reason: reason.trim() };
      await adminStock.addMovement(productId, payload);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Le mouvement de stock a échoué.');
      setSubmitting(false);
    }
  };

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      onClick={(e) => { if (e.target === e.currentTarget && !submitting) onClose(); }}
    >
      <div className={styles.modal}>
        <header className={styles.header}>
          <div>
            <h2><Package size={18} /> Mouvement de stock</h2>
            <p className={styles.sub}>{productName}</p>
          </div>
          <button type="button" className={styles.close} onClick={onClose} disabled={submitting} aria-label="Fermer">
            <X size={18} />
          </button>
        </header>

        <div className={styles.body}>
          <div className={styles.currentStock}>
            <span>Stock actuel</span>
            <strong>{currentStock}</strong>
          </div>

          <div className={styles.typeChoice}>
            <TypeButton current={type} value="in" onChange={setType} icon={<ArrowDownToLine size={16} />} label="Entrée" sub="Réappro / retour" />
            <TypeButton current={type} value="out" onChange={setType} icon={<ArrowUpFromLine size={16} />} label="Sortie" sub="Casse / cadeau" />
            <TypeButton current={type} value="adjustment" onChange={setType} icon={<Settings2 size={16} />} label="Ajustement" sub="Correction" />
          </div>

          <div className={styles.field}>
            <label htmlFor="qty">
              {type === 'adjustment' ? 'Stock final souhaité' : 'Quantité'}
            </label>
            <input
              id="qty"
              type="number"
              min={type === 'adjustment' ? 0 : 1}
              step={1}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              disabled={submitting}
            />
          </div>

          <div className={styles.preview}>
            <span className={styles.previewLabel}>Stock après opération</span>
            <strong className={`${styles.previewValue} ${willGoNegative ? styles.previewError : ''}`}>
              {newStock}
              {willGoNegative && <span className={styles.previewHint}>impossible (stock négatif)</span>}
            </strong>
          </div>

          <div className={styles.field}>
            <label htmlFor="reason">Raison <em>(visible dans l historique)</em></label>
            <input
              id="reason"
              list="reason-presets"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ex : livraison fournisseur du 03/05/2026"
              disabled={submitting}
            />
            <datalist id="reason-presets">
              {PRESET_REASONS[type].map((r) => <option key={r} value={r} />)}
            </datalist>
          </div>

          {error && <p className={styles.error} role="alert">{error}</p>}
        </div>

        <footer className={styles.footer}>
          <button type="button" className={styles.btnSecondary} onClick={onClose} disabled={submitting}>
            Annuler
          </button>
          <button type="button" className={styles.btnPrimary} onClick={submit} disabled={!canSubmit}>
            {submitting ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </footer>
      </div>
    </div>
  );
};

const TypeButton = ({ current, value, onChange, icon, label, sub }: {
  current: MovementType;
  value: MovementType;
  onChange: (v: MovementType) => void;
  icon: React.ReactNode;
  label: string;
  sub: string;
}) => (
  <button
    type="button"
    className={`${styles.typeBtn} ${current === value ? styles.typeBtnActive : ''}`}
    onClick={() => onChange(value)}
  >
    {icon}
    <div>
      <strong>{label}</strong>
      <span>{sub}</span>
    </div>
  </button>
);

export default StockMovementModal;
