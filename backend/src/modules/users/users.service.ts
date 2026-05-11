import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async findAll(): Promise<Omit<User, 'password'>[]> {
    return this.userRepo.find({
      select: ['id', 'fullName', 'email', 'role', 'phone', 'isActive', 'createdAt', 'updatedAt'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { email } });
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { googleId } });
  }

  async createGoogleUser(data: { email: string; fullName: string; googleId: string }): Promise<User> {
    const user = this.userRepo.create({
      email: data.email,
      fullName: data.fullName,
      googleId: data.googleId,
      // password remains null — only Google-based login for now
    });
    return this.userRepo.save(user);
  }

  async linkGoogleAccount(userId: string, googleId: string): Promise<User> {
    await this.userRepo.update(userId, { googleId });
    return this.findOne(userId);
  }

  async create(dto: CreateUserDto): Promise<User> {
    const exists = await this.findByEmail(dto.email);
    if (exists) throw new ConflictException(`Email "${dto.email}" already in use`);
    const user = this.userRepo.create(dto);
    return this.userRepo.save(user);
  }

  async update(id: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);
    Object.assign(user, dto);
    return this.userRepo.save(user);
  }

  async updatePassword(id: string, hashedPassword: string): Promise<void> {
    await this.userRepo.update(id, { password: hashedPassword });
  }

  async save(user: User): Promise<User> {
    return this.userRepo.save(user);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    user.isActive = false;
    await this.userRepo.save(user);
  }
}
