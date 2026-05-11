import { useState, useRef } from 'react';
import { X, Upload, FileText, CheckCircle, AlertTriangle } from 'lucide-react';
import { adminStock, StockBulkImportResult } from '../../services/admin';
import styles from './StockBulkImportModal.module.scss';

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const SAMPLE_CSV = `sku,quantity,reason
SKU-001,50,Réappro fournisseur 03/05
SKU-002,12,Réception colis 03/05
SKU-003,-3,Inventaire physique
`;

const StockBulkImportModal = ({ open, onClose, onSuccess }: Props) => {
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<StockBulkImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  const reset = () => {
    setFile(null);
    setResult(null);
    setError(null);
    setSubmitting(false);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleClose = () => {
    if (submitting) return;
    reset();
    onClose();
    if (result && result.processed > 0) onSuccess();
  };

  const submit = async () => {
    if (!file) return;
    setSubmitting(true);
    setError(null);
    try {
      const r = await adminStock.bulkImport(file);
      setResult(r);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'L import a échoué.');
    } finally {
      setSubmitting(false);
    }
  };

  const downloadSample = () => {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'modele-stock.csv';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5_000);
  };

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div className={styles.modal}>
        <header className={styles.header}>
          <div>
            <h2><Upload size={18} /> Import CSV de stock</h2>
            <p className={styles.sub}>Mettre à jour le stock de plusieurs produits d un coup</p>
          </div>
          <button type="button" className={styles.close} onClick={handleClose} aria-label="Fermer">
            <X size={18} />
          </button>
        </header>

        <div className={styles.body}>
          {!result && (
            <>
              <p className={styles.intro}>
                Format attendu : colonnes <code>sku</code>, <code>quantity</code>, <code>reason</code>.
                Les quantités positives sont des entrées (réappro), les négatives des sorties (casse, ajustement).
              </p>

              <button type="button" className={styles.sampleLink} onClick={downloadSample}>
                <FileText size={14} /> Télécharger un fichier exemple
              </button>

              <label className={styles.dropZone}>
                <input
                  ref={inputRef}
                  type="file"
                  accept=".csv,text/csv"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  disabled={submitting}
                />
                {file ? (
                  <div className={styles.fileSelected}>
                    <FileText size={20} />
                    <div>
                      <strong>{file.name}</strong>
                      <span>{(file.size / 1024).toFixed(1)} KB</span>
                    </div>
                  </div>
                ) : (
                  <div className={styles.dropEmpty}>
                    <Upload size={24} />
                    <strong>Cliquez pour choisir un fichier CSV</strong>
                    <span>ou glissez-déposez ici</span>
                  </div>
                )}
              </label>
            </>
          )}

          {result && (
            <div className={styles.results}>
              <div className={`${styles.resultsHead} ${result.processed > 0 ? styles.successHead : styles.errorHead}`}>
                {result.processed > 0 ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
                <div>
                  <strong>{result.processed} ligne{result.processed !== 1 ? 's' : ''} traitée{result.processed !== 1 ? 's' : ''}</strong>
                  <span>sur {result.total} ligne{result.total !== 1 ? 's' : ''} dans le fichier</span>
                </div>
              </div>

              {result.errors.length > 0 && (
                <>
                  <h3 className={styles.errorsTitle}>{result.errors.length} ligne{result.errors.length !== 1 ? 's' : ''} en erreur</h3>
                  <ul className={styles.errorList}>
                    {result.errors.map((e, i) => (
                      <li key={i}>
                        <span className={styles.errorRow}>L. {e.row}</span>
                        {e.sku && <code>{e.sku}</code>}
                        <span className={styles.errorMsg}>{e.message}</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          )}

          {error && <p className={styles.error} role="alert">{error}</p>}
        </div>

        <footer className={styles.footer}>
          {!result ? (
            <>
              <button type="button" className={styles.btnSecondary} onClick={handleClose} disabled={submitting}>Annuler</button>
              <button type="button" className={styles.btnPrimary} onClick={submit} disabled={!file || submitting}>
                {submitting ? 'Import en cours…' : 'Importer'}
              </button>
            </>
          ) : (
            <>
              <button type="button" className={styles.btnSecondary} onClick={reset}>
                Importer un autre fichier
              </button>
              <button type="button" className={styles.btnPrimary} onClick={handleClose}>
                Fermer
              </button>
            </>
          )}
        </footer>
      </div>
    </div>
  );
};

export default StockBulkImportModal;
