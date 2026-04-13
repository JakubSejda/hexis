# M0 — Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Postavit funkční Next.js 15 projekt s kompletním Drizzle schematem, seeded daty (katalog cviků + UA/UB/LA/LB plány) a testovacím setupem — ready pro stavění feature milestones M1+.

**Architecture:** Next.js 15 App Router + TypeScript strict + Tailwind 4 + Drizzle ORM + MySQL 8 (Docker). Schema obsahuje všech 12 tabulek z specu od dne 1, přestože většina bude prázdná do příslušného feature milestone. Seed naplní pouze `muscle_groups`, `exercises` (kurátorovaný katalog), `plans` + `plan_exercises` (UA/UB/LA/LB Jakubův split). Test DB paralelně na jiném portu.

**Tech Stack:** Next.js 15, React 19, TypeScript 5, Tailwind 4, Drizzle ORM + drizzle-kit, mysql2, MySQL 8 (Docker), Vitest, Prettier + ESLint (Next.js preset), Husky + lint-staged.

---

## File Structure

Vytvořené/upravené soubory:

```
hexis/
├── .env.example                     # env template (committed)
├── .env.local                       # dev secrets (gitignored)
├── .gitignore                       # augmented
├── .prettierrc                      # formatter config
├── .husky/pre-commit                # git hook
├── README.md                        # setup instrukce
├── docker-compose.yml               # MySQL 8 dev + test
├── drizzle.config.ts                # Drizzle CLI config
├── next.config.ts                   # Next config (placeholder)
├── package.json                     # scripts + deps
├── tsconfig.json                    # TypeScript strict
├── vitest.config.ts                 # test runner config
├── src/
│   ├── app/
│   │   ├── layout.tsx               # root layout (Tailwind)
│   │   ├── page.tsx                 # placeholder homepage
│   │   └── globals.css              # Tailwind + design tokens
│   ├── db/
│   │   ├── client.ts                # Drizzle client export
│   │   ├── schema.ts                # všech 12 tabulek
│   │   ├── migrate.ts               # migrate runner
│   │   ├── seed.ts                  # seed orchestrátor
│   │   └── seed/
│   │       ├── muscle-groups.ts     # data
│   │       ├── exercises.ts         # data + M:N s mg
│   │       └── plans.ts             # UA/UB/LA/LB
│   ├── lib/
│   │   └── env.ts                   # parsed env (zod)
│   └── tests/
│       └── smoke.test.ts            # sanity test
```

---

## Task 1: Scaffold Next.js 15 project

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`, `postcss.config.mjs`, `eslint.config.mjs`, `next-env.d.ts`
- Modify: `README.md`, `.gitignore`

Existující soubory (`docs/`, `README.md`, `.gitignore`) blokují `create-next-app`. Strategie: přesunout je dočasně do `/tmp`, scaffoldovat, vrátit.

- [ ] **Step 1: Přesunout existující soubory do /tmp**

```bash
cd /Users/jakubsejda/SideProjects/hexis
mkdir -p /tmp/hexis-stash
mv docs /tmp/hexis-stash/
mv README.md /tmp/hexis-stash/
mv .gitignore /tmp/hexis-stash/
ls -la  # zbývá jen .git/
```

- [ ] **Step 2: Spustit create-next-app**

```bash
cd /Users/jakubsejda/SideProjects/hexis
npx create-next-app@latest . \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*" \
  --turbopack \
  --use-npm \
  --no-interactive
```

Očekávané: vytvoří `src/app/`, `package.json`, `tsconfig.json`, `.gitignore`, atd. Install dependencies proběhne.

- [ ] **Step 3: Vrátit docs/ a README.md zpět**

```bash
mv /tmp/hexis-stash/docs ./docs
mv /tmp/hexis-stash/README.md ./README.md  # přepíše create-next-app generated README
```

- [ ] **Step 4: Zmergovat stashed .gitignore do nového**

```bash
cat /tmp/hexis-stash/.gitignore >> .gitignore
# Odstranit duplicity manuálně:
sort -u .gitignore -o .gitignore
# Pokud sort rozbije strukturu (obvykle je OK), zkontrolovat a případně upravit ručně.
```

Otevřít `.gitignore` a ověřit přítomnost:
- `node_modules/`
- `.next/`
- `.env*`
- `uploads/`
- `mysql-data/`
- `.DS_Store`

- [ ] **Step 5: Ověřit, že dev server naběhne**

```bash
npm run dev
```

Očekávané: `▲ Next.js 15.x.x — Local: http://localhost:3000`. Otevřít v prohlížeči → vidět default Next.js welcome page. Stop server (Ctrl+C).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(m0): scaffold Next.js 15 with TypeScript, Tailwind, App Router"
```

---

## Task 2: TypeScript strict mode + path alias check

**Files:**
- Modify: `tsconfig.json`

- [ ] **Step 1: Otevřít tsconfig.json a ověřit strict mode**

Přečíst `tsconfig.json`. Pokud `"strict": true` chybí v `compilerOptions`, přidat:

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true
  }
}
```

Tyto dvě flag nad rámec `strict` chytnou další třídu bugů (array[i] je `T | undefined`, `override` modifier vynucený).

- [ ] **Step 2: Ověřit type check**

```bash
npx tsc --noEmit
```

Očekávané: žádné errory.

- [ ] **Step 3: Commit**

```bash
git add tsconfig.json
git commit -m "chore(m0): enable TypeScript strict plus extra safety flags"
```

---

## Task 3: Docker Compose pro MySQL

**Files:**
- Create: `docker-compose.yml`

- [ ] **Step 1: Vytvořit docker-compose.yml**

```yaml
services:
  mysql:
    image: mysql:8.0
    container_name: hexis-mysql
    restart: unless-stopped
    ports:
      - '3306:3306'
    environment:
      MYSQL_ROOT_PASSWORD: dev
      MYSQL_DATABASE: hexis
    volumes:
      - mysql-data:/var/lib/mysql
    healthcheck:
      test: ['CMD', 'mysqladmin', 'ping', '-h', 'localhost', '-uroot', '-pdev']
      interval: 5s
      timeout: 5s
      retries: 10

  mysql-test:
    image: mysql:8.0
    container_name: hexis-mysql-test
    restart: unless-stopped
    ports:
      - '3307:3306'
    environment:
      MYSQL_ROOT_PASSWORD: test
      MYSQL_DATABASE: hexis_test
    tmpfs:
      - /var/lib/mysql
    healthcheck:
      test: ['CMD', 'mysqladmin', 'ping', '-h', 'localhost', '-uroot', '-ptest']
      interval: 5s
      timeout: 5s
      retries: 10

volumes:
  mysql-data:
```

