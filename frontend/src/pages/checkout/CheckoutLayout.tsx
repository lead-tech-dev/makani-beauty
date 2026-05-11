import { useEffect } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { CheckoutProvider } from '../../context/CheckoutContext';
import styles from './CheckoutLayout.module.scss';

const STEPS = [
  { path: '/checkout/cart',     label: 'Panier' },
  { path: '/checkout/shipping', label: 'Livraison' },
  { path: '/checkout/payment',  label: 'Paiement' },
];

const CheckoutLayout = () => {
  const { items } = useCart();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  // Bounce out if cart empties mid-flow
  useEffect(() => {
    if (items.length === 0) navigate('/collections', { replace: true });
  }, [items.length, navigate]);

  const currentStepIndex = STEPS.findIndex((s) => pathname.startsWith(s.path));
  const safeIndex = currentStepIndex >= 0 ? currentStepIndex : 0;

  if (items.length === 0) return null;

  return (
    <CheckoutProvider>
      <div className={styles.page}>
        <div className={styles.container}>
          <header className={styles.header}>
            <Link to="/" className={styles.brand}>Makani Cosmétique</Link>
            <h1 className={styles.title}>Finaliser la commande</h1>
          </header>

          <nav className={styles.stepper} aria-label="Progression">
            {STEPS.map((step, i) => {
              const isActive = i === safeIndex;
              const isDone = i < safeIndex;
              const reachable = i <= safeIndex; // can navigate back, not forward
              const cls = `${styles.step} ${isActive ? styles.active : ''} ${isDone ? styles.done : ''}`;

              return (
                <div key={step.path} className={styles.stepWrap}>
                  {reachable ? (
                    <NavLink to={step.path} className={cls}>
                      <span className={styles.dot}>
                        {isDone ? <Check size={14} /> : i + 1}
                      </span>
                      <span className={styles.label}>{step.label}</span>
                    </NavLink>
                  ) : (
                    <div className={cls} aria-disabled="true">
                      <span className={styles.dot}>{i + 1}</span>
                      <span className={styles.label}>{step.label}</span>
                    </div>
                  )}
                  {i < STEPS.length - 1 && (
                    <div className={`${styles.line} ${i < safeIndex ? styles.lineDone : ''}`} />
                  )}
                </div>
              );
            })}
          </nav>

          <main className={styles.content}>
            <Outlet />
          </main>
        </div>
      </div>
    </CheckoutProvider>
  );
};

export default CheckoutLayout;
