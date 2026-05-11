import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, ChevronRight, ShoppingBag } from 'lucide-react';
import { ordersService } from '../services/orders';
import type { Order, OrderStatus, PaymentStatus } from '../types';
import Spinner from '../components/Spinner/Spinner';
import styles from './Orders.module.scss';

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'En attente',
  confirmed: 'Confirmée',
  preparing: 'En préparation',
  shipped: 'Expédiée',
  ready_for_pickup: 'Prête à retirer',
  delivered: 'Livrée',
  returned: 'Retournée',
  cancelled: 'Annulée',
};

const PAYMENT_LABELS: Record<PaymentStatus, string> = {
  pending: 'Paiement en attente',
  paid: 'Payée',
  failed: 'Paiement échoué',
  refunded: 'Remboursée',
};

const PAYMENT_CLASS: Record<PaymentStatus, string> = {
  pending: 'payPending',
  paid: 'payPaid',
  failed: 'payFailed',
  refunded: 'payRefunded',
};

const Orders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ordersService.getMyOrders()
      .then(setOrders)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner fullPage />;

  return (
    <section className={styles.wrapper}>
      <header className={styles.header}>
        <h1 className={styles.title}>Mes commandes</h1>
        <p className={styles.sub}>{orders.length} commande{orders.length !== 1 ? 's' : ''}</p>
      </header>

      {orders.length === 0 ? (
        <div className={styles.empty}>
          <ShoppingBag size={48} />
          <h3>Aucune commande pour l'instant</h3>
          <p>Découvrez nos produits et passez votre première commande.</p>
          <Link to="/collections" className={styles.shopLink}>Découvrir la boutique</Link>
        </div>
      ) : (
        <ul className={styles.list}>
          {orders.map((order) => (
            <li key={order.id}>
              <Link to={`/account/orders/${order.id}`} className={styles.card}>
                <div className={styles.cardLeft}>
                  <Package size={20} className={styles.icon} />
                  <div>
                    <span className={styles.orderNumber}>{order.orderNumber}</span>
                    <span className={styles.meta}>
                      {order.items.length} article{order.items.length !== 1 ? 's' : ''} ·{' '}
                      {new Date(order.createdAt).toLocaleDateString('fr-FR', {
                        day: 'numeric', month: 'long', year: 'numeric',
                      })}
                    </span>
                  </div>
                </div>
                <div className={styles.cardRight}>
                  <div className={styles.badgeStack}>
                    <span className={`${styles.badge} ${styles[order.status]}`}>
                      {STATUS_LABELS[order.status]}
                    </span>
                    {order.paymentStatus && order.paymentStatus !== 'paid' && (
                      <span className={`${styles.payBadge} ${styles[PAYMENT_CLASS[order.paymentStatus]]}`}>
                        {PAYMENT_LABELS[order.paymentStatus]}
                      </span>
                    )}
                  </div>
                  <strong className={styles.total}>
                    {order.currency}{Number(order.total).toFixed(2)}
                  </strong>
                  <ChevronRight size={18} className={styles.arrow} />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

export default Orders;
