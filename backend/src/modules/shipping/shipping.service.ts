import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ShippingZone } from './shipping-zone.entity';
import { ShippingTier } from './shipping-tier.entity';
import { Product } from '../products/product.entity';
import { CreateShippingZoneDto } from './dto/create-shipping-zone.dto';
import { UpdateShippingZoneDto } from './dto/update-shipping-zone.dto';

export interface ShippingCalc {
  zoneName: string;
  shippingFee: number;
  taxRate: number;       // %
  taxAmount: number;     // VAT included in subtotal+shipping (informative breakdown)
  freeShippingApplied: boolean;
  totalWeightGrams?: number;
  tierMatched?: { minWeightGrams: number; maxWeightGrams: number | null; price: number } | null;
}

export interface CalcItem {
  productId: string;
  quantity: number;
}

// Fallback if no zones exist at all (defensive)
const FALLBACK: ShippingCalc = {
  zoneName: 'Default',
  shippingFee: 5.99,
  taxRate: 0,
  taxAmount: 0,
  freeShippingApplied: false,
};

@Injectable()
export class ShippingService {
  constructor(
    @InjectRepository(ShippingZone) private readonly repo: Repository<ShippingZone>,
    @InjectRepository(ShippingTier) private readonly tierRepo: Repository<ShippingTier>,
    @InjectRepository(Product) private readonly productRepo: Repository<Product>,
  ) {}

  async findZoneForCountry(country: string): Promise<ShippingZone | null> {
    const needle = country.trim().toLowerCase();
    const zones = await this.repo.find({ where: { isActive: true } });

    const matched = zones.find((z) =>
      z.countries.some((c) => c.trim().toLowerCase() === needle),
    );
    if (matched) return matched;

    return zones.find((z) => z.isDefault) ?? null;
  }

  /**
   * Compute shipping fee + VAT breakdown for a TTC subtotal.
   *
   * Pricing logic:
   *   1. If `items` provided AND zone has weight tiers → pick the tier matching
   *      the total weight of the cart, use its price.
   *   2. Otherwise → fall back to `zone.baseRate` (preserves backwards compat
   *      for zones that never set up tiers).
   *
   * Free-shipping threshold (subtotal ≥ threshold → fee = 0) always applies on top.
   *
   * Prices are TTC, so VAT is the embedded portion: tax = baseTTC * rate / (100 + rate).
   */
  async calculate(
    country: string,
    subtotalTTC: number,
    items?: CalcItem[],
    method: 'home' | 'relay' = 'home',
    speed: 'standard' | 'express' = 'standard',
  ): Promise<ShippingCalc> {
    const zone = await this.findZoneForCountry(country);
    if (!zone) return FALLBACK;

    const threshold = Number(zone.freeShippingThreshold);
    const taxRate = Number(zone.taxRate);
    const freeShippingApplied = threshold > 0 && subtotalTTC >= threshold;

    let totalWeightGrams = 0;
    let tierMatched: ShippingTier | null = null;
    let tieredFee: number | null = null;

    if (items?.length && zone.tiers?.length) {
      totalWeightGrams = await this.computeTotalWeight(items);
      tierMatched = pickTier(zone.tiers, totalWeightGrams);
      if (tierMatched) tieredFee = Number(tierMatched.price);
    }

    // Relay shipping: flat rate from env (Mondial Relay tariffs are typically lower than home).
    if (method === 'relay') {
      const relayFlat = Number(process.env.MONDIAL_RELAY_BASE_RATE ?? 4.5);
      const shippingFee = freeShippingApplied ? 0 : relayFlat;
      const baseTTC = subtotalTTC + shippingFee;
      const taxAmount = taxRate > 0 ? +(baseTTC * (taxRate / (100 + taxRate))).toFixed(2) : 0;
      return {
        zoneName: `${zone.name} (point relais)`,
        shippingFee,
        taxRate,
        taxAmount,
        freeShippingApplied,
        totalWeightGrams: items?.length ? totalWeightGrams : undefined,
        tierMatched: null,
      };
    }

    const fallbackFee = Number(zone.baseRate);
    const baseFee = tieredFee !== null ? tieredFee : fallbackFee;
    // Express surcharge stacks on top of the standard fee — even when the cart
    // qualifies for free shipping (premium delivery is paid by the customer
    // who specifically requested it).
    const expressSurcharge = speed === 'express'
      ? Number(process.env.CHRONOPOST_EXPRESS_SURCHARGE ?? 5)
      : 0;
    const shippingFee = freeShippingApplied
      ? expressSurcharge
      : baseFee + expressSurcharge;

    const baseTTC = subtotalTTC + shippingFee;
    const taxAmount = taxRate > 0
      ? +(baseTTC * (taxRate / (100 + taxRate))).toFixed(2)
      : 0;

    return {
      zoneName: zone.name,
      shippingFee,
      taxRate,
      taxAmount,
      freeShippingApplied,
      totalWeightGrams: items?.length ? totalWeightGrams : undefined,
      tierMatched: tierMatched
        ? {
            minWeightGrams: tierMatched.minWeightGrams,
            maxWeightGrams: tierMatched.maxWeightGrams,
            price: Number(tierMatched.price),
          }
        : null,
    };
  }

