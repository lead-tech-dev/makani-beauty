import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit2, Trash2, Search, Package, AlertCircle, Upload } from 'lucide-react';
import { adminProducts } from '../../services/admin';
import { categoriesService } from '../../services/categories';
import type { ApiProduct } from '../../lib/api';
import type { Category } from '../../types';
import Spinner from '../../components/Spinner/Spinner';
import StockBulkImportModal from '../../components/StockBulkImportModal/StockBulkImportModal';
import shared from './admin.module.scss';

type StockState = 'out' | 'low' | 'ok';

const stockStateOf = (p: ApiProduct): StockState => {
  if (p.stock <= 0) return 'out';
  if (p.stock <= p.stockAlert) return 'low';
  return 'ok';
};

const AdminProducts = () => {
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all');
  const [bulkOpen, setBulkOpen] = useState(false);

  useEffect(() => {
    Promise.all([
      adminProducts.list({ limit: 200 }),
      categoriesService.getAll(),
    ]).then(([p, c]) => {
      setProducts(p.data);
      setCategories(c);
    }).finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const s = search.toLowerCase().trim();
    return products.filter((p) => {
      if (categoryFilter && p.category?.slug !== categoryFilter) return false;
      if (s && !p.name.toLowerCase().includes(s) && !p.slug.toLowerCase().includes(s)) return false;
      const state = stockStateOf(p);
      if (stockFilter === 'low' && state === 'ok') return false;
      if (stockFilter === 'out' && state !== 'out') return false;
      return true;
    });
  }, [products, search, categoryFilter, stockFilter]);

  const counts = useMemo(() => {
    const c = { ok: 0, low: 0, out: 0 };
    products.forEach((p) => { c[stockStateOf(p)] += 1; });
    return c;
  }, [products]);

  const remove = async (p: ApiProduct) => {
    if (!window.confirm(`Supprimer "${p.name}" ?`)) return;
    try {
      await adminProducts.remove(p.id);
      setProducts((prev) => prev.filter((x) => x.id !== p.id));
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Suppression impossible');
    }
  };

  if (loading) return <Spinner fullPage />;

  return (
    <div>
      <header className={shared.pageHeader}>
        <div>
          <h1 className={shared.title}>Produits</h1>
          <p className={shared.sub}>{products.length} produit{products.length !== 1 ? 's' : ''} au catalogue</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button type="button" className={shared.btnSecondary} onClick={() => setBulkOpen(true)}>
            <Upload size={16} /> Import stock CSV
          </button>
          <Link to="/admin/products/new" className={shared.btnPrimary}>
            <Plus size={16} /> Nouveau produit
          </Link>
        </div>
      </header>

      {(counts.out > 0 || counts.low > 0) && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.6rem',
          padding: '0.7rem 1rem', marginBottom: '1rem',
          background: counts.out > 0 ? 'linear-gradient(135deg, #fdf0ef 0%, #fff7e0 100%)' : '#fff7e0',
          border: `1px solid ${counts.out > 0 ? '#f4c8c4' : '#ffe5a3'}`,
          color: '#8a4a00', borderRadius: 10, fontSize: '0.9rem',
        }}>
          <AlertCircle size={16} style={{ color: counts.out > 0 ? '#a3392b' : '#c97a00' }} />
          {counts.out > 0 && <strong style={{ color: '#a3392b' }}>{counts.out} en rupture</strong>}
          {counts.out > 0 && counts.low > 0 && <span style={{ color: '#aaa' }}>·</span>}
          {counts.low > 0 && <strong style={{ color: '#8a4a00' }}>{counts.low} en stock bas</strong>}
          <button
            onClick={() => setStockFilter('low')}
            style={{
              marginLeft: 'auto', background: '#fff', border: '1.5px solid #c97a00',
              color: '#8a4a00', borderRadius: 6, padding: '0.3rem 0.7rem',
              fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
            }}
          >
            Filtrer
          </button>
        </div>
      )}

      <div className={shared.filters}>
        <input
          placeholder="Rechercher par nom ou slug..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
          <option value="">Toutes catégories</option>
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>{c.name}</option>
          ))}
        </select>
        <select value={stockFilter} onChange={(e) => setStockFilter(e.target.value as any)}>
          <option value="all">Tous stocks</option>
          <option value="low">Stock bas ({counts.low + counts.out})</option>
          <option value="out">Rupture ({counts.out})</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className={`${shared.card} ${shared.empty}`}>
          {search || categoryFilter ? <Search size={42} /> : <Package size={42} />}
          <h3>Aucun produit</h3>
          <p>{search || categoryFilter ? 'Aucun produit ne correspond aux filtres.' : 'Créez votre premier produit pour commencer.'}</p>
        </div>
      ) : (
        <div className={shared.tableWrap}>
          <table className={shared.table}>
            <thead>
              <tr>
                <th style={{ width: 60 }}></th>
                <th>Nom</th>
                <th>Catégorie</th>
                <th>Marque</th>
                <th>Prix</th>
                <th>Stock</th>
                <th>État</th>
                <th style={{ width: 100 }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const stockState = stockStateOf(p);
                const onSale = p.salePrice != null && Number(p.salePrice) < Number(p.price);
                const stockColor = stockState === 'out' ? '#a3392b' : stockState === 'low' ? '#c97a00' : '#0a6640';
                const stockBg = stockState === 'out' ? '#fdf0ef' : stockState === 'low' ? '#fff7e0' : '#e6f7ee';
                const stockBorder = stockState === 'out' ? '#f4c8c4' : stockState === 'low' ? '#ffe5a3' : '#b8e2c8';
                return (
                  <tr key={p.id}>
                    <td>
                      {p.imageUrl ? <img src={p.imageUrl} alt="" className={shared.thumb} /> : <div className={shared.thumb} />}
                    </td>
                    <td>
                      <strong>{p.name}</strong>
                      <div style={{ fontSize: '0.78rem', color: '#888' }}><code>{p.slug}</code></div>
                    </td>
                    <td>{p.category?.name ?? <span style={{ color: '#bbb' }}>—</span>}</td>
                    <td>{p.brand?.name ?? <span style={{ color: '#bbb' }}>—</span>}</td>
                    <td>
                      {onSale ? (
                        <>
                          <strong>{p.currency}{Number(p.salePrice).toFixed(2)}</strong>
                          <span style={{ color: '#888', textDecoration: 'line-through', marginLeft: '0.4rem', fontSize: '0.82rem' }}>
                            {p.currency}{Number(p.price).toFixed(2)}
                          </span>
                        </>
                      ) : (
                        <strong>{p.currency}{Number(p.price).toFixed(2)}</strong>
                      )}
                    </td>
                    <td>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        padding: '0.2rem 0.55rem', borderRadius: 999,
                        background: stockBg, color: stockColor, border: `1px solid ${stockBorder}`,
                        fontSize: '0.78rem', fontWeight: 600,
                      }}>
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: stockColor, display: 'inline-block' }} />
                        {p.stock}
                        <span style={{ color: '#888', fontWeight: 400 }}>/ seuil {p.stockAlert}</span>
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                        <span className={`${shared.badge} ${p.isActive ? shared.success : shared.muted}`}>
                          {p.isActive ? 'Actif' : 'Inactif'}
                        </span>
                        {p.isFeatured && <span className={`${shared.badge} ${shared.confirmed}`}>Mis en avant</span>}
                        {p.isNew && <span className={`${shared.badge} ${shared.shipped}`}>Nouveau</span>}
                      </div>
                    </td>
                    <td>
                      <div className={shared.actions}>
                        <Link to={`/admin/products/${p.id}`} className={shared.btnIcon} title="Modifier">
                          <Edit2 size={14} />
                        </Link>
                        <button onClick={() => remove(p)} className={`${shared.btnIcon} ${shared.danger}`} title="Supprimer">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <StockBulkImportModal
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        onSuccess={() => {
          // Reload products to reflect new stock values
          adminProducts.list({ limit: 200 }).then((p) => setProducts(p.data)).catch(() => {});
        }}
      />
    </div>
  );
};

export default AdminProducts;