- [ ] **Step 2: Spustit stack**

```bash
docker compose up -d
```

Očekávané: dvě containery `hexis-mysql` a `hexis-mysql-test` running.

- [ ] **Step 3: Počkat na health + ověřit připojení**

```bash
docker compose ps
# Oba s Status = healthy (cca 30s)

# Test connection:
docker exec hexis-mysql mysql -uroot -pdev -e "SHOW DATABASES;"
```

Očekávané output: v seznamu je `hexis`.

- [ ] **Step 4: Commit**

```bash
git add docker-compose.yml
git commit -m "feat(m0): add Docker Compose for MySQL dev and test instances"
```

---

## Task 4: Install backend dependencies

**Files:**
- Modify: `package.json` (via npm install)

- [ ] **Step 1: Nainstalovat Drizzle + MySQL driver + zod**

```bash
npm install drizzle-orm mysql2 zod
npm install -D drizzle-kit tsx @types/node
```

Očekávané: `drizzle-orm`, `mysql2`, `zod` v `dependencies`; `drizzle-kit`, `tsx`, `@types/node` v `devDependencies`.

- [ ] **Step 2: Commit**

```bash
git add package.json package-lock.json
git commit -m "feat(m0): add Drizzle ORM, mysql2, zod, tsx dependencies"
```

---

## Task 5: Environment variables setup

**Files:**
- Create: `.env.example`, `.env.local`, `src/lib/env.ts`

- [ ] **Step 1: Vytvořit .env.example (committed template)**

```bash
cat > .env.example <<'EOF'
# Database
DATABASE_URL=mysql://root:dev@localhost:3306/hexis
TEST_DATABASE_URL=mysql://root:test@localhost:3307/hexis_test

# NextAuth (generováno v M1)
AUTH_SECRET=replace-with-openssl-rand-base64-32
NEXTAUTH_URL=http://localhost:3000

# Google OAuth (M1)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# File storage (M5)
STORAGE_ROOT=./uploads
EOF
```

- [ ] **Step 2: Vytvořit .env.local (dev secrets, gitignored)**

```bash
cat > .env.local <<'EOF'
DATABASE_URL=mysql://root:dev@localhost:3306/hexis
TEST_DATABASE_URL=mysql://root:test@localhost:3307/hexis_test
AUTH_SECRET=placeholder-will-generate-in-m1
NEXTAUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
STORAGE_ROOT=./uploads
EOF
```

- [ ] **Step 3: Vytvořit src/lib/env.ts (zod-parsed env)**

```typescript
import { z } from 'zod'

const EnvSchema = z.object({
  DATABASE_URL: z.string().url(),
  TEST_DATABASE_URL: z.string().url().optional(),
  AUTH_SECRET: z.string().min(1),
  NEXTAUTH_URL: z.string().url(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  STORAGE_ROOT: z.string().default('./uploads'),
})

export const env = EnvSchema.parse(process.env)
export type Env = z.infer<typeof EnvSchema>
```

- [ ] **Step 4: Ověřit parsování**

```bash
npx tsx -e "import('./src/lib/env.ts').then(m => console.log(Object.keys(m.env)))"
```

Očekávané output: `['DATABASE_URL', 'TEST_DATABASE_URL', 'AUTH_SECRET', 'NEXTAUTH_URL', 'GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'STORAGE_ROOT']`.

- [ ] **Step 5: Commit**

```bash
git add .env.example src/lib/env.ts
git commit -m "feat(m0): env schema with zod validation"
```

---

## Task 6: Drizzle config + client

**Files:**
- Create: `drizzle.config.ts`, `src/db/client.ts`, `src/db/migrate.ts`

- [ ] **Step 1: Vytvořit drizzle.config.ts**

```typescript
import { defineConfig } from 'drizzle-kit'
import 'dotenv/config'

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './src/db/migrations',
  dialect: 'mysql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
})
```

Pozn.: `dotenv/config` načte `.env.local` jen při spuštění drizzle-kit CLI. Runtime kód v Next.js používá vlastní env loader.

- [ ] **Step 2: Nainstalovat dotenv pro Drizzle CLI**

```bash
npm install -D dotenv
```

- [ ] **Step 3: Vytvořit src/db/client.ts**

```typescript
import { drizzle } from 'drizzle-orm/mysql2'
import mysql from 'mysql2/promise'
import { env } from '@/lib/env'
import * as schema from './schema'

const pool = mysql.createPool({
  uri: env.DATABASE_URL,
  connectionLimit: 10,
})

export const db = drizzle(pool, { schema, mode: 'default' })
export type DB = typeof db
```

- [ ] **Step 4: Vytvořit src/db/migrate.ts (CLI runner)**

```typescript
import 'dotenv/config'
import { drizzle } from 'drizzle-orm/mysql2'
import { migrate } from 'drizzle-orm/mysql2/migrator'
import mysql from 'mysql2/promise'

async function main() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL required')

  const connection = await mysql.createConnection(url)
  const db = drizzle(connection)

  console.log('Running migrations...')
  await migrate(db, { migrationsFolder: './src/db/migrations' })
  console.log('Migrations complete.')

  await connection.end()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
```

- [ ] **Step 5: Přidat package.json scripts**

Upravit `package.json` — do `scripts` přidat:

```json
{
  "scripts": {
    "dev": "next dev --turbo",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit",
    "db:generate": "drizzle-kit generate",
    "db:push": "drizzle-kit push",
    "db:migrate": "tsx src/db/migrate.ts",
    "db:studio": "drizzle-kit studio",
    "db:seed": "tsx src/db/seed.ts"
  }
}
```

(Pokud již existují `dev`, `build`, `start`, `lint` z create-next-app, ponechat je a přidat ostatní.)

- [ ] **Step 6: Commit**

```bash
git add drizzle.config.ts src/db/client.ts src/db/migrate.ts package.json package-lock.json
git commit -m "feat(m0): Drizzle config, client pool, migration runner"
```

---

## Task 7: Drizzle schema — všech 12 tabulek

**Files:**
- Create: `src/db/schema.ts`

- [ ] **Step 1: Vytvořit src/db/schema.ts s kompletním schématem**

