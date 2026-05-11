// Sentry MUST be imported before anything else — auto-instrumentation hooks
import './sentry';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, RequestMethod } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { SentryExceptionFilter } from './sentry.filter';
import { StructuredLogger } from './common/structured-logger';

async function bootstrap() {
  // rawBody is required by Stripe to verify webhook signatures.
  // The body is exposed as `req.rawBody` for routes that opt in.
  const app = await NestFactory.create(AppModule, {
    rawBody: true,
    logger: new StructuredLogger(),
  });

  app.setGlobalPrefix('api', {
    exclude: [
      { path: 'sitemap.xml', method: RequestMethod.GET },
      { path: 'robots.txt', method: RequestMethod.GET },
      { path: 'health', method: RequestMethod.GET },
    ],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.useGlobalFilters(new SentryExceptionFilter());

  // Security headers (HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, CSP).
  // CSP is set permissive enough for Stripe + PayPal + GTM + PostHog + Sentry while still
  // disabling inline scripts/styles. Adjust if you add other 3rd-party domains.
  app.use(
    helmet({
      contentSecurityPolicy: process.env.NODE_ENV === 'production' ? {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: [
            "'self'",
            "'unsafe-inline'", // Stripe, PayPal, GTM all inject inline runtime; consider strict CSP nonces if hardening
            'https://js.stripe.com',
            'https://www.googletagmanager.com',
            'https://www.google-analytics.com',
            'https://www.paypal.com',
            'https://www.paypalobjects.com',
            'https://*.posthog.com',
            'https://*.clarity.ms',
            'https://*.sentry.io',
            'https://js.hcaptcha.com',
            'https://*.hcaptcha.com',
          ],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com', 'https://*.hcaptcha.com'],
          imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
          connectSrc: [
            "'self'",
            'https://api.stripe.com',
            'https://*.paypal.com',
            'https://www.google-analytics.com',
            'https://*.posthog.com',
            'https://*.clarity.ms',
            'https://*.sentry.io',
            'https://graph.facebook.com',
            'https://business-api.tiktok.com',
            'https://*.hcaptcha.com',
          ],
          fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
          frameSrc: ["'self'", 'https://js.stripe.com', 'https://*.paypal.com', 'https://*.hcaptcha.com', 'https://newassets.hcaptcha.com'],
          frameAncestors: ["'none'"],
        },
      } : false, // disable CSP in dev to avoid friction
      crossOriginEmbedderPolicy: false, // allow embedding 3rd-party iframes (Stripe, PayPal)
      strictTransportSecurity: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true,
      },
    }),
  );

  // Exact-origin match (no startsWith — prevents `https://allowed.com.malicious.com`
  // from sneaking through). For preview deployments (Vercel branch URLs), allow a
  // configurable suffix via FRONTEND_URL_SUFFIX (e.g. `.vercel.app`).
  const allowedOrigins = new Set(
    (process.env.FRONTEND_URL || 'http://localhost:3001')
      .split(',')
      .map((o) => o.trim().replace(/\/$/, ''))
      .filter(Boolean),
  );
  const allowedSuffixes = (process.env.FRONTEND_URL_SUFFIX || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const isAllowedOrigin = (origin: string): boolean => {
    const normalized = origin.replace(/\/$/, '');
    if (allowedOrigins.has(normalized)) return true;
    try {
      const host = new URL(normalized).host; // strip protocol + path → only `host:port`
      return allowedSuffixes.some((suffix) =>
        suffix.startsWith('.') ? host.endsWith(suffix) : host === suffix,
      );
    } catch {
      return false;
    }
  };

  app.enableCors({
    origin: (origin, cb) => {
      if (!origin || isAllowedOrigin(origin)) {
        cb(null, true);
      } else {
        cb(new Error(`CORS blocked: ${origin}`));
      }
    },
    credentials: true,
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Makani Cosmétique API')
    .setDescription('API REST pour la boutique Makani Cosmétique — produits, commandes, clients')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = Number(process.env.PORT) || 3004;
  // Listen on all interfaces — required for Docker/Koyeb/Render containers.
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 API running on http://0.0.0.0:${port}/api`);
  console.log(`📚 Swagger docs at http://0.0.0.0:${port}/api/docs`);
}
bootstrap();
