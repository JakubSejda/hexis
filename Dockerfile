# Hexis production image — multi-stage.
#
#   deps     → npm ci (full node_modules, cached by lockfile)
#   builder  → next build (standalone output); also the base for the
#              one-off `migrate` compose service (has tsx + drizzle)
#   runner   → minimal standalone server, non-root
#
# Node 25 matches local dev and CI (lockfile is npm 11 format).

FROM node:25-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:25-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# env.ts (zod) parses at import time during `next build`. Real values come
# from the runtime environment — these are build-time placeholders only.
ENV DATABASE_URL="mysql://build:build@localhost:3306/build" \
    AUTH_SECRET="build-time-placeholder" \
    NEXTAUTH_URL="http://localhost:3000" \
    NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:25-slim AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
COPY --from=builder --chown=node:node /app/public ./public

# Photo uploads live on a mounted volume (STORAGE_ROOT=/data/uploads).
RUN mkdir -p /data/uploads && chown -R node:node /data

USER node
EXPOSE 3000
CMD ["node", "server.js"]
