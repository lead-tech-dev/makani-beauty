import { useEffect, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { productsService } from '../../services/products';
import { trackSearch } from '../../lib/analytics';
import { Product } from '../../types';
import styles from './SearchBar.module.scss';

interface Props {
  onClose?: () => void;
}

const SearchBar = ({ onClose }: Props) => {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (q.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const timer = setTimeout(() => {
      productsService.search(q, 8).then((r) => {
        setResults(r);
        setLoading(false);
      }).catch(() => setLoading(false));
    }, 200);
    return () => clearTimeout(timer);
  }, [q]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (q.trim().length < 2) return;
    trackSearch(q.trim());
    onClose?.();
    navigate(`/search?q=${encodeURIComponent(q.trim())}`);
  };

  const goToProduct = (slug: string) => {
    onClose?.();
    navigate(`/products/${slug}`);
  };

  const showDropdown = open && q.trim().length >= 2;

  return (
    <form onSubmit={submit} className={styles.bar} role="search">
      <Search size={18} className={styles.icon} />
      <input
        ref={inputRef}
        type="text"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onFocus={() => setOpen(true)}
        placeholder="Rechercher un produit, une marque, un soin…"
        className={styles.input}
        aria-label="Rechercher"
      />
      {q && (
        <button
          type="button"
          className={styles.clear}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => { setQ(''); setResults([]); inputRef.current?.focus(); }}
          aria-label="Effacer"
        >
          <X size={14} />
        </button>
      )}

      {showDropdown && (
        <div
          className={styles.dropdown}
          onMouseDown={(e) => e.preventDefault()}
        >
          {loading && results.length === 0 ? (
            <div className={styles.loading}>Recherche…</div>
          ) : results.length === 0 ? (
            <div className={styles.empty}>Aucun résultat pour « {q} »</div>
          ) : (
            <>
              <ul className={styles.list}>
                {results.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      className={styles.item}
                      onClick={() => goToProduct(p.slug)}
                    >
                      <img src={p.image} alt="" className={styles.thumb} loading="lazy" />
                      <div className={styles.body}>
                        <strong>{p.name}</strong>
                        {p.brandName && <span className={styles.brand}>{p.brandName}</span>}
                      </div>
                      <span className={styles.price}>
                        {p.price.toFixed(2)} {p.currency}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
              <button type="submit" className={styles.allLink}>
                Voir tous les résultats pour « {q} » →
              </button>
            </>
          )}
        </div>
      )}
    </form>
  );
};

export default SearchBar;
