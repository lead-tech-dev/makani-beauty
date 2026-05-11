import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CarrierService, ShipmentRequest, ShipmentResult, CarrierCode, TrackingStatus } from './carrier.types';
import { LabelStorageService } from './label-storage.service';
import { buildMockTrackingStatus } from './mock-tracking';

const COLISSIMO_TRACKING_BASE = 'https://www.laposte.fr/outils/suivre-vos-envois?code=';
const COLISSIMO_REST_ENDPOINT = 'https://ws.colissimo.fr/sls-ws/SlsServiceWSRest/2.0/generateLabel';

@Injectable()
export class ColissimoCarrier implements CarrierService {
  readonly code: CarrierCode = 'colissimo';
  readonly displayName = 'Colissimo';

  private readonly logger = new Logger(ColissimoCarrier.name);
  private readonly contractNumber: string | undefined;
  private readonly password: string | undefined;
  private readonly mockMode: boolean;

  constructor(
    private readonly config: ConfigService,
    private readonly labels: LabelStorageService,
  ) {
    this.contractNumber = this.config.get<string>('COLISSIMO_CONTRACT_NUMBER') || undefined;
    this.password = this.config.get<string>('COLISSIMO_PASSWORD') || undefined;
    const explicitMock = (this.config.get<string>('COLISSIMO_MOCK') ?? '').toLowerCase() === 'true';
    this.mockMode = explicitMock || !this.contractNumber || !this.password;
    this.logger.log(
      this.mockMode
        ? 'Colissimo carrier in MOCK mode — generating fake tracking + PDFs'
        : 'Colissimo carrier in LIVE mode',
    );
  }

  get isAvailable(): boolean {
    return true; // mock mode is always available; live mode also when creds present
  }

  buildTrackingUrl(trackingNumber: string): string {
    return `${COLISSIMO_TRACKING_BASE}${encodeURIComponent(trackingNumber)}`;
  }

  async createShipment(req: ShipmentRequest): Promise<ShipmentResult> {
    if (this.mockMode) return this.createMockShipment(req);
    return this.createLiveShipment(req);
  }

  async getTrackingStatus(_trackingNumber: string, shippedAt?: Date): Promise<TrackingStatus> {
    // Live polling against La Poste's tracker would go here. The public
    // suivi-coliposte API is open but rate-limited and relies on scraping the
    // HTML response — deferred until it's actually needed in prod.
    return buildMockTrackingStatus(shippedAt);
  }

  // ── Mock ──────────────────────────────────────────────────

  private async createMockShipment(req: ShipmentRequest): Promise<ShipmentResult> {
    const trackingNumber = this.generateMockTrackingNumber();
    const pdf = await this.labels.buildMockLabel({
      carrier: 'Colissimo',
      trackingNumber,
      orderNumber: req.orderNumber,
      recipient: req.recipient,
      weightGrams: req.weightGrams,
    });
    const filename = `${req.orderNumber}-${trackingNumber}.pdf`;
    const labelUrl = await this.labels.save(filename, pdf);
    return {
      trackingNumber,
      trackingUrl: this.buildTrackingUrl(trackingNumber),
      labelUrl,
      carrier: this.code,
    };
  }

  /** Format approximant le n° Colissimo réel (13 caractères, suffix FR). */
  private generateMockTrackingNumber(): string {
    const digits = Math.floor(Math.random() * 10_000_000_000_0).toString().padStart(11, '0');
    return `9V${digits}FR`.slice(0, 13);
  }

  // ── Live ──────────────────────────────────────────────────

