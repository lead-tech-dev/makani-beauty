# Checklist mise en production — Makani Cosmétique

> Ordre strict : **rien ne sort en prod tant que P0 n'est pas validé**. P1 conditionne l'utilisabilité commerciale. P2 conditionne la stabilité.

---

## P0 — Bloqueurs légaux & sécurité (avant tout)

### 0.1 Identité juridique
- [ ] Créer / formaliser l'entité juridique (SAS / SASU / EI / EURL)
- [ ] Récupérer **SIRET**, **RCS**, **N° TVA intracommunautaire**, **capital social**, **forme juridique**, **adresse du siège social** (différente ou non de la boutique)
- [ ] Désigner le **directeur de la publication** (nom + qualité)
- [ ] Choisir et contracter avec un **médiateur de la consommation** (ex : CNPM, ANM, FEVAD)

### 0.2 Pages légales (remplacer les placeholders)
- [ ] `admin/legal-pages/cgv` — remplir tous les `[…]`
- [ ] `admin/legal-pages/mentions-legales` — id.
- [ ] `admin/legal-pages/confidentialite` — id. + désigner un DPO interne ou externalisé, son email
- [ ] `admin/legal-pages/livraison-retours` — adresse retour boutique (la 142 Rue Henri Barbusse) confirmée
- [ ] `admin/sub-processors` — pour chaque sous-traitant : signer le DPA, ajuster lieu de stockage, durée
- [ ] Délai de réponse aux demandes RGPD respecté ≤ 1 mois

### 0.3 Secrets & mots de passe (rotation obligatoire)
- [ ] `JWT_SECRET` — générer une chaîne ≥ 64 chars (`openssl rand -base64 64`)
- [ ] DB `POSTGRES_PASSWORD` — remplacer `makani_password` par un secret fort
- [ ] PgAdmin `PGADMIN_DEFAULT_PASSWORD` — remplacer `admin123` ou désactiver pgAdmin en prod
- [ ] Admin Makani — changer le mot de passe `admin1234` immédiatement après le seed (via UI)
- [ ] Tous les secrets dans un coffre (Vercel/Render env vars, Doppler, 1Password Secrets) — JAMAIS dans `.env` versionné

### 0.4 Domaine + email + SSL
- [ ] Acheter `makani-cosmetique.com` (ou `.fr` selon préférence)
- [ ] Configurer DNS : `A` racine, `CNAME www`, `CNAME api` (`api.makani-cosmetique.com` → backend host)
- [ ] Cert SSL Let's Encrypt automatique (Vercel/Render le gèrent ; sinon Caddy/Traefik)
- [ ] Configurer boîtes mail `hello@`, `contact@`, `no-reply@`, `dpo@` — ProtonMail/Google Workspace/Zoho
- [ ] Records SPF + DKIM + DMARC sur le domaine pour que les emails transactionnels n'atterrissent pas en spam

### 0.5 Paiements
- [ ] **Stripe** : créer compte, valider l'identité (KYC), ajouter `STRIPE_SECRET_KEY` (live), `STRIPE_PUBLIC_KEY` (live)
- [ ] **Stripe webhook** : configurer `https://api.makani-cosmetique.com/api/payments/stripe/webhook` + `STRIPE_WEBHOOK_SECRET`
- [ ] **PayPal** : compte business, `PAYPAL_CLIENT_ID` + `PAYPAL_CLIENT_SECRET` live
- [ ] Tester un paiement réel ≤ 1 € sur les deux PSPs en staging puis en prod
- [ ] Vérifier que la fenêtre de rétractation 14 jours est bien implémentée dans le flow de remboursement

### 0.6 Email transactionnel
- [ ] Choisir un fournisseur SMTP : **Resend** (recommandé) / Mailtrap / Brevo / SendGrid
- [ ] Configurer `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM_ADDRESS`, `MAIL_FROM_NAME`
- [ ] Tester chaque template : reset password, verify email, order confirmation, order shipped, return requested/approved/rejected, stock alert, newsletter double opt-in, account deletion
- [ ] Préparer le footer email avec mentions légales (raison sociale, SIRET, lien désinscription)

---

## P1 — Données & contenu

### 1.1 Catalogue produits
- [ ] Décider : conserver les 25 produits Afrométis hérités OU charger ton vrai catalogue
- [ ] Si vrai catalogue : import via l'admin (`/admin/products`) — vérifier images, prix, stock, marques, catégories, filtres (hairType/skinType/ingredients/certifications)
- [ ] Vérifier que chaque produit a : `imageUrl`, `description`, `price`, `stock`, `categoryId`, `brandId`, optionnellement `salePrice`, `tags`, `keyIngredients`

### 1.2 Purge des données de test (héritées de feeling-beauty)
```sql
-- À exécuter via psql sur la DB prod (ou un script idempotent)
DELETE FROM users WHERE email LIKE '%@test.com';
DELETE FROM users WHERE email = 'admin@feeling-beauty.com';
-- Toutes les commandes/orders, addresses, refresh_tokens, etc. CASCADE via les FK
TRUNCATE TABLE orders, order_items, invoices, invoice_counters,
              stock_movements, addresses, favorites,
              refresh_tokens, password_reset_tokens, email_verification_tokens
              RESTART IDENTITY CASCADE;
```
- [ ] Garder uniquement l'admin Makani et les 4 pages légales
- [ ] Re-créer si besoin un compte de test interne (pas en `@test.com`)

