import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { Category } from '../modules/categories/category.entity';
import { Brand } from '../modules/brands/brand.entity';
import { Product } from '../modules/products/product.entity';
import { User } from '../modules/users/user.entity';
import { UserRole } from '../common/enums/user-role.enum';
import { PromoCode } from '../modules/promo-codes/promo-code.entity';
import { PromoCodeType } from '../common/enums/promo-code-type.enum';
import { ShippingZone } from '../modules/shipping/shipping-zone.entity';
import { ShippingTier } from "../modules/shipping/shipping-tier.entity";

dotenv.config();

// Same detection logic as runtime config — keeps managed Postgres (Neon, etc.) working.
const seedHost = process.env.DB_HOST || 'localhost';
const seedUseSsl =
  process.env.DB_SSL === 'true' ||
  /neon\.tech|render\.com|amazonaws\.com|supabase\.co|aiven\.io/i.test(seedHost);

const dataSource = new DataSource({
  type: 'postgres',
  host: seedHost,
  port: Number(process.env.DB_PORT) || 5434,
  username: process.env.DB_USERNAME || 'feeling_user',
  password: process.env.DB_PASSWORD || 'feeling_password',
  database: process.env.DB_NAME || 'feeling_beauty',
  entities: [Category, Brand, Product, User, PromoCode, ShippingZone, ShippingTier],
  synchronize: false,
  ssl: seedUseSsl ? { rejectUnauthorized: false } : false,
});

// ── Catalogue: 4 categories, 18 brands, 25 products ─────────────

const CATEGORIES = [
  {
    name: 'Soins Capillaires',
    slug: 'soins-capillaires',
    description: 'Shampoings, après-shampoings, masques, crèmes coiffantes et soins dédiés aux cheveux afro, bouclés et crépus.',
    imageUrl: '/images/cat-soins-capillaires.png',
  },
  {
    name: 'Soins de la Peau',
    slug: 'soins-de-la-peau',
    description: 'Crèmes, sérums, gels, savons et laits corporels pour une peau éclatante et hydratée au quotidien.',
    imageUrl: '/images/cat-soins-de-la-peau.png',
  },
  {
    name: "Parfums d'Orient",
    slug: 'parfums-dubai',
    description: 'Une sélection rare de fragrances arabes et orientales — boisé, oud, rose, vanille, ambre.',
    imageUrl: '/images/cat-parfums-dubai.png',
  },
  {
    name: 'Huiles & Beurres',
    slug: 'huile-pour-cheveux-et-peau',
    description: 'Beurres de karité, huiles précieuses et formulations naturelles pour nourrir cheveux et peau.',
    imageUrl: '/images/cat-huiles-beurres.png',
  },
  {
    name: 'Mèches & Perruques',
    slug: 'meches-perruques',
    description: 'Mèches naturelles et synthétiques, lace fronts, full lace, perruques bouclées et lisses — sélection professionnelle.',
    imageUrl: '/images/cat-meches-perruques.png',
  },
  {
    name: 'Vêtements',
    slug: 'vetements',
    description: 'Pièces inspirées des cultures pan-africaines — wax, lin, soie. Tailles XS à XL.',
    imageUrl: '/images/cat-vetements.png',
  },
];

