import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Share2, Copy, Check, X, Mail } from 'lucide-react';
import { favoritesService } from '../services/favorites';
import { toProduct } from '../lib/adapters';
import { useFavorites } from '../context/FavoritesContext';
import type { Product } from '../types';
import ProductCard from '../components/ProductCard/ProductCard';
import Spinner from '../components/Spinner/Spinner';
import styles from './Favorites.module.scss';

const Favorites = () => {
  const { ids } = useFavorites();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [share, setShare] = useState<{ shareUrl: string; expiresAt: string } | null>(null);
  const [sharing, setSharing] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    favoritesService.getProducts()
      .then((api) => setProducts(api.map(toProduct)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setProducts((prev) => prev.filter((p) => ids.has(p.id)));
  }, [ids]);

  const createShare = async () => {
    setSharing(true);
    try {
      const result = await favoritesService.share();
      setShare({ shareUrl: result.shareUrl, expiresAt: result.expiresAt });
    } catch (err: any) {
      alert(err?.response?.data?.message ?? 'Erreur');
    } finally {
      setSharing(false);
    }
  };

  const revokeShare = async () => {
    if (!window.confirm('Désactiver le lien de partage ?')) return;
    await favoritesService.revokeShare();
    setShare(null);
  };

  const copyLink = () => {
    if (!share) return;
    navigator.clipboard.writeText(share.shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const shareEmail = () => {
    if (!share) return;
    const subject = encodeURIComponent('Ma sélection Makani Cosmétique');
    const body = encodeURIComponent(`Hello !\n\nVoici ma sélection de produits coup de cœur sur Makani Cosmétique :\n${share.shareUrl}\n\nÀ très vite !`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  if (loading) return <Spinner fullPage />;

  return (
    <section className={styles.wrapper}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Mes favoris</h1>
          <p className={styles.sub}>
            {products.length} produit{products.length !== 1 ? 's' : ''} sauvegardé{products.length !== 1 ? 's' : ''}
          </p>
        </div>
        {products.length > 0 && !share && (
          <button onClick={createShare} disabled={sharing} className={styles.shareBtn}>
            <Share2 size={14} /> {sharing ? 'Génération…' : 'Partager ma liste'}
          </button>
        )}
      </header>

      {share && (
        <div className={styles.shareBox}>
          <div className={styles.shareInfo}>
            <Share2 size={18} />
            <div>
              <strong>Lien de partage actif</strong>
              <span>Valide jusqu au {new Date(share.expiresAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}</span>
            </div>
          </div>
          <div className={styles.shareUrl}>
            <code>{share.shareUrl}</code>
          </div>
          <div className={styles.shareActions}>
            <button onClick={copyLink} className={styles.btnPrimary}>
              {copied ? <><Check size={14} /> Copié</> : <><Copy size={14} /> Copier le lien</>}
            </button>
            <button onClick={shareEmail} className={styles.btnSecondary}>
              <Mail size={14} /> Email
            </button>
            <button onClick={revokeShare} className={styles.btnGhost} aria-label="Désactiver le partage">
              <X size={14} /> Désactiver
            </button>
          </div>
        </div>
      )}

      {products.length === 0 ? (
        <div className={styles.empty}>
          <Heart size={48} />
          <h3>Aucun favori pour l'instant</h3>
          <p>Cliquez sur le cœur d'un produit pour l'ajouter ici.</p>
          <Link to="/collections" className={styles.shopLink}>Explorer la boutique</Link>
        </div>
      ) : (
        <div className={styles.grid}>
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </section>
  );
};

export default Favorites;
