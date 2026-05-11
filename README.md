# Makani Cosmétique

E-commerce cosmétique — fork minimal de feeling-beauty avec un design propre (terracotta + cream + Bricolage Grotesque).

## Stack

- **Backend** : NestJS 11 + TypeORM + Postgres 16
- **Frontend** : React 18 + TypeScript (CRA + Craco) + SCSS Modules
- **Paiement** : Stripe + PayPal
- **Livraison** : Colissimo
- **Auth** : JWT + refresh tokens + Google OAuth
- **RGPD** : bandeau cookies, export, suppression, sous-traitants

## Démarrage local

```bash
# 1. Copier les variables d'env
cp backend/.env.example backend/.env

# 2. Lancer la stack
docker compose up -d

# 3. Seed (au premier run)
docker exec -it makani_cosmetique_api npm run seed

# Frontend  : http://localhost:3003
# API       : http://localhost:3004/api
# Postgres  : localhost:5435
# pgAdmin   : http://localhost:5052 (admin@makani-cosmetique.com / admin123)
```

## Périmètre vs feeling-beauty

**Retiré** : loyalty, parrainage, Instagram feed, bundles, comparateur, quiz, push notifs, exit-intent, marketing automation, avis vérifiés, click & collect, plusieurs transporteurs, VIP, wishlist partagée, UTM builder, recommandations.

**Conservé** : catalogue, recherche, filtres, panier, checkout 3 étapes, Stripe + PayPal, comptes clients, livraison Colissimo, retours, factures PDF, RGPD complet, SEO, cookie consent, Sentry, Helmet, CI/CD, health check, hCaptcha, WhatsApp.