  private async createLiveShipment(req: ShipmentRequest): Promise<ShipmentResult> {
    const body = {
      contractNumber: this.contractNumber,
      password: this.password,
      outputFormat: { outputPrintingType: 'PDF_A4_300dpi' },
      letter: {
        service: {
          productCode: 'DOM',
          depositDate: new Date().toISOString().slice(0, 10),
        },
        parcel: { weight: (req.weightGrams / 1000).toFixed(3) },
        sender: {
          senderParcelRef: req.orderNumber,
          address: {
            companyName: 'Makani Cosmétique',
            line2: this.config.get<string>('PICKUP_LOCATION_LINE1') ?? '12 rue de la République',
            countryCode: 'FR',
            city: this.config.get<string>('PICKUP_LOCATION_CITY') ?? 'Aubervilliers',
            zipCode: this.config.get<string>('PICKUP_LOCATION_POSTAL') ?? '93300',
            email: this.config.get<string>('MAIL_FROM_ADDRESS') ?? 'no-reply@makani-cosmetique.com',
          },
        },
        addressee: {
          addresseeParcelRef: req.orderNumber,
          address: {
            lastName: req.recipient.fullName,
            line2: req.recipient.line1,
            line3: req.recipient.line2 ?? '',
            countryCode: this.toIsoCountry(req.recipient.country),
            city: req.recipient.city,
            zipCode: req.recipient.postalCode,
            phoneNumber: req.recipient.phone ?? '',
            email: req.recipient.email ?? '',
          },
        },
      },
    };

    const formData = new FormData();
    formData.append('content-type', new Blob(['application/json'], { type: 'text/plain' }));
    formData.append('letter', new Blob([JSON.stringify(body)], { type: 'application/json' }), 'letter');

    const res = await fetch(COLISSIMO_REST_ENDPOINT, { method: 'POST', body: formData as any });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      this.logger.error(`Colissimo REST returned ${res.status}: ${text.slice(0, 500)}`);
      throw new BadRequestException(`Colissimo a refusé la création de l envoi (${res.status})`);
    }

    // Multipart response: parse boundary, extract PDF and parcelNumber JSON.
    const contentType = res.headers.get('content-type') ?? '';
    const boundary = /boundary=([^;]+)/.exec(contentType)?.[1];
    if (!boundary) {
      throw new BadRequestException('Réponse Colissimo invalide (boundary manquant)');
    }

    const buffer = Buffer.from(await res.arrayBuffer());
    const parts = this.splitMultipart(buffer, `--${boundary}`);
    let pdf: Buffer | null = null;
    let trackingNumber: string | null = null;

    for (const part of parts) {
      const headerEnd = part.indexOf('\r\n\r\n');
      if (headerEnd < 0) continue;
      const headers = part.slice(0, headerEnd).toString('utf8');
      const payload = part.slice(headerEnd + 4);

      if (/Content-Type:\s*application\/pdf/i.test(headers)) {
        pdf = payload;
      } else if (/Content-Type:\s*application\/json/i.test(headers)) {
        try {
          const json = JSON.parse(payload.toString('utf8'));
          trackingNumber = json?.labelResponse?.parcelNumber ?? null;
        } catch { /* ignore */ }
      }
    }

    if (!pdf || !trackingNumber) {
      throw new BadRequestException('Réponse Colissimo incomplète (PDF ou n° de suivi manquant)');
    }

    const filename = `${req.orderNumber}-${trackingNumber}.pdf`;
    const labelUrl = await this.labels.save(filename, pdf);
    return {
      trackingNumber,
      trackingUrl: this.buildTrackingUrl(trackingNumber),
      labelUrl,
      carrier: this.code,
    };
  }

  private splitMultipart(buf: Buffer, boundary: string): Buffer[] {
    const sep = Buffer.from(boundary);
    const parts: Buffer[] = [];
    let start = buf.indexOf(sep);
    while (start >= 0) {
      const next = buf.indexOf(sep, start + sep.length);
      if (next < 0) break;
      // skip the boundary line itself + trailing CRLF
      const partStart = start + sep.length + 2; // \r\n
      const partEnd = next - 2; // \r\n before next boundary
      if (partEnd > partStart) parts.push(buf.subarray(partStart, partEnd));
      start = next;
    }
    return parts;
  }

  private toIsoCountry(name: string): string {
    const map: Record<string, string> = {
      france: 'FR', belgique: 'BE', allemagne: 'DE', espagne: 'ES',
      italie: 'IT', portugal: 'PT', luxembourg: 'LU', suisse: 'CH',
      'royaume-uni': 'GB', 'pays-bas': 'NL',
    };
    return map[name.trim().toLowerCase()] ?? name.toUpperCase().slice(0, 2);
  }
}
