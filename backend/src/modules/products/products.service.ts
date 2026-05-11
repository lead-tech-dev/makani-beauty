import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductQueryDto, ProductSortField } from './dto/product-query.dto';
import { PaginatedDto } from '../../common/dto/paginated.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
  ) {}

  async findAll(query: ProductQueryDto): Promise<PaginatedDto<Product>> {
    const {
      search, categoryId, brandId, minPrice, maxPrice, featured,
      hairType, skinType, ingredients, certifications,
      sort, page = 1, limit = 20,
    } = query;

    const qb = this.productRepo
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.brand', 'brand')
      .where('product.isActive = true')
      .andWhere('product.vipOnly = false');

    if (search) {
      qb.andWhere(
        '(LOWER(product.name) LIKE :search OR LOWER(product.description) LIKE :search)',
        { search: `%${search.toLowerCase()}%` },
      );
    }
    if (categoryId) qb.andWhere('product.categoryId = :categoryId', { categoryId });
    if (brandId) qb.andWhere('product.brandId = :brandId', { brandId });
    if (minPrice !== undefined) qb.andWhere('product.price >= :minPrice', { minPrice });
    if (maxPrice !== undefined) qb.andWhere('product.price <= :maxPrice', { maxPrice });
    if (featured !== undefined) qb.andWhere('product.isFeatured = :featured', { featured });

    // Multi-value facet filters — match if ANY of the requested values is present in the product's array.
    // simple-array stores as comma-separated text, so we use ILIKE per value.
    const applyArrayFilter = (col: string, values: string[] | undefined, paramPrefix: string) => {
      if (!values || values.length === 0) return;
      const parts = values.map((_, i) => `${col} ILIKE :${paramPrefix}${i}`);
      const params = Object.fromEntries(values.map((v, i) => [`${paramPrefix}${i}`, `%${v}%`]));
      qb.andWhere(`(${parts.join(' OR ')})`, params);
    };
    applyArrayFilter('product.hairType', hairType, 'ht');
    applyArrayFilter('product.skinType', skinType, 'sk');
    applyArrayFilter('product."keyIngredients"', ingredients, 'ing');
    applyArrayFilter('product.certifications', certifications, 'cert');

    switch (sort) {
      case ProductSortField.PRICE_ASC:
        qb.orderBy('product.price', 'ASC');
        break;
      case ProductSortField.PRICE_DESC:
        qb.orderBy('product.price', 'DESC');
        break;
      case ProductSortField.NAME_ASC:
        qb.orderBy('product.name', 'ASC');
        break;
      case ProductSortField.POPULARITY:
        qb.orderBy('product.reviewCount', 'DESC').addOrderBy('product.rating', 'DESC');
        break;
      case ProductSortField.RATING:
        qb.orderBy('product.rating', 'DESC').addOrderBy('product.reviewCount', 'DESC');
        break;
      case ProductSortField.DISCOUNT:
        qb.orderBy(
          'CASE WHEN product."salePrice" IS NULL THEN 0 ELSE (product.price - product."salePrice") END',
          'DESC',
        );
        break;
      default:
        qb.orderBy('product.createdAt', 'DESC');
    }

    const total = await qb.getCount();
    const data = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Return facet counts within a given context (categoryId / brandId / search).
   * Each option's count = number of active products matching that context AND the option.
   */
  async getFacets(query: ProductQueryDto): Promise<{
    hairType: Record<string, number>;
    skinType: Record<string, number>;
    ingredients: Record<string, number>;
    certifications: Record<string, number>;
    priceRange: { min: number; max: number };
  }> {
    const baseFilter = (qb: any) => {
      qb.where('product.isActive = true');
      if (query.categoryId) qb.andWhere('product.categoryId = :categoryId', { categoryId: query.categoryId });
      if (query.brandId) qb.andWhere('product.brandId = :brandId', { brandId: query.brandId });
      if (query.search) {
        qb.andWhere('(LOWER(product.name) LIKE :s OR LOWER(product.description) LIKE :s)', {
          s: `%${query.search.toLowerCase()}%`,
        });
      }
      return qb;
    };

    const buildCounts = async (column: string): Promise<Record<string, number>> => {
      const qb = this.productRepo.createQueryBuilder('product');
      baseFilter(qb);
      qb.andWhere(`${column} IS NOT NULL`);
      const rows = await qb.select(column, 'val').getRawMany();
      const counts: Record<string, number> = {};
      for (const row of rows) {
        if (!row.val) continue;
        for (const tag of String(row.val).split(',')) {
          const t = tag.trim();
          if (!t) continue;
          counts[t] = (counts[t] ?? 0) + 1;
        }
      }
      return counts;
    };

    const [hairType, skinType, ingredients, certifications, priceRow] = await Promise.all([
      buildCounts('product.hairType'),
      buildCounts('product.skinType'),
      buildCounts('product."keyIngredients"'),
      buildCounts('product.certifications'),
      (baseFilter(this.productRepo.createQueryBuilder('product')) as ReturnType<typeof this.productRepo.createQueryBuilder>)
        .select('MIN(product.price)', 'min')
        .addSelect('MAX(product.price)', 'max')
        .getRawOne(),
    ]);

    const pr = priceRow as { min?: string; max?: string } | undefined;
    return {
      hairType,
      skinType,
      ingredients,
      certifications,
      priceRange: {
        min: Math.floor(Number(pr?.min ?? 0)),
        max: Math.ceil(Number(pr?.max ?? 0)),
      },
    };
  }

  async findVipProducts(): Promise<Product[]> {
    return this.productRepo
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.brand', 'brand')
      .where('product.isActive = true')
      .andWhere('product.vipOnly = true')
      .orderBy('product.createdAt', 'DESC')
      .take(100)
      .getMany();
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.productRepo.findOne({
      where: { id },
      relations: ['variants'],
    });
    if (!product) throw new NotFoundException(`Product ${id} not found`);
    return product;
  }

  async search(q: string, limit = 10): Promise<Array<Product & { rank: number }>> {
    const trimmed = q.trim();
    if (trimmed.length < 2) return [];

    // Use plainto_tsquery for safe user input + ts_rank for relevance ordering.
    // Index-less but acceptable for catalog sizes < 50k products.
    // pg_trgm fallback gives soft typo tolerance via similarity().
    const rows = await this.productRepo
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.brand', 'brand')
      .where('product.isActive = true')
      .andWhere(
        `(
          to_tsvector('french', coalesce(product.name, '') || ' ' || coalesce(brand.name, '') || ' ' || coalesce(category.name, '') || ' ' || coalesce(product.description, ''))
            @@ plainto_tsquery('french', :q)
          OR LOWER(product.name) LIKE :like
          OR LOWER(coalesce(brand.name, '')) LIKE :like
        )`,
        { q: trimmed, like: `%${trimmed.toLowerCase()}%` },
      )
      .addSelect(
        `ts_rank(
          to_tsvector('french', coalesce(product.name, '') || ' ' || coalesce(brand.name, '') || ' ' || coalesce(category.name, '') || ' ' || coalesce(product.description, '')),
          plainto_tsquery('french', :q)
        )`,
        'rank',
      )
      .orderBy('rank', 'DESC')
      .addOrderBy('product.isFeatured', 'DESC')
      .addOrderBy('product.reviewCount', 'DESC')
      .take(limit)
      .getRawAndEntities();

    return rows.entities.map((p, i) => Object.assign(p, { rank: Number(rows.raw[i]?.rank ?? 0) }));
  }

  async findBySlug(slug: string): Promise<Product> {
    const product = await this.productRepo
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.brand', 'brand')
      .leftJoinAndSelect('product.variants', 'variants')
      .where('product.slug = :slug', { slug })
      .andWhere('product.isActive = true')
      .orderBy('variants.displayOrder', 'ASC')
      .addOrderBy('variants.createdAt', 'ASC')
      .getOne();
    if (!product) throw new NotFoundException(`Product "${slug}" not found`);
    return product;
  }

  async create(dto: CreateProductDto): Promise<Product> {
    const exists = await this.productRepo.findOne({ where: { slug: dto.slug } });
    if (exists) throw new ConflictException(`Slug "${dto.slug}" already exists`);
    return this.productRepo.save(this.productRepo.create(dto));
  }

  async update(id: string, dto: UpdateProductDto): Promise<Product> {
    const product = await this.findOne(id);
    Object.assign(product, dto);
    return this.productRepo.save(product);
  }

  async remove(id: string): Promise<void> {
    const product = await this.findOne(id);
    product.isActive = false;
    await this.productRepo.save(product);
  }

  async getLowStock(): Promise<Product[]> {
    return this.productRepo
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.brand', 'brand')
      .where('product.isActive = true')
      .andWhere('product.stock <= product.stockAlert')
      .orderBy('product.stock', 'ASC')
      .getMany();
  }

  async adjustStock(id: string, delta: number): Promise<Product> {
    const product = await this.findOne(id);
    product.stock = Math.max(0, product.stock + delta);
    return this.productRepo.save(product);
  }
}
