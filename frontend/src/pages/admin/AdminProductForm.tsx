import { useEffect, useState, ChangeEvent } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Save, X, Upload, ChevronLeft, Trash2, Package, Plus, ArrowDownToLine, ArrowUpFromLine, Settings2 } from 'lucide-react';
import { adminProducts, adminUpload, adminStock, ProductInput } from '../../services/admin';
import { categoriesService } from '../../services/categories';
import { brandsService } from '../../services/brands';
import type { Category, Brand } from '../../types';
import type { ApiStockMovement } from '../../lib/api';
import api from '../../lib/api';
import Spinner from '../../components/Spinner/Spinner';
import StockMovementModal from '../../components/StockMovementModal/StockMovementModal';
import VariantsEditor from './VariantsEditor';
import { schemaForSlug } from './categorySchema';
import shared from './admin.module.scss';
import styles from './AdminProductForm.module.scss';

const slugify = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const empty: ProductInput = {
  name: '', slug: '', description: '',
  price: 0, salePrice: undefined, currency: '$',
  imageUrl: '', imageSrcset: null, imageLqip: null, images: [], sku: '',
  stock: 0, stockAlert: 5,
  isNew: false, isFeatured: false, vipOnly: false,
  ingredients: '', weight: '', weightGrams: null, volume: '',
  tags: [],
  hairType: null, skinType: null, keyIngredients: null, certifications: null,
  isActive: true,
  categoryId: undefined, brandId: undefined,
};

