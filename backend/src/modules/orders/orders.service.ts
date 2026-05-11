import {
  Injectable, Logger, NotFoundException, BadRequestException, ForbiddenException, Optional,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { Order } from './order.entity';
import { OrderItem } from './order-item.entity';
import { ShipmentEvent } from './shipment-event.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrderStatus } from '../../common/enums/order-status.enum';
import { PaymentStatus } from '../../common/enums/payment-status.enum';
import { FulfillmentMethod } from '../../common/enums/fulfillment-method.enum';
import { Product } from '../products/product.entity';
import { ProductVariant } from '../products/product-variant.entity';
import { Address } from '../addresses/address.entity';
import { StockMovement } from '../stock/stock-movement.entity';
import { StockMovementType } from '../../common/enums/stock-movement-type.enum';
import { User } from '../users/user.entity';
import { PromoCodesService } from '../promo-codes/promo-codes.service';
import { ShippingService } from '../shipping/shipping.service';
import { CarrierRegistryService } from '../carriers/carrier-registry.service';
import { CarrierCode } from '../carriers/carrier.types';
import { LabelStorageService } from '../carriers/label-storage.service';
import { InvoiceService } from '../invoices/invoice.service';
import { StockAlertService } from '../stock/stock-alert.service';
import { EmailService } from '../email/email.service';
import { GA4Service } from '../analytics-tracking/ga4.service';
import { MetaCapiService } from '../analytics-tracking/meta/meta-capi.service';
import { TikTokEventsService } from '../analytics-tracking/tiktok/tiktok-events.service';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    @InjectRepository(Order) private readonly orderRepo: Repository<Order>,
    @InjectRepository(OrderItem) private readonly itemRepo: Repository<OrderItem>,
    @InjectRepository(Product) private readonly productRepo: Repository<Product>,
    @InjectRepository(Address) private readonly addressRepo: Repository<Address>,
    @InjectRepository(StockMovement) private readonly movementRepo: Repository<StockMovement>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(ShipmentEvent) private readonly eventRepo: Repository<ShipmentEvent>,
    private readonly dataSource: DataSource,
    private readonly promoCodesService: PromoCodesService,
    private readonly shippingService: ShippingService,
    private readonly carriers: CarrierRegistryService,
    private readonly labels: LabelStorageService,
    private readonly invoices: InvoiceService,
    private readonly stockAlerts: StockAlertService,
    private readonly email: EmailService,
    private readonly config: ConfigService,
    @Optional()
    private readonly ga4?: GA4Service,
    @Optional()
    private readonly metaCapi?: MetaCapiService,
    @Optional()
    private readonly tiktokEvents?: TikTokEventsService,
  ) {}

  private get frontendUrl(): string {
    return this.config.get<string>('FRONTEND_URL') ?? 'http://localhost:3001';
  }

  async create(userId: string, dto: CreateOrderDto): Promise<Order> {
    const fulfillmentMethod = dto.fulfillmentMethod ?? FulfillmentMethod.DELIVERY;
    const isRelay = fulfillmentMethod === FulfillmentMethod.RELAY;

    let address: Address | null = null;
    if (fulfillmentMethod === FulfillmentMethod.DELIVERY) {
      if (!dto.addressId) throw new BadRequestException('Adresse requise pour la livraison à domicile');
      address = await this.addressRepo.findOne({ where: { id: dto.addressId, userId } });
      if (!address) throw new NotFoundException('Address not found');
    }

    if (isRelay && !dto.relayPoint) {
      throw new BadRequestException('Point relais requis pour le mode point relais');
    }

    const productIds = dto.items.map((i) => i.productId);
    const products = await this.productRepo.find({
      where: { id: In(productIds) },
      relations: ['variants'],
    });

    // Build a map of resolved variants for items that reference one
    const variantMap = new Map<string, { id: string; label: string; price: number; stock: number }>();
    for (const item of dto.items) {
      const product = products.find((p) => p.id === item.productId);
      if (!product) throw new NotFoundException(`Product ${item.productId} not found`);

      if (item.variantId) {
        const variant = (product.variants ?? []).find((v) => v.id === item.variantId);
        if (!variant) {
          throw new BadRequestException(`Variante ${item.variantId} introuvable pour "${product.name}"`);
        }
        if (variant.stock < item.quantity) {
          throw new BadRequestException(
            `Stock insuffisant pour "${product.name}" — variante (disponible: ${variant.stock})`,
          );
        }
        const label = Object.values(variant.attributes ?? {}).join(' / ') || 'Variante';
        const price = Number(variant.priceOverride ?? product.salePrice ?? product.price);
        variantMap.set(`${item.productId}:${item.variantId}`, {
          id: variant.id,
          label,
          price,
          stock: variant.stock,
        });
      } else {
        // Product with variants requires a variant choice
        if ((product.variants ?? []).length > 0) {
          throw new BadRequestException(`"${product.name}" requiert le choix d'une variante`);
        }
        if (product.stock < item.quantity) {
          throw new BadRequestException(`Stock insuffisant pour "${product.name}" (disponible: ${product.stock})`);
        }
      }
    }

    const currency = products[0]?.currency ?? '€';
    const subtotal = dto.items.reduce((acc, item) => {
      const p = products.find((pr) => pr.id === item.productId)!;
      const v = item.variantId ? variantMap.get(`${item.productId}:${item.variantId}`) : null;
      const price = v ? v.price : Number(p.salePrice ?? p.price);
      return acc + price * item.quantity;
    }, 0);

    // Compute shipping fee & VAT depending on fulfillment method.
    let shipping: { shippingFee: number; taxRate: number; taxAmount: number; freeShippingApplied: boolean; zoneName: string };
    if (isRelay) {
      const country = dto.relayPoint!.country;
      shipping = await this.shippingService.calculate(
        country,
        subtotal,
        dto.items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        'relay',
      ) as any;
    } else {
      shipping = await this.shippingService.calculate(
        address!.country,
        subtotal,
        dto.items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        'home',
        dto.shippingSpeed ?? 'standard',
      ) as any;
    }
    const shippingFee = Number(shipping.shippingFee);
    const taxRate = Number(shipping.taxRate);

    // Validate promo code if any (server-side check — never trust client)
    let discountAmount = 0;
    let discountCode: string | null = null;
    let promoCodeId: string | null = null;
    if (dto.promoCode) {
      const validation = await this.promoCodesService.validate(dto.promoCode, subtotal);
      if (!validation.valid) throw new BadRequestException(validation.message);
      discountAmount = validation.discount;
      discountCode = validation.code!.code;
      promoCodeId = validation.code!.id;
    }

    const total = +(subtotal + shippingFee - discountAmount).toFixed(2);

    // VAT is the embedded portion in the TTC total — informative breakdown
    const taxAmount = taxRate > 0
      ? +(total * (taxRate / (100 + taxRate))).toFixed(2)
      : 0;
    const orderNumber = `FB-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;

    let shippingSnapshot: Record<string, unknown>;
    if (isRelay) {
      shippingSnapshot = { kind: 'relay', ...dto.relayPoint! };
    } else {
      shippingSnapshot = {
        kind: 'delivery',
        fullName: address!.fullName,
        line1: address!.line1,
        line2: address!.line2,
        city: address!.city,
        state: address!.state,
        postalCode: address!.postalCode,
        country: address!.country,
        phone: address!.phone,
      };
    }

    const shippingSpeed = (fulfillmentMethod === FulfillmentMethod.DELIVERY ? dto.shippingSpeed : undefined) ?? 'standard';

    return this.dataSource.transaction(async (manager) => {
      const order = manager.create(Order, {
        orderNumber,
        userId,
        fulfillmentMethod,
        shippingSpeed,
        shippingAddressId: fulfillmentMethod === FulfillmentMethod.DELIVERY ? address!.id : null,
        shippingSnapshot,
        status: OrderStatus.PENDING,
        paymentStatus: PaymentStatus.PENDING,
        subtotal,
        shippingFee,
        taxRate,
        taxAmount,
        discountCode,
        discountAmount,
        total,
        currency,
        notes: dto.notes,
      });
      const saved = await manager.save(Order, order);

      // Snapshot the line items but DO NOT decrement stock yet —
      // that happens only on payment_intent.succeeded (see confirmPayment).
      // Stock and promo claims are also deferred to avoid blocking inventory
      // for abandoned carts.
      for (const item of dto.items) {
        const product = products.find((p) => p.id === item.productId)!;
        const variant = item.variantId
          ? variantMap.get(`${item.productId}:${item.variantId}`)
          : null;
        const unitPrice = variant ? variant.price : Number(product.salePrice ?? product.price);

        await manager.save(OrderItem, manager.create(OrderItem, {
          orderId: saved.id,
          productId: product.id,
          productName: product.name,
          productImageUrl: product.imageUrl,
          unitPrice,
          quantity: item.quantity,
          subtotal: unitPrice * item.quantity,
          variantId: variant?.id ?? null,
          variantLabel: variant?.label ?? null,
        }));
      }

      return manager.findOne(Order, { where: { id: saved.id } }) as Promise<Order>;
    });
  }

  /**
   * Called by the Stripe webhook when payment_intent.succeeded fires.
   * Atomic: re-checks stock, decrements it, claims promo, marks order paid.
   * Idempotent: safe to call multiple times (Stripe can re-deliver webhooks).
   */
  async confirmPayment(paymentIntentId: string): Promise<void> {
    const order = await this.orderRepo.findOne({ where: { stripePaymentIntentId: paymentIntentId } });
    if (!order) throw new NotFoundException(`No order for intent ${paymentIntentId}`);
    return this.markOrderPaid(order.id);
  }

  /**
   * Same logic as confirmPayment but keyed on the PayPal order id. Used by
   * the PayPal capture endpoint and the PayPal webhook.
   */
  async confirmPayPalOrder(paypalOrderId: string): Promise<void> {
    const order = await this.orderRepo.findOne({ where: { paypalOrderId } });
    if (!order) throw new NotFoundException(`No order for PayPal order ${paypalOrderId}`);
    return this.markOrderPaid(order.id);
  }

  /**
   * Atomic transition pending → paid for a known order id. Re-checks stock,
   * decrements it, claims promo, marks order paid. Idempotent: silently no-ops
   * if already PAID.
   */
  private async markOrderPaid(orderId: string): Promise<void> {
    const existing = await this.orderRepo.findOne({ where: { id: orderId } });
    if (!existing) throw new NotFoundException(`Order ${orderId} not found`);
    if (existing.paymentStatus === PaymentStatus.PAID) return;

    return this.dataSource.transaction(async (manager) => {
      // SELECT FOR UPDATE on the orders row alone — using the QueryBuilder
      // skips eager-loading (which would LEFT JOIN order_items and break the
      // lock under Postgres rules).
      const fresh = await manager
        .getRepository(Order)
        .createQueryBuilder('order')
        .where('order.id = :id', { id: orderId })
        .setLock('pessimistic_write')
        .getOne();
      if (!fresh || fresh.paymentStatus === PaymentStatus.PAID) return;
      fresh.items = await manager.find(OrderItem, { where: { orderId: fresh.id } });

      // Re-validate stock — it may have dropped since order creation
      for (const item of fresh.items) {
        const product = await manager.findOne(Product, { where: { id: item.productId } });
        if (!product) {
          throw new BadRequestException(`Product ${item.productId} no longer exists`);
        }
        if (item.variantId) {
          const variant = await manager.findOne(ProductVariant, { where: { id: item.variantId } });
          if (!variant) {
            throw new BadRequestException(`Variante ${item.variantId} pour "${product.name}" supprimée`);
          }
          if (variant.stock < item.quantity) {
            throw new BadRequestException(
              `Stock insuffisant pour "${product.name}" — ${item.variantLabel ?? 'variante'} (disponible: ${variant.stock}, demandé: ${item.quantity})`,
            );
          }
        } else if (product.stock < item.quantity) {
          throw new BadRequestException(
            `Stock insuffisant pour "${product.name}" (disponible: ${product.stock}, demandé: ${item.quantity})`,
          );
        }
      }

      // Decrement stock + write movements (per variant when applicable, else per product)
      const stockTransitions: { productId: string; previous: number; next: number }[] = [];
      for (const item of fresh.items) {
        const product = await manager.findOne(Product, { where: { id: item.productId } });
        if (!product) continue;

        if (item.variantId) {
          const variant = await manager.findOne(ProductVariant, { where: { id: item.variantId } });
          if (!variant) continue;
          const previousStock = variant.stock;
          variant.stock = Math.max(0, variant.stock - item.quantity);
          await manager.save(ProductVariant, variant);

          await manager.save(StockMovement, manager.create(StockMovement, {
            productId: product.id,
            type: StockMovementType.OUT,
            quantity: item.quantity,
            stockAfter: variant.stock,
            reason: `Commande ${fresh.orderNumber} — ${item.variantLabel ?? 'variante'}`,
          }));
          stockTransitions.push({ productId: product.id, previous: previousStock, next: variant.stock });
        } else {
          const previousStock = product.stock;
          product.stock -= item.quantity;
          await manager.save(Product, product);

          await manager.save(StockMovement, manager.create(StockMovement, {
            productId: product.id,
            type: StockMovementType.OUT,
            quantity: item.quantity,
            stockAfter: product.stock,
            reason: `Commande ${fresh.orderNumber} (paiement confirmé)`,
          }));
          stockTransitions.push({ productId: product.id, previous: previousStock, next: product.stock });
        }
      }

      // Fire rupture alerts after we know the transaction will commit (post-loop).
      // Errors in alerts are swallowed inside the service so they can't break the order.
      setImmediate(() => {
        for (const t of stockTransitions) {
          void this.stockAlerts.notifyIfNewlyOutOfStock(t.productId, t.previous, t.next, fresh.orderNumber);
        }
      });

      // Claim the promo code now (atomically refused if cap reached meanwhile)
      if (fresh.discountCode) {
        const promo = await this.promoCodesService.findByCode(fresh.discountCode);
        if (promo) {
          await this.promoCodesService.claimAtomic(manager, promo.id);
        }
      }

      fresh.paymentStatus = PaymentStatus.PAID;
      fresh.status = OrderStatus.CONFIRMED;
      fresh.paidAt = new Date();
      await manager.save(Order, fresh);

      setImmediate(() => this.sendOrderConfirmationEmail(fresh.id).catch((err) => {
        this.logger.warn(`Order confirmation email failed for ${fresh.orderNumber}: ${err.message}`);
      }));
      setImmediate(() => this.invoices.createForOrder(fresh.id).catch((err) => {
        this.logger.warn(`Invoice generation failed for ${fresh.orderNumber}: ${err.message}`);
      }));
      if (this.ga4 || this.metaCapi || this.tiktokEvents) {
        const items = fresh.items ?? [];
        const trackingItems = items.map((it) => ({
          productId: it.productId,
          productName: it.productName,
          unitPrice: Number(it.unitPrice),
          quantity: it.quantity,
        }));
        if (this.ga4) {
          setImmediate(() => this.ga4!.sendPurchase(fresh, trackingItems).catch((err) => {
            this.logger.warn(`GA4 purchase tracking failed for ${fresh.orderNumber}: ${err.message}`);
          }));
        }
        if (this.metaCapi || this.tiktokEvents) {
          // One user fetch shared between Meta and TikTok (both need email/phone for matching)
          setImmediate(() => this.userRepo.findOne({ where: { id: fresh.userId } })
            .then((user) => {
              if (this.metaCapi) {
                this.metaCapi.sendPurchase(fresh, user, trackingItems).catch((err) => {
                  this.logger.warn(`Meta CAPI purchase tracking failed for ${fresh.orderNumber}: ${err.message}`);
                });
              }
              if (this.tiktokEvents) {
                this.tiktokEvents.sendCompletePayment(fresh, user, trackingItems).catch((err) => {
                  this.logger.warn(`TikTok Events tracking failed for ${fresh.orderNumber}: ${err.message}`);
                });
              }
            })
            .catch((err) => {
              this.logger.warn(`User fetch for tracking failed: ${err.message}`);
            }));
        }
      }
    });
  }

  private async sendOrderConfirmationEmail(orderId: string): Promise<void> {
    const order = await this.orderRepo.findOne({ where: { id: orderId } });
    if (!order) return;
    const user = await this.userRepo.findOne({ where: { id: order.userId } });
    if (!user) return;
    await this.email.sendOrderConfirmation(user.email, {
      fullName: user.fullName,
      orderNumber: order.orderNumber,
      currency: order.currency,
      subtotal: order.subtotal,
      shippingFee: order.shippingFee,
      discountCode: order.discountCode,
      discountAmount: order.discountAmount,
      total: order.total,
      taxRate: order.taxRate,
      taxAmount: order.taxAmount,
      items: order.items.map((it) => ({
        productName: it.productName,
        unitPrice: it.unitPrice,
        quantity: it.quantity,
        subtotal: it.subtotal,
      })),
      shippingSnapshot: order.shippingSnapshot,
      orderUrl: `${this.frontendUrl}/account/orders/${order.id}`,
    });
  }

  private async sendOrderShippedEmail(orderId: string): Promise<void> {
    const order = await this.orderRepo.findOne({ where: { id: orderId } });
    if (!order) return;
    const user = await this.userRepo.findOne({ where: { id: order.userId } });
    if (!user) return;
    await this.email.sendOrderShipped(user.email, {
      fullName: user.fullName,
      orderNumber: order.orderNumber,
      shippingSnapshot: order.shippingSnapshot,
      orderUrl: `${this.frontendUrl}/account/orders/${order.id}`,
      trackingUrl: order.trackingUrl,
    });
  }

  async markPaymentFailed(paymentIntentId: string): Promise<void> {
    const order = await this.orderRepo.findOne({ where: { stripePaymentIntentId: paymentIntentId } });
    if (!order || order.paymentStatus === PaymentStatus.PAID) return;
    order.paymentStatus = PaymentStatus.FAILED;
    await this.orderRepo.save(order);
  }

  async markPaypalOrderFailed(paypalOrderId: string): Promise<void> {
    const order = await this.orderRepo.findOne({ where: { paypalOrderId } });
    if (!order || order.paymentStatus === PaymentStatus.PAID) return;
    order.paymentStatus = PaymentStatus.FAILED;
    await this.orderRepo.save(order);
  }

  /**
   * Mark a paid order as (fully or partially) refunded.
   *
   * - Full refund (amount omitted or covers the remaining balance):
   *   paymentStatus → REFUNDED, stock restored if not shipped, status → CANCELLED.
   * - Partial refund (amount < remaining balance):
   *   refundedAmount incremented, paymentStatus stays PAID, no stock change.
   *
   * Caller is responsible for issuing the actual Stripe / PayPal refund first.
   */
  async markRefunded(orderId: string, amount?: number): Promise<Order> {
    return this.dataSource.transaction(async (manager) => {
      const order = await manager
        .getRepository(Order)
        .createQueryBuilder('order')
        .where('order.id = :id', { id: orderId })
        .setLock('pessimistic_write')
        .getOne();
      if (!order) throw new NotFoundException('Order not found');
      order.items = await manager.find(OrderItem, { where: { orderId: order.id } });
      if (order.paymentStatus === PaymentStatus.REFUNDED) return order;
      if (order.paymentStatus !== PaymentStatus.PAID) {
        throw new BadRequestException('Seules les commandes payées peuvent être remboursées');
      }

      const total = Number(order.total);
      const alreadyRefunded = Number(order.refundedAmount ?? 0);
      const remaining = +(total - alreadyRefunded).toFixed(2);
      const refundAmount = +(amount ?? remaining).toFixed(2);

      if (refundAmount <= 0) {
        throw new BadRequestException('Le montant à rembourser doit être positif');
      }
      if (refundAmount > remaining + 0.001) {
        throw new BadRequestException(
          `Montant supérieur au solde remboursable (${remaining.toFixed(2)} ${order.currency})`,
        );
      }

      const newRefundedAmount = +(alreadyRefunded + refundAmount).toFixed(2);
      const isFull = Math.abs(newRefundedAmount - total) < 0.01;
      order.refundedAmount = newRefundedAmount;

      if (isFull) {
        const restoreStock =
          order.status === OrderStatus.PENDING
          || order.status === OrderStatus.CONFIRMED
          || order.status === OrderStatus.PREPARING
          || order.status === OrderStatus.RETURNED;
        if (restoreStock) {
          for (const item of order.items) {
            const product = await manager.findOne(Product, { where: { id: item.productId } });
            if (!product) continue;
            product.stock += item.quantity;
            await manager.save(Product, product);
            await manager.save(StockMovement, manager.create(StockMovement, {
              productId: product.id,
              type: StockMovementType.IN,
              quantity: item.quantity,
              stockAfter: product.stock,
              reason: `Remboursement commande ${order.orderNumber}`,
            }));
          }
          order.status = OrderStatus.CANCELLED;
        }
        order.paymentStatus = PaymentStatus.REFUNDED;
      }

      return manager.save(Order, order);
    });
  }

  async setStripeIntentId(orderId: string, paymentIntentId: string): Promise<void> {
    await this.orderRepo.update(orderId, { stripePaymentIntentId: paymentIntentId, paymentProvider: 'stripe' });
  }

  async setPaypalOrderId(orderId: string, paypalOrderId: string): Promise<void> {
    await this.orderRepo.update(orderId, { paypalOrderId, paymentProvider: 'paypal' });
  }

  async findByPaymentIntent(paymentIntentId: string): Promise<Order | null> {
    return this.orderRepo.findOne({ where: { stripePaymentIntentId: paymentIntentId } });
  }

  async findByPaypalOrderId(paypalOrderId: string): Promise<Order | null> {
    return this.orderRepo.findOne({ where: { paypalOrderId } });
  }

  async findByUser(userId: string): Promise<Order[]> {
    return this.orderRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, userId?: string): Promise<Order> {
    const order = await this.orderRepo.findOne({ where: { id } });
    if (!order) throw new NotFoundException('Order not found');
    if (userId && order.userId !== userId) throw new ForbiddenException();
    return order;
  }

  async findByOrderNumber(orderNumber: string, userId?: string): Promise<Order> {
    const order = await this.orderRepo.findOne({ where: { orderNumber } });
    if (!order) throw new NotFoundException('Order not found');
    if (userId && order.userId !== userId) throw new ForbiddenException();
    return order;
  }

  async cancel(id: string, userId: string): Promise<Order> {
    const order = await this.findOne(id, userId);
    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException('Only pending orders can be cancelled');
    }

    return this.dataSource.transaction(async (manager) => {
      for (const item of order.items) {
        const product = await manager.findOne(Product, { where: { id: item.productId } });
        if (product) {
          product.stock += item.quantity;
          await manager.save(Product, product);
          await manager.save(StockMovement, manager.create(StockMovement, {
            productId: product.id,
            type: StockMovementType.IN,
            quantity: item.quantity,
            stockAfter: product.stock,
            reason: `Annulation commande ${order.orderNumber}`,
          }));
        }
      }
      order.status = OrderStatus.CANCELLED;
      return manager.save(Order, order);
    });
  }

  // Admin: list all orders
  async findAll(
    page = 1,
    limit = 20,
    filters: { status?: OrderStatus; paymentStatus?: PaymentStatus } = {},
  ): Promise<{ data: Order[]; total: number }> {
    const where: Record<string, unknown> = {};
    if (filters.status) where.status = filters.status;
    if (filters.paymentStatus) where.paymentStatus = filters.paymentStatus;

    const [data, total] = await this.orderRepo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total };
  }

  // Admin: fetch one order
  async findOneAdmin(id: string): Promise<Order> {
    const order = await this.orderRepo.findOne({ where: { id } });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  // Admin: list available carriers
  listCarriers() {
    return this.carriers.list();
  }

  /**
   * Concatenate the shipping labels for the given order ids into a single
   * PDF buffer. Orders without a labelUrl are silently skipped.
   * Throws if no order has a label.
   */
  async batchLabels(orderIds: string[]): Promise<Uint8Array> {
    if (!orderIds.length) throw new BadRequestException('Aucune commande sélectionnée');
    const orders = await this.orderRepo.findByIds(orderIds);
    const urls = orders.map((o) => o.labelUrl).filter((u): u is string => !!u);
    if (urls.length === 0) {
      throw new BadRequestException('Aucun bordereau disponible pour ces commandes');
    }
    return this.labels.concatenate(urls);
  }

  /** Tracking events for an order — read-only, ordered chronologically. */
  async listEvents(orderId: string, userId?: string): Promise<ShipmentEvent[]> {
    const order = await this.findOne(orderId, userId);
    return this.eventRepo.find({
      where: { orderId: order.id },
      order: { occurredAt: 'ASC' },
    });
  }

  /**
   * Returns the invoice for an order. Generates lazily on first access in case
   * the auto-create fired during payment-confirmation failed (rare, but safe).
   * Validates ownership when userId is provided.
   */
  async getInvoiceForOrder(orderId: string, userId?: string): Promise<{ invoice: { number: string; issuedAt: Date }; pdf: Buffer }> {
    const order = await this.findOne(orderId, userId);
    if (order.paymentStatus !== PaymentStatus.PAID && order.paymentStatus !== PaymentStatus.REFUNDED) {
      throw new BadRequestException('Aucune facture disponible — la commande n a pas été payée');
    }
    let invoice = await this.invoices.findByOrderId(order.id);
    if (!invoice) invoice = await this.invoices.createForOrder(order.id);
    const pdf = await this.invoices.readPdf(invoice);
    return { invoice: { number: invoice.number, issuedAt: invoice.issuedAt }, pdf };
  }

  /**
   * Admin: create a shipment for a paid delivery order, persist tracking info
   * and transition the order to SHIPPED. Fires the expédition email afterwards.
   */
  async ship(id: string, opts: { carrier: CarrierCode; weightOverrideGrams?: number }): Promise<Order> {
    const order = await this.findOneAdmin(id);

    if (order.paymentStatus !== PaymentStatus.PAID) {
      throw new BadRequestException('La commande doit être payée avant expédition');
    }
    if (order.status === OrderStatus.SHIPPED || order.status === OrderStatus.DELIVERED) {
      throw new BadRequestException('Cette commande a déjà été expédiée');
    }
    if (order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException('Une commande annulée ne peut pas être expédiée');
    }

    const carrierCode: CarrierCode = opts.carrier;

    const totalWeightGrams = opts.weightOverrideGrams ?? await this.computeOrderWeightGrams(order);
    if (totalWeightGrams <= 0) {
      throw new BadRequestException('Poids total introuvable — renseignez weightGrams sur les produits ou indiquez un poids manuellement');
    }

    const carrier = this.carriers.get(carrierCode);

    const snap = order.shippingSnapshot as any;
    const recipient = {
      fullName: snap?.fullName ?? '',
      line1: snap?.line1 ?? '',
      line2: snap?.line2 ?? undefined,
      postalCode: snap?.postalCode ?? '',
      city: snap?.city ?? '',
      country: snap?.country ?? '',
      phone: snap?.phone ?? undefined,
    };

    const result = await carrier.createShipment({
      weightGrams: totalWeightGrams,
      orderNumber: order.orderNumber,
      recipient,
    });

    order.carrier = result.carrier;
    order.trackingNumber = result.trackingNumber;
    order.trackingUrl = result.trackingUrl;
    order.labelUrl = result.labelUrl;
    order.status = OrderStatus.SHIPPED;
    order.shippedAt = new Date();
    const saved = await this.orderRepo.save(order);

    setImmediate(() => this.sendOrderShippedEmail(saved.id).catch((err) => {
      this.logger.warn(`Shipped email failed for ${saved.orderNumber}: ${err.message}`);
    }));

    return saved;
  }

  private async computeOrderWeightGrams(order: Order): Promise<number> {
    const items = order.items?.length ? order.items : await this.itemRepo.find({ where: { orderId: order.id } });
    if (!items.length) return 0;
    const products = await this.productRepo.findByIds(items.map((i) => i.productId));
    return items.reduce((acc, item) => {
      const p = products.find((pp) => pp.id === item.productId);
      return acc + (p?.weightGrams ?? 0) * item.quantity;
    }, 0);
  }

  // Admin: update status
  async updateStatus(id: string, dto: UpdateOrderStatusDto): Promise<Order> {
    const order = await this.findOne(id);
    const previousStatus = order.status;
    order.status = dto.status;
    if (dto.status === OrderStatus.SHIPPED) order.shippedAt = new Date();
    if (dto.status === OrderStatus.DELIVERED) order.deliveredAt = new Date();
    const saved = await this.orderRepo.save(order);

    if (dto.status === OrderStatus.SHIPPED && previousStatus !== OrderStatus.SHIPPED) {
      setImmediate(() => this.sendOrderShippedEmail(saved.id).catch((err) => {
        this.logger.warn(`Shipped email failed for ${saved.orderNumber}: ${err.message}`);
      }));
    }
    return saved;
  }
}
