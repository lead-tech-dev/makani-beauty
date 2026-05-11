import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LogOut, User, Package, MapPin, Shield, Heart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import styles from './Account.module.scss';

const Account = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className={styles.page} data-testid="account-page">
      <div className={styles.container}>
        <aside className={styles.sidebar}>
          <header className={styles.identity}>
            <div className={styles.avatar}>
              {user.fullName.charAt(0).toUpperCase()}
            </div>
            <div className={styles.identityInfo}>
              <strong className={styles.name}>{user.fullName}</strong>
              <span className={styles.email}>{user.email}</span>
              {isAdmin && (
                <span className={styles.adminBadge}>
                  <Shield size={11} /> Admin
                </span>
              )}
            </div>
          </header>

          <nav className={styles.nav}>
            <NavLink
              to="/account"
              end
              className={({ isActive }) =>
                `${styles.navLink} ${isActive ? styles.active : ''}`
              }
            >
              <User size={18} /> Profil
            </NavLink>
            <NavLink
              to="/account/orders"
              className={({ isActive }) =>
                `${styles.navLink} ${isActive ? styles.active : ''}`
              }
            >
              <Package size={18} /> Mes commandes
            </NavLink>
            <NavLink
              to="/account/addresses"
              className={({ isActive }) =>
                `${styles.navLink} ${isActive ? styles.active : ''}`
              }
            >
              <MapPin size={18} /> Adresses
            </NavLink>
            <NavLink
              to="/account/favorites"
              className={({ isActive }) =>
                `${styles.navLink} ${isActive ? styles.active : ''}`
              }
            >
              <Heart size={18} /> Favoris
            </NavLink>
            {isAdmin && (
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  `${styles.navLink} ${isActive ? styles.active : ''}`
                }
              >
                <Shield size={18} /> Administration
              </NavLink>
            )}
          </nav>

          <button
            className={styles.logout}
            onClick={handleLogout}
            data-testid="logout-btn"
          >
            <LogOut size={16} /> Déconnexion
          </button>
        </aside>

        <main className={styles.content}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Account;