```typescript
import {
  mysqlTable,
  varchar,
  int,
  smallint,
  tinyint,
  decimal,
  text,
  timestamp,
  date,
  boolean,
  json,
  mysqlEnum,
  primaryKey,
  index,
  unique,
} from 'drizzle-orm/mysql-core'

// ═══════════════════════════════════════════════════════════════════
// USERS + ACCOUNTS (auth — plné využití až v M1)
// ═══════════════════════════════════════════════════════════════════

export const users = mysqlTable('users', {
  id: varchar('id', { length: 26 }).primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }),
  name: varchar('name', { length: 100 }),
  level: tinyint('level').default(1).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const accounts = mysqlTable(
  'accounts',
  {
    userId: varchar('user_id', { length: 26 }).notNull(),
    type: varchar('type', { length: 32 }).notNull(),
    provider: varchar('provider', { length: 32 }).notNull(),
    providerAccountId: varchar('provider_account_id', { length: 255 }).notNull(),
    refreshToken: text('refresh_token'),
    accessToken: text('access_token'),
    expiresAt: int('expires_at'),
    tokenType: varchar('token_type', { length: 32 }),
    scope: varchar('scope', { length: 255 }),
    idToken: text('id_token'),
    sessionState: varchar('session_state', { length: 255 }),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.provider, t.providerAccountId] }),
    byUser: index('idx_accounts_user').on(t.userId),
  })
)

// ═══════════════════════════════════════════════════════════════════
// EXERCISE CATALOG
// ═══════════════════════════════════════════════════════════════════

export const muscleGroups = mysqlTable('muscle_groups', {
  id: smallint('id').primaryKey().autoincrement(),
  slug: varchar('slug', { length: 32 }).notNull().unique(),
  name: varchar('name', { length: 64 }).notNull(),
})

export const exercises = mysqlTable(
  'exercises',
  {
    id: int('id').primaryKey().autoincrement(),
    userId: varchar('user_id', { length: 26 }), // null = curated global
    name: varchar('name', { length: 128 }).notNull(),
    type: mysqlEnum('type', [
      'barbell',
      'db',
      'cable',
      'machine',
      'bodyweight',
      'smith',
    ]).notNull(),
    videoUrl: varchar('video_url', { length: 500 }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => ({
    byUserName: index('idx_exercises_user_name').on(t.userId, t.name),
  })
)

export const exerciseMuscleGroups = mysqlTable(
  'exercise_muscle_groups',
  {
    exerciseId: int('exercise_id').notNull(),
    muscleGroupId: smallint('muscle_group_id').notNull(),
    isPrimary: boolean('is_primary').default(false).notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.exerciseId, t.muscleGroupId] }),
  })
)

// ═══════════════════════════════════════════════════════════════════
// PLANS (tréninkové šablony)
// ═══════════════════════════════════════════════════════════════════

export const plans = mysqlTable('plans', {
  id: int('id').primaryKey().autoincrement(),
  userId: varchar('user_id', { length: 26 }).notNull(),
  name: varchar('name', { length: 32 }).notNull(),
  slug: varchar('slug', { length: 16 }).notNull(),
  order: tinyint('order').notNull(),
})

export const planExercises = mysqlTable(
  'plan_exercises',
  {
    id: int('id').primaryKey().autoincrement(),
    planId: int('plan_id').notNull(),
    exerciseId: int('exercise_id').notNull(),
    order: tinyint('order').notNull(),
    targetSets: tinyint('target_sets').notNull(),
    repMin: tinyint('rep_min').notNull(),
    repMax: tinyint('rep_max').notNull(),
    restSec: smallint('rest_sec').notNull(),
  },
  (t) => ({
    byPlan: index('idx_plan_exercises_plan').on(t.planId, t.order),
  })
)

// ═══════════════════════════════════════════════════════════════════
// SESSIONS + SETS (logged workouts)
// ═══════════════════════════════════════════════════════════════════

export const sessions = mysqlTable(
  'sessions',
  {
    id: int('id').primaryKey().autoincrement(),
    userId: varchar('user_id', { length: 26 }).notNull(),
    planId: int('plan_id'),
    startedAt: timestamp('started_at').notNull(),
    finishedAt: timestamp('finished_at'),
    note: text('note'),
  },
  (t) => ({
    byUserStarted: index('idx_sessions_user_started').on(t.userId, t.startedAt),
  })
)

export const sessionSets = mysqlTable(
  'session_sets',
  {
    id: int('id').primaryKey().autoincrement(),
    sessionId: int('session_id').notNull(),
    exerciseId: int('exercise_id').notNull(),
    setIndex: tinyint('set_index').notNull(),
    weightKg: decimal('weight_kg', { precision: 5, scale: 2 }),
    reps: tinyint('reps'),
    rpe: tinyint('rpe'),
    completedAt: timestamp('completed_at').defaultNow(),
  },
  (t) => ({
    bySession: index('idx_session_sets_session').on(t.sessionId),
    byExercise: index('idx_session_sets_exercise_completed').on(
      t.exerciseId,
      t.completedAt
    ),
  })
)

// ═══════════════════════════════════════════════════════════════════
// MEASUREMENTS (weekly)
// ═══════════════════════════════════════════════════════════════════

export const measurements = mysqlTable(
  'measurements',
  {
    id: int('id').primaryKey().autoincrement(),
    userId: varchar('user_id', { length: 26 }).notNull(),
    weekStart: date('week_start').notNull(),
    weightKg: decimal('weight_kg', { precision: 5, scale: 2 }),
    waistCm: decimal('waist_cm', { precision: 4, scale: 1 }),
    chestCm: decimal('chest_cm', { precision: 4, scale: 1 }),
    thighCm: decimal('thigh_cm', { precision: 4, scale: 1 }),
    bicepsCm: decimal('biceps_cm', { precision: 4, scale: 1 }),
    targetKcal: smallint('target_kcal'),
    note: text('note'),
  },
  (t) => ({
    uniq: unique('uniq_user_week').on(t.userId, t.weekStart),
  })
)

// ═══════════════════════════════════════════════════════════════════
// NUTRITION (daily)
// ═══════════════════════════════════════════════════════════════════

export const nutritionDays = mysqlTable(
  'nutrition_days',
  {
    id: int('id').primaryKey().autoincrement(),
    userId: varchar('user_id', { length: 26 }).notNull(),
    date: date('date').notNull(),
    kcalActual: smallint('kcal_actual'),
    proteinG: smallint('protein_g'),
    note: text('note'),
  },
  (t) => ({
    uniq: unique('uniq_user_date').on(t.userId, t.date),
  })
)

// ═══════════════════════════════════════════════════════════════════
// BODY PHOTOS (M5 fills in data)
// ═══════════════════════════════════════════════════════════════════

export const bodyPhotos = mysqlTable(
  'body_photos',
  {
    id: int('id').primaryKey().autoincrement(),
    userId: varchar('user_id', { length: 26 }).notNull(),
    takenAt: date('taken_at').notNull(),
    weekStart: date('week_start'),
    pose: mysqlEnum('pose', ['front', 'side', 'back', 'other']).notNull(),
    storageKey: varchar('storage_key', { length: 255 }).notNull(),
    widthPx: smallint('width_px'),
    heightPx: smallint('height_px'),
    byteSize: int('byte_size'),
    note: text('note'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => ({
    byUserDate: index('idx_body_photos_user_date').on(t.userId, t.takenAt),
  })
)

// ═══════════════════════════════════════════════════════════════════
// XP EVENTS (M6 fills in data)
// ═══════════════════════════════════════════════════════════════════

export const xpEvents = mysqlTable(
  'xp_events',
  {
    id: int('id').primaryKey().autoincrement(),
    userId: varchar('user_id', { length: 26 }).notNull(),
    eventType: mysqlEnum('event_type', [
      'session_complete',
      'set_logged',
      'measurement_added',
      'photo_uploaded',
      'nutrition_logged',
      'pr_achieved',
      'streak_day',
    ]).notNull(),
    xpDelta: smallint('xp_delta').notNull(),
    sessionId: int('session_id'),
    meta: json('meta'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => ({
    byUserCreated: index('idx_xp_events_user_created').on(t.userId, t.createdAt),
  })
)
```

