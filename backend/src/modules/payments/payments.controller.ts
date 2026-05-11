import {
  Controller, Get, Post, Param, Body, Headers, Req, Res, UseGuards,
  HttpCode, HttpStatus, BadRequestException, ForbiddenException, Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiExcludeEndpoint } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { OrdersService } from '../orders/orders.service';
import { PaymentStatus } from '../../common/enums/payment-status.enum';
import { StripeService } from './stripe.service';
import { PaypalService } from './paypal.service';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';
import { CreatePaypalOrderDto, CapturePaypalOrderDto } from './dto/paypal.dto';
import { RefundOrderDto } from './dto/refund.dto';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(
    private readonly stripe: StripeService,
    private readonly paypal: PaypalService,
    private readonly orders: OrdersService,
  ) {}

  // ── Public config endpoint — frontend uses this to know which providers are wired ──
  @Get('config')
  @ApiOperation({ summary: 'Public payment provider configuration' })
  config() {
    return {
      stripe: {
        enabled: this.stripe.isConfigured,
        publishableKey: this.stripe.publishableKey,
      },
      paypal: {
        enabled: this.paypal.isConfigured,
        clientId: this.paypal.publicClientId,
        mode: this.paypal.currentMode,
      },
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // Stripe
  // ═══════════════════════════════════════════════════════════════

  @Post('stripe/create-intent')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Créer un PaymentIntent Stripe pour une commande pending' })
  async createIntent(
    @Body() dto: CreatePaymentIntentDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<{ clientSecret: string; paymentIntentId: string }> {
    const order = await this.orders.findOne(dto.orderId);
    if (order.userId !== user.sub) throw new ForbiddenException();
    if (order.paymentStatus === PaymentStatus.PAID) {
      throw new BadRequestException('Cette commande a déjà été payée');
    }

    // Reuse existing intent if one exists (avoids creating multiple intents per
    // order if the user re-loads the payment page)
    if (order.stripePaymentIntentId) {
      const existing = await this.stripe.retrieveIntent(order.stripePaymentIntentId);
      if (existing.status !== 'succeeded' && existing.status !== 'canceled') {
        return {
          clientSecret: existing.client_secret!,
          paymentIntentId: existing.id,
        };
      }
    }

    const intent = await this.stripe.createPaymentIntent({
      amount: Number(order.total),
      currency: this.normalizeCurrency(order.currency),
      orderId: order.id,
      customerEmail: user.email,
      metadata: { orderNumber: order.orderNumber },
    });

    await this.orders.setStripeIntentId(order.id, intent.id);

    return {
      clientSecret: intent.client_secret!,
      paymentIntentId: intent.id,
    };
  }

  @Post('stripe/sync/:orderId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Synchroniser l état de paiement d une commande depuis Stripe' })
  async syncStripe(@Param('orderId') orderId: string, @CurrentUser() user: JwtPayload) {
    const order = await this.orders.findOne(orderId);
    if (order.userId !== user.sub) throw new ForbiddenException();
    if (!order.stripePaymentIntentId) {
      return { paymentStatus: order.paymentStatus, status: order.status };
    }
    if (order.paymentStatus === PaymentStatus.PAID) {
      return { paymentStatus: order.paymentStatus, status: order.status };
    }

    let intent;
    try {
      intent = await this.stripe.retrieveIntent(order.stripePaymentIntentId);
    } catch (err: any) {
      this.logger.warn(`Sync Stripe: cannot retrieve ${order.stripePaymentIntentId}: ${err.message}`);
      return { paymentStatus: order.paymentStatus, status: order.status };
    }

    if (intent.status === 'succeeded') {
      await this.orders.confirmPayment(intent.id);
    } else if (intent.status === 'canceled') {
      await this.orders.markPaymentFailed(intent.id);
    }

    const fresh = await this.orders.findOne(orderId);
    return { paymentStatus: fresh.paymentStatus, status: fresh.status };
  }

  // ═══════════════════════════════════════════════════════════════
  // PayPal
  // ═══════════════════════════════════════════════════════════════

  @Post('paypal/create-order')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Créer une commande PayPal pour une order pending' })
  async createPaypalOrder(
    @Body() dto: CreatePaypalOrderDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<{ paypalOrderId: string; status: string }> {
    const order = await this.orders.findOne(dto.orderId);
    if (order.userId !== user.sub) throw new ForbiddenException();
    if (order.paymentStatus === PaymentStatus.PAID) {
      throw new BadRequestException('Cette commande a déjà été payée');
    }

    // Reuse existing PayPal order if it's still in CREATED / APPROVED state
    if (order.paypalOrderId) {
      try {
        const existing = await this.paypal.getOrder(order.paypalOrderId);
        if (existing?.status === 'CREATED' || existing?.status === 'APPROVED' || existing?.status === 'PAYER_ACTION_REQUIRED') {
          return { paypalOrderId: existing.id, status: existing.status };
        }
      } catch {
        // fall through and create a fresh one
      }
    }

    const created = await this.paypal.createOrder({
      amount: Number(order.total),
      currency: this.toIsoCurrency(order.currency),
      orderId: order.id,
      orderNumber: order.orderNumber,
    });

    await this.orders.setPaypalOrderId(order.id, created.id);
    return { paypalOrderId: created.id, status: created.status };
  }

  @Post('paypal/capture')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Capturer une commande PayPal approuvée par le client' })
  async capturePaypalOrder(
    @Body() dto: CapturePaypalOrderDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const order = await this.orders.findByPaypalOrderId(dto.paypalOrderId);
    if (!order) throw new BadRequestException('Commande PayPal inconnue');
    if (order.userId !== user.sub) throw new ForbiddenException();
    if (order.paymentStatus === PaymentStatus.PAID) {
      return { paymentStatus: order.paymentStatus, status: order.status };
    }

    let result: any;
    try {
      result = await this.paypal.captureOrder(dto.paypalOrderId);
    } catch (err: any) {
      this.logger.warn(`PayPal capture failed for ${dto.paypalOrderId}: ${err.message}`);
      throw new BadRequestException('Le paiement PayPal a échoué : ' + (err.message ?? 'erreur inconnue'));
    }

    if (result?.status === 'COMPLETED') {
      await this.orders.confirmPayPalOrder(dto.paypalOrderId);
    } else if (result?.status === 'DECLINED' || result?.status === 'FAILED') {
      await this.orders.markPaypalOrderFailed(dto.paypalOrderId);
      throw new BadRequestException('Le paiement PayPal a été refusé.');
    }

    const fresh = await this.orders.findOne(order.id);
    return { paymentStatus: fresh.paymentStatus, status: fresh.status, paypalStatus: result?.status };
  }

  @Post('paypal/sync/:orderId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Synchroniser l état de paiement d une commande depuis PayPal' })
  async syncPaypal(@Param('orderId') orderId: string, @CurrentUser() user: JwtPayload) {
    const order = await this.orders.findOne(orderId);
    if (order.userId !== user.sub) throw new ForbiddenException();
    if (!order.paypalOrderId) {
      return { paymentStatus: order.paymentStatus, status: order.status };
    }
    if (order.paymentStatus === PaymentStatus.PAID) {
      return { paymentStatus: order.paymentStatus, status: order.status };
    }

    let pp: any;
    try {
      pp = await this.paypal.getOrder(order.paypalOrderId);
    } catch (err: any) {
      this.logger.warn(`Sync PayPal: cannot retrieve ${order.paypalOrderId}: ${err.message}`);
      return { paymentStatus: order.paymentStatus, status: order.status };
    }

    if (pp?.status === 'COMPLETED') {
      await this.orders.confirmPayPalOrder(order.paypalOrderId);
    } else if (pp?.status === 'VOIDED') {
      await this.orders.markPaypalOrderFailed(order.paypalOrderId);
    }

    const fresh = await this.orders.findOne(orderId);
    return { paymentStatus: fresh.paymentStatus, status: fresh.status };
  }

  // ═══════════════════════════════════════════════════════════════
  // Admin: refund (Stripe OR PayPal)
  // ═══════════════════════════════════════════════════════════════

  @Post('admin/orders/:id/refund')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[Admin] Rembourser une commande payée (intégral ou partiel, Stripe ou PayPal)' })
  async refund(@Param('id') id: string, @Body() dto: RefundOrderDto) {
    const order = await this.orders.findOneAdmin(id);
    if (order.paymentStatus === PaymentStatus.REFUNDED) {
      throw new BadRequestException('Cette commande a déjà été remboursée intégralement');
    }
    if (order.paymentStatus !== PaymentStatus.PAID) {
      throw new BadRequestException('Seules les commandes payées peuvent être remboursées');
    }

    const total = Number(order.total);
    const alreadyRefunded = Number(order.refundedAmount ?? 0);
    const remaining = +(total - alreadyRefunded).toFixed(2);
    const requestedAmount = dto.amount !== undefined ? +Number(dto.amount).toFixed(2) : remaining;

    if (requestedAmount <= 0) {
      throw new BadRequestException('Le montant à rembourser doit être positif');
    }
    if (requestedAmount > remaining + 0.001) {
      throw new BadRequestException(
        `Montant supérieur au solde remboursable (${remaining.toFixed(2)} ${order.currency})`,
      );
    }

    if (order.paymentProvider === 'paypal' || order.paypalOrderId) {
      let captureId: string | null = null;
      try {
        const pp = await this.paypal.getOrder(order.paypalOrderId!);
        captureId = pp?.purchaseUnits?.[0]?.payments?.captures?.[0]?.id ?? null;
      } catch (err: any) {
        this.logger.error(`Cannot fetch PayPal order ${order.paypalOrderId}: ${err.message}`);
      }
      if (!captureId) {
        throw new BadRequestException('Capture PayPal introuvable pour cette commande');
      }
      try {
        await this.paypal.refundCapture(captureId, {
          amount: requestedAmount < remaining ? requestedAmount : undefined,
          currency: this.toIsoCurrency(order.currency),
        });
      } catch (err: any) {
        this.logger.error(`PayPal refund failed for order ${order.orderNumber}: ${err.message}`, err.stack);
        throw new BadRequestException(`PayPal a refusé le remboursement : ${err.message}`);
      }
      this.logger.log(
        `Refund ${requestedAmount}${order.currency} on ${order.orderNumber} via PayPal${dto.reason ? ` — ${dto.reason}` : ''}`,
      );
      return this.orders.markRefunded(order.id, requestedAmount);
    }

    if (!order.stripePaymentIntentId) {
      throw new BadRequestException('Aucun paiement (Stripe ou PayPal) associé à cette commande');
    }
    try {
      await this.stripe.createRefund(order.stripePaymentIntentId, {
        amount: requestedAmount < remaining ? requestedAmount : undefined,
      });
    } catch (err: any) {
      this.logger.error(`Stripe refund failed for order ${order.orderNumber}: ${err.message}`, err.stack);
      throw new BadRequestException(`Stripe a refusé le remboursement : ${err.message}`);
    }
    this.logger.log(
      `Refund ${requestedAmount}${order.currency} on ${order.orderNumber} via Stripe${dto.reason ? ` — ${dto.reason}` : ''}`,
    );
    return this.orders.markRefunded(order.id, requestedAmount);
  }

  // ═══════════════════════════════════════════════════════════════
  // Webhooks
  // ═══════════════════════════════════════════════════════════════

  @Post('stripe/webhook')
  @HttpCode(HttpStatus.OK)
  @ApiExcludeEndpoint()
  async stripeWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    if (!signature) {
      res.status(400).send('Missing stripe-signature header');
      return;
    }

    const rawBody = (req as any).rawBody as Buffer | undefined;
    if (!rawBody) {
      this.logger.error('Webhook received without rawBody — check NestFactory({ rawBody: true })');
      res.status(500).send('Server misconfigured: rawBody missing');
      return;
    }

    let event;
    try {
      event = this.stripe.constructEvent(rawBody, signature);
    } catch (err: any) {
      this.logger.warn(`Stripe webhook signature verification failed: ${err.message}`);
      res.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }

    this.logger.log(`Stripe event ${event.type} (${event.id})`);

    try {
      switch (event.type) {
        case 'payment_intent.succeeded': {
          const intent = event.data.object as { id: string };
          await this.orders.confirmPayment(intent.id);
          break;
        }
        case 'payment_intent.payment_failed':
        case 'payment_intent.canceled': {
          const intent = event.data.object as { id: string };
          await this.orders.markPaymentFailed(intent.id);
          break;
        }
        case 'charge.refunded': {
          const charge = event.data.object as { payment_intent?: string };
          if (charge.payment_intent) {
            const order = await this.orders.findByPaymentIntent(charge.payment_intent);
            if (order && order.paymentStatus === PaymentStatus.PAID) {
              await this.orders.markRefunded(order.id);
            }
          }
          break;
        }
        default:
          break;
      }
    } catch (err: any) {
      this.logger.error(`Failed handling ${event.type}: ${err.message}`, err.stack);
    }

    res.status(200).send({ received: true });
  }

  @Post('paypal/webhook')
  @HttpCode(HttpStatus.OK)
  @ApiExcludeEndpoint()
  async paypalWebhook(
    @Headers() headers: Record<string, string>,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const rawBody = (req as any).rawBody as Buffer | undefined;
    if (!rawBody) {
      this.logger.error('PayPal webhook received without rawBody');
      res.status(500).send('Server misconfigured: rawBody missing');
      return;
    }

    // Dashboard URL-validation pings have no signature headers — answer 200 so
    // PayPal accepts the URL. Real events MUST have transmission-id; we only
    // process those after signature verification.
    const hasSignature = !!headers['paypal-transmission-id']
      && !!headers['paypal-transmission-sig']
      && !!headers['paypal-cert-url'];
    if (!hasSignature) {
      this.logger.log('PayPal webhook ping (no signature headers) — acknowledged');
      res.status(200).send({ received: true, note: 'unsigned ping ignored' });
      return;
    }

    const valid = await this.paypal.verifyWebhookSignature(headers, rawBody);
    if (!valid) {
      res.status(400).send('Invalid PayPal webhook signature');
      return;
    }

    let event: any;
    try {
      event = JSON.parse(rawBody.toString('utf8'));
    } catch {
      res.status(400).send('Invalid JSON');
      return;
    }

    const type: string = event.event_type;
    this.logger.log(`PayPal event ${type} (${event.id})`);

    try {
      switch (type) {
        case 'PAYMENT.CAPTURE.COMPLETED': {
          // resource.supplementary_data.related_ids.order_id holds the v2 order id
          const ppOrderId = this.extractOrderIdFromCaptureEvent(event);
          if (ppOrderId) await this.orders.confirmPayPalOrder(ppOrderId);
          break;
        }
        case 'PAYMENT.CAPTURE.DENIED':
        case 'PAYMENT.CAPTURE.REVERSED':
        case 'CHECKOUT.ORDER.VOIDED': {
          const ppOrderId = this.extractOrderIdFromCaptureEvent(event)
            ?? event?.resource?.id;
          if (ppOrderId) await this.orders.markPaypalOrderFailed(ppOrderId);
          break;
        }
        case 'PAYMENT.CAPTURE.REFUNDED': {
          const ppOrderId = this.extractOrderIdFromCaptureEvent(event);
          if (ppOrderId) {
            const order = await this.orders.findByPaypalOrderId(ppOrderId);
            if (order && order.paymentStatus === PaymentStatus.PAID) {
              await this.orders.markRefunded(order.id);
            }
          }
          break;
        }
        default:
          break;
      }
    } catch (err: any) {
      this.logger.error(`Failed handling PayPal event ${type}: ${err.message}`, err.stack);
    }

    res.status(200).send({ received: true });
  }

  private extractOrderIdFromCaptureEvent(event: any): string | null {
    // PayPal sends the v2 order id under supplementary_data.related_ids.order_id
    const r = event?.resource;
    return r?.supplementary_data?.related_ids?.order_id
      ?? r?.custom_id
      ?? null;
  }

  private normalizeCurrency(symbolOrCode: string): string {
    const map: Record<string, string> = { '€': 'eur', '$': 'usd', '£': 'gbp' };
    return (map[symbolOrCode] ?? symbolOrCode).toLowerCase();
  }

  private toIsoCurrency(symbolOrCode: string): string {
    const map: Record<string, string> = { '€': 'EUR', '$': 'USD', '£': 'GBP' };
    return (map[symbolOrCode] ?? symbolOrCode).toUpperCase();
  }
}
