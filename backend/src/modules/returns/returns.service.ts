import {
  BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ReturnRequest, ReturnedItem, ReturnStatus } from './return-request.entity';
import { Order } from '../orders/order.entity';
import { OrderItem } from '../orders/order-item.entity';
import { Product } from '../products/product.entity';
import { StockMovement } from '../stock/stock-movement.entity';
import { User } from '../users/user.entity';
import { OrderStatus } from '../../common/enums/order-status.enum';
import { PaymentStatus } from '../../common/enums/payment-status.enum';
import { StockMovementType } from '../../common/enums/stock-movement-type.enum';
import { CreateReturnDto } from './dto/create-return.dto';
import { StripeService } from '../payments/stripe.service';
import { PaypalService } from '../payments/paypal.service';
import { EmailService } from '../email/email.service';

const RETURN_WINDOW_DAYS = 14;

@Injectable()
export class ReturnsService {
  private readonly logger = new Logger(ReturnsService.name);

  constructor(
    @InjectRepository(ReturnRequest) private readonly repo: Repository<ReturnRequest>,
    @InjectRepository(Order) private readonly orderRepo: Repository<Order>,
    @InjectRepository(OrderItem) private readonly itemRepo: Repository<OrderItem>,
    @InjectRepository(Product) private readonly productRepo: Repository<Product>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    private readonly dataSource: DataSource,
    private readonly stripe: StripeService,
    private readonly paypal: PaypalService,
    private readonly email: EmailService,
    private readonly config: ConfigService,
  ) {}

  // ── User-side ─────────────────────────────────────────────

