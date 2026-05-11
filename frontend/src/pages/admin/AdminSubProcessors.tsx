import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Save, X, ExternalLink } from 'lucide-react';
import { subProcessorsService, SubProcessor, SubProcessorInput } from '../../services/subProcessors';
import Spinner from '../../components/Spinner/Spinner';
import shared from './admin.module.scss';
import styles from './AdminSubProcessors.module.scss';

const empty: SubProcessorInput = {
  name: '',
  purpose: '',
  dataTransmitted: '',
  country: '',
  safeguards: '',
  website: '',
  displayOrder: 100,
  isActive: true,
};

const AdminSubProcessors = () => {
  const [items, setItems] = useState<SubProcessor[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | 'new' | null>(null);
  const [draft, setDraft] = useState<SubProcessorInput>(empty);
  const [error, setError] = useState('');

  const reload = () => subProcessorsService.listAdmin().then(setItems);

  useEffect(() => {
    reload().finally(() => setLoading(false));
  }, []);

  const startCreate = () => {
    setEditingId('new');
    setDraft(empty);
    setError('');
  };

  const startEdit = (sp: SubProcessor) => {
    setEditingId(sp.id);
    setDraft({
      name: sp.name,
      purpose: sp.purpose,
      dataTransmitted: sp.dataTransmitted,
      country: sp.country,
      safeguards: sp.safeguards,
      website: sp.website ?? '',
      displayOrder: sp.displayOrder,
      isActive: sp.isActive,
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
      const payload: SubProcessorInput = {
        ...draft,
        website: draft.website?.trim() === '' ? null : draft.website,
      };
      if (editingId === 'new') await subProcessorsService.create(payload);
      else if (editingId) await subProcessorsService.update(editingId, payload);
      await reload();
      cancel();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Erreur à l enregistrement');
    }
  };

  const remove = async (sp: SubProcessor) => {
    if (!window.confirm(`Supprimer "${sp.name}" du registre ?`)) return;
    await subProcessorsService.remove(sp.id);
    setItems((prev) => prev.filter((x) => x.id !== sp.id));
  };

  if (loading) return <Spinner fullPage />;

  const editor = editingId !== null && (
    <div className={styles.editor}>
      <div className={styles.editorHeader}>
        <h2>{editingId === 'new' ? 'Nouveau sous-traitant' : 'Modifier'}</h2>
        <button onClick={cancel} aria-label="Fermer"><X size={18} /></button>
      </div>
      <div className={styles.grid}>
        <label>
          <span>Nom</span>
          <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
        </label>
        <label>
          <span>Site web politique RGPD</span>
          <input
            value={draft.website ?? ''}
            placeholder="https://..."
            onChange={(e) => setDraft({ ...draft, website: e.target.value })}
          />
        </label>
        <label className={styles.full}>
          <span>Finalité</span>
          <input value={draft.purpose} onChange={(e) => setDraft({ ...draft, purpose: e.target.value })} />
        </label>
        <label className={styles.full}>
          <span>Données transmises</span>
          <textarea
            value={draft.dataTransmitted}
            rows={3}
            onChange={(e) => setDraft({ ...draft, dataTransmitted: e.target.value })}
          />
        </label>
        <label>
          <span>Pays / localisation</span>
          <input value={draft.country} onChange={(e) => setDraft({ ...draft, country: e.target.value })} />
        </label>
        <label>
          <span>Ordre d affichage</span>
          <input
            type="number"
            value={draft.displayOrder}
            onChange={(e) => setDraft({ ...draft, displayOrder: Number(e.target.value) })}
          />
        </label>
        <label className={styles.full}>
          <span>Garanties RGPD (CCT, DPF, ISO 27001…)</span>
          <textarea
            value={draft.safeguards}
            rows={2}
            onChange={(e) => setDraft({ ...draft, safeguards: e.target.value })}
          />
        </label>
        <label className={styles.checkbox}>
          <input
            type="checkbox"
            checked={draft.isActive ?? true}
            onChange={(e) => setDraft({ ...draft, isActive: e.target.checked })}
          />
          <span>Actif (affiché publiquement)</span>
        </label>
      </div>
      {error && <div className={styles.error}>{error}</div>}
      <div className={styles.editorFooter}>
        <button onClick={cancel} className={styles.btnSecondary}>Annuler</button>
        <button onClick={save} className={styles.btnPrimary}>
          <Save size={14} /> Enregistrer
        </button>
      </div>
    </div>
  );

  return (
    <div>
      <header className={shared.pageHeader}>
        <div>
          <h1 className={shared.title}>Sous-traitants (DPA)</h1>
          <p className={shared.sub}>
            {items.length} sous-traitant{items.length !== 1 ? 's' : ''} · affichés sur{' '}
            <a href="/sous-traitants" target="_blank" rel="noreferrer">/sous-traitants</a>
          </p>
        </div>
        {!editingId && (
          <button onClick={startCreate} className={styles.btnPrimary}>
            <Plus size={14} /> Ajouter un sous-traitant
          </button>
        )}
      </header>

      {editor}

      <ul className={styles.list}>
        {items.map((sp) => (
          <li key={sp.id} className={`${styles.row} ${!sp.isActive ? styles.inactive : ''}`}>
            <div className={styles.rowMain}>
              <div>
                <strong>{sp.name}</strong>
                {!sp.isActive && <span className={styles.badge}>Inactif</span>}
                <p className={styles.purpose}>{sp.purpose}</p>
                <p className={styles.country}>📍 {sp.country}</p>
              </div>
              <div className={styles.actions}>
                {sp.website && (
                  <a href={sp.website} target="_blank" rel="noreferrer" className={styles.linkSm}>
                    <ExternalLink size={14} />
                  </a>
                )}
                <button onClick={() => startEdit(sp)} className={styles.iconBtn}><Edit2 size={14} /></button>
                <button onClick={() => remove(sp)} className={styles.iconBtnDanger}><Trash2 size={14} /></button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AdminSubProcessors;
