# syntax=docker/dockerfile:1.6

# ─────────────────────────────────────────────────────────────────────────────
# Development target — used by docker-compose local for hot-reload.
# EXPOSE is metadata only; docker-compose maps the real port via `ports:`.
# ─────────────────────────────────────────────────────────────────────────────
FROM node:20-bookworm-slim AS development
WORKDIR /app

COPY package*.json ./
RUN npm install --no-audit --no-fund

COPY . .
EXPOSE 3004
CMD ["npm", "run", "start:dev"]


# ─────────────────────────────────────────────────────────────────────────────
# Build target — compile NestJS sources to dist/.
# Uses Debian slim (glibc) so sharp's prebuilt binaries work out of the box.
# ─────────────────────────────────────────────────────────────────────────────
FROM node:20-bookworm-slim AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci --no-audit --no-fund

COPY . .
RUN npm run build


# ─────────────────────────────────────────────────────────────────────────────
# Production target — minimal runtime image used by Koyeb / Render / Fly.
# Drops dev deps and source, keeps only compiled JS + prod node_modules.
# ─────────────────────────────────────────────────────────────────────────────
FROM node:20-bookworm-slim AS production
WORKDIR /app

ENV NODE_ENV=production
# Default to 10000 to match Render's auto-injected PORT and EXPOSE hint below.
# Hosts that need another value (Koyeb, Fly, docker-compose local) override
# PORT at runtime via env vars — the app already reads `process.env.PORT`.
ENV PORT=10000

COPY package*.json ./
RUN npm ci --omit=dev --no-audit --no-fund && npm cache clean --force

COPY --from=build /app/dist ./dist

# Non-root execution for the runtime image.
RUN chown -R node:node /app
USER node

# Render's HTTP proxy uses EXPOSE as the upstream port hint; must match
# whatever the runtime PORT resolves to in production.
EXPOSE 10000

# Container health probe — matches the /health endpoint excluded from /api prefix.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||10000)+'/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"

CMD ["node", "dist/main"]
