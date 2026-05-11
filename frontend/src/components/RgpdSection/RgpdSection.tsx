import { useEffect, useState } from 'react';
import { Trash2, Download, AlertTriangle, X, RotateCcw } from 'lucide-react';
import { rgpdService, DeletionRequest } from '../../services/rgpd';
import styles from './RgpdSection.module.scss';

const RgpdSection = () => {
  const [request, setRequest] = useState<DeletionRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    rgpdService.getActiveDeletionRequest().then(setRequest).finally(() => setLoading(false));
  }, []);

  const submit = async () => {
    setSubmitting(true);
    setError('');
    try {
      const r = await rgpdService.requestDeletion(reason.trim() || undefined);
      setRequest(r);
      setShowModal(false);
      setConfirmText('');
      setReason('');
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Erreur lors de la demande');
    } finally {
      setSubmitting(false);
    }
  };

  const cancel = async () => {
    if (!window.confirm('Annuler la demande de suppression ?')) return;
    try {
      await rgpdService.cancelDeletion();
      setRequest(null);
    } catch (err: any) {
      alert(err?.response?.data?.message ?? 'Erreur');
    }
  };

  const exportData = async () => {
    setExporting(true);
    try {
      const blob = await rgpdService.exportMyData();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `makani-cosmetique-mes-donnees-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err?.response?.data?.message ?? 'Export indisponible (réessayer dans 24h)');
    } finally {
      setExporting(false);
    }
  };

  if (loading) return null;

  const scheduled = request ? new Date(request.scheduledDeletionAt) : null;

  return (
    <section className={styles.section}>
      <header className={styles.header}>
        <h2>Vos droits RGPD</h2>
        <p>Conformément au Règlement Général sur la Protection des Données, vous pouvez à tout moment exporter ou supprimer vos données.</p>
      </header>

      <div className={styles.actions}>
        <button type="button" onClick={exportData} disabled={exporting} className={styles.btnSecondary}>
          <Download size={16} /> {exporting ? 'Génération…' : 'Exporter mes données'}
        </button>

        {request ? (
          <div className={styles.pendingBanner}>
            <AlertTriangle size={18} />
            <div>
              <strong>Suppression programmée</strong>
              <p>
                Votre compte sera anonymisé le{' '}
                <strong>
                  {scheduled?.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                </strong>
                . Vous pouvez encore annuler la demande pendant ce délai.
              </p>
            </div>
            <button type="button" onClick={cancel} className={styles.btnGhost}>
              <RotateCcw size={14} /> Annuler la demande
            </button>
          </div>
        ) : (
          <button type="button" onClick={() => setShowModal(true)} className={styles.btnDanger}>
            <Trash2 size={16} /> Supprimer mon compte
          </button>
        )}
      </div>

      {showModal && (
        <div className={styles.overlay} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <header className={styles.modalHeader}>
              <h3><AlertTriangle size={18} /> Supprimer mon compte</h3>
              <button onClick={() => setShowModal(false)} aria-label="Fermer"><X size={18} /></button>
            </header>

            <div className={styles.modalBody}>
              <p>Cette action déclenchera l <strong>anonymisation</strong> de vos données personnelles dans <strong>7 jours</strong>. Vous pourrez annuler la demande à tout moment pendant ce délai.</p>

              <ul className={styles.what}>
                <li><strong>Sera supprimé</strong> : nom, email, téléphone, adresses, favoris, sessions actives</li>
                <li><strong>Sera conservé 10 ans</strong> : historique de commandes et factures (obligation comptable légale, rattachées à un identifiant anonyme)</li>
              </ul>

              <label className={styles.field}>
                <span>Pourquoi nous quittez-vous ? (optionnel)</span>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  maxLength={500}
                  placeholder="Aide-nous à nous améliorer (facultatif)"
                />
              </label>

              <label className={styles.field}>
                <span>Pour confirmer, tapez <strong>SUPPRIMER</strong> ci-dessous</span>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="SUPPRIMER"
                  autoFocus
                />
              </label>

              {error && <div className={styles.error}>{error}</div>}
            </div>

            <footer className={styles.modalFooter}>
              <button type="button" onClick={() => setShowModal(false)} className={styles.btnSecondary}>Annuler</button>
              <button
                type="button"
                onClick={submit}
                disabled={confirmText !== 'SUPPRIMER' || submitting}
                className={styles.btnDanger}
              >
                {submitting ? 'Envoi…' : 'Demander la suppression'}
              </button>
            </footer>
          </div>
        </div>
      )}
    </section>
  );
};

export default RgpdSection;