const AdminProductForm = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  // The /admin/products/new route has no :id param so useParams returns
  // undefined — treat both "new" and missing id as a fresh product.
  const isNew = !id || id === 'new';

  const [draft, setDraft] = useState<ProductInput>(empty);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [movements, setMovements] = useState<ApiStockMovement[]>([]);
  const [stockModalOpen, setStockModalOpen] = useState(false);

  const reloadMovements = () => {
    if (isNew || !id) return;
    adminStock.history(id).then(setMovements).catch(() => {});
  };

  const reloadProduct = () => {
    if (isNew || !id) return;
    adminProducts.getById(id).then((prod) => {
      setDraft((d) => ({ ...d, stock: prod.stock, stockAlert: prod.stockAlert }));
    }).catch(() => {});
  };

  useEffect(() => { reloadMovements(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [id]);
  const [error, setError] = useState('');
  const [tagsInput, setTagsInput] = useState('');

  // Need raw API category/brand list to map slug→id (services return adapted types without ids)
  const [categoryMap, setCategoryMap] = useState<Map<string, string>>(new Map());
  const [brandMap, setBrandMap] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    Promise.all([
      api.get<any[]>('/categories').then((r) => r.data),
      api.get<any[]>('/brands').then((r) => r.data),
      categoriesService.getAll(),
      brandsService.getAll(),
      isNew ? Promise.resolve(null) : adminProducts.getById(id!),
    ]).then(([rawCats, rawBrands, cats, br, prod]) => {
      setCategories(cats);
      setBrands(br);
      setCategoryMap(new Map(rawCats.map((c) => [c.slug, c.id])));
      setBrandMap(new Map(rawBrands.map((b) => [b.slug, b.id])));

      if (prod) {
        setDraft({
          name: prod.name,
          slug: prod.slug,
          description: prod.description ?? '',
          price: Number(prod.price),
          salePrice: prod.salePrice != null ? Number(prod.salePrice) : undefined,
          currency: prod.currency,
          imageUrl: prod.imageUrl ?? '',
          imageSrcset: prod.imageSrcset ?? null,
          imageLqip: prod.imageLqip ?? null,
          images: prod.images ?? [],
          sku: prod.sku ?? '',
          stock: prod.stock,
          stockAlert: prod.stockAlert,
          isNew: prod.isNew,
          isFeatured: prod.isFeatured,
          vipOnly: (prod as any).vipOnly ?? false,
          ingredients: prod.ingredients ?? '',
          weight: prod.weight ?? '',
          weightGrams: prod.weightGrams ?? null,
          volume: prod.volume ?? '',
          tags: prod.tags ?? [],
          hairType: (prod as any).hairType ?? null,
          skinType: (prod as any).skinType ?? null,
          keyIngredients: (prod as any).keyIngredients ?? null,
          certifications: (prod as any).certifications ?? null,
          isActive: prod.isActive,
          categoryId: prod.category?.id,
          brandId: prod.brand?.id,
        });
        setTagsInput((prod.tags ?? []).join(', '));
      }
    }).finally(() => setLoading(false));
  }, [id, isNew]);

  // Schema dépendant de la catégorie : conditionne l'affichage des champs
  // et les axes de variantes proposés (size/color/length/texture/etc.)
  const currentCategorySlug = categories.find((c) => c.id === draft.categoryId)?.slug;
  const schema = schemaForSlug(currentCategorySlug);
  const showField = (name: string) => schema.fields.includes(name as never);

  const handleNameChange = (name: string) => {
    setDraft((d) => ({
      ...d,
      name,
      slug: !d.slug || d.slug === slugify(d.name) ? slugify(name) : d.slug,
    }));
  };

  const handleUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const { url, srcset, lqip } = await adminUpload.image(file);
      setDraft((d) => ({
        ...d,
        imageUrl: url,
        imageSrcset: srcset ?? null,
        imageLqip: lqip ?? null,
      }));
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Upload échoué');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleGalleryUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const { url } = await adminUpload.image(file);
      setDraft((d) => ({ ...d, images: [...(d.images ?? []), url] }));
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Upload échoué');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const removeGalleryImage = (idx: number) => {
    setDraft((d) => ({ ...d, images: (d.images ?? []).filter((_, i) => i !== idx) }));
  };

  const handleTagsBlur = () => {
    setDraft((d) => ({
      ...d,
      tags: tagsInput.split(',').map((t) => t.trim()).filter(Boolean),
    }));
  };

  const save = async () => {
    setError('');
    setSaving(true);
    // Sync tags one more time before save
    const finalTags = tagsInput.split(',').map((t) => t.trim()).filter(Boolean);
    const payload: ProductInput = {
      ...draft,
      tags: finalTags,
      salePrice: draft.salePrice && Number(draft.salePrice) > 0 ? Number(draft.salePrice) : undefined,
      price: Number(draft.price),
      stock: Number(draft.stock),
      stockAlert: Number(draft.stockAlert),
    };
    try {
      if (isNew) {
        const created = await adminProducts.create(payload);
        navigate(`/admin/products/${created.id}`);
      } else {
        await adminProducts.update(id!, payload);
        alert('Produit mis à jour');
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      setError(Array.isArray(msg) ? msg.join(', ') : (msg || 'Erreur lors de l enregistrement'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spinner fullPage />;

  return (
    <div>
      <Link to="/admin/products" className={styles.back}>
        <ChevronLeft size={16} /> Retour aux produits
      </Link>

      <header className={shared.pageHeader}>
        <div>
          <h1 className={shared.title}>{isNew ? 'Nouveau produit' : draft.name || 'Modifier le produit'}</h1>
          <p className={shared.sub}>
            {isNew ? 'Renseignez les informations du produit.' : `Slug : ${draft.slug}`}
          </p>
        </div>
      </header>

      <div className={styles.layout}>
        {/* Main column */}
        <div className={styles.mainCol}>
          <section className={shared.card}>
            <h2 className={styles.sectionTitle}>Informations</h2>
            <div className={shared.form}>
              <div className={shared.field}>
                <label>Nom du produit *</label>
                <input value={draft.name} onChange={(e) => handleNameChange(e.target.value)} placeholder="Crème hydratante..." />
              </div>
              <div className={shared.row}>
                <div className={shared.field}>
                  <label>Slug *</label>
                  <input value={draft.slug} onChange={(e) => setDraft({ ...draft, slug: e.target.value })} />
                </div>
                <div className={shared.field}>
                  <label>SKU</label>
                  <input value={draft.sku ?? ''} onChange={(e) => setDraft({ ...draft, sku: e.target.value })} placeholder="SKU-001" />
                </div>
              </div>
              <div className={shared.field}>
                <label>Description</label>
                <textarea
                  value={draft.description ?? ''}
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                  rows={4}
                />
              </div>
              {showField('ingredients') && (
                <div className={shared.field}>
                  <label>Ingrédients</label>
                  <textarea
                    value={draft.ingredients ?? ''}
                    onChange={(e) => setDraft({ ...draft, ingredients: e.target.value })}
                    rows={2}
                  />
                </div>
              )}
              {(showField('weight') || showField('volume') || showField('weightGrams')) && (
                <div className={shared.row}>
                  {showField('weight') && (
                    <div className={shared.field}>
                      <label>Étiquette poids/contenance</label>
                      <input value={draft.weight ?? ''} onChange={(e) => setDraft({ ...draft, weight: e.target.value })} placeholder="100g" />
                    </div>
                  )}
                  {showField('volume') && (
                    <div className={shared.field}>
                      <label>Volume</label>
                      <input value={draft.volume ?? ''} onChange={(e) => setDraft({ ...draft, volume: e.target.value })} placeholder="250ml" />
                    </div>
                  )}
                  {showField('weightGrams') && (
                    <div className={shared.field}>
                      <label>Poids réel pour la livraison <em style={{ color: '#888', fontWeight: 400, fontStyle: 'normal' }}>(grammes)</em></label>
                      <input
                        type="number"
                        min={0}
                        step={1}
                        value={draft.weightGrams ?? ''}
                        onChange={(e) => setDraft({
                          ...draft,
                          weightGrams: e.target.value === '' ? null : Math.max(0, Math.round(Number(e.target.value))),
                        })}
                        placeholder="ex: 250"
                      />
                    </div>
                  )}
                </div>
              )}
              {showField('tags') && (
                <div className={shared.field}>
                  <label>Tags / Caractéristiques (séparés par des virgules)</label>
                  <input
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    onBlur={handleTagsBlur}
                    placeholder="100% naturel, sans paraben, ..."
                  />
                </div>
              )}

              {showField('hairType') && (
                <FacetMultiSelect
                  label="Type de cheveux ciblé"
                  options={['3A', '3B', '3C', '4A', '4B', '4C']}
                  value={draft.hairType ?? []}
                  onChange={(next) => setDraft({ ...draft, hairType: next.length === 0 ? null : next })}
                />
              )}
              {showField('skinType') && (
                <FacetMultiSelect
                  label="Type de peau ciblé"
                  options={['sec', 'gras', 'mixte', 'sensible', 'normal']}
                  value={draft.skinType ?? []}
                  onChange={(next) => setDraft({ ...draft, skinType: next.length === 0 ? null : next })}
                />
              )}
              {showField('keyIngredients') && (
                <FacetTagsInput
                  label="Ingrédients clés (tags libres séparés par virgules)"
                  value={draft.keyIngredients ?? []}
                  placeholder="karité, aloe vera, argan, jojoba…"
                  onChange={(next) => setDraft({ ...draft, keyIngredients: next.length === 0 ? null : next })}
                />
              )}
              {showField('certifications') && (
                <FacetMultiSelect
                  label="Certifications"
                  options={['bio', 'vegan', 'cruelty-free', 'made-in-france']}
                  value={draft.certifications ?? []}
                  onChange={(next) => setDraft({ ...draft, certifications: next.length === 0 ? null : next })}
                />
              )}
            </div>
          </section>

          {/* Pricing & Stock */}
          <section className={shared.card}>
            <h2 className={styles.sectionTitle}>Prix & stock</h2>
            <div className={shared.form}>
              <div className={shared.row}>
                <div className={shared.field}>
                  <label>Prix régulier *</label>
                  <input type="number" step="0.01" value={draft.price} onChange={(e) => setDraft({ ...draft, price: Number(e.target.value) })} />
                </div>
                <div className={shared.field}>
                  <label>Prix soldé</label>
                  <input type="number" step="0.01" value={draft.salePrice ?? ''} onChange={(e) => setDraft({ ...draft, salePrice: e.target.value === '' ? undefined : Number(e.target.value) })} />
                </div>
                <div className={shared.field}>
                  <label>Devise</label>
                  <input value={draft.currency ?? '$'} onChange={(e) => setDraft({ ...draft, currency: e.target.value })} maxLength={3} />
                </div>
              </div>
              <div className={shared.row}>
                <div className={shared.field}>
                  <label>Stock</label>
                  <input type="number" min={0} value={draft.stock ?? 0} onChange={(e) => setDraft({ ...draft, stock: Number(e.target.value) })} />
                </div>
                <div className={shared.field}>
                  <label>Seuil d alerte stock</label>
                  <input type="number" min={0} value={draft.stockAlert ?? 5} onChange={(e) => setDraft({ ...draft, stockAlert: Number(e.target.value) })} />
                </div>
              </div>
            </div>
          </section>

          {/* Stock movements (edit mode only) */}
          {!isNew && id && (
            <section className={shared.card}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <h2 className={styles.sectionTitle} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Package size={18} /> Mouvements de stock
                </h2>
                <button
                  type="button"
                  className={shared.btnPrimary}
                  onClick={() => setStockModalOpen(true)}
                >
                  <Plus size={14} /> Nouveau mouvement
                </button>
              </div>

              <p style={{ margin: '0 0 1rem', fontSize: '0.85rem', color: '#777' }}>
                Stock actuel : <strong style={{ color: '#C44D3A' }}>{draft.stock ?? 0}</strong>
                {' · '}
                Seuil d alerte : <strong>{draft.stockAlert ?? 5}</strong>
                {(draft.stock ?? 0) <= (draft.stockAlert ?? 5) && (
                  <span style={{ marginLeft: '0.5rem', color: (draft.stock ?? 0) === 0 ? '#a3392b' : '#c97a00', fontWeight: 600 }}>
                    {(draft.stock ?? 0) === 0 ? '· Rupture' : '· Stock bas'}
                  </span>
                )}
              </p>

              {movements.length === 0 ? (
                <p style={{ margin: 0, padding: '1rem', textAlign: 'center', color: '#888', fontSize: '0.85rem', background: '#fafaf8', borderRadius: 8 }}>
                  Aucun mouvement enregistré.
                </p>
              ) : (
                <div style={{ maxHeight: 360, overflow: 'auto', border: '1px solid #f0ebe4', borderRadius: 8 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead style={{ background: '#fafaf8', position: 'sticky', top: 0 }}>
                      <tr style={{ textAlign: 'left' }}>
                        <th style={{ padding: '0.5rem 0.75rem', fontWeight: 600, color: '#666' }}>Date</th>
                        <th style={{ padding: '0.5rem 0.75rem', fontWeight: 600, color: '#666' }}>Type</th>
                        <th style={{ padding: '0.5rem 0.75rem', fontWeight: 600, color: '#666', textAlign: 'right' }}>Qté</th>
                        <th style={{ padding: '0.5rem 0.75rem', fontWeight: 600, color: '#666', textAlign: 'right' }}>Stock après</th>
                        <th style={{ padding: '0.5rem 0.75rem', fontWeight: 600, color: '#666' }}>Raison</th>
                      </tr>
                    </thead>
                    <tbody>
                      {movements.map((m) => {
                        const TypeIcon = m.type === 'in' ? ArrowDownToLine : m.type === 'out' ? ArrowUpFromLine : Settings2;
                        const typeColor = m.type === 'in' ? '#0a6640' : m.type === 'out' ? '#a3392b' : '#5c278c';
                        const typeBg = m.type === 'in' ? '#e6f7ee' : m.type === 'out' ? '#fdf0ef' : '#f0eef9';
                        const typeLabel = m.type === 'in' ? 'Entrée' : m.type === 'out' ? 'Sortie' : 'Ajustement';
                        const sign = m.type === 'in' ? '+' : m.type === 'out' ? '−' : (m.quantity >= 0 ? '+' : '');
                        return (
                          <tr key={m.id} style={{ borderTop: '1px solid #f0ebe4' }}>
                            <td style={{ padding: '0.5rem 0.75rem', color: '#555', whiteSpace: 'nowrap' }}>
                              {new Date(m.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                              {' '}
                              <span style={{ color: '#aaa', fontSize: '0.75rem' }}>
                                {new Date(m.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </td>
                            <td style={{ padding: '0.5rem 0.75rem' }}>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', fontWeight: 600, padding: '0.15rem 0.5rem', borderRadius: 999, background: typeBg, color: typeColor }}>
                                <TypeIcon size={11} /> {typeLabel}
                              </span>
                            </td>
                            <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right', fontWeight: 600, color: typeColor }}>
                              {sign}{Math.abs(m.quantity)}
                            </td>
                            <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right', color: '#1a1a1a' }}>{m.stockAfter}</td>
                            <td style={{ padding: '0.5rem 0.75rem', color: '#666' }}>{m.reason ?? <span style={{ color: '#bbb' }}>—</span>}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {/* Variants (edit mode only) */}
          {!isNew && id && schema.variantAxes.length > 0 && (
            <section className={shared.card}>
              <h2 className={styles.sectionTitle}>
                Variantes
                <span style={{ fontSize: '0.7rem', fontWeight: 400, color: '#888', marginLeft: '0.5rem', fontStyle: 'italic' }}>
                  (axes : {schema.variantAxes.join(', ')})
                </span>
              </h2>
              <VariantsEditor productId={id} axes={schema.variantAxes} />
            </section>
          )}

          {/* Images */}
          <section className={shared.card}>
            <h2 className={styles.sectionTitle}>Images</h2>
            <div className={shared.form}>
              <div className={shared.field}>
                <label>Image principale</label>
                <div className={styles.imagePickerRow}>
                  {draft.imageUrl ? (
                    <img src={draft.imageUrl} alt="" className={styles.previewMain} />
                  ) : (
                    <div className={styles.previewPlaceholder}>Aucune image</div>
                  )}
                  <div className={styles.imageActions}>
                    <input
                      value={draft.imageUrl ?? ''}
                      onChange={(e) => setDraft({ ...draft, imageUrl: e.target.value })}
                      placeholder="https://... ou utilisez le bouton ci-dessous"
                    />
                    <label className={shared.btnSecondary}>
                      <Upload size={14} /> {uploading ? 'Upload…' : 'Téléverser'}
                      <input type="file" accept="image/*" onChange={handleUpload} hidden />
                    </label>
                  </div>
                </div>
              </div>

              <div className={shared.field}>
                <label>Galerie ({(draft.images ?? []).length} image{(draft.images ?? []).length !== 1 ? 's' : ''})</label>
                <div className={styles.gallery}>
                  {(draft.images ?? []).map((url, i) => (
                    <div key={i} className={styles.galleryItem}>
                      <img src={url} alt="" />
                      <button onClick={() => removeGalleryImage(i)} className={styles.galleryRemove} title="Retirer">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                  <label className={styles.galleryAdd}>
                    <Upload size={20} />
                    <span>Ajouter</span>
                    <input type="file" accept="image/*" onChange={handleGalleryUpload} hidden />
                  </label>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Side column */}
        <aside className={styles.sideCol}>
          <section className={shared.card}>
            <h2 className={styles.sectionTitle}>Organisation</h2>
            <div className={shared.form}>
              <div className={shared.field}>
                <label>Catégorie</label>
                <select
                  value={draft.categoryId ?? ''}
                  onChange={(e) => setDraft({ ...draft, categoryId: e.target.value || undefined })}
                >
                  <option value="">— Aucune —</option>
                  {categories.map((c) => (
                    <option key={c.slug} value={categoryMap.get(c.slug)}>{c.name}</option>
                  ))}
                </select>
                {currentCategorySlug && (
                  <p style={{ fontSize: '0.72rem', color: '#888', margin: '0.4rem 0 0', fontStyle: 'italic', lineHeight: 1.4 }}>
                    Champs affichés : {schema.fields.length === 0 ? 'minimaux' : schema.fields.join(', ')}
                    {schema.variantAxes.length > 0 && (
                      <> · variantes : <strong style={{ color: '#C44D3A' }}>{schema.variantAxes.join(' × ')}</strong></>
                    )}
                  </p>
                )}
              </div>
              <div className={shared.field}>
                <label>Marque</label>
                <select
                  value={draft.brandId ?? ''}
                  onChange={(e) => setDraft({ ...draft, brandId: e.target.value || undefined })}
                >
                  <option value="">— Aucune —</option>
                  {brands.map((b) => (
                    <option key={b.slug} value={brandMap.get(b.slug)}>{b.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          <section className={shared.card}>
            <h2 className={styles.sectionTitle}>État & visibilité</h2>
            <div className={shared.form}>
              <label className={shared.checkboxField}>
                <input type="checkbox" checked={draft.isActive ?? true} onChange={(e) => setDraft({ ...draft, isActive: e.target.checked })} />
                Produit actif (visible sur la boutique)
              </label>
              <label className={shared.checkboxField}>
                <input type="checkbox" checked={draft.isFeatured ?? false} onChange={(e) => setDraft({ ...draft, isFeatured: e.target.checked })} />
                Mis en avant (best-seller)
              </label>
              <label className={shared.checkboxField}>
                <input type="checkbox" checked={draft.isNew ?? false} onChange={(e) => setDraft({ ...draft, isNew: e.target.checked })} />
                Nouveau produit
              </label>
              <label className={shared.checkboxField}>
                <input type="checkbox" checked={draft.vipOnly ?? false} onChange={(e) => setDraft({ ...draft, vipOnly: e.target.checked })} />
                Exclusif VIP (Or) — masqué des autres utilisateurs
              </label>
            </div>
          </section>

          {error && (
            <div className={shared.card} style={{ background: '#fdf0ef', border: '1px solid #f5c6c2' }}>
              <p style={{ color: '#c0392b', fontSize: '0.85rem', margin: 0 }}>{error}</p>
            </div>
          )}

          <div className={styles.saveBox}>
            <button className={shared.btnPrimary} onClick={save} disabled={saving} style={{ width: '100%', justifyContent: 'center' }}>
              <Save size={14} /> {saving ? 'Enregistrement…' : isNew ? 'Créer le produit' : 'Mettre à jour'}
            </button>
            <Link to="/admin/products" className={shared.btnSecondary} style={{ width: '100%', justifyContent: 'center' }}>
              <X size={14} /> Annuler
            </Link>
          </div>
        </aside>
      </div>

      {!isNew && id && (
        <StockMovementModal
          open={stockModalOpen}
          productId={id}
          productName={draft.name || 'Produit'}
          currentStock={draft.stock ?? 0}
          onClose={() => setStockModalOpen(false)}
          onSuccess={() => { reloadMovements(); reloadProduct(); }}
        />
      )}
    </div>
  );
};

interface FacetMultiSelectProps {
  label: string;
  options: string[];
  value: string[];
  onChange: (v: string[]) => void;
}

const FacetMultiSelect = ({ label, options, value, onChange }: FacetMultiSelectProps) => {
  const toggle = (opt: string) => {
    if (value.includes(opt)) onChange(value.filter((v) => v !== opt));
    else onChange([...value, opt]);
  };
  return (
    <div className={shared.field}>
      <label>{label}</label>
      <div className={styles.facetChips}>
        {options.map((opt) => (
          <button
            type="button"
            key={opt}
            onClick={() => toggle(opt)}
            className={`${styles.facetChip} ${value.includes(opt) ? styles.facetChipActive : ''}`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
};

interface FacetTagsInputProps {
  label: string;
  value: string[];
  placeholder?: string;
  onChange: (v: string[]) => void;
}

const FacetTagsInput = ({ label, value, placeholder, onChange }: FacetTagsInputProps) => {
  const [text, setText] = useState(value.join(', '));
  const sync = () => {
    const next = text.split(',').map((s) => s.trim()).filter(Boolean);
    onChange(next);
  };
  return (
    <div className={shared.field}>
      <label>{label}</label>
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={sync}
        placeholder={placeholder}
      />
    </div>
  );
};

export default AdminProductForm;
