import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Save, X, Truck, Scale, ChevronDown, ChevronRight } from 'lucide-react';
import { adminShippingZones, ShippingZoneInput, TierInput } from '../../services/admin';
import type { ApiShippingZone, ApiShippingTier } from '../../lib/api';
import Spinner from '../../components/Spinner/Spinner';
import shared from './admin.module.scss';

const empty: ShippingZoneInput = {
  name: '',
  countries: [],
  baseRate: 0,
  freeShippingThreshold: 0,
  taxRate: 0,
  isDefault: false,
  isActive: true,
};

const AdminShippingZones = () => {
  const [zones, setZones] = useState<ApiShippingZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | 'new' | null>(null);
  const [expandedTiers, setExpandedTiers] = useState<string | null>(null);
  const [draft, setDraft] = useState<ShippingZoneInput>(empty);
  const [countriesText, setCountriesText] = useState('');
  const [error, setError] = useState('');

  const reload = () => adminShippingZones.list().then(setZones);

  useEffect(() => { reload().finally(() => setLoading(false)); }, []);

  const startCreate = () => {
    setEditingId('new');
    setDraft(empty);
    setCountriesText('');
    setError('');
  };

  const startEdit = (z: ApiShippingZone) => {
    setEditingId(z.id);
    setDraft({
      name: z.name,
      countries: z.countries ?? [],
      baseRate: Number(z.baseRate),
      freeShippingThreshold: Number(z.freeShippingThreshold),
      taxRate: Number(z.taxRate),
      isDefault: z.isDefault,
      isActive: z.isActive,
    });
    setCountriesText((z.countries ?? []).join('\n'));
    setError('');
  };

  const cancel = () => { setEditingId(null); setDraft(empty); setCountriesText(''); setError(''); };

  const save = async () => {
    setError('');
    try {
      const payload: ShippingZoneInput = {
        ...draft,
        countries: countriesText.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean),
        baseRate: Number(draft.baseRate),
        freeShippingThreshold: Number(draft.freeShippingThreshold ?? 0),
        taxRate: Number(draft.taxRate),
      };
      if (editingId === 'new') await adminShippingZones.create(payload);
      else if (editingId) await adminShippingZones.update(editingId, payload);
      await reload();
      cancel();
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      setError(Array.isArray(msg) ? msg.join(', ') : (msg || 'Erreur lors de l enregistrement'));
    }
  };

  const remove = async (z: ApiShippingZone) => {
    if (!window.confirm(`Supprimer la zone "${z.name}" ?`)) return;
    try {
      await adminShippingZones.remove(z.id);
      setZones((prev) => prev.filter((x) => x.id !== z.id));
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Erreur');
    }
  };

  if (loading) return <Spinner fullPage />;

  return (
    <div>
      <header className={shared.pageHeader}>
        <div>
          <h1 className={shared.title}>Zones de livraison</h1>
          <p className={shared.sub}>{zones.length} zone{zones.length !== 1 ? 's' : ''}</p>
        </div>
        {!editingId && (
          <button className={shared.btnPrimary} onClick={startCreate}>
            <Plus size={16} /> Nouvelle zone
          </button>
        )}
      </header>

      {editingId === 'new' && (
        <ZoneForm draft={draft} setDraft={setDraft} countriesText={countriesText} setCountriesText={setCountriesText} error={error} onSave={save} onCancel={cancel} />
      )}

      {zones.length === 0 ? (
        <div className={`${shared.card} ${shared.empty}`}>
          <Truck size={42} />
          <h3>Aucune zone</h3>
          <p>Créez une zone pour calculer les frais de port et la TVA.</p>
        </div>
      ) : (
        <div className={shared.tableWrap}>
          <table className={shared.table}>
            <thead>
              <tr>
                <th>Nom</th>
                <th>Pays</th>
                <th>Frais</th>
                <th>Livr. gratuite dès</th>
                <th>TVA</th>
                <th>État</th>
                <th style={{ width: 100 }}></th>
              </tr>
            </thead>
            <tbody>
              {zones.map((z) => (
                editingId === z.id ? (
                  <tr key={z.id}>
                    <td colSpan={7}>
                      <ZoneForm draft={draft} setDraft={setDraft} countriesText={countriesText} setCountriesText={setCountriesText} error={error} onSave={save} onCancel={cancel} inline />
                    </td>
                  </tr>
                ) : (
                  <>
                    <tr key={z.id}>
                      <td>
                        <strong>{z.name}</strong>
                        {z.isDefault && <span className={`${shared.badge} ${shared.confirmed}`} style={{ marginLeft: '0.4rem' }}>Défaut</span>}
                      </td>
                      <td style={{ fontSize: '0.82rem', color: '#666', maxWidth: 250 }}>
                        {z.countries.length === 0
                          ? <span style={{ color: '#bbb' }}>{z.isDefault ? '(catch-all)' : '—'}</span>
                          : z.countries.slice(0, 4).join(', ') + (z.countries.length > 4 ? `, +${z.countries.length - 4}` : '')}
                      </td>
                      <td>{Number(z.baseRate).toFixed(2)}</td>
                      <td>{Number(z.freeShippingThreshold) > 0 ? Number(z.freeShippingThreshold).toFixed(2) : <span style={{ color: '#bbb' }}>—</span>}</td>
                      <td>{Number(z.taxRate)}%</td>
                      <td>
                        <span className={`${shared.badge} ${z.isActive ? shared.success : shared.muted}`}>
                          {z.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <div className={shared.actions}>
                          <button
                            onClick={() => setExpandedTiers((cur) => cur === z.id ? null : z.id)}
                            className={shared.btnIcon}
                            title="Paliers de poids"
                          >
                            {expandedTiers === z.id ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            <Scale size={14} style={{ marginLeft: 2 }} />
                          </button>
                          <button onClick={() => startEdit(z)} className={shared.btnIcon} title="Modifier"><Edit2 size={14} /></button>
                          <button onClick={() => remove(z)} className={`${shared.btnIcon} ${shared.danger}`} title="Supprimer"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                    {expandedTiers === z.id && (
                      <tr key={`${z.id}-tiers`}>
                        <td colSpan={7} style={{ background: '#fafaf8' }}>
                          <TiersEditor zoneId={z.id} fallbackPrice={Number(z.baseRate)} />
                        </td>
                      </tr>
                    )}
                  </>
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
  draft: ShippingZoneInput;
  setDraft: (d: ShippingZoneInput) => void;
  countriesText: string;
  setCountriesText: (s: string) => void;
  error: string;
  onSave: () => void;
  onCancel: () => void;
  inline?: boolean;
}

const ZoneForm = ({ draft, setDraft, countriesText, setCountriesText, error, onSave, onCancel, inline }: FormProps) => (
  <div className={inline ? '' : shared.card} style={inline ? { padding: '1rem' } : { marginBottom: '1.5rem' }}>
    <div className={shared.form}>
      <div className={shared.row}>
        <div className={shared.field}>
          <label>Nom de la zone *</label>
          <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="France métropolitaine" />
        </div>
        <div className={shared.field}>
          <label>TVA (%) *</label>
          <input type="number" step="0.1" min={0} max={100} value={draft.taxRate} onChange={(e) => setDraft({ ...draft, taxRate: Number(e.target.value) })} placeholder="20" />
        </div>
      </div>

      <div className={shared.field}>
        <label>Pays inclus (un par ligne ou séparés par virgule)</label>
        <textarea
          value={countriesText}
          onChange={(e) => setCountriesText(e.target.value)}
          rows={3}
          placeholder="France&#10;Belgique&#10;Allemagne"
        />
        <span style={{ fontSize: '0.75rem', color: '#888' }}>
          Laissez vide et cochez "Zone par défaut" pour servir de fallback.
        </span>
      </div>

      <div className={shared.row}>
        <div className={shared.field}>
          <label>Frais de port *</label>
          <input type="number" step="0.01" min={0} value={draft.baseRate} onChange={(e) => setDraft({ ...draft, baseRate: Number(e.target.value) })} placeholder="5.99" />
        </div>
        <div className={shared.field}>
          <label>Livraison gratuite dès</label>
          <input type="number" step="0.01" min={0} value={draft.freeShippingThreshold ?? 0} onChange={(e) => setDraft({ ...draft, freeShippingThreshold: Number(e.target.value) })} placeholder="80 (0 = jamais)" />
        </div>
      </div>

      <label className={shared.checkboxField}>
        <input type="checkbox" checked={draft.isDefault ?? false} onChange={(e) => setDraft({ ...draft, isDefault: e.target.checked })} />
        Zone par défaut (catch-all)
      </label>
      <label className={shared.checkboxField}>
        <input type="checkbox" checked={draft.isActive ?? true} onChange={(e) => setDraft({ ...draft, isActive: e.target.checked })} />
        Active
      </label>

      {error && <p style={{ color: '#c0392b', fontSize: '0.85rem', margin: 0 }}>{error}</p>}

      <div className={shared.formActions}>
        <button className={shared.btnSecondary} onClick={onCancel}><X size={14} /> Annuler</button>
        <button className={shared.btnPrimary} onClick={onSave}><Save size={14} /> Enregistrer</button>
      </div>
    </div>
  </div>
);

// ── Tiers editor ───────────────────────────────────────────────────────

interface TiersEditorProps {
  zoneId: string;
  fallbackPrice: number;
}

const TiersEditor = ({ zoneId, fallbackPrice }: TiersEditorProps) => {
  const [tiers, setTiers] = useState<ApiShippingTier[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [draft, setDraft] = useState<TierInput | null>(null);

  const reload = () => adminShippingZones.listTiers(zoneId).then(setTiers);

  useEffect(() => {
    setLoading(true);
    reload().finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoneId]);

  const startAdd = () => {
    setError('');
    const lastMax = tiers?.length
      ? tiers.reduce((acc, t) => Math.max(acc, t.maxWeightGrams ?? 0), 0)
      : 0;
    setDraft({
      minWeightGrams: lastMax,
      maxWeightGrams: lastMax === 0 ? 500 : null,
      price: fallbackPrice,
    });
  };

  const cancelDraft = () => { setDraft(null); setError(''); };

  const saveDraft = async () => {
    if (!draft) return;
    setError('');
    try {
      await adminShippingZones.createTier(zoneId, draft);
      await reload();
      setDraft(null);
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      setError(Array.isArray(msg) ? msg.join(', ') : (msg || 'Erreur'));
    }
  };

  const removeTier = async (tier: ApiShippingTier) => {
    if (!window.confirm('Supprimer ce palier ?')) return;
    try {
      await adminShippingZones.removeTier(zoneId, tier.id);
      setTiers((prev) => prev?.filter((t) => t.id !== tier.id) ?? null);
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Erreur');
    }
  };

  const fmtG = (g: number) => g >= 1000 ? `${(g / 1000).toFixed(g % 1000 === 0 ? 0 : 2).replace('.', ',')} kg` : `${g} g`;

  if (loading) return <div style={{ padding: '0.75rem 1rem', color: '#888', fontSize: '0.85rem' }}>Chargement…</div>;

  return (
    <div style={{ padding: '0.85rem 1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
        <strong style={{ fontSize: '0.85rem', color: '#1a1a1a' }}>Paliers de poids</strong>
        {!draft && (
          <button className={shared.btnSecondary} onClick={startAdd} style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}>
            <Plus size={12} /> Ajouter un palier
          </button>
        )}
      </div>

      {(!tiers || tiers.length === 0) && !draft && (
        <p style={{ fontSize: '0.82rem', color: '#888', margin: '0 0 0.5rem' }}>
          Aucun palier — la zone utilise le tarif unique <strong>{fallbackPrice.toFixed(2)}</strong> pour tous les poids.
        </p>
      )}

      {tiers && tiers.length > 0 && (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ textAlign: 'left', color: '#888', fontWeight: 500 }}>
              <th style={{ padding: '0.4rem 0.5rem' }}>De</th>
              <th style={{ padding: '0.4rem 0.5rem' }}>À</th>
              <th style={{ padding: '0.4rem 0.5rem' }}>Prix</th>
              <th style={{ padding: '0.4rem 0.5rem', width: 60 }}></th>
            </tr>
          </thead>
          <tbody>
            {tiers.map((t) => (
              <tr key={t.id} style={{ borderTop: '1px solid #f0ebe4' }}>
                <td style={{ padding: '0.4rem 0.5rem' }}>{fmtG(t.minWeightGrams)}</td>
                <td style={{ padding: '0.4rem 0.5rem' }}>{t.maxWeightGrams !== null ? `< ${fmtG(t.maxWeightGrams)}` : <em style={{ color: '#888', fontStyle: 'normal' }}>et plus</em>}</td>
                <td style={{ padding: '0.4rem 0.5rem', fontWeight: 600, color: '#C44D3A' }}>{Number(t.price).toFixed(2)}</td>
                <td style={{ padding: '0.4rem 0.5rem' }}>
                  <button onClick={() => removeTier(t)} className={`${shared.btnIcon} ${shared.danger}`} title="Supprimer" style={{ width: 26, height: 26 }}>
                    <Trash2 size={12} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {draft && (
        <div style={{ marginTop: '0.75rem', padding: '0.75rem 0.85rem', background: '#fff', border: '1px solid #f0ebe4', borderRadius: 8, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '0.6rem', alignItems: 'end' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.72rem', color: '#888', marginBottom: 2 }}>Min (g)</label>
            <input
              type="number" min={0} step={1}
              value={draft.minWeightGrams}
              onChange={(e) => setDraft({ ...draft, minWeightGrams: Math.max(0, Number(e.target.value || 0)) })}
              style={{ width: '100%', border: '1.5px solid #e0d8d0', borderRadius: 6, padding: '0.4rem 0.5rem', fontSize: '0.85rem' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.72rem', color: '#888', marginBottom: 2 }}>Max (g)</label>
            <input
              type="number" min={1} step={1}
              value={draft.maxWeightGrams ?? ''}
              onChange={(e) => setDraft({ ...draft, maxWeightGrams: e.target.value === '' ? null : Number(e.target.value) })}
              placeholder="vide = ouvert"
              style={{ width: '100%', border: '1.5px solid #e0d8d0', borderRadius: 6, padding: '0.4rem 0.5rem', fontSize: '0.85rem' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.72rem', color: '#888', marginBottom: 2 }}>Prix</label>
            <input
              type="number" min={0} step={0.01}
              value={draft.price}
              onChange={(e) => setDraft({ ...draft, price: Math.max(0, Number(e.target.value || 0)) })}
              style={{ width: '100%', border: '1.5px solid #e0d8d0', borderRadius: 6, padding: '0.4rem 0.5rem', fontSize: '0.85rem' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            <button onClick={cancelDraft} className={shared.btnIcon} title="Annuler" style={{ width: 32, height: 32 }}>
              <X size={14} />
            </button>
            <button onClick={saveDraft} className={shared.btnPrimary} style={{ padding: '0.35rem 0.7rem' }}>
              <Save size={12} />
            </button>
          </div>
          {error && <p style={{ gridColumn: '1 / -1', margin: 0, color: '#c0392b', fontSize: '0.78rem' }}>{error}</p>}
        </div>
      )}
    </div>
  );
};

export default AdminShippingZones;
