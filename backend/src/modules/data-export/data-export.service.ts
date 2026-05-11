import { Injectable, NotFoundException, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { Address } from '../addresses/address.entity';
import { Order } from '../orders/order.entity';
import { Favorite } from '../favorites/favorite.entity';
import { ReturnRequest } from '../returns/return-request.entity';

const EXPORT_THROTTLE_MS = 24 * 60 * 60 * 1000; // 1 export per 24h
const lastExportByUser = new Map<string, number>();

export interface ExportPayload {
  meta: {
    exportedAt: string;
    version: number;
    article: 'RGPD article 20 — droit à la portabilité';
    notice: string;
  };
  profile: any;
  addresses: any[];
  orders: any[];
  returns: any[];
  favorites: any[];
}

@Injectable()
export class DataExportService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Address) private readonly addresses: Repository<Address>,
    @InjectRepository(Order) private readonly orders: Repository<Order>,
    @InjectRepository(Favorite) private readonly favorites: Repository<Favorite>,
    @InjectRepository(ReturnRequest) private readonly returns: Repository<ReturnRequest>,
  ) {}

  async generateExport(userId: string): Promise<ExportPayload> {
    const last = lastExportByUser.get(userId);
    if (last && Date.now() - last < EXPORT_THROTTLE_MS) {
      const hoursLeft = Math.ceil((EXPORT_THROTTLE_MS - (Date.now() - last)) / (60 * 60 * 1000));
      throw new HttpException(
        `Limite d'export atteinte. Réessayez dans ${hoursLeft} heure${hoursLeft > 1 ? 's' : ''}.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const user = await this.users.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Utilisateur introuvable');

    const [addresses, orders, favorites, returns] = await Promise.all([
      this.addresses.find({ where: { userId } }),
      this.orders.find({
        where: { userId },
        relations: ['items'],
        order: { createdAt: 'DESC' },
      }),
      this.favorites.find({ where: { userId }, relations: ['product'] }),
      this.returns.find({ where: { userId }, order: { createdAt: 'DESC' } }),
    ]);

    lastExportByUser.set(userId, Date.now());

    return {
      meta: {
        exportedAt: new Date().toISOString(),
        version: 1,
        article: 'RGPD article 20 — droit à la portabilité',
        notice:
          'Ce fichier contient l intégralité des données personnelles vous concernant détenues par Makani Cosmétique au moment de l export. Format JSON UTF-8.',
      },
      profile: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone ?? null,
        role: user.role,
        emailVerifiedAt: user.emailVerifiedAt,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      addresses: addresses.map((a) => ({
        id: a.id,
        fullName: (a as any).fullName,
        line1: (a as any).line1,
        line2: (a as any).line2,
        city: (a as any).city,
        postalCode: (a as any).postalCode,
        state: (a as any).state,
        country: (a as any).country,
        phone: (a as any).phone,
        isDefault: (a as any).isDefault,
        createdAt: a.createdAt,
      })),
      orders: orders.map((o) => ({
        id: o.id,
        orderNumber: (o as any).orderNumber,
        status: o.status,
        paymentStatus: (o as any).paymentStatus,
        subtotal: Number((o as any).subtotal ?? 0),
        shippingFee: Number((o as any).shippingFee ?? 0),
        taxAmount: Number((o as any).taxAmount ?? 0),
        discountAmount: Number((o as any).discountAmount ?? 0),
        total: Number((o as any).total ?? 0),
        currency: (o as any).currency,
        items: (o as any).items?.map((it: any) => ({
          productName: it.productName,
          quantity: it.quantity,
          unitPrice: Number(it.unitPrice),
          subtotal: Number(it.subtotal),
        })),
        shippingSnapshot: (o as any).shippingSnapshot,
        carrier: (o as any).carrier,
        trackingNumber: (o as any).trackingNumber,
        createdAt: o.createdAt,
        paidAt: (o as any).paidAt,
        shippedAt: (o as any).shippedAt,
        deliveredAt: (o as any).deliveredAt,
      })),
      returns: returns.map((r) => ({
        id: r.id,
        orderId: (r as any).orderId,
        status: r.status,
        reason: (r as any).reason,
        items: (r as any).items,
        refundAmount: (r as any).refundAmount,
        rejectReason: (r as any).rejectReason,
        createdAt: r.createdAt,
        processedAt: (r as any).processedAt,
      })),
      favorites: favorites.map((f) => ({
        productName: (f as any).product?.name,
        productSlug: (f as any).product?.slug,
        addedAt: f.createdAt,
      })),
    };
  }
}
