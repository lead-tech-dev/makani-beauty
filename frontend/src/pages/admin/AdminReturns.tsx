import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { RefreshCw, ChevronRight } from 'lucide-react';
import { adminReturns } from '../../services/admin';
import type { ReturnRequest, ReturnStatus } from '../../types';
import Spinner from '../../components/Spinner/Spinner';
import shared from './admin.module.scss';

const STATUS_LABEL: Record<ReturnStatus, string> = {
  pending: 'En attente',
  approved: 'Approuvée',
  rejected: 'Refusée',
};

const STATUS_COLOR: Record<ReturnStatus, { bg: string; fg: string; border: string }> = {
  pending: { bg: '#fff7e6', fg: '#8a5d00', border: '#ffe5a3' },
  approved: { bg: '#e6f7ee', fg: '#0a6640', border: '#b8e2c8' },
  rejected: { bg: '#fdf0ef', fg: '#c0392b', border: '#f4c8c4' },
};

const AdminReturns = () => {
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<ReturnStatus | ''>('pending');

  useEffect(() => {
    setLoading(true);
    adminReturns
      .list(statusFilter ? { status: statusFilter } : {})
      .then(setReturns)
      .finally(() => setLoading(false));
  }, [statusFilter]);

  const counts = useMemo(() => {
    const c = { pending: 0, approved: 0, rejected: 0 };
    returns.forEach((r) => { c[r.status] = (c[r.status] ?? 0) + 1; });
    return c;
  }, [returns]);

  return (
    <div>
      <header className={shared.pageHeader}>
        <div>
          <h1 className={shared.title}>Demandes de retour</h1>
          <p className={shared.sub}>{returns.length} demande{returns.length !== 1 ? 's' : ''} dans le filtre actuel</p>
        </div>
      </header>

      <div className={shared.filters}>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)}>
          <option value="">Tous les statuts</option>
          <option value="pending">En attente {counts.pending > 0 ? `(${counts.pending})` : ''}</option>
          <option value="approved">Approuvées</option>
          <option value="rejected">Refusées</option>
        </select>
      </div>

      {loading ? <Spinner fullPage /> : returns.length === 0 ? (
        <div className={`${shared.card} ${shared.empty}`}>
          <RefreshCw size={42} />
          <h3>Aucune demande</h3>
          <p>Aucune demande de retour ne correspond au filtre sélectionné.</p>
        </div>
      ) : (
        <div className={shared.tableWrap}>
          <table className={shared.table}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Commande</th>
                <th>Articles</th>
                <th>Motif</th>
                <th>Statut</th>
                <th style={{ width: 60 }}></th>
              </tr>
            </thead>
            <tbody>
              {returns.map((r) => {
                const totalQty = r.items.reduce((acc, it) => acc + it.quantity, 0);
                const totalAmount = r.items.reduce((acc, it) => acc + Number(it.unitPrice) * it.quantity, 0);
                const c = STATUS_COLOR[r.status];
                return (
                  <tr key={r.id} style={{ cursor: 'pointer' }} onClick={() => window.location.assign(`/admin/returns/${r.id}`)}>
                    <td>{new Date(r.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                    <td>
                      <Link to={`/admin/orders/${r.orderId}`} onClick={(e) => e.stopPropagation()} style={{ color: '#C44D3A', fontWeight: 600, textDecoration: 'none' }}>
                        Voir commande
                      </Link>
                    </td>
                    <td>{totalQty} ({totalAmount.toFixed(2)} €)</td>
                    <td style={{ maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.85rem', color: '#555' }}>
                      {r.reason}
                    </td>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', fontSize: '0.72rem', fontWeight: 600, padding: '0.2rem 0.6rem', borderRadius: 999, background: c.bg, color: c.fg, border: `1px solid ${c.border}` }}>
                        {STATUS_LABEL[r.status]}
                      </span>
                    </td>
                    <td>
                      <Link to={`/admin/returns/${r.id}`} onClick={(e) => e.stopPropagation()} style={{ display: 'inline-flex', alignItems: 'center', color: '#888' }}>
                        <ChevronRight size={16} />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminReturns;
