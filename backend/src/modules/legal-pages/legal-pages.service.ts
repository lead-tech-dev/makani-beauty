import { Injectable, NotFoundException, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LegalPage } from './legal-page.entity';
import { UpdateLegalPageDto } from './dto/update-legal-page.dto';
import { LEGAL_PAGES_SEED } from './legal-pages.seed';

@Injectable()
export class LegalPagesService implements OnModuleInit {
  private readonly logger = new Logger(LegalPagesService.name);

  constructor(
    @InjectRepository(LegalPage)
    private readonly repo: Repository<LegalPage>,
  ) {}

  async onModuleInit() {
    for (const seed of LEGAL_PAGES_SEED) {
      const existing = await this.repo.findOne({ where: { slug: seed.slug } });
      if (!existing) {
        await this.repo.save(this.repo.create(seed));
        this.logger.log(`Seeded legal page: ${seed.slug}`);
      }
    }
  }

  findAll(): Promise<LegalPage[]> {
    return this.repo.find({ order: { slug: 'ASC' } });
  }

  async findBySlug(slug: string): Promise<LegalPage> {
    const page = await this.repo.findOne({ where: { slug } });
    if (!page) throw new NotFoundException(`Legal page not found: ${slug}`);
    return page;
  }

  async update(slug: string, dto: UpdateLegalPageDto): Promise<LegalPage> {
    const page = await this.findBySlug(slug);
    Object.assign(page, dto);
    return this.repo.save(page);
  }
}
