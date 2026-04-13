# Hexis — MVP Design Spec

> ἕξις — a stable state acquired through practice. Your habits become your hexis.

**Status:** Draft for review
**Date:** 2026-04-13
**Author:** Jakub Sejda (s JARVIS)
**Phase:** 1 — single-user MVP, local dev only
**Domain:** `hexis.app` (TBD, not reserved yet)

## 1. Cíl a kontext

Hexis je PWA pro tracking transformace — nahrazuje Excel `Dashboard_final.xlsx` plnohodnotnou aplikací s RPG-like progresí (XP, levely, avatar, daily quests). Primární cíl MVP: hypertrofie. Uživatel: Jakub, ~66–67 kg, cíl *"řecká socha"* do léta s mini cutem v červnu. Plán: Upper/Lower split (UA/UB/LA/LB).

**Jméno** — Hexis je Aristotelův pojem pro *stabilní stav získaný opakovanou praxí*. Appka je nástroj k budování vaší hexis napříč doménami (trénink, výživa, měření, fotky, mindset).

**MVP = single user (Jakub), lokálně, bez deploymentu.** Architektura je ale připravená na rollout do public produktu (viz roadmap).

### Fáze rollout
1. **Fáze 1 (tento spec)** — MVP, lokální Docker, jeden user
2. **Fáze 2** — Hostinger Business deploy, multi-user, invite-only, offline-first
3. **Fáze 3** — Public, Stripe, landing
4. **Fáze 4** — Trainer mode (role)

## 2. Architektura

```
┌─────────────────────────────────────────────┐
│         iPhone / Desktop (PWA)              │
│        React 19 + Next.js 15 App Router     │
└──────────────────┬──────────────────────────┘
                   │ HTTPS (online-only)
┌──────────────────▼──────────────────────────┐
│    Local dev — Next.js (npm run dev)        │
│      → mysql2 / Drizzle                     │
│    MySQL 8 v Docker Compose (:3306)         │
└─────────────────────────────────────────────┘
```

### 2.1 Stack

| Vrstva | Volba | Poznámka |
|---|---|---|
| Framework | Next.js 15 (App Router) | SSR + API routes v jednom |
| UI | React 19 + TypeScript | strict mode |
| Styling | Tailwind 4 + Radix UI primitivy | žádná těžká UI knihovna |
| DB | MySQL 8 | Docker lokálně, Hostinger v prod |
| ORM | Drizzle | SQL-first, type-safe, lightweight |
| Auth | NextAuth v5 (Auth.js) | Credentials + Google OAuth |
| PWA | @serwist/next + serwist | manifest + SW |
| Forms | react-hook-form + zod | |
| Charts | Recharts | |
| Testing | Vitest + Playwright | |

### 2.2 Folder structure

```
hexis/
├── src/
│   ├── app/
│   │   ├── (auth)/              # login, reset password
│   │   ├── (app)/               # authenticated
│   │   │   ├── dashboard/
│   │   │   ├── workout/
│   │   │   ├── progress/
│   │   │   ├── plans/
│   │   │   ├── avatar/
│   │   │   └── settings/
│   │   └── api/                 # route handlers
│   ├── db/
│   │   ├── schema.ts
│   │   ├── migrations/
│   │   └── seed.ts
│   ├── components/
│   │   ├── ui/                  # Button, Input, Card (Radix + Tailwind)
│   │   └── workout/             # domain komponenty
│   ├── lib/
│   │   ├── auth.ts
│   │   ├── 1rm.ts
│   │   ├── plates.ts
│   │   ├── progression.ts
│   │   ├── stagnation.ts
│   │   ├── leveling.ts
│   │   ├── xp.ts
│   │   ├── storage.ts           # FileStorage interface + LocalFileStorage impl
│   │   └── validation.ts        # zod schemas
│   └── types/
├── public/
│   ├── manifest.json
│   ├── icons/
│   └── avatars/                 # tier-1.svg … tier-5.svg (placeholder)
├── uploads/                     # body photos (lokálně, mimo public)
├── docker-compose.yml
├── drizzle.config.ts
├── next.config.ts
└── package.json
```