### 1.3 Médias
- [ ] Logo Makani Cosmétique (SVG + PNG `512x512` pour PWA + favicon)
- [ ] Image de Hero Home (portrait éditorial — actuellement Unsplash)
- [ ] Photo boutique pour la page Contact (l'iframe Maps reste, mais une vraie photo à côté)
- [ ] Open Graph image par défaut (`/og-default.jpg`, 1200×630)
- [ ] Photos catégorie (Soins capillaires, Peau, Parfums, Huiles) si vrai catalogue

### 1.4 Copy à valider
- [ ] Page À propos — confirmer la copie « pour célébrer la beauté afro et métissée »
- [ ] Footer tagline « Cosmétique pan-africaine éditée à Aubervilliers »
- [ ] FAQ — relire et ajouter questions spécifiques selon ton positionnement
- [ ] Contact — confirmer adresse, téléphone, horaires (24h/24 confirmé)

---

## P2 — Infrastructure & monitoring

### 2.1 Hébergement
- [ ] Choisir une combinaison :
  - **Frontend** : Vercel (recommandé pour CRA/Vite) / Netlify / Cloudflare Pages
  - **Backend** : Render / Railway / Fly.io / Scaleway
  - **DB** : Postgres managé chez Render / Neon / Supabase / Scaleway
- [ ] Mettre à jour `vercel.json` avec le vrai `api.makani-cosmetique.com`
- [ ] Mettre à jour `.github/workflows/deploy-prod.yml` et `deploy-staging.yml` avec les vrais secrets (`VERCEL_TOKEN`, `RENDER_API_KEY`, etc.)
- [ ] Construire l'image backend en `target: production` (multistage Dockerfile)

### 2.2 CORS + sécurité
- [ ] `FRONTEND_URL` backend = `https://makani-cosmetique.com,https://www.makani-cosmetique.com` (séparé virgule pour multi-origin)
- [ ] Helmet déjà actif ✓ — vérifier `X-Frame-Options: DENY`, `Content-Security-Policy` adapté à Stripe, PayPal, fonts.googleapis
- [ ] Rate limiting déjà actif (Throttler) — calibrer selon le trafic réel
- [ ] hCaptcha activé en prod (`HCAPTCHA_SITE_KEY` + `HCAPTCHA_SECRET` non vides → mode strict)

### 2.3 Monitoring & observabilité
- [ ] **Sentry** : compte créé, projet `makani-cosmetique` (front + back), `SENTRY_DSN` configuré côté backend ET frontend (`REACT_APP_SENTRY_DSN`)
- [ ] **Health check** externe : UptimeRobot / Better Uptime / Pingdom sur `https://api.makani-cosmetique.com/api/health`
- [ ] **Logs** : agrégation Logtail / Papertrail / Better Stack (selon hébergeur)
- [ ] **Analytics** :
  - GA4 : `REACT_APP_GA_ID` (G-XXXXXXXXXX)
  - Microsoft Clarity (optionnel) : `REACT_APP_CLARITY_ID`
  - GTM (si tag manager) : `REACT_APP_GTM_ID`
- [ ] **Backup DB** : snapshot quotidien automatique (Render/Neon le proposent ; sinon `pg_dump` cron + S3)

### 2.4 Performance
- [ ] Compression Brotli/gzip activée côté reverse proxy
- [ ] Cache headers vérifiés (`vercel.json` configure déjà `static/` à 1 an)
- [ ] CDN images : passer les images produits via Cloudinary / imgix / Cloudflare Images si volume important
- [ ] Lighthouse > 90 sur Home, Collections, ProductDetail, Checkout

### 2.5 SEO
- [ ] `sitemap.xml` généré dynamiquement (déjà via `seo.module.ts`) — vérifier l'output en prod
- [ ] `robots.txt` autorise `Allow: /` et bloque `/admin`, `/account`, `/checkout`
- [ ] Soumettre sitemap à Google Search Console + Bing Webmaster Tools
- [ ] Configurer la propriété GSC + DNS verification

---

## P3 — Nice to have (post-launch)

- [ ] PWA installable (manifest déjà présent, vérifier service worker — actuellement supprimé volontairement)
- [ ] Newsletter double opt-in vérifié bout-en-bout
- [ ] Préparer 5-10 articles blog si stratégie content marketing
- [ ] Programme fidélité / parrainage (modules supprimés du fork — à réintégrer si voulu)
- [ ] Multi-langue (anglais d'abord) — actuellement reporté (cf. memory section 16)
- [ ] Multi-devise (USD, GBP) — actuellement reporté
- [ ] Click & Collect en boutique (déjà mentionné dans CGV) — vérifier que le flow `fulfillmentMethod=pickup` est testé

---

## Validation finale (J-1 avant ouverture)

- [ ] Test bout-en-bout en staging avec un panier complet, paiement Stripe live à 1 €, email reçu, commande visible dans `/admin/orders`
- [ ] Test reset password : email reçu, lien fonctionne, mdp changé
- [ ] Test inscription newsletter : double opt-in fonctionne
- [ ] Test demande de retour : email envoyé, admin peut approuver/rejeter
- [ ] Test demande de suppression de compte (RGPD) : email envoyé, anonymisation après 7 jours
- [ ] Robots.txt + sitemap.xml accessibles
- [ ] Page 404 stylée
- [ ] Cookie banner s'affiche au premier visit, choix persisté
- [ ] Lighthouse > 90 sur les 4 pages clés
- [ ] Vérification CSP : aucune erreur console liée à des ressources bloquées
- [ ] Backup DB testé (restoration depuis snapshot)
- [ ] Plan de rollback prêt (revenir au tag git précédent en < 5 min)

---

**Estimation effort** :
- P0 : 5-10 jours (dépend de la rapidité KYC Stripe + création SAS)
- P1 : 2-3 jours (catalogue + purge)
- P2 : 3-5 jours (setup infra + monitoring + DNS)
- P3 : variable, non bloquant
