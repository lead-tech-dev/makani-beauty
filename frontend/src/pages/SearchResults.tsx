import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import ProductCard from '../components/ProductCard/ProductCard';
import SeoHead from '../components/SeoHead/SeoHead';
import Spinner from '../components/Spinner/Spinner';
import { productsService } from '../services/products';
import { Product } from '../types';
import styles from './SearchResults.module.scss';

const SearchResults = () => {
  const [params] = useSearchParams();
  const q = params.get('q') ?? '';
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    productsService.search(q, 50).then(setResults).finally(() => setLoading(false));
  }, [q]);

  return (
    <>
      <SeoHead
        title={q ? `Recherche : ${q}` : 'Rechercher'}
        description={`Résultats de recherche pour "${q}" sur Makani Cosmétique.`}
        canonical={q ? `/search?q=${encodeURIComponent(q)}` : '/search'}
        noindex
      />

      <div className={styles.page}>
        <header className={styles.header}>
          <Search size={20} />
          <h1>
            {q ? <>Résultats pour <em>« {q} »</em></> : 'Rechercher'}
          </h1>
          {!loading && q && (
            <span className={styles.count}>
              {results.length} résultat{results.length !== 1 ? 's' : ''}
            </span>
          )}
        </header>

        {loading ? (
          <Spinner fullPage />
        ) : !q ? (
          <p className={styles.empty}>Saisissez un terme dans la barre de recherche en haut de page.</p>
        ) : results.length === 0 ? (
          <div className={styles.empty}>
            <p>Aucun produit ne correspond à votre recherche.</p>
            <p>Essayez avec un autre terme, par exemple « shampooing », « huile de ricin » ou « parfum ».</p>
          </div>
        ) : (
          <div className={styles.grid}>
            {results.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default SearchResults;
