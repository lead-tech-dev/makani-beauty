import { useState, useEffect } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Search, ShoppingBag, User, Menu, X, Heart, LogOut } from "lucide-react";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { useFavorites } from "../../context/FavoritesContext";
import SearchBar from "../SearchBar/SearchBar";
import styles from "./Header.module.scss";

const navItems = [
  { to: "/collections", label: "Boutique" },
  { to: "/collections/soins-capillaires", label: "Cheveux" },
  { to: "/collections/soins-de-la-peau", label: "Peau" },
  { to: "/collections/parfums-dubai", label: "Parfums" },
  { to: "/collections/meches-perruques", label: "Mèches" },
  { to: "/collections/vetements", label: "Vêtements" },
  { to: "/brands", label: "Marques" },
  { to: "/about", label: "Histoire" },
  { to: "/contact", label: "Contact" },
];

const formatToday = () =>
  new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

const Header = () => {
  const { totalItems, openCart } = useCart();
  const { user, logout, isAuthenticated } = useAuth();
  const { count: favCount } = useFavorites();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <div className={styles.dateline} aria-hidden>
        <span className={styles.datelineDate}>{formatToday()}</span>
        <span className={styles.datelineDot}>·</span>
        <span className={styles.datelineEdition}>№ 03 — Édition Hiver</span>
        <span className={styles.datelineDot}>·</span>
        <span className={styles.datelineNote}>
          Livraison offerte dès 80&nbsp;€ &nbsp;·&nbsp; -5% sur la 1<sup>re</sup> commande
        </span>
      </div>

      <header
        className={`${styles.header} ${scrolled ? styles.scrolled : ""}`}
        data-testid="site-header"
      >
        <div className={styles.utility}>
          <button
            className={styles.utilityBtn}
            onClick={() => setMobileOpen(true)}
            aria-label="Ouvrir le menu"
            data-testid="open-mobile-menu"
          >
            <Menu size={18} strokeWidth={1.6} />
            <span>Menu</span>
          </button>
          <button
            className={styles.utilityBtn}
            aria-label="Rechercher"
            data-testid="search-btn"
            onClick={() => setSearchOpen(true)}
          >
            <Search size={18} strokeWidth={1.6} />
            <span>Recherche</span>
          </button>
        </div>

        <Link to="/" className={styles.wordmark} data-testid="header-logo" aria-label="Makani Cosmétique — Accueil">
          <span className={styles.wordmarkLetters}>
            <span>M</span>
            <span>A</span>
            <span>K</span>
            <span>A</span>
            <span>N</span>
            <span>I</span>
          </span>
          <span className={styles.wordmarkSerif}>Cosmétique</span>
        </Link>

        <div className={styles.actions}>
          {isAuthenticated ? (
            <>
              <Link
                to="/account"
                className={styles.userPill}
                aria-label="Mon compte"
                data-testid="account-btn"
              >
                <span className={styles.userAvatar}>
                  {user!.fullName.charAt(0).toUpperCase()}
                </span>
                <span className={styles.userName}>{user!.fullName.split(" ")[0]}</span>
              </Link>
              <button
                className={styles.iconBtn}
                onClick={handleLogout}
                aria-label="Se déconnecter"
                data-testid="logout-btn"
              >
                <LogOut size={18} strokeWidth={1.6} />
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className={styles.iconBtn}
              aria-label="Connexion"
              data-testid="account-btn"
            >
              <User size={18} strokeWidth={1.6} />
            </Link>
          )}
          <Link
            to={isAuthenticated ? "/account/favorites" : "/login"}
            state={isAuthenticated ? undefined : { from: { pathname: "/account/favorites" } }}
            className={styles.iconBtn}
            aria-label={`Favoris${favCount ? `, ${favCount} produits` : ""}`}
            data-testid="wishlist-btn"
          >
            <Heart size={18} strokeWidth={1.6} />
            {isAuthenticated && favCount > 0 && (
              <span className={styles.badge}>{favCount}</span>
            )}
          </Link>
          <button
            className={styles.cartBtn}
            onClick={openCart}
            aria-label={`Panier, ${totalItems} articles`}
            data-testid="open-cart-btn"
          >
            <ShoppingBag size={18} strokeWidth={1.6} />
            <span className={styles.cartLabel}>Panier</span>
            <span className={styles.cartCount} data-testid="cart-count">
              {String(totalItems).padStart(2, "0")}
            </span>
          </button>
        </div>

        <nav className={styles.nav} aria-label="Principal">
          {navItems.map((it, idx) => (
            <NavLink
              key={it.to}
              to={it.to}
              end={it.to === "/"}
              className={({ isActive }) =>
                `${styles.navLink} ${isActive ? styles.navActive : ""}`
              }
              data-testid={`nav-link-${it.label.toLowerCase().replace(/\s+/g, "-")}`}
            >
              <span className={styles.navIndex}>{String(idx + 1).padStart(2, "0")}</span>
              <span className={styles.navLabel}>{it.label}</span>
            </NavLink>
          ))}
        </nav>
      </header>

      {searchOpen && (
        <div className={styles.searchOverlay} onClick={() => setSearchOpen(false)}>
          <div className={styles.searchBox} onClick={(e) => e.stopPropagation()}>
            <SearchBar onClose={() => setSearchOpen(false)} />
          </div>
        </div>
      )}

      <div
        className={`${styles.mobileMenu} ${mobileOpen ? styles.open : ""}`}
        data-testid="mobile-menu"
      >
        <div className={styles.mobileHeader}>
          <span className={styles.mobileTitle}>№ 03 — Sommaire</span>
          <button
            className={styles.mobileClose}
            onClick={() => setMobileOpen(false)}
            aria-label="Fermer le menu"
            data-testid="close-mobile-menu"
          >
            <X size={28} strokeWidth={1.4} />
          </button>
        </div>
        <nav className={styles.mobileNav}>
          {navItems.map((it, idx) => (
            <NavLink
              key={it.to}
              to={it.to}
              end={it.to === "/"}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `${styles.mobileLink} ${isActive ? styles.mobileActive : ""}`
              }
              data-testid={`mobile-link-${it.label.toLowerCase().replace(/\s+/g, "-")}`}
              style={{ animationDelay: `${idx * 60}ms` }}
            >
              <span className={styles.mobileIndex}>{String(idx + 1).padStart(2, "0")}</span>
              <span>{it.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className={styles.mobileFooter}>
          <span>Makani Cosmétique</span>
          <span>© {new Date().getFullYear()}</span>
        </div>
      </div>
      {mobileOpen && (
        <div className={styles.backdrop} onClick={() => setMobileOpen(false)} aria-hidden />
      )}
    </>
  );
};

export default Header;
