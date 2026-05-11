import { useEffect, useState } from 'react';
import { Trash2, Clock, CheckCircle, XCircle } from 'lucide-react';
import Spinner from '../../components/Spinner/Spinner';
import { rgpdService, DeletionRequest } from '../../services/rgpd';
import shared from './admin.module.scss';
import styles from './AdminDeletionRequests.module.scss';

const STATUS_CONFIG = {
  pending: { label: 'En attente', icon: Clock, color: 'pending' as const },
  cancelled: { label: 'Annulée', icon: XCircle, color: 'cancelled' as const },
  executed: { label: 'Exécutée', icon: CheckCircle, color: 'executed' as const },
};

const AdminDeletionRequests = () => {
  const [items, setItems] = useState<DeletionRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    rgpdService.listAllDeletionRequests().then(setItems).finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner fullPage />;

  const pending = items.filter((r) => r.status === 'pending').length;

  return (
    <div>
      <header className={shared.pageHeader}>
        <div>
          <h1 className={shared.title}>Demandes de suppression de compte</h1>
          <p className={shared.sub}>
            {items.length} demande{items.length !== 1 ? 's' : ''} au total · {pending} en attente d exécution
          </p>
        </div>
      </header>

      {items.length === 0 ? (
        <p className={styles.empty}>Aucune demande de suppression à ce jour.</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Utilisateur</th>
                <th>Demandée le</th>
                <th>Anonymisation prévue</th>
                <th>Statut</th>
                <th>Motif</th>
              </tr>
            </thead>
            <tbody>
              {items.map((r) => {
                const cfg = STATUS_CONFIG[r.status];
                const Icon = cfg.icon;
                return (
                  <tr key={r.id}>
                    <td>
                      <strong>{r.user?.fullName ?? 'Utilisateur supprimé'}</strong>
                      <span className={styles.email}>{r.user?.email ?? '—'}</span>
                    </td>
                    <td>
                      {new Date(r.requestedAt).toLocaleDateString('fr-FR', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })}
                    </td>
                    <td>
                      {new Date(r.scheduledDeletionAt).toLocaleDateString('fr-FR', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })}
                    </td>
                    <td>
                      <span className={`${styles.status} ${styles[cfg.color]}`}>
                        <Icon size={13} /> {cfg.label}
                      </span>
                    </td>
                    <td className={styles.reason}>{r.reason ?? <em>—</em>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className={styles.note}>
        <Trash2 size={14} /> Ce tableau est en lecture seule. Les demandes en attente sont anonymisées automatiquement à
        leur date prévue par le cron quotidien (3h heure de Paris).
      </p>
    </div>
  );
};

export default AdminDeletionRequests;