- [ ] **Step 2: Type check**

```bash
npx tsc --noEmit
```

Očekávané: žádné errory. Drizzle typy se vyřeší.

- [ ] **Step 3: Commit**

```bash
git add src/db/schema.ts
git commit -m "feat(m0): add full Drizzle schema with all 12 tables"
```

---

## Task 8: Generovat a aplikovat první migraci

**Files:**
- Create: `src/db/migrations/0000_*.sql` (auto-generated)

- [ ] **Step 1: Generovat SQL migraci**

```bash
npm run db:generate
```

Očekávané: vytvoří `src/db/migrations/0000_xxx.sql` + `src/db/migrations/meta/`. Číslo generuje drizzle-kit.

- [ ] **Step 2: Zkontrolovat obsah migrace**

Otevřít `src/db/migrations/0000_*.sql` a zběžně ověřit:
- `CREATE TABLE users (...)` s ULID ID
- `CREATE TABLE exercises (...)` s enum type
- `CREATE TABLE sessions (...)`, `session_sets`, atd.
- Indexy a unique constraints

- [ ] **Step 3: Aplikovat migraci na dev DB**

```bash
docker compose up -d  # pokud neběží
npm run db:migrate
```

Očekávané: `Migrations complete.` bez chyby.

- [ ] **Step 4: Ověřit tabulky v DB**

```bash
docker exec hexis-mysql mysql -uroot -pdev hexis -e "SHOW TABLES;"
```

Očekávané output: 12 řádků — `users`, `accounts`, `muscle_groups`, `exercises`, `exercise_muscle_groups`, `plans`, `plan_exercises`, `sessions`, `session_sets`, `measurements`, `nutrition_days`, `body_photos`, `xp_events`, `__drizzle_migrations`. (13 s drizzle tracking tabulkou.)

- [ ] **Step 5: Commit**

```bash
git add src/db/migrations/
git commit -m "feat(m0): generate and apply initial migration"
```

---

## Task 9: Seed — muscle_groups

**Files:**
- Create: `src/db/seed/muscle-groups.ts`

- [ ] **Step 1: Vytvořit seed data**

```typescript
// src/db/seed/muscle-groups.ts
import { DB } from '../client'
import { muscleGroups } from '../schema'

export const MUSCLE_GROUPS = [
  { slug: 'chest', name: 'Hrudník' },
  { slug: 'back-lats', name: 'Záda — Lats' },
  { slug: 'back-mid', name: 'Záda — střed' },
  { slug: 'back-rear-delt', name: 'Zadní ramena' },
  { slug: 'shoulders', name: 'Ramena' },
  { slug: 'biceps', name: 'Biceps' },
  { slug: 'triceps', name: 'Triceps' },
  { slug: 'forearms', name: 'Předloktí' },
  { slug: 'abs', name: 'Core / Břicho' },
  { slug: 'obliques', name: 'Šikmé břicho' },
  { slug: 'quads', name: 'Quadriceps' },
  { slug: 'hamstrings', name: 'Hamstringy' },
  { slug: 'glutes', name: 'Hýždě' },
  { slug: 'calves', name: 'Lýtka' },
  { slug: 'adductors', name: 'Přitahovače' },
] as const

export async function seedMuscleGroups(db: DB): Promise<void> {
  await db.insert(muscleGroups).values(MUSCLE_GROUPS)
}
```

- [ ] **Step 2: Commit**

```bash
git add src/db/seed/muscle-groups.ts
git commit -m "feat(m0): seed muscle groups (15 skupin)"
```

---

## Task 10: Seed — exercises catalog

**Files:**
- Create: `src/db/seed/exercises.ts`

- [ ] **Step 1: Vytvořit katalog cviků s M:N mapováním na svaly**

