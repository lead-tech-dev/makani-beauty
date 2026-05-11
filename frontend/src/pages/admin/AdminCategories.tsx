import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Save, X, Tag } from 'lucide-react';
import { adminCategories, CategoryInput } from '../../services/admin';
import api, { ApiCategory } from '../../lib/api';
import Spinner from '../../components/Spinner/Spinner';
import shared from './admin.module.scss';

const slugify = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const empty: CategoryInput = { name: '', slug: '', description: '', imageUrl: '', isActive: true };

const AdminCategories = () => {
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | 'new' | null>(null);
  const [draft, setDraft] = useState<CategoryInput>(empty);
  const [error, setError] = useState('');

  const reload = () => api.get<ApiCategory[]>('/categories').then((r) => setCategories(r.data));

  useEffect(() => { reload().finally(() => setLoading(false)); }, []);

  const startCreate = () => {
    setEditingId('new');
    setDraft(empty);
    setError('');
  };

  const startEdit = (cat: ApiCategory) => {
    setEditingId(cat.id);
    setDraft({
      name: cat.name,
      slug: cat.slug,
      description: cat.description ?? '',
      imageUrl: cat.imageUrl ?? '',
      isActive: cat.isActive,
    });
    setError('');
  };

  const cancel = () => {
    setEditingId(null);
    setDraft(empty);
    setError('');
  };

  const save = async () => {
    setError('');
    try {
      if (editingId === 'new') await adminCategories.create(draft);
      else if (editingId) await adminCategories.update(editingId, draft);
      await reload();
      cancel();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Erreur lors de l enregistrement');
    }
  };

  const remove = async (cat: ApiCategory) => {
    if (!window.confirm(`Supprimer la catégorie "${cat.name}" ?`)) return;
    try {
      await adminCategories.remove(cat.id);
      setCategories((prev) => prev.filter((c) => c.id !== cat.id));
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Suppression impossible (produits liés ?)');
    }
  };

  if (loading) return <Spinner fullPage />;

  return (
    <div>
      <header className={shared.pageHeader}>
        <div>
          <h1 className={shared.title}>Catégories</h1>
          <p className={shared.sub}>{categories.length} catégorie{categories.length !== 1 ? 's' : ''}</p>
        </div>
        {!editingId && (
          <button className={shared.btnPrimary} onClick={startCreate}>
            <Plus size={16} /> Nouvelle catégorie
          </button>
        )}
      </header>

      {editingId === 'new' && (
        <CategoryForm draft={draft} setDraft={setDraft} error={error} onSave={save} onCancel={cancel} title="Nouvelle catégorie" />
      )}

      {categories.length === 0 ? (
        <div className={`${shared.card} ${shared.empty}`}>
          <Tag size={42} />
          <h3>Aucune catégorie</h3>
          <p>Créez votre première catégorie pour organiser le catalogue.</p>
        </div>
      ) : (
        <div className={shared.tableWrap}>
          <table className={shared.table}>
            <thead>
              <tr>
                <th style={{ width: 60 }}></th>
                <th>Nom</th>
                <th>Slug</th>
                <th>Description</th>
                <th>État</th>
                <th style={{ width: 100 }}></th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                editingId === cat.id ? (
                  <tr key={cat.id}>
                    <td colSpan={6}>
                      <CategoryForm draft={draft} setDraft={setDraft} error={error} onSave={save} onCancel={cancel} title="Modifier" inline />
                    </td>
                  </tr>
                ) : (
                  <tr key={cat.id}>
                    <td>
                      {cat.imageUrl ? (
                        <img src={cat.imageUrl} alt="" className={shared.thumb} />
                      ) : <div className={shared.thumb} />}
                    </td>
                    <td><strong>{cat.name}</strong></td>
                    <td><code>{cat.slug}</code></td>
                    <td style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {cat.description || <span style={{ color: '#bbb' }}>—</span>}
                    </td>
                    <td>
                      <span className={`${shared.badge} ${cat.isActive ? shared.success : shared.muted}`}>
                        {cat.isActive ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td>
                      <div className={shared.actions}>
                        <button onClick={() => startEdit(cat)} className={shared.btnIcon} title="Modifier">
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => remove(cat)} className={`${shared.btnIcon} ${shared.danger}`} title="Supprimer">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

interface FormProps {
  draft: CategoryInput;
  setDraft: (d: CategoryInput) => void;
  error: string;
  onSave: () => void;
  onCancel: () => void;
  title: string;
  inline?: boolean;
}

const CategoryForm = ({ draft, setDraft, error, onSave, onCancel, title, inline }: FormProps) => (
  <div className={inline ? '' : shared.card} style={inline ? { padding: '1rem' } : { marginBottom: '1.5rem' }}>
    {!inline && <h3 style={{ marginTop: 0, fontFamily: 'Bricolage Grotesque, Inter, sans-serif' }}>{title}</h3>}
    <div className={shared.form}>
      <div className={shared.row}>
        <div className={shared.field}>
          <label>Nom</label>
          <input
            value={draft.name}
            onChange={(e) => {
              const name = e.target.value;
              setDraft({ ...draft, name, slug: draft.slug === slugify(draft.name) || !draft.slug ? slugify(name) : draft.slug });
            }}
            placeholder="Soins capillaires"
          />
        </div>
        <div className={shared.field}>
          <label>Slug</label>
          <input
            value={draft.slug}
            onChange={(e) => setDraft({ ...draft, slug: e.target.value })}
            placeholder="soins-capillaires"
          />
        </div>
      </div>
      <div className={shared.field}>
        <label>Description</label>
        <textarea
          value={draft.description ?? ''}
          onChange={(e) => setDraft({ ...draft, description: e.target.value })}
          rows={2}
        />
      </div>
      <div className={shared.field}>
        <label>URL d image</label>
        <input
          value={draft.imageUrl ?? ''}
          onChange={(e) => setDraft({ ...draft, imageUrl: e.target.value })}
          placeholder="https://..."
        />
      </div>
      <label className={shared.checkboxField}>
        <input
          type="checkbox"
          checked={draft.isActive ?? true}
          onChange={(e) => setDraft({ ...draft, isActive: e.target.checked })}
        />
        Catégorie active
      </label>
      {error && <p style={{ color: '#c0392b', fontSize: '0.85rem', margin: 0 }}>{error}</p>}
      <div className={shared.formActions}>
        <button className={shared.btnSecondary} onClick={onCancel}>
          <X size={14} /> Annuler
        </button>
        <button className={shared.btnPrimary} onClick={onSave}>
          <Save size={14} /> Enregistrer
        </button>
      </div>
    </div>
  </div>
);

export default AdminCategories;
