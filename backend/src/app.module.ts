import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CorrelationIdMiddleware } from './common/correlation-id.middleware';
import { HealthModule } from './modules/health/health.module';
import { CaptchaModule } from './modules/captcha/captcha.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD } from '@nestjs/core';
import { join } from 'path';
import { getDatabaseConfig } from './config/database.config';
import { BrandsModule } from './modules/brands/brands.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { ProductsModule } from './modules/products/products.module';
import { UsersModule } from './modules/users/users.module';
import { StockModule } from './modules/stock/stock.module';
import { UploadModule } from './modules/upload/upload.module';
import { AuthModule } from './modules/auth/auth.module';
import { AddressesModule } from './modules/addresses/addresses.module';
import { OrdersModule } from './modules/orders/orders.module';
import { EmailModule } from './modules/email/email.module';
import { FavoritesModule } from './modules/favorites/favorites.module';
import { PromoCodesModule } from './modules/promo-codes/promo-codes.module';
import { ShippingModule } from './modules/shipping/shipping.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { CarriersModule } from './modules/carriers/carriers.module';
import { InvoicesModule } from './modules/invoices/invoices.module';
import { ReturnsModule } from './modules/returns/returns.module';
import { LegalPagesModule } from './modules/legal-pages/legal-pages.module';
import { SeoModule } from './modules/seo/seo.module';
import { PrerenderModule } from './modules/prerender/prerender.module';
import { AccountDeletionModule } from './modules/account-deletion/account-deletion.module';
import { DataExportModule } from './modules/data-export/data-export.module';
import { SubProcessorsModule } from './modules/sub-processors/sub-processors.module';
import { NewsletterModule } from './modules/newsletter/newsletter.module';
import { AnalyticsTrackingModule } from './modules/analytics-tracking/analytics-tracking.module';
import { StorageModule } from './modules/storage/storage.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: getDatabaseConfig,
    }),
    // Only serve local uploads when no S3 driver is configured. In prod with
    // R2 the assets are fetched directly from the public bucket URL.
    ...(process.env.STORAGE_DRIVER === 's3'
      ? []
      : [
          ServeStaticModule.forRoot({
            rootPath: join(__dirname, '..', 'uploads'),
            serveRoot: '/uploads',
          }),
        ]),
    ThrottlerModule.forRoot([
      { ttl: 60_000, limit: 300 },
    ]),
    EmailModule,
    AuthModule,
    BrandsModule,
    CategoriesModule,
    ProductsModule,
    UsersModule,
    StockModule,
    UploadModule,
    AddressesModule,
    OrdersModule,
    FavoritesModule,
    PromoCodesModule,
    ShippingModule,
    PaymentsModule,
    CarriersModule,
    InvoicesModule,
    ReturnsModule,
    LegalPagesModule,
    SeoModule,
    PrerenderModule,
    AccountDeletionModule,
    DataExportModule,
    SubProcessorsModule,
    NewsletterModule,
    AnalyticsTrackingModule,
    StorageModule,
    HealthModule,
    CaptchaModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CorrelationIdMiddleware).forRoutes('*');
  }
}