```typescript
// src/db/seed/exercises.ts
import { isNull } from 'drizzle-orm'
import { DB } from '../client'
import { exercises, muscleGroups, exerciseMuscleGroups } from '../schema'

type ExerciseSeed = {
  name: string
  type: 'barbell' | 'db' | 'cable' | 'machine' | 'bodyweight' | 'smith'
  primary: string      // muscle_groups.slug
  secondary?: string[] // muscle_groups.slug[]
}

export const EXERCISES: ExerciseSeed[] = [
  // UA — Upper A (silový)
  { name: 'Incline DB Press', type: 'db', primary: 'chest', secondary: ['shoulders', 'triceps'] },
  { name: 'Lat Pulldown (wide grip)', type: 'cable', primary: 'back-lats', secondary: ['biceps'] },
  { name: 'Seated DB Shoulder Press', type: 'db', primary: 'shoulders', secondary: ['triceps'] },
  { name: 'Seated Cable Row (neutral)', type: 'cable', primary: 'back-mid', secondary: ['biceps', 'back-rear-delt'] },
  { name: 'Cable Lateral Raises', type: 'cable', primary: 'shoulders' },
  { name: 'Barbell Curl', type: 'barbell', primary: 'biceps', secondary: ['forearms'] },
  { name: 'EZ Bar Curl', type: 'barbell', primary: 'biceps', secondary: ['forearms'] },
  { name: 'Incline DB Curl', type: 'db', primary: 'biceps' },
  { name: 'Overhead Triceps Extension', type: 'db', primary: 'triceps' },
  { name: 'Rear Delt Cable Fly', type: 'cable', primary: 'back-rear-delt' },

  // UB — Upper B (objemový)
  { name: 'Bench Press', type: 'barbell', primary: 'chest', secondary: ['shoulders', 'triceps'] },
  { name: 'Flat DB Press', type: 'db', primary: 'chest', secondary: ['shoulders', 'triceps'] },
  { name: 'Chest Supported Cable Row', type: 'cable', primary: 'back-mid', secondary: ['biceps'] },
  { name: 'Cable Chest Fly (low)', type: 'cable', primary: 'chest' },
  { name: 'Neutral Grip Pulldown', type: 'cable', primary: 'back-lats', secondary: ['biceps'] },
  { name: 'Cable Single Arm High Row', type: 'cable', primary: 'back-mid', secondary: ['back-rear-delt'] },
  { name: 'Cable Curl', type: 'cable', primary: 'biceps' },
  { name: 'Hammer Curl (DB)', type: 'db', primary: 'biceps', secondary: ['forearms'] },
  { name: 'Single Arm Triceps Pushdown', type: 'cable', primary: 'triceps' },

  // LA — Lower A (quad důraz)
  { name: 'Leg Press', type: 'machine', primary: 'quads', secondary: ['glutes', 'hamstrings'] },
  { name: 'Smith Machine Squat', type: 'smith', primary: 'quads', secondary: ['glutes', 'hamstrings'] },
  { name: 'Leg Extension', type: 'machine', primary: 'quads' },
  { name: 'Romanian Deadlift (DB)', type: 'db', primary: 'hamstrings', secondary: ['glutes', 'back-mid'] },
  { name: 'Standing Calf Raises', type: 'machine', primary: 'calves' },
  { name: 'Cable Crunch', type: 'cable', primary: 'abs' },
  { name: 'Plank', type: 'bodyweight', primary: 'abs', secondary: ['obliques'] },
  { name: 'Ab Wheel Rollout', type: 'bodyweight', primary: 'abs' },

  // LB — Lower B (hamstring důraz)
  { name: 'Romanian Deadlift (Barbell)', type: 'barbell', primary: 'hamstrings', secondary: ['glutes', 'back-mid'] },
  { name: 'Lying Leg Curl', type: 'machine', primary: 'hamstrings' },
  { name: 'Goblet Squat', type: 'db', primary: 'quads', secondary: ['glutes'] },
  { name: 'Hip Thrust', type: 'barbell', primary: 'glutes', secondary: ['hamstrings'] },
  { name: 'Hanging Knee Raise', type: 'bodyweight', primary: 'abs', secondary: ['obliques'] },
  { name: 'Dead Bug', type: 'bodyweight', primary: 'abs' },
]

export async function seedExercises(db: DB): Promise<void> {
  // 1) Insert všechny cviky (user_id = null → curated)
  for (const ex of EXERCISES) {
    await db.insert(exercises).values({
      userId: null,
      name: ex.name,
      type: ex.type,
    })
  }

  // 2) Načíst mapu slug → muscle_group.id
  const groups = await db.select().from(muscleGroups)
  const mgMap = new Map(groups.map((g) => [g.slug, g.id]))

  // 3) Načíst mapu name → exercise.id (curated only)
  const insertedExercises = await db.select().from(exercises).where(isNull(exercises.userId))
  const exMap = new Map(insertedExercises.map((e) => [e.name, e.id]))

  // 4) Insert exercise_muscle_groups s is_primary
  for (const ex of EXERCISES) {
    const exId = exMap.get(ex.name)
    if (!exId) throw new Error(`Exercise not found: ${ex.name}`)

    const primaryMgId = mgMap.get(ex.primary)
    if (!primaryMgId) throw new Error(`Muscle group not found: ${ex.primary}`)

    await db.insert(exerciseMuscleGroups).values({
      exerciseId: exId,
      muscleGroupId: primaryMgId,
      isPrimary: true,
    })

    for (const secSlug of ex.secondary ?? []) {
      const secMgId = mgMap.get(secSlug)
      if (!secMgId) throw new Error(`Muscle group not found: ${secSlug}`)

      await db.insert(exerciseMuscleGroups).values({
        exerciseId: exId,
        muscleGroupId: secMgId,
        isPrimary: false,
      })
    }
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/db/seed/exercises.ts
git commit -m "feat(m0): seed exercises catalog with muscle group mappings"
```

---

## Task 11: Seed — plans (UA/UB/LA/LB pro Jakuba)

**Files:**
- Create: `src/db/seed/plans.ts`

- [ ] **Step 1: Vytvořit plans seed**

