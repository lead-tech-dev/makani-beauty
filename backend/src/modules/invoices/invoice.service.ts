import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { mkdir, writeFile, readFile } from 'fs/promises';
import { join } from 'path';
import { PDFDocument, PDFFont, StandardFonts, rgb, RGB } from 'pdf-lib';
import { Invoice } from './invoice.entity';
import { Order } from '../orders/order.entity';
import { OrderItem } from '../orders/order-item.entity';
import { User } from '../users/user.entity';

const STORAGE_DIR = 'storage/invoices';

interface VendorInfo {
  name: string;
  line1: string;
  postalCity: string;
  country: string;
  siret?: string;
  vatNumber?: string;
  email?: string;
  phone?: string;
  legalFooter?: string;
}

@Injectable()
export class InvoiceService {
  private readonly logger = new Logger(InvoiceService.name);

  constructor(
    @InjectRepository(Invoice) private readonly repo: Repository<Invoice>,
    @InjectRepository(Order) private readonly orderRepo: Repository<Order>,
    @InjectRepository(OrderItem) private readonly itemRepo: Repository<OrderItem>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    private readonly dataSource: DataSource,
    private readonly config: ConfigService,
  ) {}

  /** Find an existing invoice for an order, or null. */
  async findByOrderId(orderId: string): Promise<Invoice | null> {
    return this.repo.findOne({ where: { orderId } });
  }

  /** Read the persisted PDF buffer for an invoice. */
  async readPdf(invoice: Invoice): Promise<Buffer> {
    return readFile(invoice.pdfPath);
  }

  /**
   * Idempotent : if an invoice already exists for this order, return it.
   * Otherwise allocate the next sequence atomically, render the PDF, persist.
   */
  async createForOrder(orderId: string): Promise<Invoice> {
    const existing = await this.findByOrderId(orderId);
    if (existing) return existing;

    const order = await this.orderRepo.findOne({ where: { id: orderId } });
    if (!order) throw new NotFoundException(`Order ${orderId} not found`);
    const items = order.items?.length
      ? order.items
      : await this.itemRepo.find({ where: { orderId } });
    const user = await this.userRepo.findOne({ where: { id: order.userId } });

    const year = new Date().getFullYear();

    // Atomic sequence allocation per year — wraps everything in a transaction
    // and locks the relevant rows. Idempotency check inside the transaction
    // prevents two concurrent calls from both creating an invoice.
    return this.dataSource.transaction(async (manager) => {
      const dup = await manager.findOne(Invoice, { where: { orderId } });
      if (dup) return dup;

      // Atomic per-year sequence allocation via UPSERT — no FOR UPDATE needed,
      // the row-level lock implicit in INSERT/UPDATE ON CONFLICT is sufficient.
      const seqRows = await manager.query(
        `INSERT INTO invoice_counters (year, "lastSequence")
           VALUES ($1, 1)
           ON CONFLICT (year) DO UPDATE
             SET "lastSequence" = invoice_counters."lastSequence" + 1
           RETURNING "lastSequence"`,
        [year],
      );
      const sequence = Number(seqRows?.[0]?.lastSequence ?? 1);
      const number = `F-${year}-${String(sequence).padStart(4, '0')}`;
      const issuedAt = new Date();

      const pdfBytes = await this.renderPdf(order, items, user, number, issuedAt);
      const pdfPath = await this.savePdf(`${number}.pdf`, pdfBytes);

      const invoice = manager.create(Invoice, {
        orderId, year, sequence, number, issuedAt, pdfPath,
      });
      return manager.save(Invoice, invoice);
    });
  }

  // ── PDF rendering ────────────────────────────────────────

  private vendor(): VendorInfo {
    return {
      name: this.config.get<string>('INVOICE_COMPANY_NAME') ?? 'Makani Cosmétique',
      line1: this.config.get<string>('INVOICE_COMPANY_ADDRESS_LINE1') ?? '',
      postalCity: this.config.get<string>('INVOICE_COMPANY_POSTAL_CITY') ?? '',
      country: this.config.get<string>('INVOICE_COMPANY_COUNTRY') ?? 'France',
      siret: this.config.get<string>('INVOICE_COMPANY_SIRET') || undefined,
      vatNumber: this.config.get<string>('INVOICE_COMPANY_VAT_NUMBER') || undefined,
      email: this.config.get<string>('INVOICE_COMPANY_EMAIL') || undefined,
      phone: this.config.get<string>('INVOICE_COMPANY_PHONE') || undefined,
      legalFooter: this.config.get<string>('INVOICE_LEGAL_FOOTER') || undefined,
    };
  }

  private async savePdf(filename: string, bytes: Uint8Array): Promise<string> {
    await mkdir(STORAGE_DIR, { recursive: true });
    const safe = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = join(STORAGE_DIR, safe);
    await writeFile(path, bytes);
    return path;
  }

