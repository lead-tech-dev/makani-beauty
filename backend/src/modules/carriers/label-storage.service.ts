import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class LabelStorageService {
  private readonly logger = new Logger(LabelStorageService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly storage: StorageService,
  ) {}

  /**
   * Persist a PDF buffer under labels/<filename>.pdf and return the publicly
   * retrievable URL. Storage backend depends on STORAGE_DRIVER (filesystem in
   * dev, R2/S3 in prod).
   */
  async save(filename: string, pdf: Buffer | Uint8Array): Promise<string> {
    const safe = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const key = `labels/${safe}`;
    const body = Buffer.isBuffer(pdf) ? pdf : Buffer.from(pdf);
    return this.storage.put(key, body, 'application/pdf');
  }

  /**
   * Concatenate several stored label PDFs into a single PDF buffer.
   * Used by the admin "batch print" feature.
   */
  async concatenate(labelUrls: string[]): Promise<Uint8Array> {
    const merged = await PDFDocument.create();
    for (const url of labelUrls) {
      try {
        const key = this.storage.keyFromUrl(url);
        const buf = await this.storage.get(key);
        const src = await PDFDocument.load(buf);
        const pages = await merged.copyPages(src, src.getPageIndices());
        pages.forEach((p) => merged.addPage(p));
      } catch (err: any) {
        this.logger.warn(`Skipping label ${url}: ${err.message}`);
      }
    }
    return merged.save();
  }

  /**
   * Generate a development-friendly PDF that mimics a real shipping label.
   * Used when a carrier runs in mock mode.
   */
  async buildMockLabel(opts: {
    carrier: string;
    trackingNumber: string;
    orderNumber: string;
    recipient: {
      fullName: string;
      line1: string;
      line2?: string;
      postalCode: string;
      city: string;
      country: string;
    };
    weightGrams: number;
  }): Promise<Uint8Array> {
    const pdf = await PDFDocument.create();
    const page = pdf.addPage([400, 600]);
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

    const { width, height } = page.getSize();
    const green = rgb(0.04, 0.24, 0.19);
    const grey = rgb(0.4, 0.4, 0.4);

    page.drawRectangle({ x: 0, y: height - 60, width, height: 60, color: green });
    page.drawText('FEELING BEAUTY', { x: 20, y: height - 38, size: 18, font: bold, color: rgb(1, 1, 1) });
    page.drawText('Bordereau d expédition (DEV / MOCK)', { x: 20, y: height - 55, size: 9, font, color: rgb(1, 1, 1) });

    let y = height - 90;
    const writeLine = (label: string, value: string, options: { boldValue?: boolean; size?: number } = {}) => {
      page.drawText(label, { x: 20, y, size: 9, font, color: grey });
      page.drawText(value, { x: 20, y: y - 14, size: options.size ?? 12, font: options.boldValue ? bold : font, color: rgb(0, 0, 0) });
      y -= 36;
    };

    writeLine('TRANSPORTEUR', opts.carrier.toUpperCase(), { boldValue: true, size: 14 });
    writeLine('NUMÉRO DE SUIVI', opts.trackingNumber, { boldValue: true, size: 16 });
    writeLine('COMMANDE', opts.orderNumber, { boldValue: true });
    writeLine('POIDS', `${opts.weightGrams} g`);

    page.drawLine({ start: { x: 20, y }, end: { x: width - 20, y }, color: grey, thickness: 0.5 });
    y -= 24;

    page.drawText('DESTINATAIRE', { x: 20, y, size: 9, font, color: grey });
    y -= 14;
    page.drawText(opts.recipient.fullName, { x: 20, y, size: 12, font: bold });
    y -= 16;
    page.drawText(opts.recipient.line1, { x: 20, y, size: 11, font });
    y -= 14;
    if (opts.recipient.line2) {
      page.drawText(opts.recipient.line2, { x: 20, y, size: 11, font });
      y -= 14;
    }
    page.drawText(`${opts.recipient.postalCode} ${opts.recipient.city}`, { x: 20, y, size: 11, font });
    y -= 14;
    page.drawText(opts.recipient.country, { x: 20, y, size: 11, font });

    // Mock barcode visual (not a real Code128) — purely decorative.
    const barcodeY = 60;
    const barcodeWidth = width - 40;
    const seed = opts.trackingNumber.split('').reduce((s, c) => s + c.charCodeAt(0), 0);
    let x = 20;
    while (x < 20 + barcodeWidth) {
      const bw = ((seed + x) % 6) + 1;
      page.drawRectangle({ x, y: barcodeY, width: bw, height: 50, color: rgb(0, 0, 0) });
      x += bw + 2;
    }
    page.drawText(opts.trackingNumber, { x: 20, y: barcodeY - 14, size: 10, font: bold });

    return pdf.save();
  }
}
