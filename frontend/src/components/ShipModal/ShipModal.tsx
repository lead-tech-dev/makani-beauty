import { useEffect, useState } from 'react';
import { X, Truck, Package } from 'lucide-react';
import { adminOrders } from '../../services/admin';
import styles from './ShipModal.module.scss';

interface Carrier {
  code: string;
  displayName: string;
  isAvailable: boolean;
}

interface Props {
  open: boolean;
  orderNumber: string;
  estimatedWeightGrams: number; // computed from products before opening
  /** Pre-select the carrier matching the order's shipping speed (express → chronopost). */
  preferredCarrier?: 'colissimo' | 'mondial-relay' | 'chronopost';
  onClose: () => void;
  onConfirm: (payload: { carrier: any; weightOverrideGrams?: number }) => Promise<void>;
}

const ShipModal = ({ open, orderNumber, estimatedWeightGrams, preferredCarrier, onClose, onConfirm }: Props) => {
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [carrier, setCarrier] = useState<string>('colissimo');
  const [overrideWeight, setOverrideWeight] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setSubmitting(false);
    setOverrideWeight('');
    adminOrders.listCarriers()
      .then((list) => {
        setCarriers(list);
        const preferred = preferredCarrier ? list.find((c) => c.code === preferredCarrier && c.isAvailable) : null;
        const first = preferred ?? list.find((c) => c.isAvailable) ?? list[0];
        if (first) setCarrier(first.code);
      })
      .catch(() => setError('Impossible de charger la liste des transporteurs.'));
  }, [open, preferredCarrier]);

  if (!open) return null;

  const usingOverride = overrideWeight.trim().length > 0;
  const overrideValue = Number(overrideWeight);
  const overrideValid = !usingOverride || (Number.isFinite(overrideValue) && overrideValue > 0);
  const finalWeight = usingOverride ? overrideValue : estimatedWeightGrams;
  const canSubmit = !!carrier && finalWeight > 0 && overrideValid && !submitting;

  const handleConfirm = async () => {
    setError(null);
    setSubmitting(true);
    try {
      await onConfirm({
        carrier,
        weightOverrideGrams: usingOverride ? Math.round(overrideValue) : undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'L expédition a échoué.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="ship-title"
      onClick={(e) => { if (e.target === e.currentTarget && !submitting) onClose(); }}
    >
      <div className={styles.modal}>
        <header className={styles.header}>
          <div>
            <h2 id="ship-title">
              <Truck size={18} /> Expédier la commande
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
          <div className={styles.field}>
            <label htmlFor="ship-carrier">Transporteur</label>
            <select
              id="ship-carrier"
              value={carrier}
              onChange={(e) => setCarrier(e.target.value)}
              disabled={submitting}
            >
              {carriers.map((c) => (
                <option key={c.code} value={c.code} disabled={!c.isAvailable}>
                  {c.displayName}{!c.isAvailable ? ' (indisponible)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.weightCard}>
            <Package size={16} />
            <div>
              <strong>Poids estimé</strong>
              <span>{(estimatedWeightGrams / 1000).toFixed(estimatedWeightGrams >= 1000 ? 2 : 3).replace('.', ',')} kg ({estimatedWeightGrams} g)</span>
            </div>
          </div>

          <div className={styles.field}>
            <label htmlFor="ship-weight">
              Poids manuel (g) <em>— optionnel</em>
            </label>
            <input
              id="ship-weight"
              type="number"
              min={1}
              step={1}
              value={overrideWeight}
              onChange={(e) => setOverrideWeight(e.target.value)}
              placeholder="Laisser vide pour utiliser le poids estimé"
              disabled={submitting}
            />
            {usingOverride && !overrideValid && (
              <span className={styles.fieldHint} style={{ color: '#c0392b' }}>Le poids doit être supérieur à 0</span>
            )}
          </div>

          {estimatedWeightGrams === 0 && !usingOverride && (
            <p className={styles.warn}>
              Aucun poids n'est défini sur les produits — saisissez un poids manuel pour continuer.
            </p>
          )}

          <p className={styles.note}>
            La création de l'envoi appelle le transporteur, génère un bordereau PDF et notifie le client par email avec le numéro de suivi.
          </p>

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
            className={styles.btnPrimary}
            onClick={handleConfirm}
            disabled={!canSubmit}
          >
            {submitting ? 'Création de l envoi…' : 'Créer l envoi'}
          </button>
        </footer>
      </div>
    </div>
  );
};

export default ShipModal;