  private async renderPdf(
    order: Order,
    items: OrderItem[],
    user: User | null,
    invoiceNumber: string,
    issuedAt: Date,
  ): Promise<Uint8Array> {
    const pdf = await PDFDocument.create();
    const page = pdf.addPage([595, 842]); // A4
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

    const v = this.vendor();
    const snap = (order.shippingSnapshot ?? {}) as any;
    const customerName = snap.fullName ?? user?.fullName ?? 'Client';
    const customerLine1 = snap.line1 ?? '';
    const customerLine2 = snap.line2 ? `, ${snap.line2}` : '';
    const customerCity = `${snap.postalCode ?? ''} ${snap.city ?? ''}`.trim();
    const customerCountry = snap.country ?? '';

    const green = rgb(0.04, 0.24, 0.19);
    const grey = rgb(0.42, 0.42, 0.42);
    const black = rgb(0, 0, 0);
    const lightGrey = rgb(0.94, 0.92, 0.89);

    const M = 48; // margin
    const W = 595 - 2 * M;
    let y = 842 - 56;

    // Header band
    page.drawRectangle({ x: 0, y: 842 - 56, width: 595, height: 56, color: green });
    page.drawText(v.name, { x: M, y: 842 - 36, size: 18, font: bold, color: rgb(1, 1, 1) });
    const headerRight = `Facture ${invoiceNumber}`;
    const hrW = bold.widthOfTextAtSize(headerRight, 13);
    page.drawText(headerRight, {
      x: 595 - M - hrW, y: 842 - 34, size: 13, font: bold, color: rgb(1, 1, 1),
    });

    y -= 36; // below header

    // Vendor block (left) + invoice info (right)
    drawText(page, font, 9, grey, M, y, 'ÉMETTEUR');
    drawText(page, bold, 11, black, M, y - 14, v.name);
    drawText(page, font, 10, grey, M, y - 28, v.line1);
    drawText(page, font, 10, grey, M, y - 42, `${v.postalCity}, ${v.country}`);
    if (v.siret) drawText(page, font, 9, grey, M, y - 58, `SIRET : ${v.siret}`);
    if (v.vatNumber) drawText(page, font, 9, grey, M, y - 70, `TVA Intra : ${v.vatNumber}`);
    if (v.email) drawText(page, font, 9, grey, M, y - 82, v.email);
    if (v.phone) drawText(page, font, 9, grey, M, y - 94, v.phone);

    // Right column — invoice meta
    const rightX = 595 - M - 200;
    drawText(page, font, 9, grey, rightX, y, 'NUMÉRO');
    drawText(page, bold, 12, black, rightX, y - 14, invoiceNumber);
    drawText(page, font, 9, grey, rightX, y - 32, 'DATE D ÉMISSION');
    drawText(page, bold, 11, black, rightX, y - 46, formatDate(issuedAt));
    drawText(page, font, 9, grey, rightX, y - 64, 'COMMANDE');
    drawText(page, bold, 11, black, rightX, y - 78, order.orderNumber);

    y -= 130;

    // Customer block
    drawText(page, font, 9, grey, M, y, 'CLIENT');
    drawText(page, bold, 11, black, M, y - 14, customerName);
    drawText(page, font, 10, grey, M, y - 28, `${customerLine1}${customerLine2}`);
    drawText(page, font, 10, grey, M, y - 42, customerCity);
    drawText(page, font, 10, grey, M, y - 56, customerCountry);
    if (user?.email) drawText(page, font, 9, grey, M, y - 72, user.email);

    y -= 110;

    // Items table header
    page.drawRectangle({ x: M, y: y - 4, width: W, height: 22, color: lightGrey });
    drawText(page, bold, 9, black, M + 8, y + 4, 'DÉSIGNATION');
    drawText(page, bold, 9, black, M + 280, y + 4, 'QTÉ');
    drawText(page, bold, 9, black, M + 320, y + 4, 'PU HT');
    drawText(page, bold, 9, black, M + 380, y + 4, 'TVA');
    drawText(page, bold, 9, black, M + 420, y + 4, 'TOTAL HT');
    const totalTtcLabelW = bold.widthOfTextAtSize('TOTAL TTC', 9);
    drawText(page, bold, 9, black, M + W - 8 - totalTtcLabelW, y + 4, 'TOTAL TTC');
    y -= 24;

    // Tax math: prices on order are stored TTC; reverse-calc HT
    const taxRate = Number(order.taxRate ?? 0);
    const taxFactor = taxRate > 0 ? (100 + taxRate) / 100 : 1;

    let totalHT = 0;
    let totalTTC = 0;

    for (const item of items) {
      const lineTtc = Number(item.subtotal);
      const unitTtc = Number(item.unitPrice);
      const unitHt = unitTtc / taxFactor;
      const lineHt = lineTtc / taxFactor;
      totalHT += lineHt;
      totalTTC += lineTtc;

      const productName = truncate(item.productName, 40);
      drawText(page, font, 9, black, M + 8, y, productName);
      drawText(page, font, 9, black, M + 280, y, String(item.quantity));
      drawText(page, font, 9, black, M + 320, y, fmtMoney(unitHt));
      drawText(page, font, 9, black, M + 380, y, taxRate > 0 ? `${taxRate.toFixed(0)}%` : '—');
      drawText(page, font, 9, black, M + 420, y, fmtMoney(lineHt));
      const ttcStr = fmtMoney(lineTtc);
      const ttcW = font.widthOfTextAtSize(ttcStr, 9);
      drawText(page, font, 9, black, M + W - 8 - ttcW, y, ttcStr);
      y -= 18;

      if (y < 220) break; // crude overflow protection — single-page invoices only for now
    }

    // Subtotal lines
    const shippingFee = Number(order.shippingFee);
    const discount = Number(order.discountAmount ?? 0);
    const grandTtc = Number(order.total);
    const taxAmount = Number(order.taxAmount ?? 0);

    y -= 12;
    page.drawLine({ start: { x: M, y: y + 6 }, end: { x: M + W, y: y + 6 }, thickness: 0.5, color: grey });
    y -= 6;

    const drawSummaryRow = (label: string, value: string, opts: { boldRow?: boolean; color?: RGB } = {}) => {
      const f = opts.boldRow ? bold : font;
      const c = opts.color ?? black;
      drawText(page, f, 10, c, M + 320, y, label);
      const w = f.widthOfTextAtSize(value, 10);
      drawText(page, f, 10, c, M + W - 8 - w, y, value);
      y -= 16;
    };

    drawSummaryRow('Sous-total HT', fmtMoney(totalHT));
    if (shippingFee > 0) {
      const shippingHt = shippingFee / taxFactor;
      drawSummaryRow('Livraison HT', fmtMoney(shippingHt));
    }
    if (discount > 0) {
      drawSummaryRow(`Remise${order.discountCode ? ` (${order.discountCode})` : ''}`, `−${fmtMoney(discount / taxFactor)}`, { color: rgb(0.04, 0.4, 0.25) });
    }
    if (taxAmount > 0) {
      drawSummaryRow(`TVA ${taxRate.toFixed(0)}%`, fmtMoney(taxAmount));
    }
    y -= 4;
    page.drawLine({ start: { x: M + 280, y: y + 8 }, end: { x: M + W, y: y + 8 }, thickness: 0.7, color: black });
    drawSummaryRow('TOTAL TTC', `${fmtMoney(grandTtc)}`, { boldRow: true });

    // Payment block
    y -= 10;
    drawText(page, font, 9, grey, M, y, 'PAIEMENT');
    const provider = order.paymentProvider === 'paypal' ? 'PayPal' : (order.paymentProvider === 'stripe' ? 'Carte bancaire (Stripe)' : 'Paiement en ligne');
    const paidAt = order.paidAt ? formatDate(order.paidAt) : '—';
    drawText(page, font, 10, black, M, y - 14, `${provider} · payée le ${paidAt}`);

    // Legal footer
    const footerY = 56;
    if (v.legalFooter) {
      const lines = wrap(v.legalFooter, 95);
      let fy = footerY + (lines.length - 1) * 11;
      for (const line of lines) {
        drawText(page, font, 8, grey, M, fy, line);
        fy -= 11;
      }
    }
    if (!v.vatNumber) {
      // Mention obligatoire si non assujetti à la TVA
      drawText(page, font, 8, grey, M, footerY - 14, 'TVA non applicable, art. 293 B du CGI');
    }

    return pdf.save();
  }
}

// ── helpers ─────────────────────────────────────────────────

function drawText(page: any, font: PDFFont, size: number, color: RGB, x: number, y: number, text: string) {
  page.drawText(text ?? '', { x, y, size, font, color });
}

function fmtMoney(n: number): string {
  // Force French locale formatting to match the rest of the UI
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 })
    .format(n)
    .replace(/ |\xa0/g, ' '); // PDF-friendly space
}

function formatDate(d: Date): string {
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(d);
}

function truncate(s: string, max: number): string {
  return s.length <= max ? s : `${s.slice(0, max - 1)}…`;
}

function wrap(text: string, maxChars: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = '';
  for (const w of words) {
    if ((line + ' ' + w).trim().length > maxChars) {
      if (line) lines.push(line);
      line = w;
    } else {
      line = line ? `${line} ${w}` : w;
    }
  }
  if (line) lines.push(line);
  return lines;
}
