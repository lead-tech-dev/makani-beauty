import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Package, Tag, Award, ShoppingCart, AlertTriangle, TrendingUp, Users,
} from 'lucide-react';
import { adminProducts, adminOrders, adminUsers } from '../../services/admin';
import { categoriesService } from '../../services/categories';
import { brandsService } from '../../services/brands';
import type { ApiOrder, ApiProduct } from '../../lib/api';
import Spinner from '../../components/Spinner/Spinner';
import shared from './admin.module.scss';
import styles from './Dashboard.module.scss';

interface Stats {
  productCount: number;
  categoryCount: number;
  brandCount: number;
  userCount: number;
  orderCount: number;
  pendingOrders: number;
  revenue: number;
  lowStock: ApiProduct[];
  recentOrders: ApiOrder[];
}

const Dashboard = () => {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    Promise.all([
      adminProducts.list({ limit: 1 }),
      categoriesService.getAll(),
      brandsService.getAll(),
      adminUsers.list(),
      adminOrders.list({ limit: 100 }),
      adminProducts.lowStock(),
    ]).then(([products, categories, brands, users, orders, lowStock]) => {
      const pendingOrders = orders.data.filter((o) => o.status === 'pending').length;
      const revenue = orders.data
        .filter((o) => o.status !== 'cancelled')
        .reduce((acc, o) => acc + Number(o.total), 0);
      setStats({
        productCount: products.meta.total,
        categoryCount: categories.length,
        brandCount: brands.length,
        userCount: users.length,
        orderCount: orders.total,
        pendingOrders,
        revenue,
        lowStock,
        recentOrders: orders.data.slice(0, 5),
      });
    });
  }, []);

  if (!stats) return <Spinner fullPage />;

  return (
    <div>
      <header className={shared.pageHeader}>
        <div>
          <h1 className={shared.title}>Tableau de bord</h1>
          <p className={shared.sub}>Vue d ensemble du catalogue et de l activité.</p>
        </div>
      </header>

      {/* Top KPIs */}
      <div className={styles.kpis}>
        <Kpi label="Produits" value={stats.productCount} icon={<Package />} link="/admin/products" />
        <Kpi label="Catégories" value={stats.categoryCount} icon={<Tag />} link="/admin/categories" />
        <Kpi label="Marques" value={stats.brandCount} icon={<Award />} link="/admin/brands" />
        <Kpi label="Utilisateurs" value={stats.userCount} icon={<Users />} link="/admin/users" />
        <Kpi
          label="Commandes"
          value={stats.orderCount}
          sub={`${stats.pendingOrders} en attente`}
          icon={<ShoppingCart />}
          link="/admin/orders"
          highlight={stats.pendingOrders > 0}
        />
        <Kpi
          label="Chiffre d affaires"
          value={`$${stats.revenue.toFixed(2)}`}
          icon={<TrendingUp />}
        />
        <Kpi
          label="Alertes stock"
          value={stats.lowStock.length}
          sub={(() => {
            const out = stats.lowStock.filter((p) => p.stock <= 0).length;
            const low = stats.lowStock.length - out;
            if (out === 0 && low === 0) return 'tout est OK';
            return `${out} en rupture · ${low} bas`;
          })()}
          icon={<AlertTriangle />}
          link="/admin/products"
          highlight={stats.lowStock.some((p) => p.stock <= 0)}
        />
      </div>

      <div className={styles.grid}>
        {/* Low stock */}
        <section className={shared.card}>
          <header className={styles.sectionHeader}>
            <h2><AlertTriangle size={18} /> Stock faible</h2>
            <Link to="/admin/products" className={styles.linkSm}>Tout voir →</Link>
          </header>
          {stats.lowStock.length === 0 ? (
            <p className={styles.emptyMsg}>Aucun produit en stock faible.</p>
          ) : (
            <ul className={styles.list}>
              {stats.lowStock.map((p) => {
                const isOut = p.stock <= 0;
                return (
                  <li key={p.id}>
                    <Link to={`/admin/products/${p.id}`}>
                      <img src={p.imageUrl ?? ''} alt="" className={shared.thumb} />
                      <div className={styles.itemBody}>
                        <strong>{p.name}</strong>
                        <span>Seuil : {p.stockAlert}</span>
                      </div>
                      <span className={`${shared.badge} ${isOut ? shared.danger : shared.warning}`}>
                        {isOut ? 'Rupture' : `${p.stock} restant${p.stock !== 1 ? 's' : ''}`}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Recent orders */}
        <section className={shared.card}>
          <header className={styles.sectionHeader}>
            <h2><ShoppingCart size={18} /> Commandes récentes</h2>
            <Link to="/admin/orders" className={styles.linkSm}>Tout voir →</Link>
          </header>
          {stats.recentOrders.length === 0 ? (
            <p className={styles.emptyMsg}>Aucune commande pour l instant.</p>
          ) : (
            <ul className={styles.list}>
              {stats.recentOrders.map((o) => (
                <li key={o.id}>
                  <Link to={`/admin/orders/${o.id}`}>
                    <div className={styles.itemBody}>
                      <strong>{o.orderNumber}</strong>
                      <span>{new Date(o.createdAt).toLocaleDateString('fr-FR')}</span>
                    </div>
                    <span className={styles.amount}>
                      {o.currency}{Number(o.total).toFixed(2)}
                    </span>
                    <span className={`${shared.badge} ${shared[o.status]}`}>
                      {STATUS_LABELS[o.status]}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
};

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

interface KpiProps {
  label: string;
  value: number | string;
  sub?: string;
  icon: React.ReactNode;
  link?: string;
  highlight?: boolean;
}

const Kpi = ({ label, value, sub, icon, link, highlight }: KpiProps) => {
  const content = (
    <>
      <span className={`${styles.kpiIcon} ${highlight ? styles.kpiHighlight : ''}`}>{icon}</span>
      <div className={styles.kpiBody}>
        <span className={styles.kpiLabel}>{label}</span>
        <strong className={styles.kpiValue}>{value}</strong>
        {sub && <span className={styles.kpiSub}>{sub}</span>}
      </div>
    </>
  );
  return link ? (
    <Link to={link} className={styles.kpi}>{content}</Link>
  ) : (
    <div className={styles.kpi}>{content}</div>
  );
};

export default Dashboard;