const BRANDS = [
  { slug: 'aunt-jackies', name: "Aunt Jackie's", description: 'USA — Soins capillaires naturels' },
  { slug: 'cantu', name: 'Cantu', description: 'USA — Spécialiste des cheveux texturés' },
  { slug: 'creme-of-nature', name: 'Crème of Nature', description: 'USA — Soins capillaires haut de gamme' },
  { slug: 'palmers', name: "Palmer's", description: 'USA — Beurre de cacao et soins corporels' },
  { slug: 'camille-rose', name: 'Camille Rose', description: 'USA — Soins naturels artisanaux' },
  { slug: 'shea-moisture', name: 'Shea Moisture', description: 'USA — Karité et ingrédients naturels' },
  { slug: 'mielle', name: 'Mielle Organics', description: 'USA — Soins biologiques pour cheveux' },
  { slug: 'activilong', name: 'Activilong', description: 'France — Soins pour cheveux ethniques' },
  { slug: 'as-i-am', name: 'As I Am', description: 'USA — Lignes pour cheveux naturels' },
  { slug: 'les-secrets-de-loly', name: 'Les Secrets de Loly', description: 'France — Soins capillaires bouclés' },
  { slug: 'ard-al-zaafaran', name: 'Ard Al Zaafaran', description: 'Émirats — Parfumerie orientale' },
  { slug: 'ajmal', name: 'Ajmal', description: 'Émirats — Maison de parfums depuis 1951' },
  { slug: 'gris-montaigne', name: 'Gris Montaigne Paris', description: 'France — Brumes parfumées gourmandes' },
  { slug: 'paris-corner', name: 'Paris Corner', description: 'Émirats — Fragrances arabes' },
  { slug: 'asantee', name: 'Asantee', description: 'Thaïlande — Savons naturels' },
  { slug: 'bettys', name: "Betty's", description: 'Afrique du Sud — Soins naturels' },
  { slug: 'clere', name: 'Clere', description: 'Afrique du Sud — Soins de la peau' },
  { slug: 'mixa', name: 'Mixa', description: 'France — Soins corps et visage' },
];

interface SeedProduct {
  slug: string;
  name: string;
  brandSlug: string;
  categorySlug: string;
  price: number;          // regular price
  salePrice?: number;     // discounted price (lower than price)
  currency: string;
  imageUrl: string;
  rating: number;
  reviewCount: number;
  description: string;
  isFeatured?: boolean;
  isNew?: boolean;
  tags?: string[];
}

