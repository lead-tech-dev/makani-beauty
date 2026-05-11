import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Save, X, Award } from 'lucide-react';
import { adminBrands, BrandInput } from '../../services/admin';
import api, { ApiBrand } from '../../lib/api';
import Spinner from '../../components/Spinner/Spinner';
import shared from './admin.module.scss';

const slugify = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const empty: BrandInput = { name: '', slug: '', description: '', logoUrl: '', website: '', isActive: true };

const AdminBrands = () => {
  const [brands, setBrands] = useState<ApiBrand[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | 'new' | null>(null);
  const [draft, setDraft] = useState<BrandInput>(empty);
  const [error, setError] = useState('');

  const reload = () => api.get<ApiBrand[]>('/brands').then((r) => setBrands(r.data));

  useEffect(() => { reload().finally(() => setLoading(false)); }, []);

  const startCreate = () => { setEditingId('new'); setDraft(empty); setError(''); };
  const startEdit = (b: ApiBrand) => {
    setEditingId(b.id);
    setDraft({
      name: b.name, slug: b.slug,
      description: b.description ?? '', logoUrl: b.logoUrl ?? '',
      website: b.website ?? '', isActive: b.isActive,
    });
    setError('');
  };
  const cancel = () => { setEditingId(null); setDraft(empty); setError(''); };

  const save = async () => {
    setError('');
    try {
      if (editingId === 'new') await adminBrands.create(draft);
      else if (editingId) await adminBrands.update(editingId, draft);
      await reload();
      cancel();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Erreur lors de l enregistrement');
    }
  };

  const remove = async (b: ApiBrand) => {
    if (!window.confirm(`Supprimer la marque "${b.name}" ?`)) return;
    try {
      await adminBrands.remove(b.id);
      setBrands((prev) => prev.filter((x) => x.id !== b.id));
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Suppression impossible (produits liés ?)');
    }
  };

  if (loading) return <Spinner fullPage />;

  return (
    <div>
      <header className={shared.pageHeader}>
        <div>
          <h1 className={shared.title}>Marques</h1>
          <p className={shared.sub}>{brands.length} marque{brands.length !== 1 ? 's' : ''}</p>
        </div>
        {!editingId && (
          <button className={shared.btnPrimary} onClick={startCreate}>
            <Plus size={16} /> Nouvelle marque
          </button>
        )}
      </header>

      {editingId === 'new' && (
        <BrandForm draft={draft} setDraft={setDraft} error={error} onSave={save} onCancel={cancel} />
      )}

      {brands.length === 0 ? (
        <div className={`${shared.card} ${shared.empty}`}>
          <Award size={42} />
          <h3>Aucune marque</h3>
          <p>Créez votre première marque.</p>
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
                <th>Site web</th>
                <th>État</th>
                <th style={{ width: 100 }}></th>
              </tr>
            </thead>
            <tbody>
              {brands.map((b) => (
                editingId === b.id ? (
                  <tr key={b.id}>
                    <td colSpan={7}>
                      <BrandForm draft={draft} setDraft={setDraft} error={error} onSave={save} onCancel={cancel} inline />
                    </td>
                  </tr>
                ) : (
                  <tr key={b.id}>
                    <td>
                      {b.logoUrl ? <img src={b.logoUrl} alt="" className={shared.thumb} /> : <div className={shared.thumb} />}
                    </td>
                    <td><strong>{b.name}</strong></td>
                    <td><code>{b.slug}</code></td>
                    <td style={{ maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {b.description || <span style={{ color: '#bbb' }}>—</span>}
                    </td>
                    <td>
                      {b.website ? (
                        <a href={b.website} target="_blank" rel="noreferrer" style={{ color: '#C44D3A' }}>
                          {b.website.replace(/^https?:\/\//, '').slice(0, 30)}
                        </a>
                      ) : <span style={{ color: '#bbb' }}>—</span>}
                    </td>
                    <td>
                      <span className={`${shared.badge} ${b.isActive ? shared.success : shared.muted}`}>
                        {b.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div className={shared.actions}>
                        <button onClick={() => startEdit(b)} className={shared.btnIcon} title="Modifier"><Edit2 size={14} /></button>
                        <button onClick={() => remove(b)} className={`${shared.btnIcon} ${shared.danger}`} title="Supprimer"><Trash2 size={14} /></button>
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
  draft: BrandInput;
  setDraft: (d: BrandInput) => void;
  error: string;
  onSave: () => void;
  onCancel: () => void;
  inline?: boolean;
}

const BrandForm = ({ draft, setDraft, error, onSave, onCancel, inline }: FormProps) => (
  <div className={inline ? '' : shared.card} style={inline ? { padding: '1rem' } : { marginBottom: '1.5rem' }}>
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
            placeholder="Camille Rose"
          />
        </div>
        <div className={shared.field}>
          <label>Slug</label>
          <input
            value={draft.slug}
            onChange={(e) => setDraft({ ...draft, slug: e.target.value })}
            placeholder="camille-rose"
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
      <div className={shared.row}>
        <div className={shared.field}>
          <label>URL du logo</label>
          <input
            value={draft.logoUrl ?? ''}
            onChange={(e) => setDraft({ ...draft, logoUrl: e.target.value })}
            placeholder="https://..."
          />
        </div>
        <div className={shared.field}>
          <label>Site web</label>
          <input
            value={draft.website ?? ''}
            onChange={(e) => setDraft({ ...draft, website: e.target.value })}
            placeholder="https://..."
          />
        </div>
      </div>
      <label className={shared.checkboxField}>
        <input
          type="checkbox"
          checked={draft.isActive ?? true}
          onChange={(e) => setDraft({ ...draft, isActive: e.target.checked })}
        />
        Marque active
      </label>
      {error && <p style={{ color: '#c0392b', fontSize: '0.85rem', margin: 0 }}>{error}</p>}
      <div className={shared.formActions}>
        <button className={shared.btnSecondary} onClick={onCancel}><X size={14} /> Annuler</button>
        <button className={shared.btnPrimary} onClick={onSave}><Save size={14} /> Enregistrer</button>
      </div>
    </div>
  </div>
);

export default AdminBrands;
