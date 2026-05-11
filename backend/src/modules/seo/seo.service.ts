import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../products/product.entity';
import { Category } from '../categories/category.entity';
import { Brand } from '../brands/brand.entity';
import { LegalPage } from '../legal-pages/legal-page.entity';

interface SitemapEntry {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

const STATIC_PATHS: SitemapEntry[] = [
  { loc: '/', changefreq: 'daily', priority: 1.0 },
  { loc: '/collections', changefreq: 'daily', priority: 0.9 },
  { loc: '/brands', changefreq: 'weekly', priority: 0.8 },
  { loc: '/about', changefreq: 'monthly', priority: 0.5 },
  { loc: '/contact', changefreq: 'monthly', priority: 0.5 },
  { loc: '/faq', changefreq: 'monthly', priority: 0.6 },
];

const xmlEscape = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');

@Injectable()
export class SeoService implements OnModuleInit {
  private siteUrl: string;

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

  async buildSitemap(): Promise<string> {
    const entries: SitemapEntry[] = [...STATIC_PATHS];

    const [products, categories, brands, legal] = await Promise.all([
      this.products.find({ select: ['slug', 'updatedAt', 'isActive'] as any }),
      this.categories.find({ select: ['slug', 'updatedAt', 'isActive'] as any }),
      this.brands.find({ select: ['slug', 'updatedAt'] as any }),
      this.legalPages.find({ select: ['slug', 'updatedAt'] as any }),
    ]);

    for (const p of products) {
      if ((p as any).isActive === false) continue;
      entries.push({
        loc: `/products/${p.slug}`,
        lastmod: this.toIsoDate(p.updatedAt),
        changefreq: 'weekly',
        priority: 0.8,
      });
    }
    for (const c of categories) {
      if ((c as any).isActive === false) continue;
      entries.push({
        loc: `/collections/${c.slug}`,
        lastmod: this.toIsoDate(c.updatedAt),
        changefreq: 'weekly',
        priority: 0.7,
      });
    }
    for (const b of brands) {
      entries.push({
        loc: `/brands/${b.slug}`,
        lastmod: this.toIsoDate(b.updatedAt),
        changefreq: 'monthly',
        priority: 0.6,
      });
    }
    for (const lp of legal) {
      entries.push({
        loc: `/${lp.slug}`,
        lastmod: this.toIsoDate(lp.updatedAt),
        changefreq: 'yearly',
        priority: 0.4,
      });
    }

    return this.serializeSitemap(entries);
  }

  buildRobotsTxt(): string {
    return [
      'User-agent: *',
      'Allow: /',
      'Disallow: /admin',
      'Disallow: /account',
      'Disallow: /checkout',
      'Disallow: /order-confirmation',
      'Disallow: /login',
      'Disallow: /register',
      'Disallow: /forgot-password',
      'Disallow: /reset-password',
      'Disallow: /verify-email',
      '',
      `Sitemap: ${this.siteUrl}/sitemap.xml`,
      '',
    ].join('\n');
  }

  private toIsoDate(d: Date | undefined | null): string | undefined {
    if (!d) return undefined;
    return new Date(d).toISOString().slice(0, 10);
  }

  private serializeSitemap(entries: SitemapEntry[]): string {
    const urls = entries
      .map((e) => {
        const parts = [`    <loc>${xmlEscape(this.siteUrl + e.loc)}</loc>`];
        if (e.lastmod) parts.push(`    <lastmod>${e.lastmod}</lastmod>`);
        if (e.changefreq) parts.push(`    <changefreq>${e.changefreq}</changefreq>`);
        if (typeof e.priority === 'number') parts.push(`    <priority>${e.priority.toFixed(1)}</priority>`);
        return `  <url>\n${parts.join('\n')}\n  </url>`;
      })
      .join('\n');
    return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
  }
}
