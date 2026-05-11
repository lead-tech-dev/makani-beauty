import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, MoreThan } from 'typeorm';
import { v4 as uuid } from 'uuid';
import { Favorite } from './favorite.entity';
import { Product } from '../products/product.entity';
import { SharedWishlist } from './shared-wishlist.entity';
import { User } from '../users/user.entity';

const SHARE_VALIDITY_DAYS = 30;

export interface PublicWishlist {
  ownerFirstName: string;
  ownerInitial: string;
  expiresAt: Date;
  note: string | null;
  products: Product[];
}

@Injectable()
export class FavoritesService {
  private readonly siteUrl: string;

  constructor(
    @InjectRepository(Favorite) private readonly favRepo: Repository<Favorite>,
    @InjectRepository(Product) private readonly productRepo: Repository<Product>,
    @InjectRepository(SharedWishlist) private readonly sharesRepo: Repository<SharedWishlist>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    config: ConfigService,
  ) {
    this.siteUrl = (config.get<string>('FRONTEND_URL') ?? 'http://localhost:3001').replace(/\/$/, '');
  }

  async list(userId: string): Promise<Product[]> {
    const favs = await this.favRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
    if (favs.length === 0) return [];
    const products = await this.productRepo.find({
      where: { id: In(favs.map((f) => f.productId)) },
    });
    // Preserve favorite order (most recent first)
    const map = new Map(products.map((p) => [p.id, p]));
    return favs
      .map((f) => map.get(f.productId))
      .filter((p): p is Product => p !== undefined);
  }

  async listIds(userId: string): Promise<string[]> {
    const favs = await this.favRepo.find({
      where: { userId },
      select: ['productId'],
    });
    return favs.map((f) => f.productId);
  }

  async add(userId: string, productId: string): Promise<Favorite> {
    const product = await this.productRepo.findOne({ where: { id: productId } });
    if (!product) throw new NotFoundException(`Product ${productId} not found`);

    const existing = await this.favRepo.findOne({ where: { userId, productId } });
    if (existing) return existing;

    return this.favRepo.save(this.favRepo.create({ userId, productId }));
  }

  async remove(userId: string, productId: string): Promise<void> {
    await this.favRepo.delete({ userId, productId });
  }

  // ── Wishlist sharing ─────────────────────────────────────

  async getOrCreateShare(userId: string, note?: string | null): Promise<{ token: string; shareUrl: string; expiresAt: Date }> {
    // Reuse an active (non-expired) share to avoid token churn
    const existing = await this.sharesRepo.findOne({
      where: { userId, expiresAt: MoreThan(new Date()) },
      order: { createdAt: 'DESC' },
    });
    if (existing) {
      if (note !== undefined && note !== existing.note) {
        existing.note = note ?? null;
        await this.sharesRepo.save(existing);
      }
      return {
        token: existing.token,
        shareUrl: `${this.siteUrl}/wishlist/${existing.token}`,
        expiresAt: existing.expiresAt,
      };
    }

    const token = uuid().replace(/-/g, '').slice(0, 16);
    const expiresAt = new Date(Date.now() + SHARE_VALIDITY_DAYS * 24 * 60 * 60 * 1000);
    const share = await this.sharesRepo.save(
      this.sharesRepo.create({ userId, token, note: note ?? null, expiresAt, viewCount: 0 }),
    );
    return {
      token: share.token,
      shareUrl: `${this.siteUrl}/wishlist/${share.token}`,
      expiresAt: share.expiresAt,
    };
  }

  async revokeShare(userId: string): Promise<void> {
    await this.sharesRepo.delete({ userId });
  }

  async findPublicByToken(token: string): Promise<PublicWishlist> {
    const share = await this.sharesRepo.findOne({ where: { token } });
    if (!share) throw new NotFoundException('Wishlist introuvable ou expirée');
    if (share.expiresAt.getTime() <= Date.now()) {
      throw new NotFoundException('Cette wishlist a expiré');
    }

    share.viewCount += 1;
    await this.sharesRepo.save(share);

    const user = await this.userRepo.findOne({ where: { id: share.userId } });
    if (!user || !user.isActive) throw new NotFoundException('Wishlist indisponible');

    const products = await this.list(share.userId);
    const firstName = (user.fullName || 'Un client').split(' ')[0];

    return {
      ownerFirstName: firstName,
      ownerInitial: (firstName.charAt(0) || '?').toUpperCase(),
      expiresAt: share.expiresAt,
      note: share.note,
      products,
    };
  }
}