### 2.3 Env proměnné (dev)

```
DATABASE_URL=mysql://root:dev@localhost:3306/hexis
AUTH_SECRET=<openssl rand -base64 32>
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
NEXTAUTH_URL=http://localhost:3000
STORAGE_ROOT=./uploads
```

### 2.4 Docker Compose

```yaml
services:
  mysql:
    image: mysql:8.0
    ports: ['3306:3306']
    environment:
      MYSQL_ROOT_PASSWORD: dev
      MYSQL_DATABASE: hexis
    volumes: ['mysql-data:/var/lib/mysql']
    healthcheck:
      test: ['CMD', 'mysqladmin', 'ping']
      interval: 5s

  mysql-test:
    image: mysql:8.0
    ports: ['3307:3306']
    environment:
      MYSQL_ROOT_PASSWORD: test
      MYSQL_DATABASE: hexis_test
    tmpfs: ['/var/lib/mysql']

volumes:
  mysql-data:
```

## 3. Datový model

### 3.1 ERD přehled

```
users ───┬── plans ── plan_exercises ── exercises ── exercise_mg ── muscle_groups
         ├── sessions ── session_sets
         ├── measurements
         ├── nutrition_days
         ├── body_photos
         ├── xp_events
         └── accounts (NextAuth OAuth)
```

### 3.2 Drizzle schéma