```typescript
// src/db/seed/plans.ts
import { and, eq, isNull } from 'drizzle-orm'
import { DB } from '../client'
import { plans, planExercises, exercises } from '../schema'

// Seed plány jsou vázané na konkrétního uživatele. Pro M0 (pre-auth) použijeme
// placeholder userId. M1 (auth) zavede reálného usera a můžeme plány re-seedovat
// nebo updatnout. Alternativa: seed až za auth bootstrap.
export const SEED_USER_ID = '00000000000000000000000001' // ULID placeholder

type PlanExerciseSeed = {
  exerciseName: string
  targetSets: number
  repMin: number
  repMax: number
  restSec: number
}

type PlanSeed = {
  name: string
  slug: string
  order: number
  exercises: PlanExerciseSeed[]
}

export const PLANS: PlanSeed[] = [
  {
    name: 'Upper A — Silový',
    slug: 'UA',
    order: 1,
    exercises: [
      { exerciseName: 'Incline DB Press', targetSets: 4, repMin: 6, repMax: 8, restSec: 180 },
      { exerciseName: 'Lat Pulldown (wide grip)', targetSets: 4, repMin: 6, repMax: 8, restSec: 180 },
      { exerciseName: 'Seated DB Shoulder Press', targetSets: 3, repMin: 8, repMax: 10, restSec: 120 },
      { exerciseName: 'Seated Cable Row (neutral)', targetSets: 3, repMin: 8, repMax: 10, restSec: 120 },
      { exerciseName: 'Cable Lateral Raises', targetSets: 3, repMin: 12, repMax: 15, restSec: 60 },
      { exerciseName: 'Barbell Curl', targetSets: 3, repMin: 8, repMax: 10, restSec: 90 },
      { exerciseName: 'Incline DB Curl', targetSets: 3, repMin: 10, repMax: 12, restSec: 60 },
      { exerciseName: 'Overhead Triceps Extension', targetSets: 3, repMin: 8, repMax: 10, restSec: 90 },
      { exerciseName: 'Rear Delt Cable Fly', targetSets: 2, repMin: 15, repMax: 20, restSec: 60 },
    ],
  },
  {
    name: 'Upper B — Objemový',
    slug: 'UB',
    order: 3,
    exercises: [
      { exerciseName: 'Bench Press', targetSets: 4, repMin: 8, repMax: 12, restSec: 120 },
      { exerciseName: 'Chest Supported Cable Row', targetSets: 4, repMin: 10, repMax: 12, restSec: 120 },
      { exerciseName: 'Cable Chest Fly (low)', targetSets: 3, repMin: 12, repMax: 15, restSec: 60 },
      { exerciseName: 'Neutral Grip Pulldown', targetSets: 3, repMin: 8, repMax: 10, restSec: 120 },
      { exerciseName: 'Cable Single Arm High Row', targetSets: 3, repMin: 12, repMax: 15, restSec: 60 },
      { exerciseName: 'Cable Lateral Raises', targetSets: 3, repMin: 12, repMax: 15, restSec: 60 },
      { exerciseName: 'Cable Curl', targetSets: 3, repMin: 10, repMax: 12, restSec: 60 },
      { exerciseName: 'Hammer Curl (DB)', targetSets: 3, repMin: 10, repMax: 12, restSec: 60 },
      { exerciseName: 'Single Arm Triceps Pushdown', targetSets: 3, repMin: 12, repMax: 15, restSec: 60 },
    ],
  },
  {
    name: 'Lower A — Quad důraz',
    slug: 'LA',
    order: 2,
    exercises: [
      { exerciseName: 'Leg Press', targetSets: 4, repMin: 8, repMax: 12, restSec: 180 },
      { exerciseName: 'Smith Machine Squat', targetSets: 3, repMin: 8, repMax: 10, restSec: 120 },
      { exerciseName: 'Leg Extension', targetSets: 3, repMin: 12, repMax: 15, restSec: 60 },
      { exerciseName: 'Romanian Deadlift (DB)', targetSets: 3, repMin: 10, repMax: 12, restSec: 120 },
      { exerciseName: 'Standing Calf Raises', targetSets: 4, repMin: 15, repMax: 20, restSec: 60 },
      { exerciseName: 'Cable Crunch', targetSets: 3, repMin: 15, repMax: 20, restSec: 60 },
      { exerciseName: 'Plank', targetSets: 3, repMin: 30, repMax: 60, restSec: 60 },
      { exerciseName: 'Ab Wheel Rollout', targetSets: 3, repMin: 10, repMax: 15, restSec: 60 },
    ],
  },
  {
    name: 'Lower B — Hamstring důraz',
    slug: 'LB',
    order: 4,
    exercises: [
      { exerciseName: 'Romanian Deadlift (Barbell)', targetSets: 4, repMin: 8, repMax: 10, restSec: 180 },
      { exerciseName: 'Lying Leg Curl', targetSets: 4, repMin: 10, repMax: 12, restSec: 120 },
      { exerciseName: 'Goblet Squat', targetSets: 3, repMin: 12, repMax: 15, restSec: 120 },
      { exerciseName: 'Hip Thrust', targetSets: 3, repMin: 10, repMax: 12, restSec: 120 },
      { exerciseName: 'Leg Extension', targetSets: 3, repMin: 12, repMax: 15, restSec: 60 },
      { exerciseName: 'Standing Calf Raises', targetSets: 4, repMin: 15, repMax: 20, restSec: 60 },
      { exerciseName: 'Hanging Knee Raise', targetSets: 3, repMin: 15, repMax: 20, restSec: 60 },
      { exerciseName: 'Dead Bug', targetSets: 3, repMin: 10, repMax: 10, restSec: 60 },
    ],
  },
]

export async function seedPlans(db: DB): Promise<void> {
  // Načíst map name → exercise.id (curated cviky)
  const allExercises = await db.select().from(exercises).where(isNull(exercises.userId))
  const exMap = new Map(allExercises.map((e) => [e.name, e.id]))

  for (const p of PLANS) {
    const [plan] = await db.insert(plans).values({
      userId: SEED_USER_ID,
      name: p.name,
      slug: p.slug,
      order: p.order,
    }).$returningId()

    const planId = plan.id

    for (let i = 0; i < p.exercises.length; i++) {
      const pe = p.exercises[i]!
      const exId = exMap.get(pe.exerciseName)
      if (!exId) throw new Error(`Exercise not in catalog: ${pe.exerciseName}`)

      await db.insert(planExercises).values({
        planId,
        exerciseId: exId,
        order: i + 1,
        targetSets: pe.targetSets,
        repMin: pe.repMin,
        repMax: pe.repMax,
        restSec: pe.restSec,
      })
    }
  }
}
```

Poznámka: `SEED_USER_ID` je placeholder. V M1 (auth) tento řádek nahradíme skutečným `users.id` po bootstrap uživatele nebo plány znovu naseed po vytvoření usera. Drizzle pro MySQL podporuje `.$returningId()` pro získání auto-incremented ID po insertu.

- [ ] **Step 2: Commit**

```bash
git add src/db/seed/plans.ts
git commit -m "feat(m0): seed UA/UB/LA/LB plans for initial user"
```

---

## Task 12: Seed orchestrator + idempotence

**Files:**
- Create: `src/db/seed.ts`

- [ ] **Step 1: Vytvořit orchestrator**

```typescript
// src/db/seed.ts
import 'dotenv/config'
import { drizzle } from 'drizzle-orm/mysql2'
import mysql from 'mysql2/promise'
import * as schema from './schema'
import { seedMuscleGroups } from './seed/muscle-groups'
import { seedExercises } from './seed/exercises'
import { seedPlans } from './seed/plans'

async function main() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL required')

  const connection = await mysql.createConnection(url)
  const db = drizzle(connection, { schema, mode: 'default' })

  // Idempotence: check if seed už proběhl
  const [existing] = await db.select().from(schema.muscleGroups).limit(1)
  if (existing) {
    console.log('Seed already applied — muscle_groups table non-empty. Skipping.')
    console.log('  To re-seed: truncate tables manually, then re-run.')
    await connection.end()
    return
  }

  console.log('Seeding muscle_groups...')
  await seedMuscleGroups(db as any)

  console.log('Seeding exercises + muscle group mapping...')
  await seedExercises(db as any)

  console.log('Seeding plans (UA/UB/LA/LB)...')
  await seedPlans(db as any)

  console.log('Seed complete.')
  await connection.end()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
```

Pozn: `as any` pro `db` je kvůli tomu, že seed funkce přijímají zúžený typ `DB` z `client.ts`, ale tady používáme manuálně vytvořenou Drizzle instanci s rawou connection. Alternativa: exportovat factory z `client.ts`. Pro M0 stačí takto; při M1 refactoringu sjednotíme.

- [ ] **Step 2: Spustit seed**

```bash
npm run db:seed
```

Očekávané output:
```
Seeding muscle_groups...
Seeding exercises + muscle group mapping...
Seeding plans (UA/UB/LA/LB)...
Seed complete.
```

- [ ] **Step 3: Ověřit data v DB**

