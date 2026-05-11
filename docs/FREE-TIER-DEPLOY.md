# Déploiement free-tier — Makani Cosmétique

> Runbook pour mettre staging en ligne sur des plateformes gratuites. Suivre
> dans l'ordre — chaque étape récupère des secrets/URLs réutilisés ensuite.
> Une fois tout vert, le déploiement est piloté par GitHub Actions :
> push sur `develop` → CI valide → Vercel & Koyeb déploient automatiquement.

---

## Récap de la stack staging

| Composant | Plateforme | Free tier | Cold start |
|---|---|---|---|
| Backend NestJS | **Koyeb** | 1 service Web, 512 Mo RAM, 100 GB bandwidth | Aucun (ne dort pas) |
| Postgres | **Neon** | 500 Mo storage, autopause 5 min | ~1 s au wake |
| Storage media | **Cloudflare R2** | 10 GB storage, egress gratuit | Aucun |
| SMTP | **Resend** | 3 000 emails / mois, 100 / jour | Aucun |
| Frontend CRA | **Vercel** | 100 GB bandwidth, builds illimités | Aucun |

Sans carte bancaire requise nulle part (Koyeb demande optionnellement une CB seulement pour scale au-delà du free tier).

---

## 1 · Neon (Postgres) — ~3 min

1. Aller sur **https://neon.tech** → Sign up avec GitHub.
2. Create project :
   - Name : `makani-beauty-staging`
   - Postgres version : 16
   - Region : `europe-central-1` (Frankfurt) — proche France
3. Une fois créé, ouvre **Dashboard → Connection Details** :
   - Copie la **Connection string** au format `postgresql://user:pwd@host/db?sslmode=require`
   - Note séparément les composants : `host`, `database`, `user`, `password`, `port`
4. Onglet **Branches** : crée une branche `develop` (clone du `main`) — elle servira au CI pour les migrations sans toucher la main.

**À noter pour GitHub secrets :**
- `DATABASE_URL_STAGING` = la connection string complète

---

## 2 · Cloudflare R2 (storage) — ~5 min

1. Compte sur **https://dash.cloudflare.com** → Sign up (gratuit, sans CB).
2. Sidebar → **R2 Object Storage** → **Get started** (active R2 — peut demander une CB de vérification pour les comptes neufs, gratuit dans les limites).
3. **Create bucket** :
   - Name : `makani-beauty-media-staging`
   - Location : Eastern Europe (EEUR) ou Western Europe (WEUR)
4. Bucket ouvert → onglet **Settings** :
   - **Public access** → **R2.dev subdomain** → **Allow Access**
   - Copie le **Public R2.dev Bucket URL** (format `https://pub-<hash>.r2.dev`) — c'est `R2_PUBLIC_URL`
5. Sidebar R2 → **Manage R2 API Tokens** → **Create API Token** :
   - Permissions : **Object Read & Write**
   - Specify bucket(s) : seulement `makani-beauty-media-staging`
   - TTL : Forever (ou 1 an)
   - **Create**
6. Note immédiatement (page non re-affichable) :
   - **Access Key ID** → `R2_ACCESS_KEY_ID`
   - **Secret Access Key** → `R2_SECRET_ACCESS_KEY`
   - **Endpoint URL** (jugaff S3 API) : `https://<account_id>.r2.cloudflarestorage.com` → `R2_ENDPOINT`

**À noter pour GitHub secrets :**
- `R2_STAGING_ENDPOINT`
- `R2_STAGING_ACCESS_KEY_ID`
- `R2_STAGING_SECRET_ACCESS_KEY`
- `R2_STAGING_BUCKET` = `makani-beauty-media-staging`
- `R2_STAGING_PUBLIC_URL` = l'URL pub-xxx.r2.dev sans slash final

---

## 3 · Resend (SMTP) — ~2 min

1. **https://resend.com** → Sign up GitHub.
2. **API Keys** → **Create API Key** → Name `makani-staging` → Permission **Sending access** → Copie le `re_…`.
3. Optionnel mais recommandé : **Domains** → Add domain (`makani-cosmetique.com`) → suivre DNS records pour vérifier. Tant que ce n'est pas fait, tu peux envoyer **uniquement vers l'email du compte Resend** (mode sandbox). Pour staging démo, c'est OK.

**À noter pour GitHub secrets :**
- `SMTP_STAGING_HOST` = `smtp.resend.com`
- `SMTP_STAGING_PORT` = `465`
- `SMTP_STAGING_USER` = `resend`
- `SMTP_STAGING_PASS` = la clé `re_…`

---

## 4 · Koyeb (Backend) — ~10 min

1. **https://app.koyeb.com** → Sign up GitHub (autorise l'accès au repo `makani-beauty`).
2. **Create App** → **GitHub** → repo `makani-beauty`, branche `develop`.
3. Build :
   - **Builder** : `Dockerfile`
   - **Dockerfile location** : `backend/Dockerfile`
   - **Build context** : `backend` (sous-dossier)
   - **Target stage** : `production`
