// ──────────────────────────────────────────────────────────────────
// Editorial visuals — Makani Cosmétique
//
// Brief : portraits de femmes africaines à la peau claire / brune
// (afro-claires, métisses, maghrébines).
//
// Images AI-générées hébergées dans /public/images/. Pour en remplacer
// une, dépose le PNG dans /public/images/ et ajuste le chemin ci-dessous.
// ──────────────────────────────────────────────────────────────────

// Hero (page d'accueil, partie droite, croppé en arche)
export const HERO_PORTRAIT = "/images/hero-portrait.png";

// About (split « Manifeste »)
export const ABOUT_PORTRAIT = "/images/about-portrait.png";

// Section éditoriale Home — image arche du « Manifeste »
export const HOME_EDITORIAL = "/images/home-editorial.png";

// Catégories (utilisées si /admin/categories n'a pas encore été édité ;
// pour mettre à jour les images en DB voir scripts ci-dessous)
export const CATEGORY_IMAGES: Record<string, string> = {
  "soins-capillaires": "/images/cat-soins-capillaires.png",
  "soins-de-la-peau": "/images/cat-soins-de-la-peau.png",
  "parfums-dubai": "/images/cat-parfums-dubai.png",
  "huile-pour-cheveux-et-peau": "/images/cat-huiles-beurres.png",
  "meches-perruques": "/images/cat-meches-perruques.png",
  "vetements": "/images/cat-vetements.png",
};

// Fallbacks (produit/catégorie sans image en DB)
export const FALLBACK_PRODUCT_IMG = "/images/hero-portrait.png";
export const FALLBACK_CATEGORY_IMG = "/images/about-portrait.png";
