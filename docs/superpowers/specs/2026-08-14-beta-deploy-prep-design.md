# Friends-and-family beta — deploy prep (design)

**Date:** 2026-08-14
**Status:** approved (owner picked all three forks 2026-08-14)
**Predecessors:** UX/UI Polish initiative closed (#24–#28); CI shipped (#29).

## Owner decisions (locked)

| Fork | Decision |
|---|---|
| Hosting | **VPS + Docker Compose** (e.g. Hetzner CX22) — mirrors current architecture: MySQL 8 container, uploads on a disk volume, no code changes |
| Error tracking | **Sentry free tier** (`@sentry/nextjs`), DSN via env — wiring is a no-op when DSN is unset |
| Beta accounts | **Manual seed script** — N accounts with generated passwords, handed out personally; no public registration |

## Slices (one PR each)

### D1 — Production container + compose + runbook
- Multi-stage `Dockerfile` (Next.js standalone output; `output: 'standalone'` in next.config if not set).
- `compose.prod.yml`: `app` (built image, env from `.env.production`), `mysql:8.0` (named volume, healthcheck), `caddy` (reverse proxy + automatic Let's Encrypt TLS; domain via env).
- Volumes: `mysql-data`, `uploads` (mounted at STORAGE_ROOT), `caddy-data`.
- `.env.production.example`: DATABASE_URL (compose-internal host `mysql`), AUTH_SECRET, NEXTAUTH_URL=https://<domain>, STORAGE_ROOT=/data/uploads, SENTRY_DSN=.
- `docs/deploy-runbook.md`: VPS bootstrap (docker install, firewall 80/443/22), first deploy, migrace (`docker compose exec app npm run db:migrate` or migrate-on-start), seed, backup cron (`mysqldump` do `/backups`, retence 14 dní), update postup (git pull + build + up -d).

### D2 — Sentry
- `@sentry/nextjs` s condition: initialized only when `SENTRY_DSN` set (local dev/test = no-op, no DSN in repo).
- Client + server + edge config per Next 16 instrumentation conventions; sourcemaps upload optional (skip for beta — free tier, minified stacks acceptable, revisit later).

### D3 — Beta account seed script
- `scripts/seed-beta-users.ts`: input = list of emails (arg or file); for each: create user (argon2 hash of generated 12-char password, `onboarded_at = NULL` → **new users get the P5 onboarding wizard**), seed plans + plate inventory (reuse `seedPlans`/`seedPlateInventory` from demo script); output table email → password (stdout only, never written to disk).
- Idempotent: existing email → skip with warning.

## Owner action items (blocking actual go-live, not the PRs)
1. Buy/choose VPS + point a domain (A record) at it.
2. Create Sentry project → DSN.
3. Pick beta tester emails.

## Out of scope
Public registration, Google OAuth, GDPR/analytics, CDN, staging environment (beta = production for friends), automated deploys from CI (manual `git pull` deploy is fine at this scale).
