import { Injectable, OnModuleInit, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../products/product.entity';
import { Category } from '../categories/category.entity';
import { Brand } from '../brands/brand.entity';
import { LegalPage } from '../legal-pages/legal-page.entity';

const xmlEscape = (s: string): string =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const stripHtml = (html: string): string =>
  html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const truncate = (s: string, max: number): string =>
  s.length <= max ? s : `${s.slice(0, max - 1).trim()}…`;

interface RenderInput {
  title: string;
  description: string;
  canonical: string;
  ogType?: string;
  image?: string | null;
  bodyContent: string;
  jsonLd?: Record<string, any>[];
}

@Injectable()
export class PrerenderService implements OnModuleInit {
  private siteUrl: string;
  private siteName = 'Makani Cosmétique';

  constructor(
    private readonly config: ConfigService,
    @InjectRepository(Product) private readonly products: Repository<Product>,
    @InjectRepository(Category) private readonly categories: Repository<Category>,
    @InjectRepository(Brand) private readonly brands: Repository<Brand>,
    @InjectRepository(LegalPage) private readonly legalPages: Repository<LegalPage>,
  ) {}

  onModuleInit() {
    const raw = this.config.get<string>('SITE_URL') ?? this.config.get<string>('FRONTEND_URL') ?? 'https://makani-cosmetique.com';
    this.siteUrl = raw.replace(/\/$/, '');
  }

  async renderForPath(path: string): Promise<string> {
    const clean = path.split('?')[0].replace(/\/+$/, '') || '/';

    if (clean === '/' || clean === '') return this.renderHome();
    if (clean === '/collections') return this.renderCollections();
    if (clean === '/brands') return this.renderBrands();
    if (clean === '/about') return this.renderAbout();
    if (clean === '/contact') return this.renderContact();
    if (clean === '/faq') return this.renderFaq();

    const productMatch = clean.match(/^\/products\/(.+)$/);
    if (productMatch) return this.renderProduct(productMatch[1]);

    const collectionMatch = clean.match(/^\/collections\/(.+)$/);
    if (collectionMatch) return this.renderCollection(collectionMatch[1]);

    const legalSlugs = ['cgv', 'mentions-legales', 'confidentialite', 'livraison-retours'];
    if (legalSlugs.includes(clean.slice(1))) return this.renderLegal(clean.slice(1));

    throw new NotFoundException(`Path not prerenderable: ${path}`);
  }

  // ── Page renderers ─────────────────────────────────────────

  private async renderHome(): Promise<string> {
    return this.assembleHtml({
      title: `${this.siteName} · Beauté Afro · Soins Cheveux, Peau & Parfums`,
      description:
        'Makani Cosmétique — votre style, votre beauté. Soins capillaires, soins de la peau et parfums orientaux pour la beauté afro et métissée.',
      canonical: '/',
      ogType: 'website',
      bodyContent: `
        <h1>Makani Cosmétique — Beauté Afro</h1>
        <p>Soins capillaires, soins de la peau et parfums orientaux sélectionnés avec amour pour la beauté afro et métissée.</p>
        <h2>Nos collections</h2>
        <ul>
          <li><a href="/collections/soins-capillaires">Soins capillaires</a></li>
          <li><a href="/collections/soins-de-la-peau">Soins de la peau</a></li>
          <li><a href="/collections/parfums-dubai">Parfums d'Orient</a></li>
          <li><a href="/collections/huile-pour-cheveux-et-peau">Huiles &amp; beurres</a></li>
        </ul>
        <p><a href="/brands">Découvrir toutes les marques</a></p>
      `,
      jsonLd: [
        {
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: this.siteName,
          url: this.siteUrl,
          logo: `${this.siteUrl}/logo512.png`,
          contactPoint: {
            '@type': 'ContactPoint',
            email: 'contact@makani-cosmetique.com',
            telephone: '+33 7 66 33 12 26',
            contactType: 'customer support',
            availableLanguage: ['French'],
          },
          address: {
            '@type': 'PostalAddress',
            streetAddress: '142 Rue Henri Barbusse',
            postalCode: '93300',
            addressLocality: 'Aubervilliers',
            addressCountry: 'FR',
          },
        },
      ],
    });
  }

  private async renderProduct(slug: string): Promise<string> {
    const p = await this.products.findOne({ where: { slug } });
    if (!p) throw new NotFoundException(`Product not found: ${slug}`);

    const desc = p.description
      ? truncate(stripHtml(p.description), 155)
      : `Découvrez ${p.name} sur ${this.siteName}.`;
    const cat = (p as any).category?.slug ?? null;
    const catName = (p as any).category?.name ?? null;
    const brandName = (p as any).brand?.name ?? null;
    const url = `/products/${p.slug}`;

    return this.assembleHtml({
      title: p.name,
      description: desc,
      canonical: url,
      ogType: 'product',
      image: p.imageUrl,
      bodyContent: `
        <nav>
          <a href="/">Accueil</a> &gt;
          <a href="/collections">Boutique</a> &gt;
          ${cat ? `<a href="/collections/${cat}">${xmlEscape(catName ?? cat)}</a> &gt;` : ''}
          <span>${xmlEscape(p.name)}</span>
        </nav>
        <h1>${xmlEscape(p.name)}</h1>
        ${brandName ? `<p><strong>Marque :</strong> ${xmlEscape(brandName)}</p>` : ''}
        <p><strong>Prix :</strong> ${Number(p.price).toFixed(2)} ${xmlEscape(p.currency || '€')}</p>
        ${p.imageUrl ? `<img src="${xmlEscape(p.imageUrl)}" alt="${xmlEscape(p.name)}" />` : ''}
        ${p.description ? `<p>${xmlEscape(stripHtml(p.description))}</p>` : ''}
        ${p.ingredients ? `<h2>Ingrédients</h2><p>${xmlEscape(p.ingredients)}</p>` : ''}
      `,
      jsonLd: [
        {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Accueil', item: `${this.siteUrl}/` },
            { '@type': 'ListItem', position: 2, name: 'Boutique', item: `${this.siteUrl}/collections` },
            ...(cat ? [{ '@type': 'ListItem', position: 3, name: catName ?? cat, item: `${this.siteUrl}/collections/${cat}` }] : []),
            { '@type': 'ListItem', position: cat ? 4 : 3, name: p.name },
          ],
        },
        {
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: p.name,
          image: p.imageUrl ?? undefined,
          description: p.description ? stripHtml(p.description) : undefined,
          brand: brandName ? { '@type': 'Brand', name: brandName } : undefined,
          sku: p.id,
          offers: {
            '@type': 'Offer',
            url: `${this.siteUrl}${url}`,
            priceCurrency: 'EUR',
            price: Number(p.price).toFixed(2),
            availability: p.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
            itemCondition: 'https://schema.org/NewCondition',
          },
          aggregateRating:
            p.rating && p.reviewCount
              ? {
                  '@type': 'AggregateRating',
                  ratingValue: Number(p.rating).toFixed(1),
                  reviewCount: p.reviewCount,
                }
              : undefined,
        },
      ],
    });
  }

  private async renderCollection(slug: string): Promise<string> {
    const cat = await this.categories.findOne({ where: { slug } });
    if (!cat) throw new NotFoundException(`Category not found: ${slug}`);

    const products = await this.products.find({
      where: { categoryId: cat.id, isActive: true },
      take: 50,
    });

    return this.assembleHtml({
      title: cat.name,
      description:
        truncate(cat.description ?? `Découvrez notre sélection ${cat.name.toLowerCase()} sur ${this.siteName}.`, 155),
      canonical: `/collections/${slug}`,
      image: cat.imageUrl,
      bodyContent: `
        <nav>
          <a href="/">Accueil</a> &gt;
          <a href="/collections">Boutique</a> &gt;
          <span>${xmlEscape(cat.name)}</span>
        </nav>
        <h1>${xmlEscape(cat.name)}</h1>
        ${cat.description ? `<p>${xmlEscape(cat.description)}</p>` : ''}
        <h2>Produits (${products.length})</h2>
        <ul>
          ${products.map((p) => `<li><a href="/products/${p.slug}">${xmlEscape(p.name)}</a> — ${Number(p.price).toFixed(2)} ${xmlEscape(p.currency || '€')}</li>`).join('\n')}
        </ul>
      `,
    });
  }

  private async renderCollections(): Promise<string> {
    const cats = await this.categories.find({ where: { isActive: true } });
    return this.assembleHtml({
      title: 'Toutes les collections',
      description:
        "Explorez l'intégralité de nos collections beauté afro : soins capillaires, soins de la peau, parfums d'Orient, huiles & beurres.",
      canonical: '/collections',
      bodyContent: `
        <h1>Toutes les collections</h1>
        <ul>
          ${cats.map((c) => `<li><a href="/collections/${c.slug}">${xmlEscape(c.name)}</a></li>`).join('\n')}
        </ul>
      `,
    });
  }

  private async renderBrands(): Promise<string> {
    const brands = await this.brands.find();
    return this.assembleHtml({
      title: 'Toutes les marques',
      description:
        "Découvrez les maisons de beauté distribuées par Makani Cosmétique : marques afro, parfumeries d'Orient, soins capillaires premium.",
      canonical: '/brands',
      bodyContent: `
        <h1>Toutes les marques</h1>
        <ul>
          ${brands.sort((a, b) => a.name.localeCompare(b.name)).map((b) => `<li>${xmlEscape(b.name)}</li>`).join('\n')}
        </ul>
      `,
    });
  }

  private async renderAbout(): Promise<string> {
    return this.assembleHtml({
      title: 'Notre histoire',
      description:
        'Makani Cosmétique célèbre la beauté afro et métissée. Découvrez notre mission, nos valeurs et l équipe derrière la marque.',
      canonical: '/about',
      bodyContent: `
        <h1>Notre histoire</h1>
        <p>Makani Cosmétique est née d'une conviction simple : nous méritons une boutique qui célèbre la beauté afro et métissée. Soins capillaires, peau et parfums sélectionnés avec amour.</p>
      `,
    });
  }

  private async renderContact(): Promise<string> {
    return this.assembleHtml({
      title: 'Contact',
      description:
        'Une question sur nos produits, votre commande ou un partenariat ? Contactez l équipe Makani Cosmétique — réponse sous 48h.',
      canonical: '/contact',
      bodyContent: `
        <h1>Nous contacter</h1>
        <p>Email : <a href="mailto:hello@makani-cosmetique.com">hello@makani-cosmetique.com</a></p>
        <p>Téléphone : <a href="tel:+33766331226">+33 7 66 33 12 26</a></p>
        <p>Boutique : 142 Rue Henri Barbusse, 93300 Aubervilliers</p>
      `,
      jsonLd: [
        {
          '@context': 'https://schema.org',
          '@type': 'BeautySalon',
          name: this.siteName,
          telephone: '+33 7 66 33 12 26',
          email: 'hello@makani-cosmetique.com',
          address: {
            '@type': 'PostalAddress',
            streetAddress: '142 Rue Henri Barbusse',
            postalCode: '93300',
            addressLocality: 'Aubervilliers',
            addressCountry: 'FR',
          },
          openingHoursSpecification: [
            {
              '@type': 'OpeningHoursSpecification',
              dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
              opens: '00:00',
              closes: '23:59',
            },
          ],
        },
      ],
    });
  }

  private async renderFaq(): Promise<string> {
    return this.assembleHtml({
      title: 'FAQ — Questions fréquentes',
      description:
        'Toutes les réponses à vos questions sur la commande, le paiement, la livraison, les retours et votre compte Makani Cosmétique.',
      canonical: '/faq',
      bodyContent: `
        <h1>Questions fréquentes</h1>
        <p>Vous ne trouvez pas la réponse à votre question ? Contactez-nous à contact@makani-cosmetique.com — nous répondons sous 48 heures ouvrées.</p>
        <h2>Catégories</h2>
        <ul>
          <li>Commande</li>
          <li>Paiement</li>
          <li>Livraison</li>
          <li>Retours &amp; remboursements</li>
          <li>Mon compte</li>
          <li>Produits</li>
        </ul>
      `,
    });
  }

  private async renderLegal(slug: string): Promise<string> {
    const page = await this.legalPages.findOne({ where: { slug } });
    if (!page) throw new NotFoundException(`Legal page not found: ${slug}`);
    const bodyText = page.body
      .replace(/^##\s+(.+)$/gm, '<h2>$1</h2>')
      .replace(/^###\s+(.+)$/gm, '<h3>$1</h3>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>')
      .split(/\n{2,}/)
      .map((para) => (para.startsWith('<h') ? para : `<p>${para.trim()}</p>`))
      .join('\n');
    return this.assembleHtml({
      title: page.title,
      description: truncate(page.intro ?? `${page.title} — ${this.siteName}.`, 155),
      canonical: `/${slug}`,
      bodyContent: `
        <h1>${xmlEscape(page.title)}</h1>
        <p><em>Dernière mise à jour : ${page.lastUpdated}</em></p>
        ${page.intro ? `<p>${xmlEscape(page.intro)}</p>` : ''}
        ${bodyText}
      `,
    });
  }

  // ── Assembly ───────────────────────────────────────────────

  private assembleHtml(input: RenderInput): string {
    const fullTitle = input.title.includes(this.siteName) ? input.title : `${input.title} · ${this.siteName}`;
    const canonicalUrl = `${this.siteUrl}${input.canonical}`;
    const imgUrl = input.image
      ? input.image.startsWith('http')
        ? input.image
        : `${this.siteUrl}${input.image}`
      : null;
    const ogType = input.ogType ?? 'website';

    const ldBlocks = (input.jsonLd ?? [])
      .map((d) => `<script type="application/ld+json">${JSON.stringify(d)}</script>`)
      .join('\n  ');

    return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${xmlEscape(fullTitle)}</title>
  <meta name="description" content="${xmlEscape(input.description)}" />
  <link rel="canonical" href="${xmlEscape(canonicalUrl)}" />
  <meta property="og:title" content="${xmlEscape(fullTitle)}" />
  <meta property="og:description" content="${xmlEscape(input.description)}" />
  <meta property="og:url" content="${xmlEscape(canonicalUrl)}" />
  <meta property="og:type" content="${xmlEscape(ogType)}" />
  <meta property="og:site_name" content="${xmlEscape(this.siteName)}" />
  <meta property="og:locale" content="fr_FR" />
  ${imgUrl ? `<meta property="og:image" content="${xmlEscape(imgUrl)}" />` : ''}
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${xmlEscape(fullTitle)}" />
  <meta name="twitter:description" content="${xmlEscape(input.description)}" />
  ${imgUrl ? `<meta name="twitter:image" content="${xmlEscape(imgUrl)}" />` : ''}
  ${ldBlocks}
</head>
<body>
${input.bodyContent}
</body>
</html>`;
  }
}