```bash
docker exec hexis-mysql mysql -uroot -pdev hexis -e "
SELECT COUNT(*) AS muscle_groups FROM muscle_groups;
SELECT COUNT(*) AS exercises FROM exercises;
SELECT COUNT(*) AS plans FROM plans;
SELECT COUNT(*) AS plan_exercises FROM plan_exercises;
SELECT COUNT(*) AS exercise_mg FROM exercise_muscle_groups;
"
```

Očekávané output:
```
muscle_groups: 15
exercises: ~33 (katalog)
plans: 4
plan_exercises: ~34 (součet všech cviků v UA+UB+LA+LB)
exercise_mg: >33 (každý cvik má 1 primary + případně secondary)
```

- [ ] **Step 4: Druhé spuštění (idempotence check)**

```bash
npm run db:seed
```

Očekávané output:
```
Seed already applied — muscle_groups table non-empty. Skipping.
  To re-seed: truncate tables manually, then re-run.
```

- [ ] **Step 5: Commit**

```bash
git add src/db/seed.ts
git commit -m "feat(m0): seed orchestrator with idempotence guard"
```

---

## Task 13: Vitest setup

**Files:**
- Create: `vitest.config.ts`, `src/tests/smoke.test.ts`
- Modify: `package.json`

- [ ] **Step 1: Nainstalovat Vitest**

```bash
npm install -D vitest @vitest/ui
```

- [ ] **Step 2: Vytvořit vitest.config.ts**

```typescript
import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

- [ ] **Step 3: Vytvořit sanity test**

```typescript
// src/tests/smoke.test.ts
import { describe, it, expect } from 'vitest'

