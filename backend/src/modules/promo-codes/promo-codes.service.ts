import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { PromoCode } from './promo-code.entity';
import { CreatePromoCodeDto } from './dto/create-promo-code.dto';
import { UpdatePromoCodeDto } from './dto/update-promo-code.dto';
import { PromoCodeType } from '../../common/enums/promo-code-type.enum';

export interface ValidationResult {
  valid: boolean;
  message: string;
  discount: number;
  code?: PromoCode;
}

@Injectable()
export class PromoCodesService {
  constructor(
    @InjectRepository(PromoCode) private readonly repo: Repository<PromoCode>,
  ) {}

  // ── Public: validate a code against an order subtotal ──────

  async validate(rawCode: string, subtotal: number): Promise<ValidationResult> {
    const code = (rawCode ?? '').trim().toUpperCase();
    if (!code) return { valid: false, discount: 0, message: 'Code requis' };

    const promo = await this.repo.findOne({ where: { code } });
    if (!promo) return { valid: false, discount: 0, message: 'Code invalide' };
    if (!promo.isActive) return { valid: false, discount: 0, message: 'Code désactivé' };

    const now = new Date();
    if (promo.validFrom && promo.validFrom > now) {
      return { valid: false, discount: 0, message: 'Code pas encore actif' };
    }
    if (promo.validUntil && promo.validUntil < now) {
      return { valid: false, discount: 0, message: 'Code expiré' };
    }
    if (promo.maxUses !== null && promo.usedCount >= promo.maxUses) {
      return { valid: false, discount: 0, message: 'Code épuisé' };
    }
    if (Number(promo.minOrderAmount) > subtotal) {
      return {
        valid: false,
        discount: 0,
        message: `Commande minimum ${Number(promo.minOrderAmount).toFixed(2)} requise`,
      };
    }

    const discount = this.computeDiscount(promo, subtotal);
    return {
      valid: true,
      code: promo,
      discount,
      message: 'Code appliqué',
    };
  }

  computeDiscount(promo: PromoCode, subtotal: number): number {
    const value = Number(promo.value);
    if (promo.type === PromoCodeType.PERCENTAGE) {
      return Math.min(+(subtotal * value / 100).toFixed(2), subtotal);
    }
    return Math.min(value, subtotal);
  }

  /**
   * Atomically increment usedCount, refusing if cap reached.
   * Called from a transaction by OrdersService.
   */
  async claimAtomic(manager: EntityManager, codeId: string): Promise<void> {
    const result = await manager
      .createQueryBuilder()
      .update(PromoCode)
      .set({ usedCount: () => '"usedCount" + 1' })
      .where('id = :id', { id: codeId })
      .andWhere('"isActive" = true')
      .andWhere('("maxUses" IS NULL OR "usedCount" < "maxUses")')
      .execute();
    if (result.affected === 0) {
      throw new BadRequestException('Code épuisé ou désactivé');
    }
  }

  // ── Admin CRUD ──────────────────────────────────────────────

  async findAll(): Promise<PromoCode[]> {
    return this.repo.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string): Promise<PromoCode> {
    const code = await this.repo.findOne({ where: { id } });
    if (!code) throw new NotFoundException('Promo code not found');
    return code;
  }

  async findByCode(code: string): Promise<PromoCode | null> {
    return this.repo.findOne({ where: { code: code.trim().toUpperCase() } });
  }

  async create(dto: CreatePromoCodeDto): Promise<PromoCode> {
    const code = dto.code.trim().toUpperCase();
    const exists = await this.repo.findOne({ where: { code } });
    if (exists) throw new ConflictException(`Le code "${code}" existe déjà`);
    return this.repo.save(this.repo.create({
      ...dto,
      code,
      validFrom: dto.validFrom ? new Date(dto.validFrom) : null,
      validUntil: dto.validUntil ? new Date(dto.validUntil) : null,
      maxUses: dto.maxUses ?? null,
    }));
  }

  async update(id: string, dto: UpdatePromoCodeDto): Promise<PromoCode> {
    const promo = await this.findOne(id);
    Object.assign(promo, {
      ...dto,
      code: dto.code ? dto.code.trim().toUpperCase() : promo.code,
      validFrom: dto.validFrom !== undefined
        ? (dto.validFrom ? new Date(dto.validFrom) : null)
        : promo.validFrom,
      validUntil: dto.validUntil !== undefined
        ? (dto.validUntil ? new Date(dto.validUntil) : null)
        : promo.validUntil,
      maxUses: dto.maxUses !== undefined ? (dto.maxUses ?? null) : promo.maxUses,
    });
    return this.repo.save(promo);
  }

  async remove(id: string): Promise<void> {
    const promo = await this.findOne(id);
    await this.repo.remove(promo);
  }
}
