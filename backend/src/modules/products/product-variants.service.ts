import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductVariant } from './product-variant.entity';
import { Product } from './product.entity';
import { UpsertVariantDto } from './dto/upsert-variant.dto';

@Injectable()
export class ProductVariantsService {
  constructor(
    @InjectRepository(ProductVariant)
    private readonly repo: Repository<ProductVariant>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
  ) {}

  async list(productId: string): Promise<ProductVariant[]> {
    return this.repo.find({
      where: { productId },
      order: { displayOrder: 'ASC', createdAt: 'ASC' },
    });
  }

  async findOne(id: string): Promise<ProductVariant> {
    const v = await this.repo.findOne({ where: { id } });
    if (!v) throw new NotFoundException('Variante introuvable');
    return v;
  }

  async create(productId: string, dto: UpsertVariantDto): Promise<ProductVariant> {
    const product = await this.productRepo.findOne({ where: { id: productId } });
    if (!product) throw new NotFoundException('Produit introuvable');
    const variant = this.repo.create({ ...dto, productId });
    return this.repo.save(variant);
  }

  async update(id: string, dto: UpsertVariantDto): Promise<ProductVariant> {
    const existing = await this.findOne(id);
    Object.assign(existing, dto);
    return this.repo.save(existing);
  }

  async remove(id: string): Promise<void> {
    const existing = await this.findOne(id);
    await this.repo.remove(existing);
  }

  async decrementStock(variantId: string, quantity: number): Promise<void> {
    const v = await this.findOne(variantId);
    v.stock = Math.max(0, v.stock - quantity);
    await this.repo.save(v);
  }
}