describe('smoke', () => {
  it('runs', () => {
    expect(1 + 1).toBe(2)
  })
})
```

- [ ] **Step 4: Přidat test script do package.json**

Upravit `package.json` scripts — přidat:

```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",
    "test:ui": "vitest --ui"
  }
}
```

- [ ] **Step 5: Spustit test**

```bash
npm run test:run
```

Očekávané output: `✓ src/tests/smoke.test.ts > smoke > runs` — 1 passed.

- [ ] **Step 6: Commit**

```bash
git add vitest.config.ts src/tests/smoke.test.ts package.json package-lock.json
git commit -m "feat(m0): Vitest setup with smoke test"
```

---

## Task 14: Prettier + .editorconfig

**Files:**
- Create: `.prettierrc`, `.prettierignore`, `.editorconfig`
- Modify: `package.json`

- [ ] **Step 1: Nainstalovat Prettier**

```bash
npm install -D prettier
```

- [ ] **Step 2: Vytvořit .prettierrc**

```json
{
  "semi": false,
  "singleQuote": true,
  "trailingComma": "es5",
  "printWidth": 100,
  "tabWidth": 2,
  "arrowParens": "always",
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

- [ ] **Step 3: Nainstalovat Tailwind plugin pro Prettier**

```bash
npm install -D prettier-plugin-tailwindcss
```

- [ ] **Step 4: Vytvořit .prettierignore**

```
.next
node_modules
src/db/migrations
package-lock.json
*.md
```

- [ ] **Step 5: Vytvořit .editorconfig**

```ini
root = true

[*]
indent_style = space
indent_size = 2
end_of_line = lf
charset = utf-8
trim_trailing_whitespace = true
insert_final_newline = true

[*.md]
trim_trailing_whitespace = false
```

- [ ] **Step 6: Přidat format script**

V `package.json` scripts:

```json
{
  "scripts": {
    "format": "prettier --write .",
    "format:check": "prettier --check ."
  }
}
```

- [ ] **Step 7: Spustit format**

```bash
npm run format
```

Očekávané: Prettier přeformátuje existující soubory (hlavně TypeScript).

- [ ] **Step 8: Commit**

```bash
git add .prettierrc .prettierignore .editorconfig package.json package-lock.json
git add -u  # zachytit reformatované soubory
git commit -m "chore(m0): Prettier + editorconfig + format existing files"
```

---

## Task 15: Husky + lint-staged pre-commit hook

**Files:**
- Create: `.husky/pre-commit`, `lint-staged.config.js`
- Modify: `package.json`

- [ ] **Step 1: Nainstalovat husky + lint-staged**

```bash
npm install -D husky lint-staged
npx husky init
```

- [ ] **Step 2: Vytvořit lint-staged config**

```javascript
// lint-staged.config.js
export default {
  '*.{ts,tsx,js,jsx}': ['prettier --write', 'next lint --fix --file'],
  '*.{json,md,yml,yaml}': ['prettier --write'],
}
```

- [ ] **Step 3: Přepsat .husky/pre-commit**

Soubor vytvořený `npx husky init` přepsat na:

```bash
#!/usr/bin/env sh
npx lint-staged
npx tsc --noEmit
```

Zajistit executable:
```bash
chmod +x .husky/pre-commit
```

- [ ] **Step 4: Ověřit hook funguje**

Upravit libovolný TypeScript soubor (třeba vymazat pomlčku v komentáři a vrátit), přidat do stage, commit:

```bash
echo "// test" >> src/app/page.tsx
git add src/app/page.tsx
git commit -m "test: verify hook"
```

Očekávané: hook spustí prettier + tsc → commit projde. Poté vrátit změnu:

```bash
git reset --soft HEAD~1
git restore --staged src/app/page.tsx
git checkout src/app/page.tsx
```

- [ ] **Step 5: Commit final husky setup**

```bash
git add .husky/ lint-staged.config.js package.json package-lock.json
git commit -m "chore(m0): Husky pre-commit hook with lint-staged and typecheck"
```

---

## Task 16: Základní root layout + placeholder page

**Files:**
- Modify: `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`

- [ ] **Step 1: Přepsat src/app/layout.tsx**

```typescript
// src/app/layout.tsx
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Hexis',
  description: 'ἕξις — a stable state acquired through practice.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="cs" className="dark">
      <body className="bg-background text-foreground antialiased min-h-screen">
        {children}
      </body>
    </html>
  )
}
```

- [ ] **Step 2: Přepsat src/app/globals.css**

```css
@import 'tailwindcss';

@theme {
  --color-background: #0a0e14;
  --color-surface: #141a22;
  --color-border: #1f2733;
  --color-foreground: #e5e7eb;
  --color-muted: #6b7280;
  --color-primary: #10b981;
  --color-accent: #f59e0b;
  --color-danger: #ef4444;

  --font-sans:
    ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI',
    Roboto, 'Helvetica Neue', Arial, 'Inter', sans-serif;
}

html,
body {
  background: var(--color-background);
  color: var(--color-foreground);
  font-family: var(--font-sans);
}
```

Tailwind 4 `@theme` syntax definuje design tokeny jako CSS custom properties dostupné jako Tailwind utility class (`bg-background`, `text-foreground`, atd.).

- [ ] **Step 3: Přepsat src/app/page.tsx**

```typescript
// src/app/page.tsx
export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-semibold tracking-tight">Hexis</h1>
      <p className="mt-2 text-muted italic">
        ἕξις — a stable state acquired through practice.
      </p>
      <p className="mt-8 text-sm text-muted">
        M0 Foundation complete. Feature milestones build from here.
      </p>
    </main>
  )
}
```

- [ ] **Step 4: Spustit dev server a ověřit**

```bash
npm run dev
```

Otevřít `http://localhost:3000`. Očekávané: tmavě zelený background, bílý nápis "Hexis", pod ním řecký nápis + status v tlumené šedé. Stop server.

- [ ] **Step 5: Commit**

```bash
git add src/app/layout.tsx src/app/page.tsx src/app/globals.css
git commit -m "feat(m0): root layout with design tokens and placeholder homepage"
```

---

## Task 17: README setup instrukce

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Přepsat README.md**

```markdown
# Hexis

> ἕξις — a stable state acquired through practice. Your habits become your hexis.

PWA pro tracking transformace. Daily quests, XP, levely, měření, fotky, výživa — nástroj k dosažení vaší *arete*.

## Stav

**Fáze 1 — MVP, lokální dev.** Žádný production deploy.

**Aktuální milestone:** M0 Foundation (dokončeno). Další milestones: viz `docs/superpowers/roadmap/hexis-roadmap.md`.

## Tech stack

Next.js 15 (App Router) · React 19 · TypeScript · Tailwind 4 · Drizzle ORM · MySQL 8 · Vitest

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

### Reset DB

```bash
docker compose down -v   # smaže volume se všemi daty
docker compose up -d
# počkat na healthcheck
npm run db:migrate
npm run db:seed
```

## Docs

- `docs/superpowers/specs/2026-04-13-hexis-pwa-design.md` — MVP design spec
- `docs/superpowers/roadmap/hexis-roadmap.md` — living roadmap
- `docs/superpowers/plans/` — implementation plans per milestone
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs(m0): README with full setup instructions"
```

---

## Task 18: M0 verifikace + push

**Files:** (žádné změny — jen verifikace)

- [ ] **Step 1: Spustit kompletní sanity check**

```bash
# Zastavit cokoli co běží
# Clean state
docker compose down -v
docker compose up -d

# Počkat na healthcheck
sleep 20
docker compose ps  # obě healthy

# Full setup
npm install
npm run db:migrate
npm run db:seed

# Testy
npm run test:run
npm run typecheck
npm run lint
npm run build
```

Očekávané:
- `db:migrate` → Migrations complete
- `db:seed` → Seed complete
- `test:run` → smoke test passes
- `typecheck` → no errors
- `lint` → no errors
- `build` → Next.js build succeeds

- [ ] **Step 2: Ověřit DB state**

```bash
docker exec hexis-mysql mysql -uroot -pdev hexis -e "
SELECT 'users' AS t, COUNT(*) AS n FROM users UNION
SELECT 'muscle_groups', COUNT(*) FROM muscle_groups UNION
SELECT 'exercises', COUNT(*) FROM exercises UNION
SELECT 'exercise_muscle_groups', COUNT(*) FROM exercise_muscle_groups UNION
SELECT 'plans', COUNT(*) FROM plans UNION
SELECT 'plan_exercises', COUNT(*) FROM plan_exercises UNION
SELECT 'sessions', COUNT(*) FROM sessions UNION
SELECT 'session_sets', COUNT(*) FROM session_sets UNION
SELECT 'measurements', COUNT(*) FROM measurements UNION
SELECT 'nutrition_days', COUNT(*) FROM nutrition_days UNION
SELECT 'body_photos', COUNT(*) FROM body_photos UNION
SELECT 'xp_events', COUNT(*) FROM xp_events UNION
SELECT 'accounts', COUNT(*) FROM accounts;
"
```

Očekávané:
```
users: 0
muscle_groups: 15
exercises: ~33
exercise_muscle_groups: >33
plans: 4
plan_exercises: ~34
sessions: 0
session_sets: 0
measurements: 0
nutrition_days: 0
body_photos: 0
xp_events: 0
accounts: 0
```

- [ ] **Step 3: Push na GitHub**

```bash
git push origin main
```

Očekávané: `origin/main` updated.

- [ ] **Step 4: Update roadmap**

Otevřít `docs/superpowers/roadmap/hexis-roadmap.md` a přeznačit Fáze 1 Core položky jako hotové:

```markdown
### Core
- [x] Next.js 15 projekt setup + TypeScript strict
- [x] Docker Compose s MySQL 8 (dev + test instance)
- [x] Drizzle schema + migrace
- [x] Seed script (katalog ~50 cviků + UA/UB/LA/LB plány)
- [ ] NextAuth v5 (credentials + Google OAuth)   ← M1
- [ ] Middleware: security headers + rate limit   ← M1
- [x] Tailwind 4 + Radix primitivy + design tokens
```

(Položky označené ← M1 zůstávají nezaškrtnuté — řeší se v dalším plánu.)

- [ ] **Step 5: Commit roadmap update + push**

```bash
git add docs/superpowers/roadmap/hexis-roadmap.md
git commit -m "docs(m0): mark foundation tasks complete in roadmap"
git push origin main
```

---

## Definition of Done — M0

- [x] `npm run dev` → homepage vidět na localhost:3000
- [x] Docker Compose běží s MySQL 8 (dev + test instance)
- [x] Všech 12 tabulek existuje v DB (`SHOW TABLES;` vrací očekávaný seznam)
- [x] Seed nalil: 15 muscle_groups, ~33 exercises, 4 plans, ~34 plan_exercises
- [x] Idempotentní seed (druhé spuštění je no-op)
- [x] `npm run test:run` zelené
- [x] `npm run typecheck` bez chyb
- [x] `npm run lint` bez chyb
- [x] `npm run build` projde
- [x] Git hooks fungují (pre-commit spouští prettier + tsc)
- [x] README obsahuje plné setup instrukce
- [x] Vše commitnuto a pushnuto na origin/main

## Navazující milestone

**M1 — Auth.** Plán se napíše po completion M0. Bude zahrnovat:
- NextAuth v5 integrace
- Credentials provider (email + argon2id)
- Google OAuth
- Password reset flow
- Middleware pro security headers
- Rate limiting helper
- `users` bootstrap (CLI script na vytvoření prvního uživatele)
- Re-seed plans s reálným `user_id`