```typescript
// src/db/schema.ts

export const users = mysqlTable('users', {
  id: varchar('id', { length: 26 }).primaryKey(),          // ULID
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }), // null = OAuth-only
  name: varchar('name', { length: 100 }),
  level: tinyint('level').default(1).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const muscleGroups = mysqlTable('muscle_groups', {
  id: smallint('id').primaryKey().autoincrement(),
  slug: varchar('slug', { length: 32 }).notNull().unique(),
  name: varchar('name', { length: 64 }).notNull(),
})

export const exercises = mysqlTable('exercises', {
  id: int('id').primaryKey().autoincrement(),
  userId: varchar('user_id', { length: 26 }),              // null = curated
  name: varchar('name', { length: 128 }).notNull(),
  type: mysqlEnum('type', ['barbell','db','cable','machine','bodyweight','smith']).notNull(),
  videoUrl: varchar('video_url', { length: 500 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const exerciseMuscleGroups = mysqlTable('exercise_muscle_groups', {
  exerciseId: int('exercise_id').notNull(),
  muscleGroupId: smallint('muscle_group_id').notNull(),
  isPrimary: boolean('is_primary').default(false).notNull(),
}, (t) => ({ pk: primaryKey({ columns: [t.exerciseId, t.muscleGroupId] }) }))

export const plans = mysqlTable('plans', {
  id: int('id').primaryKey().autoincrement(),
  userId: varchar('user_id', { length: 26 }).notNull(),
  name: varchar('name', { length: 32 }).notNull(),         // "Upper A"
  slug: varchar('slug', { length: 16 }).notNull(),         // "UA"
  order: tinyint('order').notNull(),                       // rotation order
})

export const planExercises = mysqlTable('plan_exercises', {
  id: int('id').primaryKey().autoincrement(),
  planId: int('plan_id').notNull(),
  exerciseId: int('exercise_id').notNull(),
  order: tinyint('order').notNull(),
  targetSets: tinyint('target_sets').notNull(),
  repMin: tinyint('rep_min').notNull(),
  repMax: tinyint('rep_max').notNull(),
  restSec: smallint('rest_sec').notNull(),
})

export const sessions = mysqlTable('sessions', {
  id: int('id').primaryKey().autoincrement(),
  userId: varchar('user_id', { length: 26 }).notNull(),
  planId: int('plan_id'),                                  // null = ad-hoc
  startedAt: timestamp('started_at').notNull(),
  finishedAt: timestamp('finished_at'),
  note: text('note'),
}, (t) => ({ idx: index('idx_user_started').on(t.userId, t.startedAt) }))

export const sessionSets = mysqlTable('session_sets', {
  id: int('id').primaryKey().autoincrement(),
  sessionId: int('session_id').notNull(),
  exerciseId: int('exercise_id').notNull(),
  setIndex: tinyint('set_index').notNull(),
  weightKg: decimal('weight_kg', { precision: 5, scale: 2 }),
  reps: tinyint('reps'),
  rpe: tinyint('rpe'),
  completedAt: timestamp('completed_at').defaultNow(),
}, (t) => ({
  bySession: index('idx_session').on(t.sessionId),
  byExercise: index('idx_exercise_completed').on(t.exerciseId, t.completedAt),
}))

export const measurements = mysqlTable('measurements', {
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
}, (t) => ({ uniq: unique().on(t.userId, t.weekStart) }))

export const nutritionDays = mysqlTable('nutrition_days', {
  id: int('id').primaryKey().autoincrement(),
  userId: varchar('user_id', { length: 26 }).notNull(),
  date: date('date').notNull(),
  kcalActual: smallint('kcal_actual'),
  proteinG: smallint('protein_g'),
  note: text('note'),
}, (t) => ({ uniq: unique().on(t.userId, t.date) }))

export const bodyPhotos = mysqlTable('body_photos', {
  id: int('id').primaryKey().autoincrement(),
  userId: varchar('user_id', { length: 26 }).notNull(),
  takenAt: date('taken_at').notNull(),
  weekStart: date('week_start'),
  pose: mysqlEnum('pose', ['front','side','back','other']).notNull(),
  storageKey: varchar('storage_key', { length: 255 }).notNull(),
  widthPx: smallint('width_px'),
  heightPx: smallint('height_px'),
  byteSize: int('byte_size'),
  note: text('note'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({ idx: index('idx_user_date').on(t.userId, t.takenAt) }))

export const xpEvents = mysqlTable('xp_events', {
  id: int('id').primaryKey().autoincrement(),
  userId: varchar('user_id', { length: 26 }).notNull(),
  eventType: mysqlEnum('event_type', [
    'session_complete', 'set_logged', 'measurement_added',
    'photo_uploaded', 'nutrition_logged', 'pr_achieved', 'streak_day'
  ]).notNull(),
  xpDelta: smallint('xp_delta').notNull(),
  sessionId: int('session_id'),
  meta: json('meta'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({ idx: index('idx_user_created').on(t.userId, t.createdAt) }))

// NextAuth OAuth provider linking
// Tabulka kopíruje standard NextAuth v5 Account schema — finální column list
// převezmeme z @auth/drizzle-adapter při implementaci.
export const accounts = mysqlTable('accounts', {
  userId: varchar('user_id', { length: 26 }).notNull(),
  type: varchar('type', { length: 32 }).notNull(),            // 'oauth' | 'email' | ...
  provider: varchar('provider', { length: 32 }).notNull(),    // 'google', ...
  providerAccountId: varchar('provider_account_id', { length: 255 }).notNull(),
  refreshToken: text('refresh_token'),
  accessToken: text('access_token'),
  expiresAt: int('expires_at'),
  tokenType: varchar('token_type', { length: 32 }),
  scope: varchar('scope', { length: 255 }),
  idToken: text('id_token'),
  sessionState: varchar('session_state', { length: 255 }),
}, (t) => ({ pk: primaryKey({ columns: [t.provider, t.providerAccountId] }) }))
```

### 3.3 Klíčová designová rozhodnutí

- **`user_id` všude od dne 1** — multi-tenant ready, Fáze 2 beze změny schématu
- **Snapshot-free sessions** — `session_sets.exercise_id` drží vlastní ID, úprava plánu nemění historii
- **Kurátorovaný + custom katalog cviků** — `exercises.user_id = null` = global, jinak user-owned
- **ULID u users, autoincrement int jinde** — opaque ID jen tam kde jde o URL/cookie
- **Nutrition v samostatné tabulce** — ready pro D (food log) přidáním `meals` tabulky bez migrace
- **XP ledger, ne counter** — audit, undo-friendly, agregace přes SUM
- **Soft delete NE v MVP** — přidáme až bude GDPR relevantní (Fáze 3)