const PRODUCTS: SeedProduct[] = [
  { slug: 'bettys-soothing-aloe-vera-body-gel', name: "Betty's Gel Corps Apaisant à l'Aloe Vera Visage et Mains 100% Naturel 300 ml", brandSlug: 'bettys', categorySlug: 'soins-de-la-peau', price: 10, salePrice: 8, currency: '$', imageUrl: 'https://afrometis.com/cdn/shop/files/1_55752b34-86ee-4fea-b8a8-715dff8fdec9.png?v=1710925406', rating: 5, reviewCount: 124, description: "Un gel apaisant 100% naturel à l'aloe vera pour le visage, le corps et les mains. Hydrate, calme et apporte fraîcheur immédiate. Idéal après-soleil ou pour les peaux sensibles.", isFeatured: true, tags: ['100% naturel', 'Visage, corps et mains', 'Sans parfum agressif', 'Format 300ml'] },
  { slug: 'clere-bp-pure-glycerine', name: 'Clere BP Glycérine pure pour soins polyvalents 200 ml', brandSlug: 'clere', categorySlug: 'soins-de-la-peau', price: 8, salePrice: 5, currency: '$', imageUrl: 'https://afrometis.com/cdn/shop/products/71aHHcb9L1L._AC_SL1500.jpg?v=1710163977', rating: 5, reviewCount: 89, description: 'Glycérine pure BP pour soins polyvalents de la peau. Adoucit, hydrate et apaise les peaux les plus sèches.', isFeatured: true },
  { slug: 'apres-shampoing-moroccan-pear-custard-camille-rose', name: 'Après shampoing Moroccan Pear Custard 355ml — Camille Rose', brandSlug: 'camille-rose', categorySlug: 'soins-capillaires', price: 24, salePrice: 22, currency: '$', imageUrl: 'https://afrometis.com/cdn/shop/files/2_bcd1248e-2312-4a61-a66f-c2842d1c10aa.png?v=1710925210', rating: 5, reviewCount: 211, description: "Après-shampoing crémeux à la poire et à l'huile d'argan marocaine. Démêle, nourrit et redonne brillance aux cheveux bouclés et crépus.", isFeatured: true },
  { slug: 'asantee-papaya-honey-soap', name: 'Savon visage et corps Asantee à la papaye et au miel', brandSlug: 'asantee', categorySlug: 'soins-de-la-peau', price: 9, salePrice: 6, currency: '$', imageUrl: 'https://afrometis.com/cdn/shop/files/3_375b114d-8051-4c1c-a2fd-bb332ce3d9d1.png?v=1710925203', rating: 4.5, reviewCount: 320, description: 'Un savon naturel à la papaye et au miel qui éclaircit, hydrate et purifie en douceur. Tient le teint uniforme.', isFeatured: true },
  { slug: 'as-i-am-rice-water-shampoo', name: "As I Am Shampoing micellaire à l'eau de riz 8oz", brandSlug: 'as-i-am', categorySlug: 'soins-capillaires', price: 16, currency: '$', imageUrl: 'https://afrometis.com/cdn/shop/files/Shmp_grande_7ea59fb5-ac3e-468c-bea0-5ad146a0b7a7.webp?v=1710918703', rating: 5, reviewCount: 178, description: "Un shampoing micellaire fortifiant à l'eau de riz pour des cheveux plus forts, plus denses et plus brillants." },
  { slug: 'shampooing-mielle-pomegranate-honey', name: 'Shampooing Mielle Grenade & Miel Hydratant & Démêlant 355 ml', brandSlug: 'mielle', categorySlug: 'soins-capillaires', price: 20, salePrice: 15, currency: '$', imageUrl: 'https://afrometis.com/cdn/shop/files/data_2.jpg?v=1712647787', rating: 5, reviewCount: 256, description: 'Hydrate, démêle et nourrit en profondeur. Une formule à la grenade et au miel pour les cheveux assoiffés.', isFeatured: true },
  { slug: 'les-secrets-de-loly-boost-curl-jelly', name: 'LES SECRETS DE LOLY Boost Curl Gelée 250 ml', brandSlug: 'les-secrets-de-loly', categorySlug: 'soins-capillaires', price: 32, salePrice: 26, currency: '$', imageUrl: 'https://afrometis.com/cdn/shop/files/afrometis_18.jpg?v=1710919405', rating: 5, reviewCount: 412, description: 'Gelée définissante qui sublime les boucles, sans effet carton. Tenue souple, brillance et hydratation longue durée.', isFeatured: true },
  { slug: 'ajmal-ehsas-bloom-edp', name: 'Ajmal Ehsas Bloom Eau de Parfum 100ml', brandSlug: 'ajmal', categorySlug: 'parfums-dubai', price: 41, salePrice: 36, currency: '$', imageUrl: 'https://afrometis.com/cdn/shop/files/10_38f7398b-31c9-46f2-ab76-51aa0a044cb6.png?v=1710416175', rating: 5, reviewCount: 67, description: 'Une fragrance florale orientale aux notes de pétales fraîches, de rose et de musc blanc. Élégante et lumineuse.', isNew: true },
  { slug: 'cherie-blossom-edp', name: 'Fleur de Chérie EDP 100ml (3.4Oz)', brandSlug: 'paris-corner', categorySlug: 'parfums-dubai', price: 47, salePrice: 43, currency: '$', imageUrl: 'https://afrometis.com/cdn/shop/products/Untitleddesign-2023-10-28T114432.361.png?v=1710418806', rating: 4.5, reviewCount: 92, description: 'Une eau de parfum gourmande et fleurie, sillage chaud, parfait pour le jour comme pour le soir.' },
  { slug: 'lil-banaat-faqat-edp', name: 'LIL BANAAT FAQAT Eau de Parfum 100ml — Ard Al Zaafran', brandSlug: 'ard-al-zaafaran', categorySlug: 'parfums-dubai', price: 47, salePrice: 43, currency: '$', imageUrl: 'https://afrometis.com/cdn/shop/products/lil-banaat-faqat-eau-de-perfume-100ml-by-ard-al-zaafran-974936_1024x1024_d8d7dab9-62a0-4cf6-9424-b74eec2ab5f7.jpg?v=1710413948', rating: 5, reviewCount: 154, description: 'Une fragrance signature pour femme, mêlant fleurs blanches, fruits rouges et bois précieux. Sillage envoûtant.' },
  { slug: 'ard-al-zaafaran-dar-al-hae', name: 'Ard Al Zaafaran Dar Al Hae Femme EDP 100 ml', brandSlug: 'ard-al-zaafaran', categorySlug: 'parfums-dubai', price: 41, salePrice: 36, currency: '$', imageUrl: 'https://afrometis.com/cdn/shop/products/dar-al-hae.jpg?v=1710418824', rating: 5, reviewCount: 88, description: 'Notes de tête vibrantes, cœur floral et fond ambré. Une signature orientale moderne.' },
  { slug: 'ard-al-zaafaran-mousuf-edp', name: 'Ard Al Zaafaran Mousuf EDP 30ml décantation', brandSlug: 'ard-al-zaafaran', categorySlug: 'parfums-dubai', price: 41, salePrice: 36, currency: '$', imageUrl: 'https://afrometis.com/cdn/shop/files/8_00ff9b1f-9485-4d3a-977a-7c875353b9fc.png?v=1710416031', rating: 4.5, reviewCount: 41, description: "Format découverte 30ml d'une eau de parfum unisexe boisée et chaleureuse, idéale en voyage." },
  { slug: 'aunt-jackies-grapeseed-styling-glue', name: "Aunt Jackie's Colle coiffante flexible aux pépins de raisin 4oz", brandSlug: 'aunt-jackies', categorySlug: 'soins-capillaires', price: 12, currency: '$', imageUrl: 'https://afrometis.com/cdn/shop/files/cosmetics_15.png?v=1710918793', rating: 4.5, reviewCount: 76, description: 'Colle coiffante flexible pour des coiffures précises et durables, sans effet carton.' },
  { slug: 'lait-corps-satinant-eclat-mixa', name: 'Lait Corps Satinant Éclat Mixa', brandSlug: 'mixa', categorySlug: 'soins-de-la-peau', price: 24, currency: '$', imageUrl: 'https://afrometis.com/cdn/shop/products/Lait-de-Beaute-Satinant-Mixa-Eclat.png?v=1710404139', rating: 4.5, reviewCount: 58, description: 'Lait corporel satinant qui sublime les peaux mates et foncées, pour un éclat naturel quotidien.' },
  { slug: 'camille-rose-aloe-whipped-butter-gel', name: "Camille Rose Naturals : Gel au beurre fouetté à l'aloès 8oz", brandSlug: 'camille-rose', categorySlug: 'huile-pour-cheveux-et-peau', price: 21, currency: '$', imageUrl: 'https://afrometis.com/cdn/shop/products/Untitleddesign_5_3b07a31e-6616-4550-8261-7664995bd18b.png?v=1709966638', rating: 5, reviewCount: 142, description: "Gel-beurre fouetté hydratant à l'aloès, pour définir et nourrir les boucles avec souplesse." },
  { slug: 'asantee-rice-milk-collagen-soap', name: 'ASANTEE Savon au Lait de Riz, Collagène et Miel 125g', brandSlug: 'asantee', categorySlug: 'soins-de-la-peau', price: 6, currency: '$', imageUrl: 'https://afrometis.com/cdn/shop/files/design_1.jpg?v=1710919145', rating: 4.5, reviewCount: 198, description: 'Savon éclat au lait de riz, collagène et miel. Adoucit la peau et unifie le teint.' },
  { slug: 'shea-moisture-coconut-hibiscus-shampoo', name: 'SHEA MOISTURE Shampooing boucles & brillance Coco & Hibiscus 384 ml', brandSlug: 'shea-moisture', categorySlug: 'soins-capillaires', price: 16, currency: '$', imageUrl: 'https://afrometis.com/cdn/shop/files/afrometisss_4.jpg?v=1710921309', rating: 5, reviewCount: 305, description: 'Un shampoing brillance pour cheveux bouclés et frisés. Coco, hibiscus, soie de neem.' },
  { slug: 'activilong-actirepair-brillantine', name: 'Activilong Actirepair Brillantine Végétale Olive & Avocat 125 ml', brandSlug: 'activilong', categorySlug: 'soins-capillaires', price: 12, currency: '$', imageUrl: 'https://afrometis.com/cdn/shop/files/cosmetics_8.png?v=1710328868', rating: 4.5, reviewCount: 64, description: "Brillantine végétale aux huiles d'olive et d'avocat bio. Apporte brillance, démêlage et souplesse." },
  { slug: 'activilong-gel-control-fixation-forte', name: 'Activilong Gel Contrôle Fixation Forte 300 ml', brandSlug: 'activilong', categorySlug: 'soins-capillaires', price: 10, currency: '$', imageUrl: 'https://afrometis.com/cdn/shop/files/Untitled_1_1.jpg?v=1712313796', rating: 4.5, reviewCount: 47, description: 'Gel coiffant fixation forte pour des coiffures plaquées impeccables et nettes.' },
  { slug: 'activilong-conditioning-shampoo-mango', name: 'ACTIVILONG Shampoing Conditionneur Mangue & Amande Douce 300 ml', brandSlug: 'activilong', categorySlug: 'soins-capillaires', price: 14, currency: '$', imageUrl: 'https://afrometis.com/cdn/shop/files/ti-actikids-conditioning-shampoo.jpg?v=1712312747', rating: 5, reviewCount: 81, description: "Shampoing 2-en-1 mangue & amande douce. Lavant et démêlant, idéal pour cheveux d'enfants et boucles fines." },
  { slug: 'activilong-ti-milkshake-leave-in', name: 'ACTIVILONG Ti Milkshake Leave-In Actikids — Sans Rinçage', brandSlug: 'activilong', categorySlug: 'soins-capillaires', price: 14, currency: '$', imageUrl: 'https://afrometis.com/cdn/shop/products/71lsIqItSBL_4afe31e8-8198-4c87-8aef-6a4051c85451.jpg?v=1709966890', rating: 5, reviewCount: 96, description: 'Soin sans rinçage doux et hydratant, formulé pour les enfants aux cheveux bouclés.' },
  { slug: 'marshmallow-blush-paris-corner', name: 'Marshmallow Blush — Paris Corner', brandSlug: 'paris-corner', categorySlug: 'parfums-dubai', price: 60, currency: '$', imageUrl: 'https://afrometis.com/cdn/shop/files/WhatsApp_Image_2025-01-21_at_1.14.07_PM.jpg?v=1739345660', rating: 5, reviewCount: 33, description: 'Une fragrance gourmande et tendre, marshmallow, vanille et fleurs blanches. Un sillage cocooning.', isNew: true },
  { slug: 'ard-al-zaafaran-rose-paris-edp', name: 'Ard Al Zaafaran Rose Paris EDP Femme 100ml', brandSlug: 'ard-al-zaafaran', categorySlug: 'parfums-dubai', price: 35, salePrice: 31, currency: '$', imageUrl: 'https://afrometis.com/cdn/shop/products/289821.jpg?v=1710413979', rating: 5, reviewCount: 217, description: 'Un parfum oriental floral autour de la rose de Damas, du oud et du musc. Élégance et caractère.' },
  { slug: 'gris-montaigne-sweet-candy', name: 'Sweet Candy — Gris Montaigne Paris', brandSlug: 'gris-montaigne', categorySlug: 'parfums-dubai', price: 12, currency: '$', imageUrl: 'https://afrometis.com/cdn/shop/files/SWEET-CANDY-BRUME-PARFUMEE.webp?v=1756885092', rating: 4.5, reviewCount: 112, description: 'Brume parfumée légère et gourmande, idéale pour cheveux et corps. Sillage sucré et frais.' },
  { slug: 'gris-montaigne-barbe-a-papa', name: 'Gris Montaigne — Barbe à Papa — Brume Parfumée', brandSlug: 'gris-montaigne', categorySlug: 'parfums-dubai', price: 12, currency: '$', imageUrl: 'https://afrometis.com/cdn/shop/files/BARBE-A-PAPA-BRUME-PARFUMEE.webp?v=1756796206', rating: 4.5, reviewCount: 84, description: 'Brume parfumée Barbe à Papa, ultra-gourmande, parfaite pour rafraîchir les cheveux et la peau.' },
];

