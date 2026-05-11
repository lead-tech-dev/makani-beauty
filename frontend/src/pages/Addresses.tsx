import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { MapPin, Plus, Trash2, Edit2, Star } from 'lucide-react';
import { addressesService, AddressInput } from '../services/addresses';
import type { Address } from '../types';
import Spinner from '../components/Spinner/Spinner';
import styles from './Addresses.module.scss';

const schema = z.object({
  fullName: z.string().min(2, 'Nom requis'),
  line1: z.string().min(3, 'Adresse requise'),
  line2: z.string().optional(),
  city: z.string().min(1, 'Ville requise'),
  state: z.string().optional(),
  postalCode: z.string().min(1, 'Code postal requis'),
  country: z.string().min(1, 'Pays requis'),
  phone: z.string().optional(),
  isDefault: z.boolean().optional(),
});
type FormData = z.infer<typeof schema>;

const Addresses = () => {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { country: 'France' },
  });

  useEffect(() => {
    addressesService.getAll().then(setAddresses).finally(() => setLoading(false));
  }, []);

  const startCreate = () => {
    setEditingId(null);
    reset({ country: 'France' });
    setShowForm(true);
  };

  const startEdit = (addr: Address) => {
    setEditingId(addr.id);
    reset({
      fullName: addr.fullName,
      line1: addr.line1,
      line2: addr.line2 ?? '',
      city: addr.city,
      state: addr.state ?? '',
      postalCode: addr.postalCode,
      country: addr.country,
      phone: addr.phone ?? '',
      isDefault: addr.isDefault,
    });
    setShowForm(true);
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingId(null);
    reset({ country: 'France' });
  };

  const onSubmit = async (data: FormData) => {
    if (editingId) {
      const updated = await addressesService.update(editingId, data as AddressInput);
      setAddresses((prev) => prev.map((a) => (a.id === editingId ? updated : a)));
    } else {
      const created = await addressesService.create(data as AddressInput);
      setAddresses((prev) => [...prev, created]);
    }
    cancelForm();
    // Reload to reflect default-flag changes across other addresses
    addressesService.getAll().then(setAddresses);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Supprimer cette adresse ?')) return;
    await addressesService.remove(id);
    setAddresses((prev) => prev.filter((a) => a.id !== id));
  };

  const setDefault = async (addr: Address) => {
    if (addr.isDefault) return;
    await addressesService.update(addr.id, { isDefault: true });
    addressesService.getAll().then(setAddresses);
  };

  if (loading) return <Spinner fullPage />;

  return (
    <section className={styles.card}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Mes adresses</h1>
          <p className={styles.sub}>{addresses.length} adresse{addresses.length !== 1 ? 's' : ''} enregistrée{addresses.length !== 1 ? 's' : ''}</p>
        </div>
        {!showForm && (
          <button className={styles.addBtn} onClick={startCreate}>
            <Plus size={16} /> Nouvelle adresse
          </button>
        )}
      </header>

      {addresses.length === 0 && !showForm && (
        <div className={styles.empty}>
          <MapPin size={42} />
          <h3>Aucune adresse enregistrée</h3>
          <p>Ajoutez une adresse pour passer commande plus rapidement.</p>
          <button className={styles.addBtn} onClick={startCreate}>
            <Plus size={16} /> Ajouter une adresse
          </button>
        </div>
      )}

      {addresses.length > 0 && (
        <div className={styles.list}>
          {addresses.map((addr) => (
            <article key={addr.id} className={styles.addressCard}>
              <header>
                <strong>{addr.fullName}</strong>
                {addr.isDefault && (
                  <span className={styles.defaultBadge}>
                    <Star size={11} /> Par défaut
                  </span>
                )}
              </header>
              <div className={styles.addressBody}>
                <span>{addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}</span>
                <span>{addr.postalCode} {addr.city}</span>
                <span>{addr.country}</span>
                {addr.phone && <span className={styles.phone}>{addr.phone}</span>}
              </div>
              <div className={styles.actions}>
                {!addr.isDefault && (
                  <button onClick={() => setDefault(addr)} className={styles.actionBtn}>
                    <Star size={14} /> Par défaut
                  </button>
                )}
                <button onClick={() => startEdit(addr)} className={styles.actionBtn}>
                  <Edit2 size={14} /> Modifier
                </button>
                <button onClick={() => handleDelete(addr.id)} className={`${styles.actionBtn} ${styles.danger}`}>
                  <Trash2 size={14} /> Supprimer
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit(onSubmit)} className={styles.form} noValidate>
          <h2 className={styles.formTitle}>
            {editingId ? 'Modifier l adresse' : 'Nouvelle adresse'}
          </h2>

          <div className={styles.row}>
            <div className={styles.field}>
              <label>Nom complet</label>
              <input {...register('fullName')} placeholder="Marie Dupont" />
              {errors.fullName && <span className={styles.err}>{errors.fullName.message}</span>}
            </div>
            <div className={styles.field}>
              <label>Téléphone</label>
              <input {...register('phone')} placeholder="+33 6 12 34 56 78" />
            </div>
          </div>

          <div className={styles.field}>
            <label>Adresse</label>
            <input {...register('line1')} placeholder="12 rue de la Paix" />
            {errors.line1 && <span className={styles.err}>{errors.line1.message}</span>}
          </div>

          <div className={styles.field}>
            <label>Complément (optionnel)</label>
            <input {...register('line2')} placeholder="Appartement, étage..." />
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label>Code postal</label>
              <input {...register('postalCode')} placeholder="75001" />
              {errors.postalCode && <span className={styles.err}>{errors.postalCode.message}</span>}
            </div>
            <div className={styles.field}>
              <label>Ville</label>
              <input {...register('city')} placeholder="Paris" />
              {errors.city && <span className={styles.err}>{errors.city.message}</span>}
            </div>
          </div>

          <div className={styles.field}>
            <label>Pays</label>
            <input {...register('country')} placeholder="France" />
            {errors.country && <span className={styles.err}>{errors.country.message}</span>}
          </div>

          <label className={styles.checkboxField}>
            <input type="checkbox" {...register('isDefault')} />
            Définir comme adresse par défaut
          </label>

          <div className={styles.formActions}>
            <button type="button" onClick={cancelForm} className={styles.cancelBtn}>
              Annuler
            </button>
            <button type="submit" className={styles.saveBtn} disabled={isSubmitting}>
              {isSubmitting ? 'Enregistrement…' : editingId ? 'Mettre à jour' : 'Enregistrer'}
            </button>
          </div>
        </form>
      )}
    </section>
  );
};

export default Addresses;
