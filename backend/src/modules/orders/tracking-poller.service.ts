import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Order } from './order.entity';
import { ShipmentEvent } from './shipment-event.entity';
import { OrderStatus } from '../../common/enums/order-status.enum';
import { CarrierRegistryService } from '../carriers/carrier-registry.service';
import { ShipmentStatus, CarrierCode } from '../carriers/carrier.types';
import { OrdersService } from './orders.service';

/**
 * Periodic poller that fetches the latest tracking status for every shipped
 * (and not yet delivered) order, appends new events to the timeline, and
 * transitions the order to DELIVERED when the carrier confirms it.
 *
 * Runs every 30 minutes by default. In mock mode the carriers progress
 * deterministically based on shippedAt age — a freshly shipped order will
 * cycle through pre_transit → in_transit → out_for_delivery → delivered
 * over ~36 hours.
 */
@Injectable()
export class TrackingPollerService {
  private readonly logger = new Logger(TrackingPollerService.name);

  constructor(
    @InjectRepository(Order) private readonly orderRepo: Repository<Order>,
    @InjectRepository(ShipmentEvent) private readonly eventRepo: Repository<ShipmentEvent>,
    private readonly carriers: CarrierRegistryService,
    private readonly orders: OrdersService,
  ) {}

  @Cron(CronExpression.EVERY_30_MINUTES)
  async poll(): Promise<void> {
    const candidates = await this.orderRepo.find({
      where: { status: OrderStatus.SHIPPED },
    });
    if (candidates.length === 0) return;

    this.logger.log(`Polling tracking status for ${candidates.length} shipped order(s)`);

    for (const order of candidates) {
      try {
        await this.refreshOne(order);
      } catch (err: any) {
        this.logger.warn(`Tracking refresh failed for ${order.orderNumber}: ${err.message}`);
      }
    }
  }

  /**
   * Fetch + persist current status for a single order. Idempotent: if the
   * latest status matches the most recent event, nothing is appended.
   * Returns the (possibly newly created) latest event so callers can react.
   */
  async refreshOne(order: Order): Promise<ShipmentEvent | null> {
    if (!order.carrier || !order.trackingNumber) return null;

    const carrier = this.carriers.get(order.carrier as CarrierCode);
    const status = await carrier.getTrackingStatus(order.trackingNumber, order.shippedAt);

    const last = await this.eventRepo.findOne({
      where: { orderId: order.id },
      order: { occurredAt: 'DESC' },
    });

    let event: ShipmentEvent | null = last;
    // Append a new event when the status changes (or when there's no log yet).
    if (!last || last.status !== status.status) {
      event = await this.eventRepo.save(this.eventRepo.create({
        orderId: order.id,
        status: status.status,
        message: status.message ?? this.defaultMessage(status.status),
        occurredAt: status.occurredAt ?? new Date(),
      }));
    }

    if (status.status === 'delivered' && order.status !== OrderStatus.DELIVERED) {
      // Reuse the same transition path as admin's "Marquer livrée" — fires no
      // email by itself, the user already saw the shipped one. Could be added
      // later as a sendOrderDelivered template if needed.
      order.status = OrderStatus.DELIVERED;
      order.deliveredAt = new Date();
      await this.orderRepo.save(order);
      this.logger.log(`Order ${order.orderNumber} auto-transitioned to DELIVERED`);
    }

    return event;
  }

  private defaultMessage(s: ShipmentStatus): string {
    switch (s) {
      case 'pre_transit': return 'Étiquette créée';
      case 'in_transit': return 'En cours d acheminement';
      case 'out_for_delivery': return 'En cours de livraison';
      case 'delivered': return 'Livré';
      case 'exception': return 'Anomalie de livraison';
      default: return 'Statut indisponible';
    }
  }
}
