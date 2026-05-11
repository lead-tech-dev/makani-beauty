import { Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SubProcessor } from './sub-processor.entity';
import { CreateSubProcessorDto, UpdateSubProcessorDto } from './dto/sub-processor.dto';
import { SUB_PROCESSORS_SEED } from './sub-processors.seed';

@Injectable()
export class SubProcessorsService implements OnModuleInit {
  private readonly logger = new Logger(SubProcessorsService.name);

  constructor(
    @InjectRepository(SubProcessor) private readonly repo: Repository<SubProcessor>,
  ) {}

  async onModuleInit() {
    const count = await this.repo.count();
    if (count === 0) {
      await this.repo.save(SUB_PROCESSORS_SEED.map((s) => this.repo.create(s)));
      this.logger.log(`Seeded ${SUB_PROCESSORS_SEED.length} sub-processors`);
    }
  }

  findAllPublic(): Promise<SubProcessor[]> {
    return this.repo.find({
      where: { isActive: true },
      order: { displayOrder: 'ASC', name: 'ASC' },
    });
  }

  findAllAdmin(): Promise<SubProcessor[]> {
    return this.repo.find({ order: { displayOrder: 'ASC', name: 'ASC' } });
  }

  async findOne(id: string): Promise<SubProcessor> {
    const sp = await this.repo.findOne({ where: { id } });
    if (!sp) throw new NotFoundException(`Sub-processor not found: ${id}`);
    return sp;
  }

  create(dto: CreateSubProcessorDto): Promise<SubProcessor> {
    return this.repo.save(this.repo.create(dto));
  }

  async update(id: string, dto: UpdateSubProcessorDto): Promise<SubProcessor> {
    const sp = await this.findOne(id);
    Object.assign(sp, dto);
    return this.repo.save(sp);
  }

  async remove(id: string): Promise<void> {
    const sp = await this.findOne(id);
    await this.repo.remove(sp);
  }
}
