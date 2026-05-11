# Configuration production — Makani Cosmétique

> Toutes les variables d'environnement et services tiers à configurer
> avant la mise en ligne. Les valeurs en `[brackets]` sont des
> placeholders — à remplacer par tes vraies valeurs.

---

## 1. Backend — `backend/.env` (production)

### 1.1 Application
```bash
NODE_ENV=production
PORT=3004
FRONTEND_URL=https://makani-cosmetique.com,https://www.makani-cosmetique.com
SITE_URL=https://makani-cosmetique.com
```

### 1.2 Base de données (Postgres)
```bash
DB_HOST=[host-db-managé]                 # ex: ep-cool-meadow-12345.eu-west-2.aws.neon.tech
DB_PORT=5432
DB_USERNAME=makani_user
DB_PASSWORD=[mot-de-passe-fort-32-chars] # openssl rand -base64 32
DB_NAME=makani_cosmetique
```

### 1.3 JWT (auth tokens)
```bash
JWT_SECRET=[secret-aléatoire-≥-64-chars] # openssl rand -base64 64
```

### 1.4 SMTP — emails transactionnels
**Choisir un fournisseur** : [Resend](https://resend.com) (recommandé), Brevo, SendGrid, Mailtrap.

```bash
SMTP_HOST=smtp.resend.com               # ou smtp.brevo.com / smtp.sendgrid.net
SMTP_PORT=587                           # 587 STARTTLS, ou 465 SSL
SMTP_USER=[user-fourni-par-le-prestataire]
SMTP_PASS=[clé-API-fournie-par-le-prestataire]
MAIL_FROM_ADDRESS=no-reply@makani-cosmetique.com
MAIL_FROM_NAME=Makani Cosmétique
```

### 1.5 Stripe (paiement CB / Apple Pay / Google Pay)
1. Créer un compte sur https://stripe.com — KYC entreprise (~24h)
2. Récupérer les clés **live** depuis le dashboard
3. Configurer un webhook → `https://api.makani-cosmetique.com/api/payments/stripe/webhook` avec les events `payment_intent.succeeded`, `payment_intent.payment_failed`

```bash
STRIPE_SECRET_KEY=sk_live_[…]
STRIPE_PUBLISHABLE_KEY=pk_live_[…]      # aussi exposé côté frontend
STRIPE_WEBHOOK_SECRET=whsec_[…]
```

### 1.6 PayPal
1. Créer un compte business sur https://developer.paypal.com → app live
2. Configurer un webhook → `https://api.makani-cosmetique.com/api/payments/paypal/webhook`

```bash
PAYPAL_CLIENT_ID=[…]
PAYPAL_CLIENT_SECRET=[…]
PAYPAL_MODE=live                        # ou "sandbox" pour tests
PAYPAL_WEBHOOK_ID=[…]
```

### 1.7 hCaptcha (anti-spam sur signup, contact, newsletter)
1. Créer un compte sur https://www.hcaptcha.com
2. Site Key publique → exposée côté frontend
3. Secret → backend uniquement

```bash
HCAPTCHA_SECRET=[…]
HCAPTCHA_SITE_KEY=[…]                   # aussi exposé frontend
```

### 1.8 Google OAuth (login Google)
1. Créer un projet sur https://console.cloud.google.com → OAuth 2.0 client ID
2. Authorized redirect URI : `https://api.makani-cosmetique.com/api/auth/google/callback`

```bash
GOOGLE_CLIENT_ID=[…].apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=[…]
GOOGLE_CALLBACK_URL=https://api.makani-cosmetique.com/api/auth/google/callback
```

### 1.9 Identité juridique (factures, mentions légales)
```bash
INVOICE_COMPANY_NAME=Makani Cosmétique SAS
INVOICE_COMPANY_SIRET=[14-chiffres]
INVOICE_COMPANY_VAT_NUMBER=FR[xxxxxxxxxxx]
INVOICE_COMPANY_EMAIL=contact@makani-cosmetique.com
INVOICE_COMPANY_PHONE=+33 7 66 33 12 26
INVOICE_COMPANY_POSTAL_CITY=93300 Aubervilliers
INVOICE_COMPANY_COUNTRY=France
INVOICE_LEGAL_FOOTER=SAS au capital de [montant] € · RCS [ville] [n° RCS]
```

### 1.10 Boutique physique (Click & Collect)
```bash
PICKUP_LOCATION_CITY=Aubervilliers
PICKUP_LOCATION_POSTAL=93300
```

### 1.11 Colissimo (étiquettes d'expédition)
1. Souscrire un contrat Colissimo entreprise
2. Récupérer le numéro de contrat + mot de passe API

```bash
COLISSIMO_CONTRACT_NUMBER=[…]
COLISSIMO_PASSWORD=[…]
COLISSIMO_MOCK=false                    # false en prod, true en dev
```

### 1.12 Brevo (newsletter contacts list)
*Optionnel* — synchronise les abonnés newsletter avec une liste Brevo pour les campagnes.

```bash
BREVO_API_KEY=[xkeysib-…]
BREVO_NEWSLETTER_LIST_ID=[id-numérique-liste-brevo]
```

### 1.13 Sentry (error tracking)
1. Créer un projet **NestJS** sur https://sentry.io → DSN

```bash
SENTRY_DSN=https://[…]@sentry.io/[…]
SENTRY_RELEASE=makani@1.0.0             # synchroniser avec git tag
```

### 1.14 Monitoring alertes admin (stock alerts)
```bash
ADMIN_ALERT_EMAIL=admin@makani-cosmetique.com
ADMIN_ALERTS_ENABLED=true
ADMIN_ALERTS_QUIET=22:00-08:00          # heures sans alertes (Europe/Paris)
```

### 1.15 Tracking conversions (Meta Pixel + TikTok Pixel server-side)
*Optionnel pour ads Facebook/Instagram et TikTok Ads.*
```bash
META_PIXEL_ID=[…]
META_CAPI_ACCESS_TOKEN=[…]
META_TEST_EVENT_CODE=                    # vide en prod
TIKTOK_PIXEL_CODE=[…]
TIKTOK_ACCESS_TOKEN=[…]
TIKTOK_TEST_EVENT_CODE=
```

---

## 2. Frontend — `frontend/.env.production`

```bash
REACT_APP_API_URL=https://api.makani-cosmetique.com/api
REACT_APP_SITE_URL=https://makani-cosmetique.com

# Sentry (frontend errors)
REACT_APP_SENTRY_DSN=https://[…]@sentry.io/[…]
REACT_APP_SENTRY_RELEASE=makani@1.0.0

# Google Tag Manager (analytics, ads pixels)
REACT_APP_GTM_CONTAINER_ID=GTM-XXXXXXX

# Stripe (clé publique seulement)
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_live_[…]

# hCaptcha (clé publique)
REACT_APP_HCAPTCHA_SITE_KEY=[…]

# WhatsApp business
REACT_APP_WHATSAPP_NUMBER=33766331226
REACT_APP_WHATSAPP_DEFAULT_MESSAGE=Bonjour Makani, j'ai une question concernant…

# Tarifs livraison affichés (cohérents avec les ShippingZones backend)
REACT_APP_EXPRESS_SURCHARGE=4.50
REACT_APP_RELAY_RATE=3.99
```

---

## 3. Domaine + DNS

### 3.1 Achat
- `makani-cosmetique.com` (recommandé) chez OVH / Gandi / Namecheap
- Optionnel : `makani-cosmetique.fr` en redirect

### 3.2 DNS records
```
A      @      [IP-vercel-ou-host-frontend]
CNAME  www    cname.vercel-dns.com.
CNAME  api    [host-backend].[render|railway|fly].dev
MX     @      10 mxa.[email-provider].com
MX     @      20 mxb.[email-provider].com
TXT    @      "v=spf1 include:_spf.[provider].com ~all"
TXT    [dkim-selector]._domainkey   "v=DKIM1; k=rsa; p=…"
TXT    _dmarc  "v=DMARC1; p=quarantine; rua=mailto:dmarc@makani-cosmetique.com"
```

### 3.3 Boîtes mail
Provider : Google Workspace / Zoho / ProtonMail / OVH Pro
- `hello@makani-cosmetique.com` — service client
- `contact@makani-cosmetique.com` — alias hello
- `no-reply@makani-cosmetique.com` — sender transactionnel
- `dpo@makani-cosmetique.com` — RGPD
- `admin@makani-cosmetique.com` — équipe technique

### 3.4 SSL
- Vercel / Render gèrent Let's Encrypt automatiquement
- Sinon : Caddy / Traefik / Cloudflare

---

## 4. Hébergement — choix recommandés

| Composant | Choix recommandé | Alternative |
|---|---|---|
| Frontend (CRA) | **Vercel** | Netlify, Cloudflare Pages |
| Backend (NestJS) | **Render** | Railway, Fly.io, Scaleway Serverless |
| Postgres | **Neon** (free tier généreux) | Supabase, Render Postgres, Scaleway |
| Storage uploads | **Cloudinary** ou **S3 + Cloudfront** | Vercel Blob, Backblaze B2 |
| Email transactionnel | **Resend** | Brevo, SendGrid, Mailgun |
| Email business | **Google Workspace** | Zoho, ProtonMail, OVH |
| Domain registrar | **OVH** ou **Gandi** | Namecheap, Cloudflare Registrar |
| Monitoring | **Sentry** + **Better Uptime** | Logtail, New Relic |
| Analytics | **GA4** + **Plausible** | Matomo, PostHog |

---

## 5. Secrets CI/CD (GitHub Actions)

Ajouter dans **Repository → Settings → Secrets and variables → Actions** :

```
VERCEL_TOKEN
VERCEL_ORG_ID
VERCEL_PROJECT_ID
RENDER_API_KEY                # ou RAILWAY_TOKEN selon hébergeur
DATABASE_URL                  # pour migrations en CI si besoin
SENTRY_AUTH_TOKEN             # release tracking
SENTRY_ORG=makani
SENTRY_PROJECT=makani-cosmetique
SLACK_WEBHOOK_URL             # alerte deploy (optionnel)
```

---

## 6. Configuration interne (admin Makani)

Une fois le seed initial lancé, te connecter en admin et configurer :

- `/admin/legal-pages/cgv` — remplir `[Raison sociale]`, `[forme juridique]`, `[capital]`, `[SIRET]`, `[N° TVA]`, `[téléphone]`, `[ville]`, `[adresse complète]`, `[médiateur]`
- `/admin/legal-pages/mentions-legales` — directeur de la publication, hébergeur
- `/admin/legal-pages/confidentialite` — DPO et email RGPD
- `/admin/legal-pages/livraison-retours` — relire l'adresse de retour
- `/admin/sub-processors` — ajuster la liste selon les vrais sous-traitants signés
- `/admin/shipping-zones` — vérifier les seuils de livraison gratuite par zone
- `/admin/promo-codes` — créer ou valider `WELCOME5`
- `/admin/users` — changer le mot de passe `admin1234` IMMÉDIATEMENT
- `/admin/categories` — uploader les vraies images (remplacer les AI génériques)
- `/admin/products` — charger le vrai catalogue (créer les produits, ajouter variantes pour vêtements/mèches)

---

## 7. Données à purger avant mise en ligne

Données héritées du fork feeling-beauty à supprimer :

```sql
-- Connexion : docker exec -it makani_cosmetique_db psql -U makani_user -d makani_cosmetique
DELETE FROM users WHERE email LIKE '%@test.com';
DELETE FROM users WHERE email IN (
  'admin@feeling-beauty.com',
  'admin@makani-beauty.com',
  'ericmaximan@gmail.com'
);
TRUNCATE TABLE
  refresh_tokens,
  password_reset_tokens,
  email_verification_tokens,
  favorites,
  stock_movements,
  invoices,
  invoice_counters,
  return_requests,
  shipment_events,
  shared_wishlists,
  deletion_requests,
  newsletter_subscribers,
  order_items,
  orders,
  addresses
RESTART IDENTITY CASCADE;
```

---

## 8. Variables d'environnement — récap minimum vital

**Sans ces 12 vars, le site ne fonctionne pas en prod** :

1. `NODE_ENV=production`
2. `FRONTEND_URL`
3. `DB_HOST`, `DB_PASSWORD`, `DB_NAME`
4. `JWT_SECRET`
5. `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`
6. `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
7. `MAIL_FROM_ADDRESS`
8. *Frontend* : `REACT_APP_API_URL`, `REACT_APP_STRIPE_PUBLISHABLE_KEY`

Le reste (Sentry, hCaptcha, Google OAuth, PayPal, Brevo, Meta Pixel, Colissimo) est important mais le site marche sans (avec dégradations gracieuses).

---

## 9. Checklist secrets vault

⚠ **Ne JAMAIS commiter** ces variables dans Git :

- `JWT_SECRET`
- `DB_PASSWORD`
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- `PAYPAL_CLIENT_SECRET`, `PAYPAL_WEBHOOK_ID`
- `SMTP_PASS`
- `HCAPTCHA_SECRET`
- `GOOGLE_CLIENT_SECRET`
- `BREVO_API_KEY`
- `COLISSIMO_PASSWORD`
- `META_CAPI_ACCESS_TOKEN`
- `TIKTOK_ACCESS_TOKEN`
- `SENTRY_AUTH_TOKEN`

À gérer dans :
- **Vercel** : Project → Settings → Environment Variables (cocher "Encrypted")
- **Render** : Service → Environment → Environment Variables
- **GitHub Actions** : Settings → Secrets and variables → Actions
- **Coffre dédié** : Doppler / 1Password Secrets / HashiCorp Vault si l'équipe grandit

Le `.env` de dev local doit être dans `.gitignore` (déjà le cas — `.env.example` documente la structure).
