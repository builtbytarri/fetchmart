# Multi-stage build. The final image carries only production dependencies and
# compiled output — no TypeScript, no dev tooling — which keeps it small enough
# to pull quickly onto a small droplet.

# ── Stage 1: build ───────────────────────────────────────────────────────────
FROM node:20-slim AS builder
WORKDIR /app

# OpenSSL is required by Prisma's query engine.
RUN apt-get update && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

# Copy manifests first so `npm ci` is cached and only re-runs when deps change.
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci

COPY . .
RUN npx prisma generate && npm run build

# Drop dev dependencies from node_modules before it is copied into the runtime
# image. Prisma's client must be regenerated afterwards because pruning removes
# the generator that produced it.
RUN npm prune --omit=dev && npx prisma generate

# ── Stage 2: runtime ─────────────────────────────────────────────────────────
FROM node:20-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production

RUN apt-get update && apt-get install -y --no-install-recommends openssl curl \
    && rm -rf /var/lib/apt/lists/*

# Run as a non-root user: a container escape should not land on root.
RUN useradd --system --create-home --shell /usr/sbin/nologin app

COPY --from=builder --chown=app:app /app/node_modules ./node_modules
COPY --from=builder --chown=app:app /app/dist        ./dist
COPY --from=builder --chown=app:app /app/prisma      ./prisma
COPY --from=builder --chown=app:app /app/package.json ./package.json
# Prisma 7 reads the datasource URL from this file, not from schema.prisma —
# without it `prisma migrate deploy` inside the container has no database URL.
COPY --from=builder --chown=app:app /app/prisma.config.ts ./prisma.config.ts

USER app
EXPOSE 3000

# Compose uses this to hold traffic back until the app is genuinely serving.
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD curl -fsS http://localhost:3000/health || exit 1

CMD ["node", "dist/src/main.js"]
