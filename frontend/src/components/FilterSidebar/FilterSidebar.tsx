import { Filter, X } from 'lucide-react';
import { FacetCounts } from '../../types';
import styles from './FilterSidebar.module.scss';

export interface ActiveFilters {
  hairType: string[];
  skinType: string[];
  ingredients: string[];
  certifications: string[];
  minPrice?: number;
  maxPrice?: number;
}

interface Props {
  facets: FacetCounts | null;
  active: ActiveFilters;
  onChange: (next: ActiveFilters) => void;
  onReset: () => void;
}

const HAIR_TYPE_LABELS: Record<string, string> = {
  '3A': '3A · boucles larges',
  '3B': '3B · boucles serrées',
  '3C': '3C · spirales',
  '4A': '4A · S-curls',
  '4B': '4B · zigzag',
  '4C': '4C · coily',
};

const SKIN_TYPE_LABELS: Record<string, string> = {
  sec: 'Peau sèche',
  gras: 'Peau grasse',
  mixte: 'Peau mixte',
  sensible: 'Peau sensible',
  normal: 'Peau normale',
};

const CERT_LABELS: Record<string, string> = {
  bio: 'Bio',
  vegan: 'Vegan',
  'cruelty-free': 'Cruelty-free',
  'made-in-france': 'Fabriqué en France',
};

const FilterSidebar = ({ facets, active, onChange, onReset }: Props) => {
  const toggle = (key: keyof Omit<ActiveFilters, 'minPrice' | 'maxPrice'>, value: string) => {
    const current = active[key];
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    onChange({ ...active, [key]: next });
  };

  const hasActive =
    active.hairType.length > 0 ||
    active.skinType.length > 0 ||
    active.ingredients.length > 0 ||
    active.certifications.length > 0 ||
    active.minPrice !== undefined ||
    active.maxPrice !== undefined;

  if (!facets) return null;

  const renderGroup = (
    title: string,
    counts: Record<string, number>,
    activeValues: string[],
    key: keyof Omit<ActiveFilters, 'minPrice' | 'maxPrice'>,
    labelMap?: Record<string, string>,
  ) => {
    const entries = Object.entries(counts).sort(([a], [b]) => a.localeCompare(b));
    if (entries.length === 0) return null;
    return (
      <div className={styles.group}>
        <h3>{title}</h3>
        <ul>
          {entries.map(([value, count]) => {
            const isActive = activeValues.includes(value);
            const label = labelMap?.[value] ?? value;
            return (
              <li key={value}>
                <label className={isActive ? styles.checked : ''}>
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={() => toggle(key, value)}
                  />
                  <span className={styles.name}>{label}</span>
                  <span className={styles.count}>{count}</span>
                </label>
              </li>
            );
          })}
        </ul>
      </div>
    );
  };

  return (
    <aside className={styles.sidebar}>
      <header className={styles.header}>
        <h2><Filter size={16} /> Filtres</h2>
        {hasActive && (
          <button onClick={onReset} className={styles.resetBtn}>
            <X size={12} /> Réinitialiser
          </button>
        )}
      </header>

      <div className={styles.priceRange}>
        <h3>Prix</h3>
        <div className={styles.priceInputs}>
          <input
            type="number"
            value={active.minPrice ?? ''}
            placeholder={String(facets.priceRange.min)}
            min={facets.priceRange.min}
            max={facets.priceRange.max}
            onChange={(e) => onChange({
              ...active,
              minPrice: e.target.value === '' ? undefined : Number(e.target.value),
            })}
          />
          <span>—</span>
          <input
            type="number"
            value={active.maxPrice ?? ''}
            placeholder={String(facets.priceRange.max)}
            min={facets.priceRange.min}
            max={facets.priceRange.max}
            onChange={(e) => onChange({
              ...active,
              maxPrice: e.target.value === '' ? undefined : Number(e.target.value),
            })}
          />
          <span className={styles.priceUnit}>€</span>
        </div>
      </div>

      {renderGroup('Type de cheveux', facets.hairType, active.hairType, 'hairType', HAIR_TYPE_LABELS)}
      {renderGroup('Type de peau', facets.skinType, active.skinType, 'skinType', SKIN_TYPE_LABELS)}
      {renderGroup('Ingrédients clés', facets.ingredients, active.ingredients, 'ingredients')}
      {renderGroup('Certifications', facets.certifications, active.certifications, 'certifications', CERT_LABELS)}
    </aside>
  );
};

export default FilterSidebar;
