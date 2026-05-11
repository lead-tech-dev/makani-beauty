import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Address } from './address.entity';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

@Injectable()
export class AddressesService {
  constructor(
    @InjectRepository(Address)
    private readonly repo: Repository<Address>,
  ) {}

  async findByUser(userId: string): Promise<Address[]> {
    return this.repo.find({ where: { userId }, order: { isDefault: 'DESC', createdAt: 'ASC' } });
  }

  async findOne(id: string, userId: string): Promise<Address> {
    const addr = await this.repo.findOne({ where: { id, userId } });
    if (!addr) throw new NotFoundException('Address not found');
    return addr;
  }

  async create(userId: string, dto: CreateAddressDto): Promise<Address> {
    if (dto.isDefault) {
      await this.repo.update({ userId }, { isDefault: false });
    }
    const addr = this.repo.create({ ...dto, userId });
    return this.repo.save(addr);
  }

  async update(id: string, userId: string, dto: UpdateAddressDto): Promise<Address> {
    const addr = await this.findOne(id, userId);
    if (dto.isDefault) {
      await this.repo.update({ userId }, { isDefault: false });
    }
    Object.assign(addr, dto);
    return this.repo.save(addr);
  }

  async remove(id: string, userId: string): Promise<void> {
    const addr = await this.findOne(id, userId);
    await this.repo.remove(addr);
  }
}
