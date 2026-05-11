import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Search, Store, Zap, Printer, X as XIcon } from 'lucide-react';
import { adminOrders } from '../../services/admin';
import type { ApiOrder, ApiPaymentStatus } from '../../lib/api';
import Spinner from '../../components/Spinner/Spinner';
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

const AdminOrders = () => {
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [paymentFilter, setPaymentFilter] = useState<string>('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [printing, setPrinting] = useState(false);

  const toggleSelected = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const printSelected = async () => {
    if (selected.size === 0) return;
    setPrinting(true);
    try {
      const blob = await adminOrders.batchLabels([...selected]);
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 30_000);
    } catch (err: any) {
      alert(err?.response?.data?.message || 'L impression a échoué.');
    } finally {
      setPrinting(false);
    }
  };

  useEffect(() => {
    adminOrders.list({ limit: 200 })
      .then((r) => setOrders(r.data))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const s = search.toLowerCase().trim();
    return orders.filter((o) => {
      if (statusFilter && o.status !== statusFilter) return false;
      if (paymentFilter && o.paymentStatus !== paymentFilter) return false;
      if (s) {
        const haystack = `${o.orderNumber} ${o.shippingSnapshot?.fullName ?? ''}`.toLowerCase();
        if (!haystack.includes(s)) return false;
      }
      return true;
    });
  }, [orders, search, statusFilter, paymentFilter]);

  if (loading) return <Spinner fullPage />;

  return (
    <div>
      <header className={shared.pageHeader}>
        <div>
          <h1 className={shared.title}>Commandes</h1>
          <p className={shared.sub}>{orders.length} commande{orders.length !== 1 ? 's' : ''} au total</p>
        </div>
      </header>

      {selected.size > 0 && (
        <div style={{
          position: 'sticky', top: 16, zIndex: 5,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: '#C44D3A', color: '#fff', padding: '0.7rem 1.25rem',
          borderRadius: 10, marginBottom: '1rem',
          boxShadow: '0 6px 18px rgba(10,61,49,0.25)',
        }}>
          <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>
            {selected.size} commande{selected.size !== 1 ? 's' : ''} sélectionnée{selected.size !== 1 ? 's' : ''}
          </span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={printSelected}
              disabled={printing}
              style={{
                background: '#fff', color: '#C44D3A', border: 'none',
                borderRadius: 8, padding: '0.55rem 1rem',
                fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
                display: 'inline-flex', alignItems: 'center', gap: 6,
              }}
            >
              <Printer size={14} /> {printing ? 'Génération…' : 'Imprimer les bordereaux'}
            </button>
            <button
              onClick={() => setSelected(new Set())}
              style={{
                background: 'transparent', color: '#fff', border: '1.5px solid rgba(255,255,255,0.3)',
                borderRadius: 8, padding: '0.55rem 0.9rem',
                fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
                display: 'inline-flex', alignItems: 'center', gap: 6,
              }}
            >
              <XIcon size={14} /> Désélectionner
            </button>
          </div>
        </div>
      )}

      <div className={shared.filters}>
        <input
          placeholder="Rechercher (numéro, client)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">Tous statuts</option>
          {(['pending', 'confirmed', 'preparing', 'shipped', 'ready_for_pickup', 'delivered', 'returned', 'cancelled'] as const).map((s) => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </select>
        <select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)}>
          <option value="">Tous paiements</option>
          {(['pending', 'paid', 'failed', 'refunded'] as const).map((s) => (
            <option key={s} value={s}>{PAYMENT_LABELS[s]}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className={`${shared.card} ${shared.empty}`}>
          {search || statusFilter ? <Search size={42} /> : <ShoppingCart size={42} />}
          <h3>Aucune commande</h3>
          <p>{search || statusFilter ? 'Aucune commande ne correspond aux filtres.' : 'Les commandes apparaîtront ici.'}</p>
        </div>
      ) : (
        <div className={shared.tableWrap}>
          <table className={shared.table}>
            <thead>
              <tr>
                <th style={{ width: 32 }}></th>
                <th>Numéro</th>
                <th>Date</th>
                <th>Client</th>
                <th>Articles</th>
                <th>Total</th>
                <th>Paiement</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => (
                <tr key={o.id} style={{ cursor: 'pointer' }} onClick={() => window.location.assign(`/admin/orders/${o.id}`)}>
                  <td onClick={(e) => e.stopPropagation()} style={{ width: 32 }}>
                    <input
                      type="checkbox"
                      aria-label={`Sélectionner ${o.orderNumber}`}
                      checked={selected.has(o.id)}
                      disabled={!o.labelUrl}
                      title={o.labelUrl ? 'Sélectionner pour impression' : 'Aucun bordereau (commande non expédiée)'}
                      onChange={() => toggleSelected(o.id)}
                      style={{ accentColor: '#C44D3A', cursor: o.labelUrl ? 'pointer' : 'not-allowed' }}
                    />
                  </td>
                  <td>
                    <Link to={`/admin/orders/${o.id}`} style={{ color: '#C44D3A', fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      {o.orderNumber}
                      {o.fulfillmentMethod === 'pickup' && (
                        <span title="Retrait en boutique" style={{ display: 'inline-flex', alignItems: 'center', color: '#5c278c' }}>
                          <Store size={13} />
                        </span>
                      )}
                      {o.shippingSpeed === 'express' && (
                        <span title="Livraison Express 24h" style={{ display: 'inline-flex', alignItems: 'center', color: '#c97a00' }}>
                          <Zap size={13} />
                        </span>
                      )}
                    </Link>
                  </td>
                  <td>{new Date(o.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                  <td>{o.shippingSnapshot?.fullName ?? '—'}</td>
                  <td>{o.items.length}</td>
                  <td><strong>{o.currency}{Number(o.total).toFixed(2)}</strong></td>
                  <td>
                    {o.paymentStatus ? (
                      <span className={`${shared.payBadge} ${shared[PAYMENT_CLASS[o.paymentStatus]]}`}>
                        {PAYMENT_LABELS[o.paymentStatus]}
                      </span>
                    ) : <span style={{ color: '#bbb' }}>—</span>}
                  </td>
                  <td>
                    <span className={`${shared.badge} ${shared[o.status]}`}>
                      {STATUS_LABELS[o.status]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
