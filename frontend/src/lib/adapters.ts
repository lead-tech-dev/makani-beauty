import { Product, Category, Brand } from '../types';
import { ApiProduct, ApiCategory, ApiBrand } from './api';
import { FALLBACK_PRODUCT_IMG, FALLBACK_CATEGORY_IMG } from './images';

const FALLBACK_IMG = FALLBACK_PRODUCT_IMG;
const FALLBACK_CAT_IMG = FALLBACK_CATEGORY_IMG;

export function toProduct(api: ApiProduct): Product {
  const regularPrice = Number(api.price);
  const sale = api.salePrice != null ? Number(api.salePrice) : undefined;
  return {
    id: api.id,
    slug: api.slug,
    name: api.name,
    brand: api.brand?.slug || '',
    brandName: api.brand?.name,
    category: api.category?.slug || '',
    price: sale ?? regularPrice,
    comparePrice: sale ? regularPrice : undefined,
    currency: api.currency || '€',
    image: api.imageUrl || FALLBACK_IMG,
    imageSrcset: api.imageSrcset ?? undefined,
    imageLqip: api.imageLqip ?? undefined,
    images: api.images,
    rating: Number(api.rating) || 0,
    reviewCount: api.reviewCount || 0,
    description: api.description || '',
    features: api.tags?.length ? api.tags : undefined,
    ingredients: api.ingredients,
    isBestSeller: api.isFeatured,
    isNew: api.isNew,
    stock: api.stock,
    stockAlert: api.stockAlert,
    hairType: api.hairType ?? null,
    skinType: api.skinType ?? null,
    keyIngredients: api.keyIngredients ?? null,
    certifications: api.certifications ?? null,
    variants: (api.variants ?? []).map((v) => ({
      id: v.id,
      attributes: v.attributes ?? {},
      stock: v.stock,
      sku: v.sku ?? null,
      priceOverride: v.priceOverride != null ? Number(v.priceOverride) : null,
      imageUrl: v.imageUrl ?? null,
      displayOrder: v.displayOrder ?? 0,
      isActive: v.isActive ?? true,
    })),
  };
}

export function toCategory(api: ApiCategory): Category {
  return {
    id: api.id,
    slug: api.slug,
    name: api.name,
    description: api.description || '',
    image: api.imageUrl || FALLBACK_CAT_IMG,
  };
}

export function toBrand(api: ApiBrand): Brand {
  return {
    slug: api.slug,
    name: api.name,
    description: api.description,
  };
}
