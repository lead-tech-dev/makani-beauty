import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Save, X, Tag } from 'lucide-react';
import { adminPromoCodes, PromoCodeInput } from '../../services/admin';
import type { ApiPromoCode } from '../../lib/api';
import Spinner from '../../components/Spinner/Spinner';
import shared from './admin.module.scss';

const empty: PromoCodeInput = {
  code: '',
  type: 'percentage',
  value: 0,
  minOrderAmount: 0,
  maxUses: null,
  validFrom: null,
  validUntil: null,
  isActive: true,
  description: '',
};

const AdminPromoCodes = () => {
  const [codes, setCodes] = useState<ApiPromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | 'new' | null>(null);
  const [draft, setDraft] = useState<PromoCodeInput>(empty);
  const [error, setError] = useState('');

  const reload = () => adminPromoCodes.list().then(setCodes);

  useEffect(() => { reload().finally(() => setLoading(false)); }, []);

  const startCreate = () => {
    setEditingId('new');
    setDraft(empty);
    setError('');
  };

  const startEdit = (c: ApiPromoCode) => {
    setEditingId(c.id);
    setDraft({
      code: c.code,
      type: c.type,
      value: Number(c.value),
      minOrderAmount: Number(c.minOrderAmount),
      maxUses: c.maxUses,
      validFrom: c.validFrom ? c.validFrom.slice(0, 10) : null,
      validUntil: c.validUntil ? c.validUntil.slice(0, 10) : null,
      isActive: c.isActive,
      description: c.description ?? '',
    });
    setError('');
  };

  const cancel = () => { setEditingId(null); setDraft(empty); setError(''); };

  const save = async () => {
    setError('');
    try {
      const payload = {
        ...draft,
        value: Number(draft.value),
        minOrderAmount: draft.minOrderAmount ? Number(draft.minOrderAmount) : 0,
        maxUses: draft.maxUses ? Number(draft.maxUses) : null,
        validFrom: draft.validFrom || null,
        validUntil: draft.validUntil || null,
      };
      if (editingId === 'new') await adminPromoCodes.create(payload);
      else if (editingId) await adminPromoCodes.update(editingId, payload);
      await reload();
      cancel();
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      setError(Array.isArray(msg) ? msg.join(', ') : (msg || 'Erreur lors de l enregistrement'));
    }
  };

  const remove = async (c: ApiPromoCode) => {
    if (!window.confirm(`Supprimer le code "${c.code}" ?`)) return;
    try {
      await adminPromoCodes.remove(c.id);
      setCodes((prev) => prev.filter((x) => x.id !== c.id));
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Erreur');
    }
  };

  if (loading) return <Spinner fullPage />;

  return (
    <div>
      <header className={shared.pageHeader}>
        <div>
          <h1 className={shared.title}>Codes promo</h1>
          <p className={shared.sub}>{codes.length} code{codes.length !== 1 ? 's' : ''}</p>
        </div>
        {!editingId && (
          <button className={shared.btnPrimary} onClick={startCreate}>
            <Plus size={16} /> Nouveau code
          </button>
        )}
      </header>

      {editingId === 'new' && (
        <PromoForm draft={draft} setDraft={setDraft} error={error} onSave={save} onCancel={cancel} title="Nouveau code promo" />
      )}

      {codes.length === 0 ? (
        <div className={`${shared.card} ${shared.empty}`}>
          <Tag size={42} />
          <h3>Aucun code promo</h3>
          <p>Créez votre premier code pour attirer les clients.</p>
        </div>
      ) : (
        <div className={shared.tableWrap}>
          <table className={shared.table}>
            <thead>
              <tr>
                <th>Code</th>
                <th>Type</th>
                <th>Valeur</th>
                <th>Min</th>
                <th>Utilisé</th>
                <th>Validité</th>
                <th>État</th>
                <th style={{ width: 100 }}></th>
              </tr>
            </thead>
            <tbody>
              {codes.map((c) => (
                editingId === c.id ? (
                  <tr key={c.id}>
                    <td colSpan={8}>
                      <PromoForm draft={draft} setDraft={setDraft} error={error} onSave={save} onCancel={cancel} title="Modifier" inline />
                    </td>
                  </tr>
                ) : (
                  <tr key={c.id}>
                    <td><strong><code>{c.code}</code></strong></td>
                    <td>{c.type === 'percentage' ? '%' : 'Fixe'}</td>
                    <td>
                      {c.type === 'percentage'
                        ? `${Number(c.value)}%`
                        : `$${Number(c.value).toFixed(2)}`}
                    </td>
                    <td>{Number(c.minOrderAmount) > 0 ? `$${Number(c.minOrderAmount).toFixed(2)}` : <span style={{ color: '#bbb' }}>—</span>}</td>
                    <td>
                      {c.usedCount}{c.maxUses != null ? ` / ${c.maxUses}` : ''}
                    </td>
                    <td style={{ fontSize: '0.78rem', color: '#666' }}>
                      {c.validUntil
                        ? `Jusqu'au ${new Date(c.validUntil).toLocaleDateString('fr-FR')}`
                        : <span style={{ color: '#bbb' }}>Permanent</span>}
                    </td>
                    <td>
                      <span className={`${shared.badge} ${c.isActive ? shared.success : shared.muted}`}>
                        {c.isActive ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td>
                      <div className={shared.actions}>
                        <button onClick={() => startEdit(c)} className={shared.btnIcon} title="Modifier">
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => remove(c)} className={`${shared.btnIcon} ${shared.danger}`} title="Supprimer">
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
  draft: PromoCodeInput;
  setDraft: (d: PromoCodeInput) => void;
  error: string;
  onSave: () => void;
  onCancel: () => void;
  title: string;
  inline?: boolean;
}

const PromoForm = ({ draft, setDraft, error, onSave, onCancel, title, inline }: FormProps) => (
  <div className={inline ? '' : shared.card} style={inline ? { padding: '1rem' } : { marginBottom: '1.5rem' }}>
    {!inline && <h3 style={{ marginTop: 0, fontFamily: 'Bricolage Grotesque, Inter, sans-serif' }}>{title}</h3>}
    <div className={shared.form}>
      <div className={shared.row}>
        <div className={shared.field}>
          <label>Code *</label>
          <input
            value={draft.code}
            onChange={(e) => setDraft({ ...draft, code: e.target.value.toUpperCase() })}
            placeholder="WELCOME5"
          />
        </div>
        <div className={shared.field}>
          <label>Type</label>
          <select value={draft.type} onChange={(e) => setDraft({ ...draft, type: e.target.value as any })}>
            <option value="percentage">Pourcentage (%)</option>
            <option value="fixed">Montant fixe ($)</option>
          </select>
        </div>
        <div className={shared.field}>
          <label>Valeur *</label>
          <input
            type="number"
            step="0.01"
            value={draft.value}
            onChange={(e) => setDraft({ ...draft, value: Number(e.target.value) })}
            placeholder={draft.type === 'percentage' ? '5' : '10.00'}
          />
        </div>
      </div>

      <div className={shared.row}>
        <div className={shared.field}>
          <label>Commande minimum (optionnel)</label>
          <input
            type="number" step="0.01" min={0}
            value={draft.minOrderAmount ?? 0}
            onChange={(e) => setDraft({ ...draft, minOrderAmount: Number(e.target.value) })}
          />
        </div>
        <div className={shared.field}>
          <label>Utilisations max (optionnel)</label>
          <input
            type="number" min={1}
            value={draft.maxUses ?? ''}
            onChange={(e) => setDraft({ ...draft, maxUses: e.target.value === '' ? null : Number(e.target.value) })}
            placeholder="Illimité si vide"
          />
        </div>
      </div>

      <div className={shared.row}>
        <div className={shared.field}>
          <label>Valide du (optionnel)</label>
          <input
            type="date"
            value={draft.validFrom ?? ''}
            onChange={(e) => setDraft({ ...draft, validFrom: e.target.value || null })}
          />
        </div>
        <div className={shared.field}>
          <label>Valide jusqu'au (optionnel)</label>
          <input
            type="date"
            value={draft.validUntil ?? ''}
            onChange={(e) => setDraft({ ...draft, validUntil: e.target.value || null })}
          />
        </div>
      </div>

      <div className={shared.field}>
        <label>Description (interne)</label>
        <input
          value={draft.description ?? ''}
          onChange={(e) => setDraft({ ...draft, description: e.target.value })}
          placeholder="Bienvenue — newsletter -5%"
        />
      </div>

      <label className={shared.checkboxField}>
        <input
          type="checkbox"
          checked={draft.isActive ?? true}
          onChange={(e) => setDraft({ ...draft, isActive: e.target.checked })}
        />
        Code actif
      </label>

      {error && <p style={{ color: '#c0392b', fontSize: '0.85rem', margin: 0 }}>{error}</p>}

      <div className={shared.formActions}>
        <button className={shared.btnSecondary} onClick={onCancel}><X size={14} /> Annuler</button>
        <button className={shared.btnPrimary} onClick={onSave}><Save size={14} /> Enregistrer</button>
      </div>
    </div>
  </div>
);

export default AdminPromoCodes;
