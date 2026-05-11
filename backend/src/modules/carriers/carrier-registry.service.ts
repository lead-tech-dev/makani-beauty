import { Injectable, BadRequestException } from '@nestjs/common';
import { CarrierService, CarrierCode } from './carrier.types';
import { ColissimoCarrier } from './colissimo.carrier';

@Injectable()
export class CarrierRegistryService {
  private readonly carriers: Map<CarrierCode, CarrierService>;

  constructor(
    private readonly colissimo: ColissimoCarrier,
  ) {
    this.carriers = new Map<CarrierCode, CarrierService>([
      [colissimo.code, colissimo],
    ]);
  }

  list(): { code: CarrierCode; displayName: string; isAvailable: boolean }[] {
    return [...this.carriers.values()].map((c) => ({
      code: c.code,
      displayName: c.displayName,
      isAvailable: c.isAvailable,
    }));
  }

  get(code: CarrierCode): CarrierService {
    const carrier = this.carriers.get(code);
    if (!carrier) throw new BadRequestException(`Transporteur inconnu : ${code}`);
    if (!carrier.isAvailable) throw new BadRequestException(`Transporteur indisponible : ${code}`);
    return carrier;
  }

  /**
   * Returns the configured tracking URL for a given carrier code, or null
   * if we don't know how to build one (e.g. legacy data without carrier).
   */
  buildTrackingUrl(code: string | null | undefined, trackingNumber: string): string | null {
    if (!code) return null;
    const carrier = this.carriers.get(code as CarrierCode);
    return carrier ? carrier.buildTrackingUrl(trackingNumber) : null;
  }
}