4. Service config :
   - Name : `makani-beauty-api-staging`
   - Region : Frankfurt (`fra`)
   - Instance : Eco (Free, 512 Mo / 0.1 vCPU)
   - **Exposed port** : `3004` (matche `EXPOSE` + `PORT` env dans le Dockerfile)
   - **Health check** : `GET /health` (port 3004, success 200)
5. **Environment variables** (cliquer Add pour chaque) :

   | Var | Valeur |
   |---|---|
   | `NODE_ENV` | `production` |
   | `PORT` | `3004` |
   | `FRONTEND_URL` | (laisser vide, on remplit après l'étape 5 Vercel) |
   | `SITE_URL` | idem |
   | `DATABASE_URL` | Neon connection string (étape 1) |
   | `DB_HOST` | host Neon |
   | `DB_PORT` | `5432` |
   | `DB_USERNAME` | user Neon |
   | `DB_PASSWORD` | pwd Neon (secret) |
   | `DB_NAME` | db Neon |
   | `JWT_SECRET` | `openssl rand -base64 64` |
   | `DB_SYNCHRONIZE` | `true` ⚠️ **uniquement pour le premier deploy** — auto-crée le schéma. À retirer ou passer à `false` ensuite (TypeORM ne touchera plus aux tables). |
   | `DB_SSL` | (laisser vide — Neon est auto-détecté) |
   | `STORAGE_DRIVER` | `s3` |
   | `R2_ENDPOINT` | étape 2 |
   | `R2_ACCESS_KEY_ID` | étape 2 (secret) |
   | `R2_SECRET_ACCESS_KEY` | étape 2 (secret) |
   | `R2_BUCKET` | `makani-beauty-media-staging` |
   | `R2_PUBLIC_URL` | étape 2 |
   | `SMTP_HOST` | `smtp.resend.com` |
   | `SMTP_PORT` | `465` |
   | `SMTP_USER` | `resend` |
   | `SMTP_PASS` | étape 3 (secret) |
   | `MAIL_FROM_ADDRESS` | `onboarding@resend.dev` (sandbox) ou `no-reply@makani-cosmetique.com` (domaine vérifié) |
   | `MAIL_FROM_NAME` | `Makani Cosmétique` |
   | `COLISSIMO_MOCK` | `true` (staging) |
   | `HCAPTCHA_SECRET` | vide → mode mock |
   | `STRIPE_SECRET_KEY` | clé **test** `sk_test_…` |
   | `STRIPE_PUBLISHABLE_KEY` | clé **test** `pk_test_…` |
   | `STRIPE_WEBHOOK_SECRET` | (à ajouter après config webhook) |
   | `PAYPAL_MODE` | `sandbox` |
   | `INVOICE_COMPANY_NAME` | `Makani Cosmétique` |
   | `INVOICE_COMPANY_EMAIL` | `contact@makani-cosmetique.com` |

6. **Deploy**. Premier build ≈ 4-6 min. Quand le service est `Healthy`, copie l'URL publique (format `https://makani-beauty-api-staging-<user>.koyeb.app`).

**À noter pour GitHub vars (`Settings → Secrets and variables → Actions → Variables`) :**
- `STAGING_BACKEND_HEALTH_URL` = `https://makani-beauty-api-staging-<user>.koyeb.app/health`

---

## 5 · Vercel (Frontend) — ~5 min

1. **https://vercel.com** → Sign up GitHub.
2. **Add New… → Project** → import `makani-beauty`.
3. Configuration :
   - **Framework Preset** : Create React App
   - **Root Directory** : `frontend`
   - **Production Branch** : `main` (pour plus tard) — pour staging, on déploie `develop` via le workflow GitHub Actions
4. **Environment Variables** :
   - `REACT_APP_API_URL` = URL Koyeb + `/api` → `https://makani-beauty-api-staging-<user>.koyeb.app/api`
   - Autres `REACT_APP_*` listées dans `frontend/.env.example` (Stripe publishable key, hCaptcha site key, etc.) — pour staging démo, mettre les clés **test**
5. **Deploy**. Premier build ≈ 2-3 min.
6. Une fois en ligne, Vercel donne l'URL `https://makani-beauty.vercel.app` (ou similaire).

**À noter pour GitHub vars :**
- `STAGING_FRONTEND_URL` = l'URL Vercel

**Retour à Koyeb** : edit le service → ajoute `FRONTEND_URL` et `SITE_URL` = URL Vercel, redéploie.

---

## 6 · GitHub secrets & vars — récap final

Repo GitHub → **Settings → Secrets and variables → Actions**.

### Secrets (chiffrés, jamais affichés)

| Nom | Valeur | Utilisé par |
|---|---|---|
| `VERCEL_TOKEN` | Vercel → Settings → Tokens → Create | deploy-staging.yml, deploy-prod.yml |
| `RENDER_STAGING_DEPLOY_HOOK` | (vide — on n'utilise pas Render) | skippé par le workflow |
| `SENTRY_AUTH_TOKEN` | (optionnel — Sentry → Account → Auth Tokens) | release tracking |
| `SENTRY_ORG` | nom org Sentry | release tracking |

> Astuce : tous les steps `if: ${{ secrets.X }}` skippent silencieusement si
> le secret est absent. Tu peux donc démarrer sans Sentry et l'ajouter
> plus tard sans toucher au workflow.

### Variables (non-sensibles, visibles)

| Nom | Valeur |
|---|---|
| `STAGING_FRONTEND_URL` | URL Vercel staging |
| `STAGING_BACKEND_HEALTH_URL` | URL Koyeb + `/health` |
| `PROD_FRONTEND_URL` | (vide tant qu'on n'a pas de prod) |
| `PROD_BACKEND_HEALTH_URL` | (vide) |

---

## 7 · Branches protections — minimal

Repo → **Settings → Branches → Add rule**.

### `main`
- ✅ Require a pull request before merging (1 approver)
- ✅ Require status checks to pass : **CI / Backend (NestJS)**, **CI / Frontend (CRA)**
- ✅ Require branches to be up to date

### `develop`
- ✅ Require status checks to pass : **CI / Backend (NestJS)**, **CI / Frontend (CRA)**

---

### 4 bis · Premier seed Neon

Une fois le service Koyeb `Healthy`, les tables sont créées (grâce à `DB_SYNCHRONIZE=true`).
Pour peupler le catalogue + créer l'admin :

```bash
# En local, branché sur la même Neon staging via les env vars Neon
cd backend
DB_HOST=<neon-host> DB_PORT=5432 DB_USERNAME=<user> DB_PASSWORD=<pwd> DB_NAME=<db> \
  npm run seed
```

Le seed est idempotent (check before insert). Admin créé : `admin@makani-cosmetique.com` / `admin1234` (**change le mot de passe via /api/auth/change-password dès la première connexion**).

Puis dans Koyeb, **retire `DB_SYNCHRONIZE`** (ou passe à `false`) et redéploie — TypeORM ne touchera plus aux tables. Toute future évolution de schéma passera par une migration TypeORM.

---

## 8 · Premier déploiement — vérification

Une fois tout en place :

```bash
git checkout develop
git commit --allow-empty -m "chore: trigger first staging deploy"
git push origin develop
```

Workflow attendu :
1. **CI** se déclenche sur GitHub Actions (~3 min) → backend type-check + build, frontend type-check + build.
2. **Koyeb** détecte le push et redéploie le backend (~4 min).
3. **Deploy → Staging** workflow se déclenche → Vercel deploy + attente health Koyeb.
4. Vérifications manuelles :
   - `curl https://<koyeb-url>/health` → `{"status":"ok", ...}`
   - Ouvrir l'URL Vercel → la home charge, le catalogue produits aussi
   - Test login admin (seed initial) → admin@makani-cosmetique.com / mot de passe seed
   - Admin → upload un produit avec image → vérifier dans Cloudflare R2 dashboard que le fichier apparaît bien
   - Admin → générer une étiquette mock Colissimo → vérifier que le PDF est servi depuis R2

Si une étape échoue, vérifier dans cet ordre :
1. **Koyeb logs** (Service → Logs) — souvent un env var manquant ou Postgres non joignable
2. **Neon dashboard** → onglet **Operations** : connexions actives ?
3. **R2 bucket** → Settings → Public access bien activé ?
4. **CORS** : `FRONTEND_URL` côté Koyeb match exactement l'origine Vercel (sans trailing slash) ?

---

## 9 · Migration vers prod (quand le domaine est prêt)

1. Acheter `makani-cosmetique.com`.
2. DNS records :
   - `makani-cosmetique.com` (A/CNAME) → Vercel
   - `www.makani-cosmetique.com` (CNAME) → Vercel
   - `api.makani-cosmetique.com` (CNAME) → Koyeb (Settings → Custom domains)
3. Dupliquer la stack pour prod :
   - Neon : nouveau projet `makani-beauty-prod`
   - R2 : nouveau bucket `makani-beauty-media-prod`
   - Koyeb : nouveau service `makani-beauty-api-prod` watchant `main`
   - Vercel : déjà configuré pour deploy `main` en prod
4. Bascule Stripe en **live** (sk_live_…, pk_live_…, webhook avec endpoint prod).
5. Bascule PayPal en **live**.
6. Désactive Colissimo mock, ajoute le contrat.
7. Tag un release : `git tag v1.0.0 && git push --tags` → déclenche `deploy-prod.yml`.

---

## Annexe — Limites free tier à surveiller

- **Neon** : 500 Mo DB. Le seed dev + 1000 commandes test devrait tenir.
- **R2** : 10 GB. ~3 images par produit × 3 variantes WebP × ~200 produits = ~1 GB confortable.
- **Resend** : 100 emails / jour. Si plus de trafic, passer à Brevo (free 300/jour) ou plan payant Resend (10$/mois).
- **Koyeb** : 100 GB bandwidth / mois. Catalogue produit + API json → largement OK pour démo.
- **Vercel** : 100 GB bandwidth, 6 000 minutes build / mois. Aucune chance de dépasser en staging.

Surveille les usages dans chaque dashboard. À 80 % de limite, on planifie la migration vers le plan suivant.
