import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Brand } from './brand.entity';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';

@Injectable()
export class BrandsService {
  constructor(
    @InjectRepository(Brand)
    private readonly brandRepo: Repository<Brand>,
  ) {}

  async findAll(): Promise<Brand[]> {
    return this.brandRepo.find({ where: { isActive: true }, order: { name: 'ASC' } });
  }

  async findOne(id: string): Promise<Brand> {
    const brand = await this.brandRepo.findOne({ where: { id } });
    if (!brand) throw new NotFoundException(`Brand ${id} not found`);
    return brand;
  }

  async findBySlug(slug: string): Promise<Brand> {
    const brand = await this.brandRepo.findOne({ where: { slug, isActive: true } });
    if (!brand) throw new NotFoundException(`Brand "${slug}" not found`);
    return brand;
  }

  async create(dto: CreateBrandDto): Promise<Brand> {
    const exists = await this.brandRepo.findOne({ where: { slug: dto.slug } });
    if (exists) throw new ConflictException(`Slug "${dto.slug}" already exists`);
    return this.brandRepo.save(this.brandRepo.create(dto));
  }

  async update(id: string, dto: UpdateBrandDto): Promise<Brand> {
    const brand = await this.findOne(id);
    Object.assign(brand, dto);
    return this.brandRepo.save(brand);
  }

  async remove(id: string): Promise<void> {
    const brand = await this.findOne(id);
    brand.isActive = false;
    await this.brandRepo.save(brand);
  }
}
