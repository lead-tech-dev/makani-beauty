import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { X } from 'lucide-react';
import { addressesService, AddressInput } from '../../services/addresses';
import type { Address } from '../../types';
import styles from './AddressFormModal.module.scss';

const addressSchema = z.object({
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
type AddressForm = z.infer<typeof addressSchema>;

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: (addr: Address) => void;
}

const AddressFormModal = ({ open, onClose, onSaved }: Props) => {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<AddressForm>({
    resolver: zodResolver(addressSchema),
    defaultValues: { country: 'France' },
  });

  useEffect(() => {
    if (open) reset({ country: 'France' });
  }, [open, reset]);

  if (!open) return null;

  const onSubmit = async (data: AddressForm) => {
    const addr = await addressesService.create(data as AddressInput);
    onSaved(addr);
    onClose();
  };

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="addr-title"
      onClick={(e) => { if (e.target === e.currentTarget && !isSubmitting) onClose(); }}
    >
      <div className={styles.modal}>
        <header className={styles.header}>
          <h2 id="addr-title">Nouvelle adresse</h2>
          <button type="button" className={styles.close} onClick={onClose} disabled={isSubmitting} aria-label="Fermer">
            <X size={18} />
          </button>
        </header>

        <form onSubmit={handleSubmit(onSubmit)} className={styles.form} noValidate>
          <div className={styles.row}>
            <div className={styles.field}>
              <label>Nom complet</label>
              <input {...register('fullName')} placeholder="Marie Dupont" autoFocus />
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
            <label>Complément <em>(optionnel)</em></label>
            <input {...register('line2')} placeholder="Appartement, étage…" />
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
            <span>Définir comme adresse par défaut</span>
          </label>

          <footer className={styles.footer}>
            <button type="button" className={styles.btnSecondary} onClick={onClose} disabled={isSubmitting}>
              Annuler
            </button>
            <button type="submit" className={styles.btnPrimary} disabled={isSubmitting}>
              {isSubmitting ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
};

export default AddressFormModal;