  async createForOrder(userId: string, orderId: string, dto: CreateReturnDto): Promise<ReturnRequest> {
    const order = await this.orderRepo.findOne({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Commande introuvable');
    if (order.userId !== userId) throw new ForbiddenException();

    if (order.status !== OrderStatus.DELIVERED) {
      throw new BadRequestException('Une demande de retour n est possible que sur une commande livrée');
    }
    if (!order.deliveredAt) {
      throw new BadRequestException('Date de livraison introuvable — contactez le support');
    }
    const ageDays = (Date.now() - new Date(order.deliveredAt).getTime()) / 86_400_000;
    if (ageDays > RETURN_WINDOW_DAYS) {
      throw new BadRequestException(`Le délai de rétractation de ${RETURN_WINDOW_DAYS} jours est dépassé`);
    }

    // Block if there's already a pending request on this order.
    const existing = await this.repo.findOne({ where: { orderId, status: 'pending' } });
    if (existing) {
      throw new BadRequestException('Une demande de retour est déjà en cours pour cette commande');
    }

    // Validate the items belong to the order and quantities are sane.
    const orderItems = await this.itemRepo.find({ where: { orderId } });
    if (orderItems.length === 0) throw new BadRequestException('Aucun article sur cette commande');

    const snapshot: ReturnedItem[] = [];
    for (const req of dto.items) {
      const oi = orderItems.find((x) => x.id === req.orderItemId);
      if (!oi) throw new BadRequestException(`Article ${req.orderItemId} introuvable sur la commande`);
      if (req.quantity < 1 || req.quantity > oi.quantity) {
        throw new BadRequestException(`Quantité invalide pour "${oi.productName}" (max ${oi.quantity})`);
      }
      snapshot.push({
        orderItemId: oi.id,
        productName: oi.productName,
        unitPrice: Number(oi.unitPrice),
        quantity: req.quantity,
      });
    }
    if (snapshot.length === 0) throw new BadRequestException('Aucun article sélectionné');

    const created = await this.repo.save(this.repo.create({
      orderId,
      userId,
      status: 'pending' as ReturnStatus,
      reason: dto.reason.trim(),
      items: snapshot,
      refundAmount: null,
      rejectReason: null,
      processedAt: null,
      processedByUserId: null,
    }));

    // Best-effort confirmation email
    setImmediate(() => this.sendRequestedEmail(created).catch((err) => {
      this.logger.warn(`Return-requested email failed for ${created.id}: ${err.message}`);
    }));

    return created;
  }

  async listByUser(userId: string, orderId?: string): Promise<ReturnRequest[]> {
    return this.repo.find({
      where: orderId ? { userId, orderId } : { userId },
      order: { createdAt: 'DESC' },
    });
  }

  // ── Admin-side ────────────────────────────────────────────

  async listAll(filters: { status?: ReturnStatus } = {}): Promise<ReturnRequest[]> {
    const where: Record<string, unknown> = {};
    if (filters.status) where.status = filters.status;
    return this.repo.find({ where, order: { createdAt: 'DESC' } });
  }

  async findOneAdmin(id: string): Promise<ReturnRequest> {
    const r = await this.repo.findOne({ where: { id } });
    if (!r) throw new NotFoundException('Demande de retour introuvable');
    return r;
  }

  async approve(id: string, adminId: string, opts: { refundAmount?: number } = {}): Promise<ReturnRequest> {
    const ret = await this.findOneAdmin(id);
    if (ret.status !== 'pending') {
      throw new BadRequestException('Cette demande a déjà été traitée');
    }

    const order = await this.orderRepo.findOne({ where: { id: ret.orderId } });
    if (!order) throw new NotFoundException('Commande introuvable');
    if (order.paymentStatus !== PaymentStatus.PAID) {
      throw new BadRequestException('La commande n est pas dans un état remboursable');
    }

    const itemsValue = ret.items.reduce((acc, it) => acc + Number(it.unitPrice) * it.quantity, 0);
    const totalRemaining = +(Number(order.total) - Number(order.refundedAmount ?? 0)).toFixed(2);
    const refundAmount = +(opts.refundAmount ?? itemsValue).toFixed(2);
    if (refundAmount <= 0) {
      throw new BadRequestException('Montant à rembourser invalide');
    }
    if (refundAmount > totalRemaining + 0.001) {
      throw new BadRequestException(
        `Montant supérieur au solde remboursable (${totalRemaining.toFixed(2)} ${order.currency})`,
      );
    }

    // Issue the actual refund through the right provider.
    if (order.paymentProvider === 'paypal' || order.paypalOrderId) {
      const pp = await this.paypal.getOrder(order.paypalOrderId!);
      const captureId = pp?.purchaseUnits?.[0]?.payments?.captures?.[0]?.id ?? null;
      if (!captureId) throw new BadRequestException('Capture PayPal introuvable');
      await this.paypal.refundCapture(captureId, {
        amount: refundAmount < totalRemaining ? refundAmount : undefined,
        currency: this.toIsoCurrency(order.currency),
      });
    } else if (order.stripePaymentIntentId) {
      await this.stripe.createRefund(order.stripePaymentIntentId, {
        amount: refundAmount < totalRemaining ? refundAmount : undefined,
      });
    } else {
      throw new BadRequestException('Aucun paiement à rembourser');
    }

    // Persist: restore stock for returned items, update order, mark return.
    return this.dataSource.transaction(async (manager) => {
      // Restore stock per item
      for (const ri of ret.items) {
        const product = await manager.findOne(Product, { where: { id: (await manager.findOne(OrderItem, { where: { id: ri.orderItemId } }))?.productId } });
        if (!product) continue;
        product.stock += ri.quantity;
        await manager.save(Product, product);
        await manager.save(StockMovement, manager.create(StockMovement, {
          productId: product.id,
          type: StockMovementType.IN,
          quantity: ri.quantity,
          stockAfter: product.stock,
          reason: `Retour commande ${order.orderNumber}`,
        }));
      }

      // Update order
      const newRefunded = +(Number(order.refundedAmount ?? 0) + refundAmount).toFixed(2);
      const isFull = Math.abs(newRefunded - Number(order.total)) < 0.01;
      order.refundedAmount = newRefunded;
      if (isFull) order.paymentStatus = PaymentStatus.REFUNDED;
      order.status = OrderStatus.RETURNED;
      await manager.save(Order, order);

      // Mark return approved
      ret.status = 'approved';
      ret.refundAmount = refundAmount;
      ret.processedAt = new Date();
      ret.processedByUserId = adminId;
      const saved = await manager.save(ReturnRequest, ret);

      setImmediate(() => this.sendApprovedEmail(saved, order).catch((err) => {
        this.logger.warn(`Return-approved email failed for ${saved.id}: ${err.message}`);
      }));

      return saved;
    });
  }

  async reject(id: string, adminId: string, reason: string): Promise<ReturnRequest> {
    const ret = await this.findOneAdmin(id);
    if (ret.status !== 'pending') {
      throw new BadRequestException('Cette demande a déjà été traitée');
    }
    ret.status = 'rejected';
    ret.rejectReason = reason.trim();
    ret.processedAt = new Date();
    ret.processedByUserId = adminId;
    const saved = await this.repo.save(ret);

    setImmediate(() => this.sendRejectedEmail(saved).catch((err) => {
      this.logger.warn(`Return-rejected email failed for ${saved.id}: ${err.message}`);
    }));
    return saved;
  }

  // ── Email helpers ────────────────────────────────────────

  private async sendRequestedEmail(ret: ReturnRequest): Promise<void> {
    const user = await this.userRepo.findOne({ where: { id: ret.userId } });
    const order = await this.orderRepo.findOne({ where: { id: ret.orderId } });
    if (!user || !order) return;
    await this.email.sendReturnRequested(user.email, {
      fullName: user.fullName,
      orderNumber: order.orderNumber,
      items: ret.items,
      reason: ret.reason,
      orderUrl: `${this.frontendUrl}/account/orders/${order.id}`,
    });
  }

  private async sendApprovedEmail(ret: ReturnRequest, order: Order): Promise<void> {
    const user = await this.userRepo.findOne({ where: { id: ret.userId } });
    if (!user) return;
    await this.email.sendReturnApproved(user.email, {
      fullName: user.fullName,
      orderNumber: order.orderNumber,
      refundAmount: Number(ret.refundAmount ?? 0),
      currency: order.currency,
      orderUrl: `${this.frontendUrl}/account/orders/${order.id}`,
    });
  }

  private async sendRejectedEmail(ret: ReturnRequest): Promise<void> {
    const user = await this.userRepo.findOne({ where: { id: ret.userId } });
    const order = await this.orderRepo.findOne({ where: { id: ret.orderId } });
    if (!user || !order) return;
    await this.email.sendReturnRejected(user.email, {
      fullName: user.fullName,
      orderNumber: order.orderNumber,
      reason: ret.rejectReason ?? '',
      orderUrl: `${this.frontendUrl}/account/orders/${order.id}`,
    });
  }

  private get frontendUrl(): string {
    return this.config.get<string>('FRONTEND_URL') ?? 'http://localhost:3001';
  }

  private toIsoCurrency(symbolOrCode: string): string {
    const map: Record<string, string> = { '€': 'EUR', '$': 'USD', '£': 'GBP' };
    return (map[symbolOrCode] ?? symbolOrCode).toUpperCase();
  }
}
