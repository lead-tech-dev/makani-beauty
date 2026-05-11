import { useEffect, useMemo, useState, ChangeEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Upload,
  Save,
  Sparkles,
} from "lucide-react";
import { adminProducts, adminUpload, ProductInput } from "../../services/admin";
import { categoriesService } from "../../services/categories";
import { brandsService } from "../../services/brands";
import api from "../../lib/api";
import type { Category, Brand } from "../../types";
import Spinner from "../../components/Spinner/Spinner";
import { schemaForSlug } from "./categorySchema";
import { FacetMultiSelect, FacetTagsInput } from "./FacetInputs";
import shared from "./admin.module.scss";
import styles from "./AdminProductWizard.module.scss";

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const empty: ProductInput = {
  name: "",
  slug: "",
  description: "",
  price: 0,
  salePrice: undefined,
  currency: "$",
  imageUrl: "",
  imageSrcset: null,
  imageLqip: null,
  images: [],
  sku: "",
  stock: 0,
  stockAlert: 5,
  isNew: false,
  isFeatured: false,
  vipOnly: false,
  ingredients: "",
  weight: "",
  weightGrams: null,
  volume: "",
  tags: [],
  hairType: null,
  skinType: null,
  keyIngredients: null,
  certifications: null,
  isActive: true,
  categoryId: undefined,
  brandId: undefined,
};

const STEPS = [
  { key: "identification", label: "Étape 1", title: "Identification" },
  { key: "details", label: "Étape 2", title: "Détails" },
  { key: "stock", label: "Étape 3", title: "Stock & inventaire" },
] as const;

