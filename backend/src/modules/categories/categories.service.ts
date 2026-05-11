import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
  ) {}

  async findAll(): Promise<Category[]> {
    return this.categoryRepo.find({ where: { isActive: true }, order: { name: 'ASC' } });
  }

  async findOne(id: string): Promise<Category> {
    const category = await this.categoryRepo.findOne({ where: { id } });
    if (!category) throw new NotFoundException(`Category ${id} not found`);
    return category;
  }

  async findBySlug(slug: string): Promise<Category> {
    const category = await this.categoryRepo.findOne({ where: { slug, isActive: true } });
    if (!category) throw new NotFoundException(`Category "${slug}" not found`);
    return category;
  }

  async create(dto: CreateCategoryDto): Promise<Category> {
    const exists = await this.categoryRepo.findOne({ where: { slug: dto.slug } });
    if (exists) throw new ConflictException(`Slug "${dto.slug}" already exists`);
    return this.categoryRepo.save(this.categoryRepo.create(dto));
  }

  async update(id: string, dto: UpdateCategoryDto): Promise<Category> {
    const category = await this.findOne(id);
    Object.assign(category, dto);
    return this.categoryRepo.save(category);
  }

  async remove(id: string): Promise<void> {
    const category = await this.findOne(id);
    category.isActive = false;
    await this.categoryRepo.save(category);
  }
}
