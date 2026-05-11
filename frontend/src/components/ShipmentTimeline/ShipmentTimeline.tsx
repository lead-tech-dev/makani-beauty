import { useEffect, useState } from 'react';
import { Clock, Package, Truck, MapPin, AlertTriangle, RefreshCw, CheckCircle } from 'lucide-react';
import { ordersService } from '../../services/orders';
import type { ShipmentEvent, ShipmentStatus } from '../../types';
import styles from './ShipmentTimeline.module.scss';

interface Props {
  orderId: string;
}

const ICON: Record<ShipmentStatus, React.ReactNode> = {
  pre_transit: <Package size={14} />,
  in_transit: <Truck size={14} />,
  out_for_delivery: <MapPin size={14} />,
  delivered: <CheckCircle size={14} />,
  exception: <AlertTriangle size={14} />,
  unknown: <Clock size={14} />,
};

const COLOR: Record<ShipmentStatus, string> = {
  pre_transit: '#888',
  in_transit: '#5c278c',
  out_for_delivery: '#c97a00',
  delivered: '#0a6640',
  exception: '#c0392b',
  unknown: '#888',
};

const fmtRelative = (iso: string): string => {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(diff / 60_000);
  if (minutes < 1) return 'à l instant';
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.round(hours / 24);
  return `il y a ${days} j`;
};

const ShipmentTimeline = ({ orderId }: Props) => {
  const [events, setEvents] = useState<ShipmentEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    ordersService.listEvents(orderId)
      .then((list) => { if (alive) setEvents(list); })
      .catch(() => { if (alive) setError('Impossible de charger le suivi.'); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [orderId]);

  const refresh = async () => {
    setRefreshing(true);
    setError(null);
    try {
      const list = await ordersService.refreshTracking(orderId);
      setEvents(list);
    } catch {
      setError('La mise à jour a échoué.');
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return <p className={styles.muted}>Chargement du suivi…</p>;
  }
  if (events.length === 0 && !error) {
    return (
      <div className={styles.empty}>
        <p>Aucun évènement de suivi pour le moment. Le transporteur n'a pas encore communiqué de mise à jour.</p>
        <button className={styles.refreshBtn} onClick={refresh} disabled={refreshing}>
          <RefreshCw size={13} className={refreshing ? styles.spinning : ''} /> Actualiser
        </button>
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      <ul className={styles.list}>
        {events.map((ev, i) => (
          <li key={ev.id} className={styles.event}>
            <div
              className={styles.dot}
              style={{ background: COLOR[ev.status], color: '#fff' }}
            >
              {ICON[ev.status]}
            </div>
            {i < events.length - 1 && <div className={styles.line} />}
            <div className={styles.content}>
              <span className={styles.message}>{ev.message}</span>
              <span className={styles.time}>{fmtRelative(ev.occurredAt)}</span>
            </div>
          </li>
        ))}
      </ul>
      <button className={styles.refreshBtn} onClick={refresh} disabled={refreshing}>
        <RefreshCw size={13} className={refreshing ? styles.spinning : ''} />
        {refreshing ? 'Mise à jour…' : 'Actualiser le suivi'}
      </button>
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
};

export default ShipmentTimeline;