  private async computeTotalWeight(items: CalcItem[]): Promise<number> {
    const ids = [...new Set(items.map((i) => i.productId))];
    if (ids.length === 0) return 0;
    const products = await this.productRepo.find({ where: { id: In(ids) } });
    return items.reduce((acc, item) => {
      const p = products.find((x) => x.id === item.productId);
      const w = p?.weightGrams ?? 0;
      return acc + w * item.quantity;
    }, 0);
  }

  // ── Zone CRUD ───────────────────────────────────────────────

  async findAll(): Promise<ShippingZone[]> {
    return this.repo.find({ order: { isDefault: 'ASC', name: 'ASC' } });
  }

  async findOne(id: string): Promise<ShippingZone> {
    const zone = await this.repo.findOne({ where: { id } });
    if (!zone) throw new NotFoundException('Shipping zone not found');
    return zone;
  }

  async create(dto: CreateShippingZoneDto): Promise<ShippingZone> {
    if (dto.isDefault) {
      await this.repo.update({ isDefault: true }, { isDefault: false });
    }
    return this.repo.save(this.repo.create(dto));
  }

  async update(id: string, dto: UpdateShippingZoneDto): Promise<ShippingZone> {
    if (dto.isDefault) {
      await this.repo.update({ isDefault: true }, { isDefault: false });
    }
    const zone = await this.findOne(id);
    Object.assign(zone, dto);
    return this.repo.save(zone);
  }

  async remove(id: string): Promise<void> {
    const zone = await this.findOne(id);
    await this.repo.remove(zone);
  }

  // ── Tier CRUD ───────────────────────────────────────────────

  async listTiers(zoneId: string): Promise<ShippingTier[]> {
    await this.findOne(zoneId); // ensure zone exists
    return this.tierRepo.find({
      where: { shippingZoneId: zoneId },
      order: { minWeightGrams: 'ASC' },
    });
  }

  async createTier(zoneId: string, dto: { minWeightGrams: number; maxWeightGrams: number | null; price: number }): Promise<ShippingTier> {
    await this.findOne(zoneId);
    this.validateTierBounds(dto);
    const overlap = await this.findOverlappingTier(zoneId, dto.minWeightGrams, dto.maxWeightGrams);
    if (overlap) throw new BadRequestException('Cette plage de poids chevauche un palier existant');
    return this.tierRepo.save(this.tierRepo.create({ ...dto, shippingZoneId: zoneId }));
  }

  async updateTier(zoneId: string, tierId: string, dto: Partial<{ minWeightGrams: number; maxWeightGrams: number | null; price: number }>): Promise<ShippingTier> {
    const tier = await this.tierRepo.findOne({ where: { id: tierId, shippingZoneId: zoneId } });
    if (!tier) throw new NotFoundException('Tier not found');
    const merged = { ...tier, ...dto } as ShippingTier;
    this.validateTierBounds(merged);
    const overlap = await this.findOverlappingTier(zoneId, merged.minWeightGrams, merged.maxWeightGrams, tierId);
    if (overlap) throw new BadRequestException('Cette plage de poids chevauche un palier existant');
    Object.assign(tier, dto);
    return this.tierRepo.save(tier);
  }

  async removeTier(zoneId: string, tierId: string): Promise<void> {
    const tier = await this.tierRepo.findOne({ where: { id: tierId, shippingZoneId: zoneId } });
    if (!tier) throw new NotFoundException('Tier not found');
    await this.tierRepo.remove(tier);
  }

  private validateTierBounds(t: { minWeightGrams: number; maxWeightGrams: number | null; price: number }) {
    if (!Number.isFinite(t.minWeightGrams) || t.minWeightGrams < 0) {
      throw new BadRequestException('minWeightGrams doit être ≥ 0');
    }
    if (t.maxWeightGrams !== null && t.maxWeightGrams !== undefined) {
      if (!Number.isFinite(t.maxWeightGrams) || t.maxWeightGrams <= t.minWeightGrams) {
        throw new BadRequestException('maxWeightGrams doit être supérieur à minWeightGrams (ou null pour ouvert)');
      }
    }
    if (!Number.isFinite(t.price) || t.price < 0) {
      throw new BadRequestException('price doit être ≥ 0');
    }
  }

  private async findOverlappingTier(zoneId: string, min: number, max: number | null, excludeId?: string): Promise<ShippingTier | null> {
    const all = await this.tierRepo.find({ where: { shippingZoneId: zoneId } });
    const candMax = max ?? Number.POSITIVE_INFINITY;
    return (
      all.find((t) => {
        if (excludeId && t.id === excludeId) return false;
        const tMax = t.maxWeightGrams ?? Number.POSITIVE_INFINITY;
        return min < tMax && t.minWeightGrams < candMax;
      }) ?? null
    );
  }
}

function pickTier(tiers: ShippingTier[], weightGrams: number): ShippingTier | null {
  return (
    tiers.find((t) => {
      const max = t.maxWeightGrams ?? Number.POSITIVE_INFINITY;
      return weightGrams >= t.minWeightGrams && weightGrams < max;
    }) ?? null
  );
}