### 3.4 Indexy

- `exercises`: `(user_id, name)`
- `sessions`: `(user_id, started_at DESC)`
- `session_sets`: `(session_id)`, `(exercise_id, completed_at DESC)` — klíčové pro "minule jsi dal X"
- `measurements`: unique `(user_id, week_start)`
- `nutrition_days`: unique `(user_id, date)`
- `body_photos`: `(user_id, taken_at)`
- `plan_exercises`: `(plan_id, order)`
- `xp_events`: `(user_id, created_at)`

## 4. Core funkce

### 4.1 Workout logging

Hlavní denní flow. Pattern:

1. Dashboard navrhne dnešní trénink podle rotace (UA → LA → UB → LB) a historie
2. Tap "Začít trénink" → vytvoří `sessions` row s `plan_id` a `started_at = now`
3. Pro každý cvik: suggestion "minule jsi dal X" + cílový rozsah → zaznamenat série
4. Každý ✓ = okamžitý `POST /api/sets` (stav se neztratí)
5. Po cviku: rest timer (v Service Workeru, přežije tab switch)
6. "Dokončit trénink" → `finished_at = now`, XP award

**Fallback při výpadku netu:** POST selže → toast error, série disabled dokud se neuloží. Online-only acknowledged — v posilce bez netu appka nejede (Fáze 1 rozhodnutí).

### 4.2 Smart coach

**a) Suggestion "co dát dnes"** (`src/lib/progression.ts`)
- Double progression: pokud všechny série v předchozí session hit `rep_max` → +2.5 kg (barbell) / +1 kg (DB), reset na `rep_min`
- Jinak: stejná váha, +1 rep (cap na `rep_max`)
- 2+ týdny bez progrese → flag "stagnace" + návrh deloadu

**b) Grafy progrese** (`/progress/strength`)
- Line chart: 1RM odhad v čase per cvik
- Stacked bar: týdenní objem (sets × reps × weight) per svalová skupina
- Line chart: tělesná váha + míry v čase

**c) 1RM odhad** (`src/lib/1rm.ts`)
```typescript
export function estimate1RM(weight: number, reps: number): number {
  if (reps === 1) return weight
  const epley = weight * (1 + reps / 30)
  const brzycki = weight * 36 / (37 - reps)
  return Math.round((epley + brzycki) / 2 * 10) / 10
}
```

**d) Plate calculator** (`src/lib/plates.ts`) — input: target kg, barbell, dostupné talíře (konfigurovatelné v settings); output: talíře per stranu.

**e) Rest timer** — v Service Workeru, survives tab switch/screen lock. Audio + haptic + visual notifikace na konci.

**f) Export dat** — `/settings/export` → ZIP se CSV: sessions, sets, measurements, nutrition, photos metadata.

### 4.3 Měření (týdenní)

`/progress/body` — grid týden × metrika (weight, waist, chest, thigh, biceps, target_kcal, note). Inline edit, save on blur. Mini grafy nad tabulkou.

**Oproti Excelu fixed:**
- Delta váhy správným směrem (`Dn - Dn-1`, ne nekonzistentně)
- Null guard (IF guard na prázdné buňky)

### 4.4 Výživa (denní)

`/progress/nutrition` — měsíční kalendář s heat map (zelená = hit target, červená = mimo). Tap den → modal: kcal actual, protein g, note. Rychlý přístup z dashboardu.

Data model ready pro D (food log) přidáním `meals` tabulky.

### 4.5 Body photos

`/progress/photos` — 4 view modes:
- **Grid** — miniatury podle data
- **Timeline** — chronologicky s group po týdnech
- **Před × Po** — dva data side-by-side + overlay slider
- **Timelapse** — přehrát fotky jako video (speed 3/5/10s, pose filter)

**Upload flow:**
1. Client: HEIC → JPEG konverze (heic2any)
2. `POST /api/photos` (multipart, limit 10 MB)
3. Server: auth → sharp resize (max 2048×2048) → EXIF strip → thumbnail (400×400) → uložit přes `FileStorage.put()` → INSERT do `body_photos`
4. Response: `{ id, thumbUrl, fullUrl }`

