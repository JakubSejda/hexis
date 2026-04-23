# Hexis

> ἕξις — a stable state acquired through practice. Your habits become your hexis.

PWA pro tracking transformace. Daily quests, XP, levely, měření, fotky, výživa — nástroj k dosažení vaší *arete*.

## Stav

**Fáze 1 — MVP, lokální dev.** Žádný production deploy.

**Aktuální milestone:** M0 Foundation (dokončeno). Další milestones: viz `docs/superpowers/roadmap/hexis-roadmap.md`.

## Tech stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind 4 · Drizzle ORM · MySQL 8 · Vitest

## Setup

### Prerekvizity

- Node.js 20+
- Docker Desktop (pro MySQL)

### First-time setup

```bash
# 1. Install dependencies
npm install

# 2. Environment
cp .env.example .env.local
# .env.local je pre-filled pro lokální dev — není potřeba nic upravovat

# 3. Start MySQL
docker compose up -d

# 4. Počkat ~30s na health check
docker compose ps  # obě containery Status = healthy

# 5. Apply schema
npm run db:migrate

# 6. Seed data (katalog cviků + UA/UB/LA/LB plány)
npm run db:seed

# 7. Start dev server
npm run dev
```

Otevřít `http://localhost:3000`.

### Běžné příkazy

```bash
npm run dev           # Next.js dev server (Turbopack)
npm run build         # Production build
npm run test          # Vitest watch mode
npm run test:run      # Vitest single run (CI mode)
npm run typecheck     # tsc --noEmit
npm run lint          # ESLint
npm run format        # Prettier write
npm run db:generate   # Generovat SQL migraci z schema.ts
npm run db:migrate    # Apply migrations na DB
npm run db:seed       # Seed data (idempotent)
npm run db:studio     # Drizzle Studio (DB GUI)
```

> **Pre-push hook:** při každém `git push` se spouští `typecheck + lint + vitest` (viz `.husky/pre-push`).
> Vyžaduje běžící test DB (`docker compose up -d mysql-test`).
> Bypass v nouzi: `git push --no-verify`.

### Reset DB

```bash
docker compose down -v   # smaže volume se všemi daty
docker compose up -d
# počkat na healthcheck
npm run db:migrate
npm run db:seed
```

## Docs

- [Design System](docs/design-system/README.md) — component reference (tokens, ~30 component docs)
- `docs/superpowers/specs/2026-04-13-hexis-pwa-design.md` — MVP design spec
- `docs/superpowers/roadmap/hexis-roadmap.md` — living roadmap
- `docs/superpowers/plans/` — implementation plans per milestone
