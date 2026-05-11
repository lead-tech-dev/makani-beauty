import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../common/entities/base.entity';
import { Category } from '../categories/category.entity';
import { Brand } from '../brands/brand.entity';
import { ProductVariant } from './product-variant.entity';

@Entity('products')
export class Product extends BaseEntity {
  @ApiProperty({ example: 'Crème hydratante Aloe Vera' })
  @Column()
  name: string;

  @ApiProperty({ example: 'creme-hydratante-aloe-vera' })
  @Column({ unique: true })
  slug: string;

  @ApiProperty({ required: false })
  @Column({ type: 'text', nullable: true })
  description: string;

  @ApiProperty({ example: 24.99 })
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @ApiProperty({ required: false, example: 19.99 })
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  salePrice: number;

  @ApiProperty({ default: '€' })
  @Column({ default: '€' })
  currency: string;

  @ApiProperty({ required: false })
  @Column({ nullable: true })
  imageUrl: string;

  @ApiProperty({ required: false, description: 'Comma-separated WebP srcset for the main image' })
  @Column({ type: 'text', nullable: true })
  imageSrcset: string | null;

  @ApiProperty({ required: false, description: 'Tiny base64 data URI for blur-up placeholder' })
  @Column({ type: 'text', nullable: true })
  imageLqip: string | null;

  @ApiProperty({ type: [String] })
  @Column({ type: 'simple-array', nullable: true })
  images: string[];

  @ApiProperty({ required: false })
  @Column({ nullable: true })
  sku: string;

  @ApiProperty({ default: 0 })
  @Column({ default: 0 })
  stock: number;

  @ApiProperty({ default: 5 })
  @Column({ default: 5 })
  stockAlert: number;

  @ApiProperty({ default: 0, minimum: 0, maximum: 5 })
  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  rating: number;

  @ApiProperty({ default: 0 })
  @Column({ default: 0 })
  reviewCount: number;

  @ApiProperty({ default: false })
  @Column({ default: false })
  isNew: boolean;

  @ApiProperty({ required: false })
  @Column({ type: 'text', nullable: true })
  ingredients: string;

  @ApiProperty({ required: false, description: 'Display label e.g. "100ml" or "75g"' })
  @Column({ nullable: true })
  weight: string;

  @ApiProperty({ required: false, description: 'Numeric weight in grams used for shipping cost calculation' })
  @Column({ type: 'integer', nullable: true })
  weightGrams: number | null;

  @ApiProperty({ required: false })
  @Column({ nullable: true })
  volume: string;

  @ApiProperty({ type: [String], required: false })
  @Column({ type: 'simple-array', nullable: true })
  tags: string[];

  @ApiProperty({ type: [String], required: false, description: 'Hair type targets — values: 3A, 3B, 3C, 4A, 4B, 4C' })
  @Column({ type: 'simple-array', nullable: true })
  hairType: string[] | null;

  @ApiProperty({ type: [String], required: false, description: 'Skin type targets — values: sec, gras, mixte, sensible, normal' })
  @Column({ type: 'simple-array', nullable: true })
  skinType: string[] | null;

  @ApiProperty({ type: [String], required: false, description: 'Key ingredients (free-text tags) — e.g. karité, aloe vera, argan' })
  @Column({ type: 'simple-array', nullable: true })
  keyIngredients: string[] | null;

  @ApiProperty({ type: [String], required: false, description: 'Certifications — values: bio, vegan, cruelty-free, etc.' })
  @Column({ type: 'simple-array', nullable: true })
  certifications: string[] | null;

  @ApiProperty({ default: true })
  @Column({ default: true })
  isActive: boolean;

  @ApiProperty({ default: false })
  @Column({ default: false })
  isFeatured: boolean;

  @ApiProperty({ default: false, description: 'Hidden from non-VIP (Or tier) customers' })
  @Column({ default: false })
  vipOnly: boolean;

  @ManyToOne(() => Category, { eager: true, nullable: true })
  @JoinColumn({ name: 'categoryId' })
  category: Category;

  @Column({ nullable: true })
  categoryId: string;

  @ManyToOne(() => Brand, { eager: true, nullable: true })
  @JoinColumn({ name: 'brandId' })
  brand: Brand;

  @Column({ nullable: true })
  brandId: string;

  @OneToMany(() => ProductVariant, (v) => v.product, { cascade: true })
  variants: ProductVariant[];
}
