import { Module } from '@nestjs/common';
import { CarrierRegistryService } from './carrier-registry.service';
import { ColissimoCarrier } from './colissimo.carrier';
import { LabelStorageService } from './label-storage.service';

@Module({
  providers: [LabelStorageService, ColissimoCarrier, CarrierRegistryService],
  exports: [CarrierRegistryService, LabelStorageService],
})
export class CarriersModule {}