const AdminProductWizard = () => {
  const navigate = useNavigate();
  const [stepIdx, setStepIdx] = useState(0);
  const [draft, setDraft] = useState<ProductInput>(empty);
  const [tagsInput, setTagsInput] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categoryMap, setCategoryMap] = useState<Map<string, string>>(new Map());
  const [brandMap, setBrandMap] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  // Load categories + brands
  useEffect(() => {
    Promise.all([
      api.get<any[]>("/categories").then((r) => r.data),
      api.get<any[]>("/brands").then((r) => r.data),
      categoriesService.getAll(),
      brandsService.getAll(),
    ]).then(([rawCats, rawBrands, cats, br]) => {
      setCategories(cats);
      setBrands(br);
      setCategoryMap(new Map(rawCats.map((c) => [c.slug, c.id])));
      setBrandMap(new Map(rawBrands.map((b) => [b.slug, b.id])));
      setLoading(false);
    });
  }, []);

  const currentCategorySlug = categories.find((c) => c.id === draft.categoryId)?.slug;
  const schema = useMemo(() => schemaForSlug(currentCategorySlug), [currentCategorySlug]);
  const showField = (name: string) => schema.fields.includes(name as never);
  const usesVariants = schema.variantAxes.length > 0;

  // Validation
  const stepValid = useMemo(() => {
    if (stepIdx === 0) {
      return !!draft.categoryId && draft.name.trim().length >= 2 && !!draft.slug;
    }
    if (stepIdx === 1) {
      return draft.price > 0;
    }
    return true;
  }, [stepIdx, draft]);

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
    try {
      const { url, srcset, lqip } = await adminUpload.image(file);
      setDraft((d) => ({
        ...d,
        imageUrl: url,
        imageSrcset: srcset ?? null,
        imageLqip: lqip ?? null,
      }));
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "Échec de l'upload");
    } finally {
      setUploading(false);
    }
  };

  const handleTagsBlur = () => {
    const tags = tagsInput.split(",").map((t) => t.trim()).filter(Boolean);
    setDraft({ ...draft, tags });
  };

  const handleSubmit = async () => {
    setSaving(true);
    setError("");
    try {
      const payload: ProductInput = {
        ...draft,
        price: Number(draft.price),
        salePrice: draft.salePrice != null ? Number(draft.salePrice) : undefined,
        stock: Number(draft.stock),
        stockAlert: Number(draft.stockAlert),
      };
      const created = await adminProducts.create(payload);
      // Redirect to edit form so user can manage gallery, variants, etc.
      navigate(`/admin/products/${created.id}`);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "Erreur lors de la création");
      setSaving(false);
    }
  };

  if (loading) return <Spinner fullPage />;

  return (
    <div className={styles.wrap}>
      <Link to="/admin/products" className={styles.back}>
        <ChevronLeft size={14} /> Retour aux produits
      </Link>

      <header className={styles.head}>
        <h1 className={styles.title}>
          <em>Nouveau</em> produit
        </h1>
        <p className={styles.sub}>
          Étape {stepIdx + 1} / {STEPS.length} — {STEPS[stepIdx].title}
        </p>
      </header>

      {/* Stepper */}
      <nav className={styles.stepper} aria-label="Progression">
        {STEPS.map((step, i) => {
          const isActive = i === stepIdx;
          const isDone = i < stepIdx;
          return (
            <button
              key={step.key}
              type="button"
              className={`${styles.step} ${isActive ? styles.stepActive : ""} ${isDone ? styles.stepDone : ""}`}
              onClick={() => i <= stepIdx && setStepIdx(i)}
              disabled={i > stepIdx}
              aria-current={isActive ? "step" : undefined}
            >
              <span className={styles.stepIndex}>
                {isDone ? <Check size={14} strokeWidth={2.5} /> : i + 1}
              </span>
              <span className={styles.stepBody}>
                <span className={styles.stepLabel}>{step.label}</span>
                <span className={styles.stepTitle}>{step.title}</span>
              </span>
            </button>
          );
        })}
      </nav>

      {error && <div className={styles.error}>{error}</div>}

      {/* Step content */}
      <div className={styles.card}>
        {stepIdx === 0 && (
          <>
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Catégorie *</h3>
              <div className={shared.field}>
                <select
                  value={draft.categoryId ?? ""}
                  onChange={(e) =>
                    setDraft({ ...draft, categoryId: e.target.value || undefined })
                  }
                >
                  <option value="">— Choisir une catégorie —</option>
                  {categories.map((c) => (
                    <option key={c.slug} value={categoryMap.get(c.slug)}>
                      {c.name}
                    </option>
                  ))}
                </select>
                {currentCategorySlug && (
                  <p className={styles.help}>
                    {usesVariants ? (
                      <>
                        Cette catégorie utilise des <strong>variantes</strong> (
                        {schema.variantAxes.join(" × ")}). Tu pourras les
                        ajouter à la dernière étape.
                      </>
                    ) : (
                      <>
                        Cette catégorie utilise un <strong>stock global</strong>{" "}
                        (pas de variantes).
                      </>
                    )}
                  </p>
                )}
              </div>
            </div>

            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Identification *</h3>
              <div className={shared.field}>
                <label>Nom du produit *</label>
                <input
                  value={draft.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder={
                    currentCategorySlug === "vetements"
                      ? "Robe wax bohème"
                      : currentCategorySlug === "meches-perruques"
                        ? "Lace front bouclée 18″"
                        : "Crème hydratante…"
                  }
                />
              </div>
              <div className={shared.row}>
                <div className={shared.field}>
                  <label>Slug *</label>
                  <input
                    value={draft.slug}
                    onChange={(e) => setDraft({ ...draft, slug: e.target.value })}
                  />
                </div>
                <div className={shared.field}>
                  <label>SKU</label>
                  <input
                    value={draft.sku ?? ""}
                    onChange={(e) => setDraft({ ...draft, sku: e.target.value })}
                    placeholder="SKU-001"
                  />
                </div>
              </div>
              <div className={shared.field}>
                <label>Marque</label>
                <select
                  value={draft.brandId ?? ""}
                  onChange={(e) =>
                    setDraft({ ...draft, brandId: e.target.value || undefined })
                  }
                >
                  <option value="">— Aucune —</option>
                  {brands.map((b) => (
                    <option key={b.slug} value={brandMap.get(b.slug)}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </>
        )}

        {stepIdx === 1 && (
          <>
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Description &amp; image</h3>
              <div className={shared.field}>
                <label>Description</label>
                <textarea
                  rows={4}
                  value={draft.description ?? ""}
                  onChange={(e) =>
                    setDraft({ ...draft, description: e.target.value })
                  }
                  placeholder="Présentation du produit, bénéfices, conseils d'utilisation…"
                />
              </div>
              <div className={shared.field}>
                <label>Image principale</label>
                <div className={styles.imagePicker}>
                  {draft.imageUrl ? (
                    <img src={draft.imageUrl} alt="" className={styles.preview} />
                  ) : (
                    <div className={styles.previewEmpty}>Aucune image</div>
                  )}
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.55rem" }}>
                    <input
                      value={draft.imageUrl ?? ""}
                      onChange={(e) =>
                        setDraft({ ...draft, imageUrl: e.target.value })
                      }
                      placeholder="https://… ou téléverser"
                    />
                    <label className={shared.btnSecondary} style={{ alignSelf: "flex-start" }}>
                      <Upload size={14} /> {uploading ? "Upload…" : "Téléverser"}
                      <input type="file" accept="image/*" onChange={handleUpload} hidden />
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Prix *</h3>
              <div className={shared.row}>
                <div className={shared.field}>
                  <label>Prix régulier *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={draft.price}
                    onChange={(e) =>
                      setDraft({ ...draft, price: Number(e.target.value) })
                    }
                  />
                </div>
                <div className={shared.field}>
                  <label>Prix soldé</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={draft.salePrice ?? ""}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        salePrice:
                          e.target.value === "" ? undefined : Number(e.target.value),
                      })
                    }
                  />
                </div>
                <div className={shared.field}>
                  <label>Devise</label>
                  <input
                    value={draft.currency ?? "$"}
                    maxLength={3}
                    onChange={(e) => setDraft({ ...draft, currency: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {(showField("ingredients") ||
              showField("weight") ||
              showField("volume") ||
              showField("weightGrams")) && (
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Spécifications</h3>
                {showField("ingredients") && (
                  <div className={shared.field}>
                    <label>Ingrédients</label>
                    <textarea
                      rows={2}
                      value={draft.ingredients ?? ""}
                      onChange={(e) =>
                        setDraft({ ...draft, ingredients: e.target.value })
                      }
                    />
                  </div>
                )}
                {(showField("weight") || showField("volume") || showField("weightGrams")) && (
                  <div className={shared.row}>
                    {showField("weight") && (
                      <div className={shared.field}>
                        <label>Poids/contenance</label>
                        <input
                          value={draft.weight ?? ""}
                          onChange={(e) => setDraft({ ...draft, weight: e.target.value })}
                          placeholder="100g"
                        />
                      </div>
                    )}
                    {showField("volume") && (
                      <div className={shared.field}>
                        <label>Volume</label>
                        <input
                          value={draft.volume ?? ""}
                          onChange={(e) => setDraft({ ...draft, volume: e.target.value })}
                          placeholder="250ml"
                        />
                      </div>
                    )}
                    {showField("weightGrams") && (
                      <div className={shared.field}>
                        <label>Poids livraison (g)</label>
                        <input
                          type="number"
                          min={0}
                          value={draft.weightGrams ?? ""}
                          onChange={(e) =>
                            setDraft({
                              ...draft,
                              weightGrams:
                                e.target.value === ""
                                  ? null
                                  : Math.max(0, Math.round(Number(e.target.value))),
                            })
                          }
                          placeholder="250"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {(showField("hairType") ||
              showField("skinType") ||
              showField("keyIngredients") ||
              showField("certifications") ||
              showField("tags")) && (
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Caractéristiques</h3>
                {showField("tags") && (
                  <div className={shared.field}>
                    <label>Tags (séparés par des virgules)</label>
                    <input
                      value={tagsInput}
                      onChange={(e) => setTagsInput(e.target.value)}
                      onBlur={handleTagsBlur}
                      placeholder="100% naturel, sans paraben…"
                    />
                  </div>
                )}
                {showField("hairType") && (
                  <FacetMultiSelect
                    label="Type de cheveux ciblé"
                    options={["3A", "3B", "3C", "4A", "4B", "4C"]}
                    value={draft.hairType ?? []}
                    onChange={(next) =>
                      setDraft({ ...draft, hairType: next.length === 0 ? null : next })
                    }
                  />
                )}
                {showField("skinType") && (
                  <FacetMultiSelect
                    label="Type de peau ciblé"
                    options={["sec", "gras", "mixte", "sensible", "normal"]}
                    value={draft.skinType ?? []}
                    onChange={(next) =>
                      setDraft({ ...draft, skinType: next.length === 0 ? null : next })
                    }
                  />
                )}
                {showField("keyIngredients") && (
                  <FacetTagsInput
                    label="Ingrédients clés (tags libres)"
                    value={draft.keyIngredients ?? []}
                    placeholder="karité, aloe vera, argan…"
                    onChange={(next) =>
                      setDraft({ ...draft, keyIngredients: next.length === 0 ? null : next })
                    }
                  />
                )}
                {showField("certifications") && (
                  <FacetMultiSelect
                    label="Certifications"
                    options={["bio", "vegan", "cruelty-free", "made-in-france"]}
                    value={draft.certifications ?? []}
                    onChange={(next) =>
                      setDraft({ ...draft, certifications: next.length === 0 ? null : next })
                    }
                  />
                )}
              </div>
            )}
          </>
        )}

        {stepIdx === 2 && (
          <>
            {usesVariants ? (
              <div className={styles.section}>
                <p className={styles.callout}>
                  <Sparkles size={16} style={{ verticalAlign: "middle", marginRight: 6, color: "#C44D3A" }} />
                  Cette catégorie utilise des <strong>variantes</strong>{" "}
                  ({schema.variantAxes.join(" × ")}). Crée d'abord le produit ;
                  tu seras redirigé vers l'écran d'édition pour ajouter les
                  variantes (taille / couleur / longueur, stock par variante).
                </p>
                <div className={shared.row} style={{ marginTop: "1.4rem" }}>
                  <div className={shared.field}>
                    <label>Stock initial (optionnel — utilisé si aucune variante)</label>
                    <input
                      type="number"
                      min={0}
                      value={draft.stock ?? 0}
                      onChange={(e) =>
                        setDraft({ ...draft, stock: Number(e.target.value) || 0 })
                      }
                    />
                  </div>
                  <div className={shared.field}>
                    <label>Seuil d'alerte stock</label>
                    <input
                      type="number"
                      min={0}
                      value={draft.stockAlert ?? 5}
                      onChange={(e) =>
                        setDraft({ ...draft, stockAlert: Number(e.target.value) || 0 })
                      }
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Stock global</h3>
                <div className={shared.row}>
                  <div className={shared.field}>
                    <label>Stock disponible *</label>
                    <input
                      type="number"
                      min={0}
                      value={draft.stock ?? 0}
                      onChange={(e) =>
                        setDraft({ ...draft, stock: Number(e.target.value) || 0 })
                      }
                    />
                  </div>
                  <div className={shared.field}>
                    <label>Seuil d'alerte stock bas</label>
                    <input
                      type="number"
                      min={0}
                      value={draft.stockAlert ?? 5}
                      onChange={(e) =>
                        setDraft({ ...draft, stockAlert: Number(e.target.value) || 0 })
                      }
                    />
                  </div>
                </div>
              </div>
            )}

            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Visibilité</h3>
              <div className={shared.row}>
                <label className={shared.checkboxField}>
                  <input
                    type="checkbox"
                    checked={!!draft.isActive}
                    onChange={(e) => setDraft({ ...draft, isActive: e.target.checked })}
                  />
                  Actif (visible en boutique)
                </label>
                <label className={shared.checkboxField}>
                  <input
                    type="checkbox"
                    checked={!!draft.isFeatured}
                    onChange={(e) => setDraft({ ...draft, isFeatured: e.target.checked })}
                  />
                  Mis en avant
                </label>
                <label className={shared.checkboxField}>
                  <input
                    type="checkbox"
                    checked={!!draft.isNew}
                    onChange={(e) => setDraft({ ...draft, isNew: e.target.checked })}
                  />
                  Nouveauté
                </label>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Footer nav */}
      <div className={styles.footer}>
        <button
          type="button"
          className={shared.btnSecondary}
          onClick={() => setStepIdx((s) => Math.max(0, s - 1))}
          disabled={stepIdx === 0}
        >
          <ChevronLeft size={14} /> Précédent
        </button>
        <span className={styles.spacer} />
        {stepIdx < STEPS.length - 1 ? (
          <button
            type="button"
            className={shared.btnPrimary}
            onClick={() => setStepIdx((s) => Math.min(STEPS.length - 1, s + 1))}
            disabled={!stepValid}
          >
            Suivant <ChevronRight size={14} />
          </button>
        ) : (
          <button
            type="button"
            className={shared.btnPrimary}
            onClick={handleSubmit}
            disabled={saving || !stepValid}
          >
            <Save size={14} /> {saving ? "Création…" : "Créer le produit"}
          </button>
        )}
      </div>
    </div>
  );
};

export default AdminProductWizard;
