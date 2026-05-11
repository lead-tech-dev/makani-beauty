import { Global, Module } from '@nestjs/common';
import { GA4Service } from './ga4.service';
import { MetaCapiService } from './meta/meta-capi.service';
import { TikTokEventsService } from './tiktok/tiktok-events.service';

@Global()
@Module({
  providers: [GA4Service, MetaCapiService, TikTokEventsService],
  exports: [GA4Service, MetaCapiService, TikTokEventsService],
})
export class AnalyticsTrackingModule {}
