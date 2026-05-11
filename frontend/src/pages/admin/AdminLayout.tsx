import { NavLink, Outlet, Link } from 'react-router-dom';
import {
  LayoutDashboard, Package, Tag, Award, ShoppingCart, Users, ArrowLeft, Ticket, Truck, RefreshCw, FileText, Shield, UserX,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import styles from './AdminLayout.module.scss';

const NAV = [
  { to: '/admin', label: 'Tableau de bord', icon: LayoutDashboard, end: true },
  { to: '/admin/products', label: 'Produits', icon: Package },
  { to: '/admin/categories', label: 'Catégories', icon: Tag },
  { to: '/admin/brands', label: 'Marques', icon: Award },
  { to: '/admin/orders', label: 'Commandes', icon: ShoppingCart },
  { to: '/admin/returns', label: 'Retours', icon: RefreshCw },
  { to: '/admin/promo-codes', label: 'Codes promo', icon: Ticket },
  { to: '/admin/shipping-zones', label: 'Zones livraison', icon: Truck },
  { to: '/admin/users', label: 'Utilisateurs', icon: Users },
  { to: '/admin/legal-pages', label: 'Pages légales', icon: FileText },
  { to: '/admin/sub-processors', label: 'Sous-traitants', icon: Shield },
  { to: '/admin/deletion-requests', label: 'Suppressions RGPD', icon: UserX },
];

const AdminLayout = () => {
  const { user } = useAuth();

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <header className={styles.brand}>
          <Link to="/" className={styles.brandLink}>
            <span className={styles.brandMark}>M</span>
            <span className={styles.brandText}>
              <strong>Makani Cosmétique</strong>
              <small>Back-office</small>
            </span>
          </Link>
        </header>

        <nav className={styles.nav}>
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `${styles.navLink} ${isActive ? styles.active : ''}`
              }
            >
              <Icon size={18} /> {label}
            </NavLink>
          ))}
        </nav>

        <footer className={styles.footer}>
          <div className={styles.userRow}>
            <span className={styles.avatar}>{user?.fullName.charAt(0).toUpperCase()}</span>
            <div>
              <strong>{user?.fullName}</strong>
              <span>{user?.email}</span>
            </div>
          </div>
          <Link to="/" className={styles.exit}>
            <ArrowLeft size={14} /> Retour au site
          </Link>
        </footer>
      </aside>

      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