**Storage strategie:**
```typescript
interface FileStorage {
  put(key: string, buffer: Buffer, mime: string): Promise<void>
  get(key: string): Promise<Buffer>
  delete(key: string): Promise<void>
  url(key: string): string
}
class LocalFileStorage implements FileStorage { /* ./uploads */ }
class S3FileStorage implements FileStorage { /* Fáze 2+ */ }
```

**Privacy:**
- Storage mimo webroot (`./uploads`, ne `./public`)
- Serving přes `/api/photos/[id]` s ownership check
- EXIF strip při uploadu
- Náhodná file names (UUID)
- `Cache-Control: private, no-store`

### 4.6 Muscle heatmap

Anatomická silueta (SVG, front + back view). Barvy:
- Červená = planned pro dnešní session
- Zelená = already done v této session
- Šedá = nezapojené

Týdenní heat map na dashboardu: intenzita barvy = objem per svalová skupina za posledních 7 dní. Mapování cvik → svaly přes `exercise_muscle_groups` (is_primary bit).

Implementace: vlastní SVG (100–200 řádků) nebo knihovna `react-body-highlighter` — volba při implementaci.

### 4.7 Avatar companion (RPG gamifikace)

**XP ekonomie:**

| Event | XP | Podmínka |
|---|---|---|
| Set logged | +5 | Dokončená série |
| Session complete | +100 | `finished_at` nastaveno |
| Measurement added | +20 | Nový weekly entry |
| Photo uploaded | +15 | Per fotka |
| Nutrition day logged | +10 | Per den |
| New PR | +50 bonus | 1RM odhad > dosavadní max |
| Streak day | +10 | Consecutive training day |

**Level curve** (`src/lib/leveling.ts`):
```typescript
export function xpToLevel(totalXp: number): number {
  return Math.max(1, Math.floor(Math.sqrt(totalXp / 100)) + 1)
}
export function xpForNextLevel(level: number): number {
  return level * level * 100
}
```

**Evoluční tiery:**
- Tier 1 (L1–5): Rookie
- Tier 2 (L6–15): Apprentice
- Tier 3 (L16–30): Warrior
- Tier 4 (L31–50): Beast
- Tier 5 (L51+): Titan

**Artwork strategie:** MVP ship s placeholder SVG (`public/avatars/tier-{1-5}.svg`), vlastní tvorba za pár hodin. Finální artwork = samostatný follow-up task v roadmap.

**Server flow:** `POST /api/sets` (a další writes) spočítá `xp_delta` → insert `xp_events` → vrátí nový total + level + levelup flag. Client zobrazí toast + mini animaci při levelupu.

## 5. UI struktura

### 5.1 Navigace

**Bottom tab bar na mobile** (5 tabů: Dashboard / Trénink / Progres / Avatar / Nastavení). Desktop (≥1024 px) přepne na sidebar vlevo.

### 5.2 Route mapa

```
/                           → redirect
(auth)
├─ /login
└─ (Fáze 2) /signup

(app) — auth required
├─ /dashboard
├─ /workout                 → buď CTA "Začít", nebo pokračování aktivního
│  └─ /workout/[sessionId]
├─ /progress
│  ├─ /progress/strength
│  ├─ /progress/body
│  ├─ /progress/photos
│  └─ /progress/nutrition
├─ /plans
│  ├─ /plans
│  └─ /plans/[slug]
├─ /avatar
└─ /settings
   ├─ /settings/profile
   ├─ /settings/plates
   ├─ /settings/export
   └─ /settings/account
```

### 5.3 Klíčové obrazovky

**Dashboard** — avatar + XP bar + streak; "Dnes: UA" CTA; rychlé metriky (váha, kcal, protein); tento týden splněno/zbývá.

**Active workout** — optimalizovaná pro gym: velké tap targety, auto-focus na první prázdné políčko, velký kontrastní rest timer, muscle map toggle (💪 ikona).