async function seed() {
  await dataSource.initialize();
  console.log('🌱 Seeding database...\n');

  const categoryRepo = dataSource.getRepository(Category);
  const brandRepo = dataSource.getRepository(Brand);
  const productRepo = dataSource.getRepository(Product);
  const userRepo = dataSource.getRepository(User);

  // ── Categories ──────────────────────────────────────────────
  console.log(`📂 Categories (${CATEGORIES.length})`);
  for (const cat of CATEGORIES) {
    const existing = await categoryRepo.findOne({ where: { slug: cat.slug } });
    if (existing) {
      Object.assign(existing, cat);
      await categoryRepo.save(existing);
      console.log(`  ↻ Updated: ${cat.name}`);
    } else {
      await categoryRepo.save(categoryRepo.create(cat));
      console.log(`  ✓ Created: ${cat.name}`);
    }
  }

  // ── Brands ──────────────────────────────────────────────────
  console.log(`\n🏷️  Brands (${BRANDS.length})`);
  for (const brand of BRANDS) {
    const existing = await brandRepo.findOne({ where: { slug: brand.slug } });
    if (existing) {
      Object.assign(existing, brand);
      await brandRepo.save(existing);
      console.log(`  ↻ Updated: ${brand.name}`);
    } else {
      await brandRepo.save(brandRepo.create(brand));
      console.log(`  ✓ Created: ${brand.name}`);
    }
  }

  // ── Products ────────────────────────────────────────────────
  console.log(`\n🛍️  Products (${PRODUCTS.length})`);
  let created = 0, updated = 0, skipped = 0;
  for (const p of PRODUCTS) {
    const cat = await categoryRepo.findOne({ where: { slug: p.categorySlug } });
    const brand = await brandRepo.findOne({ where: { slug: p.brandSlug } });
    if (!cat) {
      console.warn(`  ⚠ Skipping "${p.slug}" — category "${p.categorySlug}" not found`);
      skipped++;
      continue;
    }

    const fields = {
      name: p.name,
      slug: p.slug,
      description: p.description,
      price: p.price,
      salePrice: p.salePrice ?? null,
      currency: p.currency,
      imageUrl: p.imageUrl,
      stock: 50,
      stockAlert: 10,
      rating: p.rating,
      reviewCount: p.reviewCount,
      isNew: p.isNew ?? false,
      isFeatured: p.isFeatured ?? false,
      isActive: true,
      tags: p.tags ?? null,
      categoryId: cat.id,
      brandId: brand?.id ?? null,
    };

    const existing = await productRepo.findOne({ where: { slug: p.slug } });
    if (existing) {
      Object.assign(existing, fields);
      await productRepo.save(existing);
      updated++;
    } else {
      await productRepo.save(productRepo.create(fields as any));
      created++;
    }
  }
  console.log(`  ✓ ${created} created, ↻ ${updated} updated, ⚠ ${skipped} skipped`);

  // ── Cleanup orphans not in canonical lists ──────────────────
  console.log('\n🧹 Cleanup');
  const canonicalProductSlugs = new Set(PRODUCTS.map((p) => p.slug));
  const canonicalCatSlugs = new Set(CATEGORIES.map((c) => c.slug));
  const canonicalBrandSlugs = new Set(BRANDS.map((b) => b.slug));

  const allProducts = await productRepo.find();
  for (const p of allProducts) {
    if (!canonicalProductSlugs.has(p.slug)) {
      await productRepo.remove(p);
      console.log(`  ✗ Removed orphan product: ${p.name}`);
    }
  }

  const allCats = await categoryRepo.find();
  for (const c of allCats) {
    if (canonicalCatSlugs.has(c.slug)) continue;
    const linked = await productRepo.count({ where: { categoryId: c.id } });
    if (linked === 0) {
      await categoryRepo.remove(c);
      console.log(`  ✗ Removed unused category: ${c.name}`);
    } else {
      console.log(`  ⚠ Kept category "${c.name}" (${linked} product(s) attached)`);
    }
  }

  const allBrands = await brandRepo.find();
  for (const b of allBrands) {
    if (canonicalBrandSlugs.has(b.slug)) continue;
    const linked = await productRepo.count({ where: { brandId: b.id } });
    if (linked === 0) {
      await brandRepo.remove(b);
      console.log(`  ✗ Removed unused brand: ${b.name}`);
    } else {
      console.log(`  ⚠ Kept brand "${b.name}" (${linked} product(s) attached)`);
    }
  }

  // ── Promo codes ─────────────────────────────────────────────
  console.log('\n🎟️  Promo codes');
  const promoRepo = dataSource.getRepository(PromoCode);
  const welcomeExists = await promoRepo.findOne({ where: { code: 'WELCOME5' } });
  if (!welcomeExists) {
    await promoRepo.save(promoRepo.create({
      code: 'WELCOME5',
      type: PromoCodeType.PERCENTAGE,
      value: 5,
      minOrderAmount: 0,
      maxUses: null,
      usedCount: 0,
      isActive: true,
      description: 'Bienvenue — 5% sur la première commande (newsletter)',
    }));
    console.log('  ✓ WELCOME5 (-5%)');
  } else {
    console.log('  – WELCOME5 already exists');
  }

  // ── Shipping zones ──────────────────────────────────────────
  console.log('\n🚚 Shipping zones');
  const zoneRepo = dataSource.getRepository(ShippingZone);
  const ZONES = [
    {
      name: 'France métropolitaine',
      countries: ['France'],
      baseRate: 5.99,
      freeShippingThreshold: 80,
      taxRate: 20,
      isDefault: false,
    },
    {
      name: 'Union européenne',
      countries: [
        'Belgique', 'Allemagne', 'Espagne', 'Italie', 'Pays-Bas',
        'Portugal', 'Luxembourg', 'Irlande', 'Autriche',
      ],
      baseRate: 12,
      freeShippingThreshold: 120,
      taxRate: 20,
      isDefault: false,
    },
    {
      name: 'International',
      countries: [],
      baseRate: 25,
      freeShippingThreshold: 200,
      taxRate: 0,
      isDefault: true,
    },
  ];
  for (const z of ZONES) {
    const existing = await zoneRepo.findOne({ where: { name: z.name } });
    if (existing) {
      Object.assign(existing, z);
      await zoneRepo.save(existing);
      console.log(`  ↻ Updated: ${z.name}`);
    } else {
      await zoneRepo.save(zoneRepo.create(z));
      console.log(`  ✓ Created: ${z.name}`);
    }
  }

  // ── Admin user ──────────────────────────────────────────────
  const adminEmail = 'admin@makani-cosmetique.com';
  const existingAdmin = await userRepo.findOne({ where: { email: adminEmail } });
  if (!existingAdmin) {
    await userRepo.save(
      userRepo.create({
        fullName: 'Admin Makani Cosmétique',
        email: adminEmail,
        password: 'admin1234', // @BeforeInsert hashes
        role: UserRole.ADMIN,
      }),
    );
    console.log(`\n👤 Admin: ${adminEmail} / admin1234`);
  } else {
    console.log(`\n👤 Admin already exists: ${adminEmail}`);
  }

  await dataSource.destroy();
  console.log('\n✅ Seed complete.\n');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
