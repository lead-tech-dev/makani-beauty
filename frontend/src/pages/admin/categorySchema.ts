// ────────────────────────────────────────────────────────────────────
// Per-category form schema
//
// Le formulaire produit affiche uniquement les champs pertinents pour
// la catégorie sélectionnée. Les champs « universels » (nom, slug, prix,
// description, image) sont toujours visibles.
//
// `fields` : champs spécifiques à montrer (en plus des universels)
// `variantAxes` : axes proposés par défaut dans l'éditeur de variantes
// ────────────────────────────────────────────────────────────────────

export type FormField =
  | "ingredients"
  | "hairType"
  | "skinType"
  | "weight"
  | "weightGrams"
  | "volume"
  | "keyIngredients"
  | "certifications"
  | "tags";

export interface CategorySchema {
  /** Champs spécifiques visibles pour cette catégorie. */
  fields: FormField[];
  /** Axes par défaut de l'éditeur de variantes. */
  variantAxes: string[];
  /** Suggestions d'options pour chaque axe (autocomplétion future). */
  variantAxisOptions?: Record<string, string[]>;
}

export const CATEGORY_SCHEMA: Record<string, CategorySchema> = {
  "soins-capillaires": {
    fields: [
      "ingredients",
      "hairType",
      "weight",
      "weightGrams",
      "volume",
      "keyIngredients",
      "certifications",
      "tags",
    ],
    variantAxes: [],
  },
  "soins-de-la-peau": {
    fields: [
      "ingredients",
      "skinType",
      "weight",
      "weightGrams",
      "volume",
      "keyIngredients",
      "certifications",
      "tags",
    ],
    variantAxes: [],
  },
  "parfums-dubai": {
    fields: ["volume", "keyIngredients", "weightGrams", "tags"],
    variantAxes: ["volume"],
    variantAxisOptions: {
      volume: ["30ml", "50ml", "75ml", "100ml"],
    },
  },
  "huile-pour-cheveux-et-peau": {
    fields: [
      "ingredients",
      "hairType",
      "skinType",
      "weight",
      "weightGrams",
      "volume",
      "keyIngredients",
      "certifications",
      "tags",
    ],
    variantAxes: [],
  },
  "meches-perruques": {
    fields: ["weightGrams", "tags"],
    variantAxes: ["length", "texture", "color"],
    variantAxisOptions: {
      length: ['10"', '12"', '14"', '16"', '18"', '20"', '22"', '24"', '26"', '28"', '30"'],
      texture: ["lisse", "ondulé", "bouclé", "deep wave", "kinky curly", "afro"],
      color: ["1B (naturel)", "2 (brun foncé)", "4 (brun)", "27 (caramel)", "613 (blond)", "ombré"],
    },
  },
  "vetements": {
    fields: ["weightGrams", "tags"],
    variantAxes: ["size", "color"],
    variantAxisOptions: {
      size: ["XS", "S", "M", "L", "XL", "XXL", "Unique"],
      color: ["noir", "blanc", "terracotta", "ocre", "crème", "wax mixte"],
    },
  },
};

/** Default schema for uncategorized products — show everything, no variants. */
export const DEFAULT_SCHEMA: CategorySchema = {
  fields: [
    "ingredients",
    "hairType",
    "skinType",
    "weight",
    "weightGrams",
    "volume",
    "keyIngredients",
    "certifications",
    "tags",
  ],
  variantAxes: [],
};

export const schemaForSlug = (slug: string | undefined): CategorySchema =>
  (slug && CATEGORY_SCHEMA[slug]) || DEFAULT_SCHEMA;