**Progress/photos** — tabs: Grid | Timeline | Před×Po | Timelapse. Pose filter, datum picker.

Detailní wireframy a komponentní dekompozice se finalizují v implementation planu — tento spec určuje rozsah a strukturu, ne pixel-přesné layouty.

### 5.4 Design language

**Tmavý režim default:**
```
Background:  #0A0E14
Surface:     #141A22
Border:      #1F2733
Primary:     #10B981 (emerald)
Accent:      #F59E0B (amber)
Danger:      #EF4444
Body text:   #E5E7EB
Muted:       #6B7280
```

**Typografie:** systémový stack (SF Pro / Segoe UI / Inter fallback). Žádný custom web font.

**Tap targety:** minimum 44×44 px (Apple HIG).

**Accessibility:** WCAG AA kontrast, focus states, `prefers-reduced-motion` respektováno, rest timer má visual + haptic + audio signály.

### 5.5 PWA

```
manifest.json:
  - name: "Hexis"
  - display: "standalone"
  - theme_color: "#0A0E14"
  - icons: 192, 512, maskable
  - orientation: "portrait"

iOS:
  - apple-touch-icon 180×180
  - splash screens per device

Service Worker (Serwist):
  - precache app shell
  - network-first /api/*
  - cache rest timer state v IndexedDB
```

## 6. Auth & bezpečnost

### 6.1 Auth stack

- **NextAuth v5** (Auth.js)
- **Credentials provider** (email + argon2id hash)
- **Google OAuth** (email-based account linking)
- **Session:** JWT v httpOnly cookie (`__Secure-authjs.session-token`), 30 dní rolling
- **Strategie:** stateless JWT (ne DB session) — Fáze 1 justifikace: single user, rychlejší, méně DB round-trips. Fáze 2+ přehodnotíme.

### 6.2 Password policy

```
Min length:  8 znaků
Required:    ≥1 velké písmeno, ≥1 číslo
Block list:  top 10k common (haveibeenpwned)
Reset flow:  email token, 1 hodina validita
```

Zod schema:
```typescript
export const passwordSchema = z.string()
  .min(8, 'Heslo musí mít alespoň 8 znaků')
  .regex(/[A-Z]/, 'Heslo musí obsahovat velké písmeno')
  .regex(/[0-9]/, 'Heslo musí obsahovat číslo')
```

### 6.3 Autorizace pattern

Každý API endpoint explicitně kontroluje ownership:
```typescript
export async function GET(req, { params }) {
  const session = await auth()
  if (!session?.user?.id) return unauthorized()

  const row = await db.query.sessions.findFirst({
    where: and(
      eq(sessions.id, Number(params.id)),
      eq(sessions.userId, session.user.id)   // OWNERSHIP
    )
  })
  if (!row) return notFound()                // ne 403 — leaked info
  return Response.json(row)
}
```

Helper `requireOwnership(table, id, userId)` konvergně napříč endpoints.

### 6.4 Security headers (middleware.ts)

```
CSP:                  default-src 'self'; img-src 'self' data:; script-src 'self';
                      style-src 'self' 'unsafe-inline'; connect-src 'self'
HSTS:                 max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options:      DENY
Referrer-Policy:      strict-origin-when-cross-origin
Permissions-Policy:   geolocation=(), microphone=(), camera=()
```

### 6.5 Rate limiting

In-memory sliding window (`src/lib/ratelimit.ts`) — Fáze 1 single-instance:
- `/api/auth/callback/credentials`: 5 / 15 min / IP
- `/api/auth/forgot-password`: 3 / hour / IP
- `/api/sets` a další: 100 / min / user

Fáze 2+: přesun do Redis / Upstash.

### 6.6 File upload safety

- Limit 10 MB server-side
- Magic bytes sniffing (ne extension)
- `sharp` reject invalidní bitmapy
- Storage mimo webroot
- UUID file names
- EXIF strip
- `Cache-Control: private, no-store`

### 6.7 Ostatní

- **SQL injection:** Drizzle parametrized queries only
- **XSS:** React default escape všeho user contentu; raw-HTML insert React API nepoužívat; markdown v notes přes rehype-sanitize s allow-listem
- **CSRF:** NextAuth forms pokryté + SameSite=Lax + Origin header check na vlastních endpoints
- **Secrets:** `.env.local` gitignored, `.env.example` committed s placeholders

### 6.8 Deferred do roadmapu

- Passkey (WebAuthn)
- 2FA (TOTP)
- OAuth Apple
- Security audit / pen test
- GDPR export + deletion endpoints

## 7. Testing

### 7.1 Pyramida

```
       E2E (~10)           Playwright, happy paths
       ─────────
   Integration (~30)       API routes + DB (Docker MySQL)
   ─────────────────
      Unit (~50)           Čisté funkce (1RM, progression, plates, XP)
```

### 7.2 Co testovat

**Unit — rigorózně:**
- `estimate1RM` — Epley, Brzycki, edge cases
- `suggestNextSet` — všechny větve double progression
- `detectStagnation`
- `calculatePlates` — různé konfigurace
- `xpToLevel`, `xpForNextLevel`
- `awardXp` — event → delta mapping

**Integration — kritické flow:**
- `POST /api/sets` → DB insert + XP event + return total
- `POST /api/sessions/complete` → `finished_at` + XP
- Auth: login → `/api/me` vrátí správného usera
- Ownership: cizí session → 404
- Rate limit: 6. failed login → block

**E2E — minimum:**
1. Signup → login → session → 2 sets → finish → history
2. Upload photo → grid → delete
3. Weekly measurement → graf
4. Mobile viewport: Dashboard → workout → log set (tap targety)

### 7.3 Stack

- **Unit + Integration:** Vitest + @testing-library/react
- **E2E:** Playwright
- **Test DB:** samostatná MySQL instance v docker-compose (tmpfs)

## 8. Dev workflow

### 8.1 Scripts

```json
{
  "dev":         "next dev --turbo",
  "build":       "next build",
  "start":       "next start",
  "db:push":     "drizzle-kit push",
  "db:generate": "drizzle-kit generate",
  "db:migrate":  "tsx src/db/migrate.ts",
  "db:seed":     "tsx src/db/seed.ts",
  "db:studio":   "drizzle-kit studio",
  "test":        "vitest",
  "test:e2e":    "playwright test",
  "typecheck":   "tsc --noEmit",
  "lint":        "next lint"
}
```

### 8.2 Hooks

- **pre-commit:** `lint-staged` (prettier + eslint) + `tsc --noEmit`
- **pre-push:** `npm test` (unit + integration)
- E2E manuálně před milestone

### 8.3 Observability

- **Logging:** pino structured, pretty v dev
- **Errors:** Fáze 1 jen log; Fáze 2+ Sentry

## 9. Definition of Done — MVP

- [ ] Všechny testy zelené
- [ ] `tsc --noEmit` bez chyb
- [ ] Lint clean
- [ ] Funkční end-to-end: dashboard → session → log → progress → photos → avatar
- [ ] Seed nalije katalog cviků + UA/UB/LA/LB plány
- [ ] Manuální QA: iPhone Safari + desktop Chrome
- [ ] PWA install test: iOS home screen + Chrome
- [ ] Spec + roadmap committed
- [ ] README se setup instrukcemi

## 10. Out of scope (explicitně)

Viz `docs/superpowers/roadmap/hexis-roadmap.md` pro kompletní seznam deferred features.

Z tohoto specu explicitně venku:
- Deployment na Hostinger (Fáze 2)
- Multi-user / registrace (Fáze 2)
- Offline-first sync (Fáze 2)
- Stripe billing / public product (Fáze 3)
- Trainer mode (Fáze 4)
- Procedurální silueta avatara B2 (deferred)
- 3D model avatara B4 (deferred)
- Food log D (deferred)
- Video cvičení, supersety, drop sets, cardio, mobility (deferred)

## 11. Otevřené otázky

Žádné v tomto momentě. Pokud na něco narazíme během implementace, přidá se k tomuto seznamu a vyřeší se před pokračováním.
