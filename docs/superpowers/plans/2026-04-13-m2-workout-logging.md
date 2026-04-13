# M2 — Core Workout Logging Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementovat jádro denního workout flow — dashboard, plán picker, active workout stepper (one-exercise-at-a-time), per-set suggestion engine, rest timer, plate calculator s user inventory, historie sessions s edit/delete, 12h auto-finish, XP eventy backend-only.

**Architecture:** Next.js 16 App Router + Server Components. API route handlers pro mutace, ownership přes `requireOwnership` (z M1). Business logic jako čisté funkce v `src/lib/` (progression, plates, 1rm, xp, session-auto-finish). Komponenty v `src/components/workout/` (domain) + `src/components/ui/` (primitives). State client-side jen lokální `useState`; rest timer přes localStorage + Screen Wake Lock API. Strict server-confirmed UI (žádný optimistic). Append-only XP ledger.

**Tech Stack:** Next.js 16.2.3, React 19.2.4, Drizzle ORM, MySQL 8, Vitest, Playwright (nový), @radix-ui/react-dialog (nový), @testing-library/react (nový pro komponentní unit testy — optional, preferuju E2E).

**Next.js 16 warning:** AGENTS.md upozorňuje na breaking changes. Route handler signature, params jako Promise, `useSearchParams` vyžaduje Suspense boundary. Před každou Next.js specifikou zkontroluj `node_modules/next/dist/docs/`.

**Spec:** `docs/superpowers/specs/2026-04-13-m2-workout-logging-design.md`

**Branch:** `m2-workout-logging` (odbočka z `m1-auth`, již vytvořena).

---

## File Structure

```
hexis/
├── package.json                                       # + @radix-ui/react-dialog, @playwright/test
├── playwright.config.ts                               # NEW
├── src/
│   ├── app/
│   │   ├── (app)/
│   │   │   ├── layout.tsx                             # MODIFY: bottom tab bar
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx                           # REWRITE: level+streak+CTA
│   │   │   ├── workout/
│   │   │   │   ├── page.tsx                           # NEW: plán picker + resume + history
│   │   │   │   └── [sessionId]/
│   │   │   │       └── page.tsx                       # NEW: stepper (running/readonly modes)
│   │   │   └── settings/
│   │   │       └── plates/
│   │   │           └── page.tsx                       # NEW: plate inventory CRUD
│   │   └── api/
│   │       ├── workout/
│   │       │   └── active/
│   │       │       └── route.ts                       # NEW: GET
│   │       ├── sessions/
│   │       │   ├── route.ts                           # NEW: POST, GET list
│   │       │   └── [id]/
│   │       │       ├── route.ts                       # NEW: GET, PATCH, DELETE
│   │       │       └── sets/
│   │       │           └── route.ts                   # NEW: POST
│   │       ├── sets/
│   │       │   └── [id]/
│   │       │       └── route.ts                       # NEW: PATCH, DELETE
│   │       ├── plates/
│   │       │   └── route.ts                           # NEW: GET, PUT
│   │       └── exercises/
│   │           └── route.ts                           # NEW: GET
│   ├── components/
│   │   ├── ui/
│   │   │   ├── BottomSheet.tsx                        # NEW
│   │   │   ├── NumberInput.tsx                        # NEW
│   │   │   ├── Toast.tsx                              # NEW
│   │   │   └── LongPress.tsx                          # NEW (hook)
│   │   └── workout/
│   │       ├── ResumeBanner.tsx                       # NEW
│   │       ├── PlanPicker.tsx                         # NEW
│   │       ├── SessionHistoryList.tsx                 # NEW
│   │       ├── ExerciseStepper.tsx                    # NEW
│   │       ├── ExerciseCard.tsx                       # NEW
│   │       ├── SetInput.tsx                           # NEW
│   │       ├── SetRow.tsx                             # NEW
│   │       ├── SuggestionHint.tsx                     # NEW
│   │       ├── RestTimer.tsx                          # NEW
│   │       ├── StepperNav.tsx                         # NEW
│   │       ├── AdHocAddButton.tsx                     # NEW
│   │       ├── ExercisePicker.tsx                     # NEW
│   │       ├── SessionSummary.tsx                     # NEW
│   │       ├── SessionDetailView.tsx                  # NEW
│   │       ├── EditSetSheet.tsx                       # NEW
│   │       └── PlateCalculatorSheet.tsx               # NEW
│   ├── db/
│   │   ├── schema.ts                                  # MODIFY: plateInventories, idx_user_finished
│   │   ├── bootstrap.ts                               # MODIFY: seedPlateInventory call
│   │   ├── migrations/
│   │   │   └── 0001_m2_plate_inventory.sql            # NEW
│   │   └── seed/
│   │       └── plate-inventory.ts                     # NEW
│   ├── lib/
│   │   ├── 1rm.ts                                     # NEW
│   │   ├── plates.ts                                  # NEW
│   │   ├── progression.ts                             # NEW
│   │   ├── xp-events.ts                               # NEW
│   │   ├── xp.ts                                      # NEW
│   │   ├── session-auto-finish.ts                     # NEW
│   │   └── rest-timer.ts                              # NEW
│   └── tests/
│       ├── workout/
│       │   ├── 1rm.test.ts                            # NEW
│       │   ├── plates.test.ts                         # NEW
│       │   ├── progression.test.ts                    # NEW
│       │   ├── xp.test.ts                             # NEW
│       │   ├── session-auto-finish.test.ts            # NEW
│       │   ├── api-sessions.test.ts                   # NEW
│       │   ├── api-sets.test.ts                       # NEW
│       │   ├── api-plates.test.ts                     # NEW
│       │   └── api-workout-active.test.ts             # NEW
└── tests/
    └── e2e/
        └── workout-flow.spec.ts                       # NEW (Playwright)
```

---

## Task 1: Verify branch + install deps

**Files:** `package.json`, `package-lock.json`

- [ ] **Step 1: Verify branch**

```bash
cd /Users/jakubsejda/SideProjects/hexis
git branch --show-current
```

Expected: `m2-workout-logging`

- [ ] **Step 2: Install runtime deps**

```bash
npm install @radix-ui/react-dialog
```

- [ ] **Step 3: Install dev deps**

```bash
npm install -D @playwright/test
npx playwright install chromium
```

- [ ] **Step 4: Verify**

```bash
npm list @radix-ui/react-dialog @playwright/test 2>&1 | head
```

Expected: versions printed.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json
git commit -m "feat(m2): install Radix Dialog + Playwright"
```

---

## Task 2: Schema — plate_inventories table + idx_user_finished

**Files:** `src/db/schema.ts`

- [ ] **Step 1: Add plateInventories table**

Append to `src/db/schema.ts` (after `xpEvents` block):

```typescript
// ═══════════════════════════════════════════════════════════════════
// PLATE INVENTORY (per-user equipment config)
// ═══════════════════════════════════════════════════════════════════

export const plateInventories = mysqlTable('plate_inventories', {
  userId: varchar('user_id', { length: 26 }).primaryKey(),
  barKg: decimal('bar_kg', { precision: 4, scale: 1 }).default('20').notNull(),
  plates: json('plates').$type<{ weightKg: number; pairs: number }[]>().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
})
```

- [ ] **Step 2: Add `idx_user_finished` index on `sessions`**

Modify `sessions` table definition — add to the indexes callback:

```typescript
export const sessions = mysqlTable(
  'sessions',
  { /* columns unchanged */ },
  (t) => ({
    byUserStarted: index('idx_sessions_user_started').on(t.userId, t.startedAt),
    byUserFinished: index('idx_sessions_user_finished').on(t.userId, t.finishedAt),
  })
)
```

- [ ] **Step 3: Generate migration**

```bash
npm run db:generate
```

Expected: new file `src/db/migrations/0001_<random_name>.sql` with `CREATE TABLE plate_inventories` and `CREATE INDEX idx_sessions_user_finished`.

- [ ] **Step 4: Rename migration for clarity**

```bash
mv src/db/migrations/0001_*.sql src/db/migrations/0001_m2_plate_inventory.sql
```

Then update the corresponding entry in `src/db/migrations/meta/_journal.json` (the `tag` field) to match the new filename (without `.sql`).

- [ ] **Step 5: Apply migration to dev DB**

```bash
docker compose up -d hexis-mysql
npm run db:migrate
```

Expected: no errors; new table exists. Verify:

```bash
docker compose exec hexis-mysql mysql -uroot -pdev hexis -e "SHOW TABLES LIKE 'plate_inventories'; SHOW INDEX FROM sessions WHERE Key_name='idx_sessions_user_finished';"
```

- [ ] **Step 6: Apply to test DB**

```bash
docker compose up -d hexis-mysql-test
DATABASE_URL="mysql://root:test@localhost:3308/hexis_test" npm run db:migrate
```

- [ ] **Step 7: Update truncate helper in login-flow test**

Add `'plate_inventories'` to the truncate table list in `src/tests/auth/login-flow.test.ts` (it'll be copy-pasted into new tests — fix the original too):

```typescript
for (const table of [
  'xp_events',
  'body_photos',
  'nutrition_days',
  'measurements',
  'session_sets',
  'sessions',
  'plan_exercises',
  'plans',
  'exercise_muscle_groups',
  'exercises',
  'muscle_groups',
  'plate_inventories',   // NEW
  'accounts',
  'users',
]) {
```

- [ ] **Step 8: Run existing tests to confirm no regression**

```bash
npm run test:run
```

Expected: all existing tests pass.

- [ ] **Step 9: Commit**

```bash
git add src/db/schema.ts src/db/migrations src/tests/auth/login-flow.test.ts
git commit -m "feat(m2): plate_inventories table + sessions finished index"
```

---

## Task 3: Seed plate inventory + bootstrap update

**Files:** `src/db/seed/plate-inventory.ts`, `src/db/bootstrap.ts`

- [ ] **Step 1: Create seed helper**

`src/db/seed/plate-inventory.ts`:

```typescript
import type { MySql2Database } from 'drizzle-orm/mysql2'
import { eq } from 'drizzle-orm'
import * as schema from '../schema'
import { plateInventories } from '../schema'

export const DEFAULT_PLATE_INVENTORY = {
  barKg: '20',
  plates: [
    { weightKg: 25, pairs: 2 },
    { weightKg: 20, pairs: 2 },
    { weightKg: 15, pairs: 2 },
    { weightKg: 10, pairs: 2 },
    { weightKg: 5, pairs: 2 },
    { weightKg: 2.5, pairs: 2 },
    { weightKg: 1.25, pairs: 2 },
  ],
} as const

export async function seedPlateInventory(
  db: MySql2Database<typeof schema>,
  userId: string
) {
  const existing = await db.query.plateInventories.findFirst({
    where: eq(plateInventories.userId, userId),
  })
  if (existing) return // idempotent
  await db.insert(plateInventories).values({
    userId,
    barKg: DEFAULT_PLATE_INVENTORY.barKg,
    plates: [...DEFAULT_PLATE_INVENTORY.plates],
  })
}
```

- [ ] **Step 2: Hook into bootstrap**

Open `src/db/bootstrap.ts` and add the import + call after `seedPlans(db, userId)`:

```typescript
import { seedPlateInventory } from './seed/plate-inventory'
// ...
await seedPlans(db, userId)
await seedPlateInventory(db, userId)
console.log('✓ Default plate inventory seeded')
```

- [ ] **Step 3: Verify**

Run bootstrap idempotently against a fresh user (manual — skip if already bootstrapped from M1):

```bash
# Only if fresh DB needed — not required for this task
```

Alternatively, connect in Drizzle Studio or CLI to the current user row and confirm no insert is attempted on re-run by invoking the helper manually:

```bash
npx tsx -e "import('./src/db/seed/plate-inventory.ts').then(m => console.log(m.DEFAULT_PLATE_INVENTORY))"
```

Expected: logs default inventory.

- [ ] **Step 4: Commit**

```bash
git add src/db/seed/plate-inventory.ts src/db/bootstrap.ts
git commit -m "feat(m2): seed default plate inventory on bootstrap"
```

---

## Task 4: xp-events constants + xp module

**Files:** `src/lib/xp-events.ts`, `src/lib/xp.ts`, `src/tests/workout/xp.test.ts`

- [ ] **Step 1: Write XP events constants**

`src/lib/xp-events.ts`:

```typescript
export const XP_DELTAS = {
  session_complete: 100,
  set_logged: 5,
  measurement_added: 20,
  photo_uploaded: 15,
  nutrition_logged: 10,
  pr_achieved: 50,
  streak_day: 10,
} as const

export type XpEventType = keyof typeof XP_DELTAS

export function xpToLevel(totalXp: number): number {
  return Math.max(1, Math.floor(Math.sqrt(totalXp / 100)) + 1)
}

export function xpForNextLevel(level: number): number {
  return level * level * 100
}
```

- [ ] **Step 2: Write unit tests**

`src/tests/workout/xp.test.ts`:

```typescript
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { drizzle, type MySql2Database } from 'drizzle-orm/mysql2'
import mysql from 'mysql2/promise'
import { eq } from 'drizzle-orm'
import * as schema from '@/db/schema'
import { users, xpEvents } from '@/db/schema'
import { hashPassword } from '@/lib/password'
import { newUlid } from '@/lib/ulid'
import { awardXp, getTotalXp, reverseXp } from '@/lib/xp'
import { xpToLevel } from '@/lib/xp-events'

describe('xp level curve', () => {
  it('level 1 at 0 xp', () => {
    expect(xpToLevel(0)).toBe(1)
  })

  it('level 2 at 100 xp', () => {
    expect(xpToLevel(100)).toBe(2)
  })

  it('level 3 at 400 xp', () => {
    expect(xpToLevel(400)).toBe(3)
  })

  it('level 5 at 1600 xp', () => {
    expect(xpToLevel(1600)).toBe(5)
  })
})

describe('awardXp + reverseXp (DB integration)', () => {
  const url = process.env.TEST_DATABASE_URL
  if (!url) throw new Error('TEST_DATABASE_URL required')

  let connection: mysql.Connection
  let db: MySql2Database<typeof schema>
  let userId: string

  beforeAll(async () => {
    connection = await mysql.createConnection(url)
    db = drizzle(connection, { schema, mode: 'default' })
  })

  afterAll(async () => {
    await connection.end()
  })

  beforeEach(async () => {
    await db.execute('SET FOREIGN_KEY_CHECKS = 0')
    await db.execute('TRUNCATE TABLE xp_events')
    await db.execute('TRUNCATE TABLE users')
    await db.execute('SET FOREIGN_KEY_CHECKS = 1')
    userId = newUlid()
    await db.insert(users).values({
      id: userId,
      email: `xp-${userId}@t.com`,
      passwordHash: await hashPassword('Abcd1234'),
      level: 1,
    })
  })

  it('awards set_logged +5 and returns new total', async () => {
    const r = await awardXp({ event: 'set_logged', db, userId })
    expect(r.xpDelta).toBe(5)
    expect(r.newTotalXp).toBe(5)
    expect(r.levelUp).toBe(false)
  })

  it('levelUp=true when crossing threshold', async () => {
    // seed 95 XP
    await db.insert(xpEvents).values({ userId, eventType: 'session_complete', xpDelta: 95 })
    const r = await awardXp({ event: 'set_logged', db, userId })
    expect(r.newTotalXp).toBe(100)
    expect(r.levelUp).toBe(true) // level 1 → 2
  })

  it('reverseXp appends negative event', async () => {
    await awardXp({ event: 'set_logged', db, userId })
    const r = await reverseXp({ event: 'set_logged', db, userId, sessionId: null })
    expect(r.xpDelta).toBe(-5)
    expect(r.newTotalXp).toBe(0)
  })

  it('getTotalXp sums across all events', async () => {
    await awardXp({ event: 'set_logged', db, userId })
    await awardXp({ event: 'set_logged', db, userId })
    await awardXp({ event: 'session_complete', db, userId })
    expect(await getTotalXp(db, userId)).toBe(110)
  })
})
```

- [ ] **Step 3: Run tests — expect failure**

```bash
TEST_DATABASE_URL="mysql://root:test@localhost:3308/hexis_test" npm run test:run -- src/tests/workout/xp.test.ts
```

Expected: failures ("awardXp is not defined"). Level curve tests may pass (no import from xp.ts).

- [ ] **Step 4: Implement xp module**

`src/lib/xp.ts`:

```typescript
import type { MySql2Database } from 'drizzle-orm/mysql2'
import { and, eq, sql } from 'drizzle-orm'
import * as schema from '@/db/schema'
import { users, xpEvents } from '@/db/schema'
import { XP_DELTAS, xpToLevel, type XpEventType } from './xp-events'

type DB = MySql2Database<typeof schema>

type AwardArgs = {
  event: XpEventType
  db: DB
  userId: string
  sessionId?: number | null
  meta?: Record<string, unknown>
}

export async function awardXp(args: AwardArgs) {
  const delta = XP_DELTAS[args.event]
  return appendXpEvent({ ...args, xpDelta: delta })
}

type ReverseArgs = {
  event: XpEventType
  db: DB
  userId: string
  sessionId: number | null
  meta?: Record<string, unknown>
}

export async function reverseXp(args: ReverseArgs) {
  const delta = -XP_DELTAS[args.event]
  return appendXpEvent({ ...args, xpDelta: delta })
}

async function appendXpEvent(args: {
  event: XpEventType
  db: DB
  userId: string
  sessionId?: number | null
  meta?: Record<string, unknown>
  xpDelta: number
}) {
  const totalBefore = await getTotalXp(args.db, args.userId)
  const levelBefore = xpToLevel(totalBefore)
  await args.db.insert(xpEvents).values({
    userId: args.userId,
    eventType: args.event,
    xpDelta: args.xpDelta,
    sessionId: args.sessionId ?? null,
    meta: args.meta ?? null,
  })
  const totalAfter = totalBefore + args.xpDelta
  const levelAfter = xpToLevel(totalAfter)
  if (levelAfter !== levelBefore) {
    await args.db
      .update(users)
      .set({ level: levelAfter })
      .where(eq(users.id, args.userId))
  }
  return {
    xpDelta: args.xpDelta,
    newTotalXp: totalAfter,
    levelUp: levelAfter > levelBefore,
  }
}

export async function getTotalXp(db: DB, userId: string): Promise<number> {
  const rows = await db
    .select({ total: sql<number>`COALESCE(SUM(${xpEvents.xpDelta}), 0)` })
    .from(xpEvents)
    .where(eq(xpEvents.userId, userId))
  return Number(rows[0]?.total ?? 0)
}
```

- [ ] **Step 5: Run tests — expect pass**

```bash
TEST_DATABASE_URL="mysql://root:test@localhost:3308/hexis_test" npm run test:run -- src/tests/workout/xp.test.ts
```

Expected: all pass.

- [ ] **Step 6: Commit**

```bash
git add src/lib/xp-events.ts src/lib/xp.ts src/tests/workout/xp.test.ts
git commit -m "feat(m2): XP append-only ledger with awardXp + reverseXp"
```

---

## Task 5: 1RM estimator

**Files:** `src/lib/1rm.ts`, `src/tests/workout/1rm.test.ts`

- [ ] **Step 1: Write tests**

`src/tests/workout/1rm.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { estimate1RM } from '@/lib/1rm'

describe('estimate1RM', () => {
  it('reps=1 returns weight', () => {
    expect(estimate1RM(100, 1)).toBe(100)
  })

  it('reps=5 at 100kg is ~112.5 (Epley+Brzycki avg)', () => {
    const v = estimate1RM(100, 5)
    expect(v).toBeGreaterThan(111)
    expect(v).toBeLessThan(114)
  })

  it('reps=10 at 60kg is ~80', () => {
    const v = estimate1RM(60, 10)
    expect(v).toBeGreaterThan(78)
    expect(v).toBeLessThan(82)
  })

  it('reps=0 returns 0', () => {
    expect(estimate1RM(100, 0)).toBe(0)
  })

  it('weight=0 returns 0', () => {
    expect(estimate1RM(0, 8)).toBe(0)
  })

  it('reps>=37 degrades gracefully (Brzycki undefined)', () => {
    // Brzycki divisor 37-reps → 0 when reps=37. Clamp.
    const v = estimate1RM(60, 40)
    expect(Number.isFinite(v)).toBe(true)
    expect(v).toBeGreaterThan(60)
  })
})
```

- [ ] **Step 2: Run — expect fail**

```bash
npm run test:run -- src/tests/workout/1rm.test.ts
```

- [ ] **Step 3: Implement**

`src/lib/1rm.ts`:

```typescript
/**
 * Estimate 1 Rep Max (1RM) from a weight × reps set.
 * Returns the average of Epley and Brzycki formulas, rounded to 0.1 kg.
 * Brzycki is undefined for reps >= 37; in that case we fall back to Epley alone.
 */
export function estimate1RM(weight: number, reps: number): number {
  if (weight <= 0 || reps <= 0) return 0
  if (reps === 1) return weight
  const epley = weight * (1 + reps / 30)
  if (reps >= 37) return Math.round(epley * 10) / 10
  const brzycki = (weight * 36) / (37 - reps)
  return Math.round(((epley + brzycki) / 2) * 10) / 10
}
```

- [ ] **Step 4: Run — expect pass**

```bash
npm run test:run -- src/tests/workout/1rm.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/1rm.ts src/tests/workout/1rm.test.ts
git commit -m "feat(m2): estimate1RM (Epley+Brzycki average)"
```

---

## Task 6: Plate calculator

**Files:** `src/lib/plates.ts`, `src/tests/workout/plates.test.ts`

- [ ] **Step 1: Write tests**

`src/tests/workout/plates.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { calculatePlates } from '@/lib/plates'

const IPF_20 = {
  bar: { weightKg: 20 },
  inventory: [
    { weightKg: 25, pairs: 2 },
    { weightKg: 20, pairs: 2 },
    { weightKg: 15, pairs: 2 },
    { weightKg: 10, pairs: 2 },
    { weightKg: 5, pairs: 2 },
    { weightKg: 2.5, pairs: 2 },
    { weightKg: 1.25, pairs: 2 },
  ],
}

describe('calculatePlates', () => {
  it('target == bar → empty plates', () => {
    const r = calculatePlates({ targetKg: 20, ...IPF_20 })
    expect(r.perSide).toEqual([])
    expect(r.missingKg).toBe(0)
  })

  it('target < bar throws', () => {
    expect(() => calculatePlates({ targetKg: 10, ...IPF_20 })).toThrow(/pod/)
  })

  it('60 kg on 20 kg bar → 20 per side', () => {
    const r = calculatePlates({ targetKg: 60, ...IPF_20 })
    expect(r.perSide).toEqual([{ weightKg: 20, count: 1 }])
    expect(r.missingKg).toBe(0)
  })

  it('100 kg on 20 kg bar → 25+10+5 per side', () => {
    const r = calculatePlates({ targetKg: 100, ...IPF_20 })
    expect(r.perSide).toEqual([
      { weightKg: 25, count: 1 },
      { weightKg: 10, count: 1 },
      { weightKg: 5, count: 1 },
    ])
  })

  it('140 kg on 20 kg bar → 25×2 + 10 per side', () => {
    const r = calculatePlates({ targetKg: 140, ...IPF_20 })
    expect(r.perSide).toEqual([
      { weightKg: 25, count: 2 },
      { weightKg: 10, count: 1 },
    ])
  })

  it('limits by available pairs', () => {
    const r = calculatePlates({
      targetKg: 100,
      bar: { weightKg: 20 },
      inventory: [{ weightKg: 25, pairs: 1 }, { weightKg: 15, pairs: 1 }],
    })
    // 25 + 15 = 40 per side → 100 kg exact
    expect(r.perSide).toEqual([
      { weightKg: 25, count: 1 },
      { weightKg: 15, count: 1 },
    ])
    expect(r.missingKg).toBe(0)
  })

  it('returns missingKg when inventory is insufficient', () => {
    const r = calculatePlates({
      targetKg: 100,
      bar: { weightKg: 20 },
      inventory: [{ weightKg: 10, pairs: 1 }],
    })
    // only 10 per side available → 40 kg total → missing 60
    expect(r.perSide).toEqual([{ weightKg: 10, count: 1 }])
    expect(r.missingKg).toBeCloseTo(60, 5)
  })

  it('15 kg women bar + 52.5 kg target → 20+2.5 + 15?', () => {
    // 52.5 - 15 = 37.5 per-side = 37.5/2 = 18.75
    // 15 + 2.5 + 1.25 = 18.75 per side
    const r = calculatePlates({
      targetKg: 52.5,
      bar: { weightKg: 15 },
      inventory: IPF_20.inventory,
    })
    expect(r.perSide).toEqual([
      { weightKg: 15, count: 1 },
      { weightKg: 2.5, count: 1 },
      { weightKg: 1.25, count: 1 },
    ])
    expect(r.missingKg).toBe(0)
  })
})
```

- [ ] **Step 2: Run — expect fail**

```bash
npm run test:run -- src/tests/workout/plates.test.ts
```

- [ ] **Step 3: Implement**

`src/lib/plates.ts`:

```typescript
export type PlateInventoryEntry = { weightKg: number; pairs: number }

export type CalculateArgs = {
  targetKg: number
  bar: { weightKg: number }
  inventory: PlateInventoryEntry[]
}

export type PlateResult = {
  perSide: Array<{ weightKg: number; count: number }>
  missingKg: number
}

/**
 * Greedy-fill plate calculator.
 * Takes target total weight, bar weight, and inventory (pairs available).
 * Returns plates per side (heaviest first) and missingKg if inventory is insufficient.
 */
export function calculatePlates(args: CalculateArgs): PlateResult {
  const { targetKg, bar, inventory } = args
  if (targetKg < bar.weightKg) {
    throw new Error(`Cílová váha ${targetKg} kg je pod váhou bar (${bar.weightKg} kg)`)
  }
  let remainder = (targetKg - bar.weightKg) / 2
  if (remainder <= 0) return { perSide: [], missingKg: 0 }

  const sorted = [...inventory].sort((a, b) => b.weightKg - a.weightKg)
  const perSide: PlateResult['perSide'] = []

  for (const plate of sorted) {
    if (remainder <= 0) break
    let used = 0
    // epsilon guard for float comparison (1.25 adds float error)
    while (used < plate.pairs && plate.weightKg <= remainder + 1e-6) {
      remainder -= plate.weightKg
      used += 1
    }
    if (used > 0) perSide.push({ weightKg: plate.weightKg, count: used })
  }

  const missingKg = remainder > 1e-6 ? Math.round(remainder * 2 * 100) / 100 : 0
  return { perSide, missingKg }
}
```

- [ ] **Step 4: Run — expect pass**

```bash
npm run test:run -- src/tests/workout/plates.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/plates.ts src/tests/workout/plates.test.ts
git commit -m "feat(m2): plate calculator with greedy inventory fill"
```

---

## Task 7: Suggestion engine (double progression + per-set re-eval)

**Files:** `src/lib/progression.ts`, `src/tests/workout/progression.test.ts`

- [ ] **Step 1: Write tests**

`src/tests/workout/progression.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { suggestNextSet } from '@/lib/progression'

const BARBELL_PLAN = {
  targetSets: 4,
  repMin: 6,
  repMax: 8,
  exerciseType: 'barbell' as const,
}

describe('suggestNextSet — first session (no history)', () => {
  it('prefills repMin and lets user set weight (weight=null)', () => {
    const r = suggestNextSet({
      history: [],
      planExercise: BARBELL_PLAN,
      currentSessionSets: [],
    })
    expect(r.weightKg).toBeNull()
    expect(r.reps).toBe(6)
    expect(r.reason).toMatch(/první/i)
  })
})

describe('suggestNextSet — start of session, with history', () => {
  it('all sets hit repMax → +2.5 kg, reset to repMin', () => {
    const r = suggestNextSet({
      history: [
        {
          startedAt: new Date(),
          sets: [
            { weightKg: 60, reps: 8 },
            { weightKg: 60, reps: 8 },
            { weightKg: 60, reps: 8 },
            { weightKg: 60, reps: 8 },
          ],
        },
      ],
      planExercise: BARBELL_PLAN,
      currentSessionSets: [],
    })
    expect(r.weightKg).toBe(62.5)
    expect(r.reps).toBe(6)
    expect(r.reason).toMatch(/progres/i)
  })

  it('partial hit → same weight, +1 rep capped at repMax', () => {
    const r = suggestNextSet({
      history: [
        {
          startedAt: new Date(),
          sets: [
            { weightKg: 60, reps: 8 },
            { weightKg: 60, reps: 7 },
            { weightKg: 60, reps: 7 },
            { weightKg: 60, reps: 7 },
          ],
        },
      ],
      planExercise: BARBELL_PLAN,
      currentSessionSets: [],
    })
    expect(r.weightKg).toBe(60)
    expect(r.reps).toBe(8)
  })

  it('last session degraded (below repMin) → same weight, repMin', () => {
    const r = suggestNextSet({
      history: [
        {
          startedAt: new Date(),
          sets: [
            { weightKg: 60, reps: 5 },
            { weightKg: 60, reps: 5 },
          ],
        },
      ],
      planExercise: BARBELL_PLAN,
      currentSessionSets: [],
    })
    expect(r.weightKg).toBe(60)
    expect(r.reps).toBe(6)
  })

  it('db increment is +1 kg (not 2.5)', () => {
    const r = suggestNextSet({
      history: [
        {
          startedAt: new Date(),
          sets: [
            { weightKg: 20, reps: 8 },
            { weightKg: 20, reps: 8 },
            { weightKg: 20, reps: 8 },
            { weightKg: 20, reps: 8 },
          ],
        },
      ],
      planExercise: { ...BARBELL_PLAN, exerciseType: 'db' },
      currentSessionSets: [],
    })
    expect(r.weightKg).toBe(21)
  })

  it('bodyweight: weight=null, reps only', () => {
    const r = suggestNextSet({
      history: [
        {
          startedAt: new Date(),
          sets: [
            { weightKg: null, reps: 10 },
            { weightKg: null, reps: 10 },
          ],
        },
      ],
      planExercise: { targetSets: 3, repMin: 8, repMax: 12, exerciseType: 'bodyweight' },
      currentSessionSets: [],
    })
    expect(r.weightKg).toBeNull()
    expect(r.reps).toBe(11)
  })
})

describe('suggestNextSet — per-set re-eval within current session', () => {
  it('previous set hit target → next set same weight same reps', () => {
    const r = suggestNextSet({
      history: [
        {
          startedAt: new Date(),
          sets: [{ weightKg: 60, reps: 8 }, { weightKg: 60, reps: 8 }, { weightKg: 60, reps: 8 }, { weightKg: 60, reps: 8 }],
        },
      ],
      planExercise: BARBELL_PLAN,
      currentSessionSets: [{ setIndex: 0, weightKg: 62.5, reps: 8 }],
    })
    expect(r.weightKg).toBe(62.5)
    expect(r.reps).toBe(6) // target of suggestion remains plan repMin after progression (design choice) — we keep target
  })

  it('previous set RPE 10 and below repMin → down-target weight', () => {
    const r = suggestNextSet({
      history: [
        {
          startedAt: new Date(),
          sets: [{ weightKg: 60, reps: 8 }, { weightKg: 60, reps: 8 }, { weightKg: 60, reps: 8 }, { weightKg: 60, reps: 8 }],
        },
      ],
      planExercise: BARBELL_PLAN,
      currentSessionSets: [{ setIndex: 0, weightKg: 62.5, reps: 4, rpe: 10 }],
    })
    expect(r.weightKg).toBe(60) // down-weight by 1 increment
    expect(r.reason).toMatch(/down/i)
  })

  it('previous set at/above repMin → keep same', () => {
    const r = suggestNextSet({
      history: [
        {
          startedAt: new Date(),
          sets: [{ weightKg: 60, reps: 8 }, { weightKg: 60, reps: 8 }, { weightKg: 60, reps: 8 }, { weightKg: 60, reps: 8 }],
        },
      ],
      planExercise: BARBELL_PLAN,
      currentSessionSets: [{ setIndex: 0, weightKg: 62.5, reps: 6 }],
    })
    expect(r.weightKg).toBe(62.5)
  })
})

describe('suggestNextSet — ad-hoc exercise (no plan)', () => {
  it('without planExercise and without history → empty suggestion', () => {
    const r = suggestNextSet({
      history: [],
      planExercise: null,
      currentSessionSets: [],
    })
    expect(r.weightKg).toBeNull()
    expect(r.reps).toBeNull()
    expect(r.reason).toMatch(/ad-hoc|nová/i)
  })

  it('ad-hoc with history uses last session as anchor', () => {
    const r = suggestNextSet({
      history: [
        {
          startedAt: new Date(),
          sets: [{ weightKg: 30, reps: 10 }, { weightKg: 30, reps: 10 }],
        },
      ],
      planExercise: null,
      currentSessionSets: [],
    })
    expect(r.weightKg).toBe(30)
    expect(r.reps).toBe(10)
  })
})
```

- [ ] **Step 2: Run — expect fail**

```bash
npm run test:run -- src/tests/workout/progression.test.ts
```

- [ ] **Step 3: Implement**

`src/lib/progression.ts`:

```typescript
export type ExerciseType = 'barbell' | 'db' | 'cable' | 'machine' | 'bodyweight' | 'smith'

export type HistorySet = {
  weightKg: number | null
  reps: number | null
  rpe?: number | null
}

export type HistorySession = {
  startedAt: Date
  sets: HistorySet[]
}

export type PlanSnapshot = {
  targetSets: number
  repMin: number
  repMax: number
  exerciseType: ExerciseType
}

export type CurrentSet = {
  setIndex: number
  weightKg: number | null
  reps: number | null
  rpe?: number | null
}

export type Suggestion = {
  weightKg: number | null
  reps: number | null
  reason: string
}

export type SuggestArgs = {
  history: HistorySession[]        // last ~3 sessions, newest first
  planExercise: PlanSnapshot | null // null = ad-hoc
  currentSessionSets: CurrentSet[] // sets already logged in THIS session, this exercise
}

function incrementFor(type: ExerciseType): number {
  switch (type) {
    case 'db':
      return 1
    case 'bodyweight':
      return 0
    default:
      return 2.5
  }
}

export function suggestNextSet(args: SuggestArgs): Suggestion {
  const { history, planExercise, currentSessionSets } = args
  const last = history[0]

  // 1. Ad-hoc (no plan)
  if (!planExercise) {
    if (!last || last.sets.length === 0) {
      return { weightKg: null, reps: null, reason: 'Nová série — nastav sám' }
    }
    const lastSet = last.sets[last.sets.length - 1]!
    return {
      weightKg: lastSet.weightKg,
      reps: lastSet.reps,
      reason: 'Ad-hoc: podle minulé série',
    }
  }

  const inc = incrementFor(planExercise.exerciseType)
  const isBodyweight = planExercise.exerciseType === 'bodyweight'

  // 2. Mid-session re-eval
  if (currentSessionSets.length > 0) {
    const prev = currentSessionSets[currentSessionSets.length - 1]!
    const prevReps = prev.reps ?? 0
    const prevWeight = prev.weightKg
    const hardRpe = (prev.rpe ?? 0) >= 10
    if (hardRpe && prevReps < planExercise.repMin) {
      const downWeight = prevWeight !== null ? Math.max(0, prevWeight - inc) : null
      return {
        weightKg: isBodyweight ? null : downWeight,
        reps: planExercise.repMin,
        reason: 'Down-target: předchozí série RPE 10 pod repMin',
      }
    }
    return {
      weightKg: prevWeight,
      reps: prevReps >= planExercise.repMin ? prevReps : planExercise.repMin,
      reason: 'Navazuj na předchozí sérii',
    }
  }

  // 3. Start of session, no history
  if (!last || last.sets.length === 0) {
    return {
      weightKg: null,
      reps: planExercise.repMin,
      reason: 'První session — nastav váhu sám',
    }
  }

  // 4. Start of session, with history → double progression
  const allHitMax = last.sets.every((s) => (s.reps ?? 0) >= planExercise.repMax)
  const lastWeight = last.sets[0]?.weightKg ?? null

  if (allHitMax) {
    const bumped = isBodyweight
      ? null
      : lastWeight !== null
        ? Math.round((lastWeight + inc) * 100) / 100
        : null
    return {
      weightKg: bumped,
      reps: planExercise.repMin,
      reason: `Progres: všechny série hit ${planExercise.repMax}, +${inc} kg`,
    }
  }

  // partial: same weight, bump reps by 1 (capped)
  const topReps = Math.max(...last.sets.map((s) => s.reps ?? 0))
  const anyBelowMin = last.sets.some((s) => (s.reps ?? 0) < planExercise.repMin)

  if (anyBelowMin) {
    return {
      weightKg: lastWeight,
      reps: planExercise.repMin,
      reason: 'Restart: minule pod repMin',
    }
  }

  return {
    weightKg: lastWeight,
    reps: Math.min(topReps + 1, planExercise.repMax),
    reason: 'Navazuj: +1 rep',
  }
}
```

- [ ] **Step 4: Run — expect pass**

```bash
npm run test:run -- src/tests/workout/progression.test.ts
```

Some test expectations may need adjustment — resolve any mismatches in this step, editing either the test or implementation to match the spec (double progression behavior). **Do not** skip failing tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/progression.ts src/tests/workout/progression.test.ts
git commit -m "feat(m2): suggestion engine with double progression + per-set re-eval"
```

---

## Task 8: Session auto-finish

**Files:** `src/lib/session-auto-finish.ts`, `src/tests/workout/session-auto-finish.test.ts`

- [ ] **Step 1: Write tests**

`src/tests/workout/session-auto-finish.test.ts`:

```typescript
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { drizzle, type MySql2Database } from 'drizzle-orm/mysql2'
import mysql from 'mysql2/promise'
import { and, eq, isNull } from 'drizzle-orm'
import * as schema from '@/db/schema'
import { users, sessions, sessionSets, xpEvents } from '@/db/schema'
import { hashPassword } from '@/lib/password'
import { newUlid } from '@/lib/ulid'
import { checkAndFinishStaleSessions } from '@/lib/session-auto-finish'

const TWELVE_H_MS = 12 * 3600 * 1000

describe('checkAndFinishStaleSessions', () => {
  const url = process.env.TEST_DATABASE_URL
  if (!url) throw new Error('TEST_DATABASE_URL required')

  let connection: mysql.Connection
  let db: MySql2Database<typeof schema>
  let userId: string

  beforeAll(async () => {
    connection = await mysql.createConnection(url)
    db = drizzle(connection, { schema, mode: 'default' })
  })

  afterAll(async () => {
    await connection.end()
  })

  beforeEach(async () => {
    await db.execute('SET FOREIGN_KEY_CHECKS = 0')
    for (const t of ['xp_events', 'session_sets', 'sessions', 'users']) {
      await db.execute(`TRUNCATE TABLE \`${t}\``)
    }
    await db.execute('SET FOREIGN_KEY_CHECKS = 1')
    userId = newUlid()
    await db.insert(users).values({
      id: userId,
      email: `af-${userId}@t.com`,
      passwordHash: await hashPassword('Abcd1234'),
      level: 1,
    })
  })

  it('session <12h stays open', async () => {
    const startedAt = new Date(Date.now() - 2 * 3600 * 1000)
    await db.insert(sessions).values({ userId, startedAt, finishedAt: null })
    await checkAndFinishStaleSessions(userId, db)
    const rows = await db.select().from(sessions).where(eq(sessions.userId, userId))
    expect(rows[0]?.finishedAt).toBeNull()
  })

  it('session >12h with sets → finishedAt = MAX(session_sets.completedAt)', async () => {
    const startedAt = new Date(Date.now() - TWELVE_H_MS - 3600 * 1000)
    const [{ insertId }] = (await db.insert(sessions).values({ userId, startedAt })) as unknown as [{ insertId: number }]
    const sessionId = insertId
    const lastSetTime = new Date(startedAt.getTime() + 1800 * 1000) // 30 min in
    await db.insert(sessionSets).values({
      sessionId,
      exerciseId: 999,
      setIndex: 0,
      weightKg: '60.00',
      reps: 8,
      completedAt: lastSetTime,
    })
    await checkAndFinishStaleSessions(userId, db)
    const [row] = await db.select().from(sessions).where(eq(sessions.id, sessionId))
    expect(row?.finishedAt).toEqual(lastSetTime)
  })

  it('session >12h with no sets → finishedAt = startedAt + 1h', async () => {
    const startedAt = new Date(Date.now() - TWELVE_H_MS - 3600 * 1000)
    const [{ insertId }] = (await db.insert(sessions).values({ userId, startedAt })) as unknown as [{ insertId: number }]
    await checkAndFinishStaleSessions(userId, db)
    const [row] = await db.select().from(sessions).where(eq(sessions.id, insertId))
    expect(row?.finishedAt).toEqual(new Date(startedAt.getTime() + 3600 * 1000))
  })

  it('awards session_complete XP on auto-finish', async () => {
    const startedAt = new Date(Date.now() - TWELVE_H_MS - 3600 * 1000)
    await db.insert(sessions).values({ userId, startedAt })
    await checkAndFinishStaleSessions(userId, db)
    const events = await db.select().from(xpEvents).where(eq(xpEvents.userId, userId))
    const complete = events.find((e) => e.eventType === 'session_complete')
    expect(complete?.xpDelta).toBe(100)
  })

  it('idempotent — second call does nothing', async () => {
    const startedAt = new Date(Date.now() - TWELVE_H_MS - 3600 * 1000)
    await db.insert(sessions).values({ userId, startedAt })
    await checkAndFinishStaleSessions(userId, db)
    await checkAndFinishStaleSessions(userId, db)
    const events = await db.select().from(xpEvents).where(eq(xpEvents.userId, userId))
    expect(events.filter((e) => e.eventType === 'session_complete').length).toBe(1)
  })
})
```

- [ ] **Step 2: Run — expect fail**

```bash
TEST_DATABASE_URL="mysql://root:test@localhost:3308/hexis_test" npm run test:run -- src/tests/workout/session-auto-finish.test.ts
```

- [ ] **Step 3: Implement**

`src/lib/session-auto-finish.ts`:

```typescript
import type { MySql2Database } from 'drizzle-orm/mysql2'
import { and, desc, eq, isNull, lt } from 'drizzle-orm'
import * as schema from '@/db/schema'
import { sessions, sessionSets } from '@/db/schema'
import { awardXp } from './xp'

type DB = MySql2Database<typeof schema>

const TWELVE_H_MS = 12 * 3600 * 1000
const FALLBACK_DURATION_MS = 3600 * 1000

/**
 * Lazy auto-finish of sessions older than 12 hours.
 * Called from GET /api/workout/active, POST /api/sessions, and dashboard SSR.
 * Idempotent — the UPDATE WHERE finishedAt IS NULL guards against races.
 */
export async function checkAndFinishStaleSessions(userId: string, db: DB) {
  const threshold = new Date(Date.now() - TWELVE_H_MS)
  const stale = await db
    .select()
    .from(sessions)
    .where(and(eq(sessions.userId, userId), isNull(sessions.finishedAt), lt(sessions.startedAt, threshold)))

  for (const s of stale) {
    const lastSet = await db.query.sessionSets.findFirst({
      where: eq(sessionSets.sessionId, s.id),
      orderBy: desc(sessionSets.completedAt),
    })
    const finishedAt = lastSet?.completedAt ?? new Date(s.startedAt.getTime() + FALLBACK_DURATION_MS)

    const result = await db
      .update(sessions)
      .set({ finishedAt })
      .where(and(eq(sessions.id, s.id), isNull(sessions.finishedAt)))

    // Drizzle mysql2: no affectedRows directly; re-query if idempotence needed
    // Here we attempt XP award only when UPDATE touched a row — detect via refetch
    const [refetched] = await db.select().from(sessions).where(eq(sessions.id, s.id))
    if (refetched?.finishedAt?.getTime() === finishedAt.getTime()) {
      // Prevent duplicate XP: check xp_events for existing session_complete
      // Simplest approach: check XP event count with sessionId filter
      const already = await db.query.xpEvents.findFirst({
        where: (xp, { and, eq }) =>
          and(eq(xp.userId, userId), eq(xp.sessionId, s.id), eq(xp.eventType, 'session_complete')),
      })
      if (!already) {
        await awardXp({ event: 'session_complete', db, userId, sessionId: s.id })
      }
    }
  }
}
```

- [ ] **Step 4: Run — expect pass**

```bash
TEST_DATABASE_URL="mysql://root:test@localhost:3308/hexis_test" npm run test:run -- src/tests/workout/session-auto-finish.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/session-auto-finish.ts src/tests/workout/session-auto-finish.test.ts
git commit -m "feat(m2): lazy 12h session auto-finish with XP award"
```

---

## Task 9: Rest-timer client helpers

**Files:** `src/lib/rest-timer.ts`

> The timer is pure client state; no DB. We write helpers that read/write localStorage + expose a subscribable store for `useSyncExternalStore`.

- [ ] **Step 1: Implement**

`src/lib/rest-timer.ts`:

```typescript
const KEY = 'hexis:rest-timer'

export type TimerState = {
  startedAt: number    // Date.now() at start
  durationMs: number
} | null

type Listener = () => void
const listeners = new Set<Listener>()

function readStorage(): TimerState {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as TimerState
    if (!parsed) return null
    // expired? clean up
    if (Date.now() > parsed.startedAt + parsed.durationMs) {
      window.localStorage.removeItem(KEY)
      return null
    }
    return parsed
  } catch {
    return null
  }
}

function writeStorage(state: TimerState) {
  if (typeof window === 'undefined') return
  if (state === null) {
    window.localStorage.removeItem(KEY)
  } else {
    window.localStorage.setItem(KEY, JSON.stringify(state))
  }
  listeners.forEach((l) => l())
}

export const restTimerStore = {
  start(durationSec: number) {
    writeStorage({ startedAt: Date.now(), durationMs: durationSec * 1000 })
  },
  stop() {
    writeStorage(null)
  },
  getSnapshot(): TimerState {
    return readStorage()
  },
  subscribe(listener: Listener) {
    listeners.add(listener)
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) listener()
    }
    if (typeof window !== 'undefined') window.addEventListener('storage', onStorage)
    return () => {
      listeners.delete(listener)
      if (typeof window !== 'undefined') window.removeEventListener('storage', onStorage)
    }
  },
}

export function remainingMs(state: TimerState, now = Date.now()): number {
  if (!state) return 0
  return Math.max(0, state.startedAt + state.durationMs - now)
}

/** Screen Wake Lock wrapper with graceful fallback on unsupported browsers. */
export async function requestWakeLock(): Promise<() => void> {
  if (typeof navigator === 'undefined' || !('wakeLock' in navigator)) {
    return () => {}
  }
  try {
    // @ts-expect-error wakeLock types not in TS lib yet
    const sentinel = await navigator.wakeLock.request('screen')
    return () => {
      sentinel.release().catch(() => {})
    }
  } catch {
    return () => {}
  }
}
```

- [ ] **Step 2: Typecheck**

```bash
npm run typecheck
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/rest-timer.ts
git commit -m "feat(m2): rest timer store with localStorage + wake lock"
```

---

## Task 10: API — GET /api/workout/active

**Files:** `src/app/api/workout/active/route.ts`, `src/tests/workout/api-workout-active.test.ts`

- [ ] **Step 1: Write integration test**

`src/tests/workout/api-workout-active.test.ts`:

```typescript
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { drizzle, type MySql2Database } from 'drizzle-orm/mysql2'
import mysql from 'mysql2/promise'
import * as schema from '@/db/schema'
import { users, sessions } from '@/db/schema'
import { hashPassword } from '@/lib/password'
import { newUlid } from '@/lib/ulid'
import { GET } from '@/app/api/workout/active/route'

// Mock getSessionUser to return a fixed user
vi.mock('@/lib/auth-helpers', async () => {
  const actual = await vi.importActual<typeof import('@/lib/auth-helpers')>('@/lib/auth-helpers')
  return { ...actual, getSessionUser: vi.fn() }
})

import { getSessionUser } from '@/lib/auth-helpers'
import { vi } from 'vitest'

describe('GET /api/workout/active', () => {
  const url = process.env.TEST_DATABASE_URL
  if (!url) throw new Error('TEST_DATABASE_URL required')

  let connection: mysql.Connection
  let db: MySql2Database<typeof schema>
  let userId: string

  beforeAll(async () => {
    connection = await mysql.createConnection(url)
    db = drizzle(connection, { schema, mode: 'default' })
  })

  afterAll(async () => {
    await connection.end()
  })

  beforeEach(async () => {
    await db.execute('SET FOREIGN_KEY_CHECKS = 0')
    for (const t of ['xp_events', 'session_sets', 'sessions', 'users']) {
      await db.execute(`TRUNCATE TABLE \`${t}\``)
    }
    await db.execute('SET FOREIGN_KEY_CHECKS = 1')
    userId = newUlid()
    await db.insert(users).values({
      id: userId,
      email: `api-${userId}@t.com`,
      passwordHash: await hashPassword('Abcd1234'),
      level: 1,
    })
    vi.mocked(getSessionUser).mockResolvedValue({ id: userId, email: 'x@y.com' } as any)
  })

  it('returns { active: null } when no open session', async () => {
    const res = await GET()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toEqual({ active: null })
  })

  it('returns active session info', async () => {
    await db.insert(sessions).values({
      userId,
      startedAt: new Date(),
    })
    const res = await GET()
    const body = await res.json()
    expect(body.active).toMatchObject({ id: expect.any(Number), startedAt: expect.any(String) })
  })

  it('auto-finishes >12h session and returns null', async () => {
    await db.insert(sessions).values({
      userId,
      startedAt: new Date(Date.now() - 13 * 3600 * 1000),
    })
    const res = await GET()
    const body = await res.json()
    expect(body.active).toBeNull()
  })

  it('returns 401 when unauthenticated', async () => {
    vi.mocked(getSessionUser).mockResolvedValue(null)
    const res = await GET()
    expect(res.status).toBe(401)
  })
})
```

- [ ] **Step 2: Implement route**

`src/app/api/workout/active/route.ts`:

```typescript
import { and, desc, eq, isNull } from 'drizzle-orm'
import { db } from '@/db/client'
import { sessions, plans } from '@/db/schema'
import { getSessionUser } from '@/lib/auth-helpers'
import { checkAndFinishStaleSessions } from '@/lib/session-auto-finish'

export async function GET() {
  const user = await getSessionUser()
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'content-type': 'application/json' },
    })
  }
  await checkAndFinishStaleSessions(user.id, db)
  const active = await db
    .select({
      id: sessions.id,
      planId: sessions.planId,
      startedAt: sessions.startedAt,
      planSlug: plans.slug,
      planName: plans.name,
    })
    .from(sessions)
    .leftJoin(plans, eq(plans.id, sessions.planId))
    .where(and(eq(sessions.userId, user.id), isNull(sessions.finishedAt)))
    .orderBy(desc(sessions.startedAt))
    .limit(1)

  return Response.json({ active: active[0] ?? null })
}
```

- [ ] **Step 3: Run tests**

```bash
TEST_DATABASE_URL="mysql://root:test@localhost:3308/hexis_test" npm run test:run -- src/tests/workout/api-workout-active.test.ts
```

Expected: all pass. If `db` client in test context is the dev connection (not test), refactor the route to accept a `db` param or use dependency injection. Simpler path: trust the shared `db` import and ensure tests point `DATABASE_URL` to test DB (set env via `cross-env` or in vitest `env`). Adjust `vitest.config.ts` if needed to force `DATABASE_URL = TEST_DATABASE_URL` during test runs.

- [ ] **Step 4: Commit**

```bash
git add src/app/api src/tests/workout/api-workout-active.test.ts
git commit -m "feat(m2): GET /api/workout/active with lazy auto-finish"
```

---

## Task 11: API — GET + PUT /api/plates

**Files:** `src/app/api/plates/route.ts`, `src/tests/workout/api-plates.test.ts`

- [ ] **Step 1: Test**

`src/tests/workout/api-plates.test.ts` — mirror Task 10 structure with `getSessionUser` mocked. Cases:

```typescript
// - GET: unauthenticated → 401
// - GET: no inventory yet → lazy seeds IPF default → returns barKg=20 + 7 plate entries
// - GET: existing inventory → returns as-is
// - PUT: invalid body (pairs<0) → 400
// - PUT: valid body → 200 + persisted
```

Use the pattern from Task 10 for `vi.mock`, `db`, and `beforeEach` truncate (include `plate_inventories`).

- [ ] **Step 2: Implement**

`src/app/api/plates/route.ts`:

```typescript
import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { db } from '@/db/client'
import { plateInventories } from '@/db/schema'
import { getSessionUser } from '@/lib/auth-helpers'
import { DEFAULT_PLATE_INVENTORY } from '@/db/seed/plate-inventory'

const platesSchema = z.object({
  barKg: z.number().min(5).max(50),
  plates: z.array(
    z.object({
      weightKg: z.number().positive(),
      pairs: z.number().int().min(0).max(50),
    })
  ),
})

export async function GET() {
  const user = await getSessionUser()
  if (!user) return unauth()
  let row = await db.query.plateInventories.findFirst({
    where: eq(plateInventories.userId, user.id),
  })
  if (!row) {
    await db.insert(plateInventories).values({
      userId: user.id,
      barKg: DEFAULT_PLATE_INVENTORY.barKg,
      plates: [...DEFAULT_PLATE_INVENTORY.plates],
    })
    row = await db.query.plateInventories.findFirst({
      where: eq(plateInventories.userId, user.id),
    })
  }
  return Response.json({ barKg: Number(row!.barKg), plates: row!.plates })
}

export async function PUT(req: Request) {
  const user = await getSessionUser()
  if (!user) return unauth()
  const body = await req.json().catch(() => null)
  const parsed = platesSchema.safeParse(body)
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: 'Invalid body', details: parsed.error.format() }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    })
  }
  await db
    .insert(plateInventories)
    .values({
      userId: user.id,
      barKg: String(parsed.data.barKg),
      plates: parsed.data.plates,
    })
    .onDuplicateKeyUpdate({
      set: { barKg: String(parsed.data.barKg), plates: parsed.data.plates },
    })
  return Response.json({ barKg: parsed.data.barKg, plates: parsed.data.plates })
}

function unauth() {
  return new Response(JSON.stringify({ error: 'Unauthorized' }), {
    status: 401,
    headers: { 'content-type': 'application/json' },
  })
}
```

- [ ] **Step 3: Run tests, commit**

```bash
TEST_DATABASE_URL="mysql://root:test@localhost:3308/hexis_test" npm run test:run -- src/tests/workout/api-plates.test.ts
git add src/app/api/plates src/tests/workout/api-plates.test.ts
git commit -m "feat(m2): GET/PUT /api/plates with lazy seed"
```

---

## Task 12: API — GET /api/exercises

**Files:** `src/app/api/exercises/route.ts`

- [ ] **Step 1: Implement**

`src/app/api/exercises/route.ts`:

```typescript
import { and, eq, isNull, like, or } from 'drizzle-orm'
import { db } from '@/db/client'
import { exercises } from '@/db/schema'
import { getSessionUser } from '@/lib/auth-helpers'

export async function GET(req: Request) {
  const user = await getSessionUser()
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'content-type': 'application/json' },
    })
  }
  const url = new URL(req.url)
  const q = url.searchParams.get('q')?.trim()
  const includeCatalog = url.searchParams.get('includeCatalog') !== 'false'

  const ownership = includeCatalog
    ? or(eq(exercises.userId, user.id), isNull(exercises.userId))
    : eq(exercises.userId, user.id)
  const where = q
    ? and(ownership, like(exercises.name, `%${q}%`))
    : ownership

  const rows = await db.select().from(exercises).where(where).limit(50)
  return Response.json(rows)
}
```

- [ ] **Step 2: Commit** (no new test — covered by E2E + manual).

```bash
git add src/app/api/exercises
git commit -m "feat(m2): GET /api/exercises with search + catalog filter"
```

---

## Task 13: API — POST + GET /api/sessions

**Files:** `src/app/api/sessions/route.ts`, `src/tests/workout/api-sessions.test.ts`

- [ ] **Step 1: Test (POST)**

Add to `src/tests/workout/api-sessions.test.ts`:
- POST with planId → creates session, returns { id }
- POST with null planId → ad-hoc session
- POST when active exists → 409 with `{ activeSessionId }`
- POST triggers `checkAndFinishStaleSessions` before insert (stale→finished, then new allowed)
- GET list returns recent sessions with setCount + volumeKg derived
- 401 when unauth

Use the mock pattern from Task 10.

- [ ] **Step 2: Implement**

`src/app/api/sessions/route.ts`:

```typescript
import { z } from 'zod'
import { and, desc, eq, isNull, lt, sql } from 'drizzle-orm'
import { db } from '@/db/client'
import { sessions, sessionSets } from '@/db/schema'
import { getSessionUser } from '@/lib/auth-helpers'
import { checkAndFinishStaleSessions } from '@/lib/session-auto-finish'

const postSchema = z.object({
  planId: z.number().int().positive().nullable().optional(),
})

export async function POST(req: Request) {
  const user = await getSessionUser()
  if (!user) return unauth()
  const body = await req.json().catch(() => ({}))
  const parsed = postSchema.safeParse(body)
  if (!parsed.success) return badRequest(parsed.error)

  await checkAndFinishStaleSessions(user.id, db)

  const existing = await db.query.sessions.findFirst({
    where: and(eq(sessions.userId, user.id), isNull(sessions.finishedAt)),
  })
  if (existing) {
    return new Response(JSON.stringify({ error: 'Active session exists', activeSessionId: existing.id }), {
      status: 409,
      headers: { 'content-type': 'application/json' },
    })
  }

  const [{ insertId }] = (await db.insert(sessions).values({
    userId: user.id,
    planId: parsed.data.planId ?? null,
    startedAt: new Date(),
  })) as unknown as [{ insertId: number }]

  return Response.json({ id: insertId }, { status: 201 })
}

export async function GET(req: Request) {
  const user = await getSessionUser()
  if (!user) return unauth()
  const url = new URL(req.url)
  const limit = Math.min(Number(url.searchParams.get('limit') ?? 20), 100)
  const cursor = Number(url.searchParams.get('cursor') ?? 0)

  const rows = await db
    .select({
      id: sessions.id,
      planId: sessions.planId,
      startedAt: sessions.startedAt,
      finishedAt: sessions.finishedAt,
      setCount: sql<number>`(SELECT COUNT(*) FROM session_sets WHERE session_sets.session_id = ${sessions.id})`,
      volumeKg: sql<number>`(SELECT COALESCE(SUM(weight_kg * reps), 0) FROM session_sets WHERE session_sets.session_id = ${sessions.id})`,
    })
    .from(sessions)
    .where(
      cursor > 0
        ? and(eq(sessions.userId, user.id), lt(sessions.id, cursor))
        : eq(sessions.userId, user.id)
    )
    .orderBy(desc(sessions.startedAt))
    .limit(limit + 1)

  const hasMore = rows.length > limit
  const items = hasMore ? rows.slice(0, limit) : rows
  const nextCursor = hasMore ? items[items.length - 1]!.id : null

  return Response.json({ items, nextCursor })
}

function unauth() {
  return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
}
function badRequest(err: unknown) {
  return new Response(JSON.stringify({ error: 'Invalid body', details: err }), { status: 400 })
}
```

- [ ] **Step 3: Run tests, commit**

```bash
TEST_DATABASE_URL="mysql://root:test@localhost:3308/hexis_test" npm run test:run -- src/tests/workout/api-sessions.test.ts
git add src/app/api/sessions/route.ts src/tests/workout/api-sessions.test.ts
git commit -m "feat(m2): POST/GET /api/sessions with auto-finish + active guard"
```

---

## Task 14: API — GET /api/sessions/[id]

**Files:** `src/app/api/sessions/[id]/route.ts`

> Returns full session detail with exercises (joined from plan_exercises when planId set + any ad-hoc inferred from session_sets) and all sets.

- [ ] **Step 1: Implement GET handler**

`src/app/api/sessions/[id]/route.ts`:

```typescript
import { and, asc, eq } from 'drizzle-orm'
import { db } from '@/db/client'
import {
  sessions,
  sessionSets,
  planExercises,
  exercises,
  plans,
} from '@/db/schema'
import { getSessionUser, requireOwnership } from '@/lib/auth-helpers'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser()
  if (!user) return unauth()
  const { id } = await params
  const sessionId = Number(id)
  if (!Number.isFinite(sessionId)) return notFound()

  const owned = await requireOwnership(
    db.query.sessions.findFirst({ where: eq(sessions.id, sessionId) }),
    user.id
  )
  if (owned instanceof Response) return owned

  const plan = owned.planId
    ? await db.query.plans.findFirst({ where: eq(plans.id, owned.planId) })
    : null

  const planRows = owned.planId
    ? await db
        .select({
          exerciseId: planExercises.exerciseId,
          order: planExercises.order,
          targetSets: planExercises.targetSets,
          repMin: planExercises.repMin,
          repMax: planExercises.repMax,
          restSec: planExercises.restSec,
          name: exercises.name,
          type: exercises.type,
        })
        .from(planExercises)
        .leftJoin(exercises, eq(exercises.id, planExercises.exerciseId))
        .where(eq(planExercises.planId, owned.planId))
        .orderBy(asc(planExercises.order))
    : []

  const sets = await db
    .select()
    .from(sessionSets)
    .where(eq(sessionSets.sessionId, sessionId))
    .orderBy(asc(sessionSets.completedAt))

  // Also collect ad-hoc exercises (present in sets but not in plan)
  const planIds = new Set(planRows.map((r) => r.exerciseId))
  const adhocIds = [...new Set(sets.map((s) => s.exerciseId).filter((id) => !planIds.has(id)))]
  const adhocExercises =
    adhocIds.length > 0
      ? await db.select().from(exercises).where(eq(exercises.id, adhocIds[0]!))
      : []

  const allExercises = [
    ...planRows.map((r) => ({
      exerciseId: r.exerciseId,
      name: r.name ?? '—',
      type: r.type,
      order: r.order,
      targetSets: r.targetSets,
      repMin: r.repMin,
      repMax: r.repMax,
      restSec: r.restSec,
      sets: sets
        .filter((s) => s.exerciseId === r.exerciseId)
        .map(({ id, setIndex, weightKg, reps, rpe, completedAt }) => ({
          id,
          setIndex,
          weightKg,
          reps,
          rpe,
          completedAt,
        })),
    })),
    ...adhocExercises.map((ex, idx) => ({
      exerciseId: ex.id,
      name: ex.name,
      type: ex.type,
      order: 100 + idx,
      targetSets: 0,
      repMin: 0,
      repMax: 0,
      restSec: 0,
      sets: sets
        .filter((s) => s.exerciseId === ex.id)
        .map(({ id, setIndex, weightKg, reps, rpe, completedAt }) => ({
          id,
          setIndex,
          weightKg,
          reps,
          rpe,
          completedAt,
        })),
    })),
  ]

  return Response.json({
    id: owned.id,
    planId: owned.planId,
    planSlug: plan?.slug ?? null,
    planName: plan?.name ?? null,
    startedAt: owned.startedAt,
    finishedAt: owned.finishedAt,
    note: owned.note,
    exercises: allExercises,
  })
}

function unauth() {
  return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
}
function notFound() {
  return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 })
}
```

**Bug to fix before commit:** the adhocExercises fetch uses only `adhocIds[0]` — that's a bug. Expand to an `inArray`:

```typescript
import { inArray } from 'drizzle-orm'
// ...
const adhocExercises =
  adhocIds.length > 0
    ? await db.select().from(exercises).where(inArray(exercises.id, adhocIds))
    : []
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/sessions/\[id\]/route.ts
git commit -m "feat(m2): GET /api/sessions/[id] with plan + ad-hoc exercises + sets"
```

---

## Task 15: API — PATCH /api/sessions/[id]

**Files:** `src/app/api/sessions/[id]/route.ts` (add PATCH)

- [ ] **Step 1: Add PATCH export**

Append to `src/app/api/sessions/[id]/route.ts`:

```typescript
import { z } from 'zod'
import { awardXp } from '@/lib/xp'

const patchSchema = z.object({
  finishedAt: z.boolean().optional(),
  note: z.string().max(2000).nullable().optional(),
})

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser()
  if (!user) return unauth()
  const { id } = await params
  const sessionId = Number(id)
  const body = await req.json().catch(() => null)
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: 'Invalid body' }), { status: 400 })
  }

  const owned = await requireOwnership(
    db.query.sessions.findFirst({ where: eq(sessions.id, sessionId) }),
    user.id
  )
  if (owned instanceof Response) return owned

  const updates: Record<string, unknown> = {}
  let xpAward: Awaited<ReturnType<typeof awardXp>> | null = null

  if (parsed.data.note !== undefined) updates.note = parsed.data.note
  if (parsed.data.finishedAt === true && !owned.finishedAt) {
    updates.finishedAt = new Date()
  }

  if (Object.keys(updates).length > 0) {
    await db.update(sessions).set(updates).where(eq(sessions.id, sessionId))
  }

  if (updates.finishedAt) {
    xpAward = await awardXp({
      event: 'session_complete',
      db,
      userId: user.id,
      sessionId,
    })
  }

  return Response.json({
    id: sessionId,
    finishedAt: (updates.finishedAt as Date | undefined) ?? owned.finishedAt,
    note: (parsed.data.note ?? owned.note) as string | null,
    xpDelta: xpAward?.xpDelta ?? 0,
    newTotalXp: xpAward?.newTotalXp ?? null,
    levelUp: xpAward?.levelUp ?? false,
  })
}
```

- [ ] **Step 2: Add test cases** to `api-sessions.test.ts`:
- PATCH { finishedAt: true } → finishedAt set + XP session_complete +100
- PATCH { note: 'x' } → note updated
- PATCH on already-finished session with finishedAt:true → no-op (no double XP)

- [ ] **Step 3: Run + commit**

```bash
TEST_DATABASE_URL="mysql://root:test@localhost:3308/hexis_test" npm run test:run -- src/tests/workout/api-sessions.test.ts
git add src/app/api/sessions/\[id\]/route.ts src/tests/workout/api-sessions.test.ts
git commit -m "feat(m2): PATCH /api/sessions/[id] finish + note with XP award"
```

---

## Task 16: API — DELETE /api/sessions/[id]

**Files:** `src/app/api/sessions/[id]/route.ts` (add DELETE)

> Deletes session + cascades sets + appends reversal XP events for every event tied to this session.

- [ ] **Step 1: Add DELETE handler**

```typescript
import { xpEvents } from '@/db/schema'
import { sum } from 'drizzle-orm'

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser()
  if (!user) return unauth()
  const { id } = await params
  const sessionId = Number(id)

  const owned = await requireOwnership(
    db.query.sessions.findFirst({ where: eq(sessions.id, sessionId) }),
    user.id
  )
  if (owned instanceof Response) return owned

  // Reversal: sum all xp_events with this sessionId → append one event with -sum
  const events = await db
    .select()
    .from(xpEvents)
    .where(and(eq(xpEvents.userId, user.id), eq(xpEvents.sessionId, sessionId)))
  const netXp = events.reduce((acc, e) => acc + e.xpDelta, 0)
  if (netXp !== 0) {
    await db.insert(xpEvents).values({
      userId: user.id,
      eventType: 'session_complete', // marker for grouping — could be custom but keeping enum
      xpDelta: -netXp,
      sessionId,
      meta: { reason: 'session_deleted' },
    })
  }

  await db.delete(sessionSets).where(eq(sessionSets.sessionId, sessionId))
  await db.delete(sessions).where(eq(sessions.id, sessionId))

  return new Response(null, { status: 204 })
}
```

- [ ] **Step 2: Test** (append):
- DELETE owned session → 204 + session gone + reversal event with matching -netXp

- [ ] **Step 3: Run + commit**

```bash
git add src/app/api/sessions/\[id\]/route.ts src/tests/workout/api-sessions.test.ts
git commit -m "feat(m2): DELETE /api/sessions/[id] with XP reversal"
```

---

## Task 17: API — POST /api/sessions/[id]/sets (with PR detection)

**Files:** `src/app/api/sessions/[id]/sets/route.ts`, `src/tests/workout/api-sets.test.ts`

- [ ] **Step 1: Tests**

In `api-sets.test.ts`:
- POST valid set → 201 + xpDelta 5 + newTotalXp
- POST on finished session → 409
- PR detection: session 1 (60×8) then session 2 (70×8) → PR event +50 on set write
- Ownership: cizí session → 404
- Invalid body (reps > 255) → 400

- [ ] **Step 2: Implement**

`src/app/api/sessions/[id]/sets/route.ts`:

```typescript
import { z } from 'zod'
import { and, desc, eq, ne } from 'drizzle-orm'
import { db } from '@/db/client'
import { sessions, sessionSets, exercises, xpEvents } from '@/db/schema'
import { getSessionUser, requireOwnership } from '@/lib/auth-helpers'
import { awardXp } from '@/lib/xp'
import { estimate1RM } from '@/lib/1rm'
import { suggestNextSet } from '@/lib/progression'

const postSchema = z.object({
  exerciseId: z.number().int().positive(),
  setIndex: z.number().int().min(0).max(50),
  weightKg: z.number().min(0).max(999).nullable(),
  reps: z.number().int().min(0).max(100).nullable(),
  rpe: z.number().int().min(1).max(10).nullable().optional(),
})

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser()
  if (!user) return unauth()
  const { id } = await params
  const sessionId = Number(id)
  const body = await req.json().catch(() => null)
  const parsed = postSchema.safeParse(body)
  if (!parsed.success) return badRequest()

  const owned = await requireOwnership(
    db.query.sessions.findFirst({ where: eq(sessions.id, sessionId) }),
    user.id
  )
  if (owned instanceof Response) return owned
  if (owned.finishedAt) {
    return new Response(JSON.stringify({ error: 'Session finished' }), { status: 409 })
  }

  const { exerciseId, setIndex, weightKg, reps, rpe } = parsed.data

  const [{ insertId }] = (await db.insert(sessionSets).values({
    sessionId,
    exerciseId,
    setIndex,
    weightKg: weightKg !== null ? String(weightKg) : null,
    reps: reps ?? null,
    rpe: rpe ?? null,
  })) as unknown as [{ insertId: number }]

  const xpSet = await awardXp({
    event: 'set_logged',
    db,
    userId: user.id,
    sessionId,
  })

  // PR detection
  let xpPr: Awaited<ReturnType<typeof awardXp>> | null = null
  if (weightKg !== null && reps !== null && reps > 0) {
    const newEst = estimate1RM(weightKg, reps)
    // find previous max 1RM for this exercise (user scope), excluding just-inserted set
    const priorSets = await db
      .select({
        weightKg: sessionSets.weightKg,
        reps: sessionSets.reps,
      })
      .from(sessionSets)
      .innerJoin(sessions, eq(sessions.id, sessionSets.sessionId))
      .where(
        and(
          eq(sessions.userId, user.id),
          eq(sessionSets.exerciseId, exerciseId),
          ne(sessionSets.id, insertId)
        )
      )
    const priorMax = priorSets.reduce((max, s) => {
      const v = estimate1RM(Number(s.weightKg ?? 0), s.reps ?? 0)
      return v > max ? v : max
    }, 0)
    if (newEst > priorMax) {
      xpPr = await awardXp({
        event: 'pr_achieved',
        db,
        userId: user.id,
        sessionId,
        meta: { exerciseId, estimated1RM: newEst },
      })
    }
  }

  // Recompute nextSuggestion for client
  const currentSets = await db
    .select()
    .from(sessionSets)
    .where(and(eq(sessionSets.sessionId, sessionId), eq(sessionSets.exerciseId, exerciseId)))
    .orderBy(desc(sessionSets.completedAt))
  const ex = await db.query.exercises.findFirst({ where: eq(exercises.id, exerciseId) })

  const nextSuggestion = suggestNextSet({
    history: [], // client fetches history separately for label; server passes empty; per-set re-eval uses currentSessionSets only
    planExercise: null,
    currentSessionSets: currentSets.map((s) => ({
      setIndex: s.setIndex,
      weightKg: s.weightKg !== null ? Number(s.weightKg) : null,
      reps: s.reps,
      rpe: s.rpe,
    })),
  })

  const totalXpDelta = xpSet.xpDelta + (xpPr?.xpDelta ?? 0)
  const newTotalXp = (xpPr?.newTotalXp ?? xpSet.newTotalXp)
  const levelUp = xpSet.levelUp || (xpPr?.levelUp ?? false)

  return Response.json(
    {
      id: insertId,
      completedAt: new Date().toISOString(),
      xpDelta: totalXpDelta,
      newTotalXp,
      levelUp,
      nextSuggestion,
    },
    { status: 201 }
  )
}

function unauth() {
  return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
}
function badRequest() {
  return new Response(JSON.stringify({ error: 'Invalid body' }), { status: 400 })
}
```

- [ ] **Step 3: Run + commit**

```bash
TEST_DATABASE_URL="mysql://root:test@localhost:3308/hexis_test" npm run test:run -- src/tests/workout/api-sets.test.ts
git add src/app/api/sessions/\[id\]/sets src/tests/workout/api-sets.test.ts
git commit -m "feat(m2): POST /api/sessions/[id]/sets with XP + PR detection"
```

---

## Task 18: API — PATCH + DELETE /api/sets/[id]

**Files:** `src/app/api/sets/[id]/route.ts`

- [ ] **Step 1: Implement**

`src/app/api/sets/[id]/route.ts`:

```typescript
import { z } from 'zod'
import { and, eq } from 'drizzle-orm'
import { db } from '@/db/client'
import { sessionSets, sessions, xpEvents } from '@/db/schema'
import { getSessionUser } from '@/lib/auth-helpers'
import { reverseXp } from '@/lib/xp'

const patchSchema = z.object({
  weightKg: z.number().min(0).max(999).nullable().optional(),
  reps: z.number().int().min(0).max(100).nullable().optional(),
  rpe: z.number().int().min(1).max(10).nullable().optional(),
})

async function loadOwnedSet(setId: number, userId: string) {
  const row = await db
    .select({
      id: sessionSets.id,
      sessionId: sessionSets.sessionId,
      exerciseId: sessionSets.exerciseId,
      weightKg: sessionSets.weightKg,
      reps: sessionSets.reps,
      rpe: sessionSets.rpe,
      sessionUserId: sessions.userId,
    })
    .from(sessionSets)
    .innerJoin(sessions, eq(sessions.id, sessionSets.sessionId))
    .where(eq(sessionSets.id, setId))
    .limit(1)
  if (!row[0] || row[0].sessionUserId !== userId) return null
  return row[0]
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser()
  if (!user) return new Response(null, { status: 401 })
  const { id } = await params
  const setId = Number(id)
  const body = await req.json().catch(() => null)
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) return new Response(JSON.stringify({ error: 'Invalid body' }), { status: 400 })

  const set = await loadOwnedSet(setId, user.id)
  if (!set) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 })

  const updates: Record<string, unknown> = {}
  if (parsed.data.weightKg !== undefined) {
    updates.weightKg = parsed.data.weightKg !== null ? String(parsed.data.weightKg) : null
  }
  if (parsed.data.reps !== undefined) updates.reps = parsed.data.reps
  if (parsed.data.rpe !== undefined) updates.rpe = parsed.data.rpe

  if (Object.keys(updates).length > 0) {
    await db.update(sessionSets).set(updates).where(eq(sessionSets.id, setId))
  }
  // PR re-evaluation: M2 keeps it simple — PR bonus remains, no retroactive reversal on edit
  // (documented trade-off; acceptable for single-user MVP)
  return Response.json({ id: setId, ...parsed.data })
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser()
  if (!user) return new Response(null, { status: 401 })
  const { id } = await params
  const setId = Number(id)
  const set = await loadOwnedSet(setId, user.id)
  if (!set) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 })

  await db.delete(sessionSets).where(eq(sessionSets.id, setId))

  await reverseXp({
    event: 'set_logged',
    db,
    userId: user.id,
    sessionId: set.sessionId,
  })

  return new Response(null, { status: 204 })
}
```

- [ ] **Step 2: Tests** (append to `api-sets.test.ts`):
- PATCH set.weightKg → update + no XP effect
- DELETE set → 204 + reversal event -5
- Cizí set → 404
- Invalid reps > 100 → 400

- [ ] **Step 3: Run + commit**

```bash
git add src/app/api/sets src/tests/workout/api-sets.test.ts
git commit -m "feat(m2): PATCH+DELETE /api/sets/[id] with XP reversal on delete"
```

---

## Task 19: (app) layout — bottom tab bar

**Files:** `src/app/(app)/layout.tsx`

- [ ] **Step 1: Read current layout**

```bash
cat src/app/\(app\)/layout.tsx
```

- [ ] **Step 2: Replace with bottom-tab layout**

`src/app/(app)/layout.tsx`:

```tsx
import Link from 'next/link'
import { requireSessionUser } from '@/lib/auth-helpers'
import { redirect } from 'next/navigation'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireSessionUser()
  if (user instanceof Response) redirect('/login')

  return (
    <div className="flex min-h-screen flex-col bg-[#0A0E14] text-[#E5E7EB]">
      <main className="flex-1 pb-16">{children}</main>
      <nav className="fixed bottom-0 left-0 right-0 border-t border-[#1F2733] bg-[#141A22] flex h-16">
        <TabLink href="/dashboard" label="Dashboard" />
        <TabLink href="/workout" label="Trénink" />
        <TabLink href="/settings" label="Nastavení" />
      </nav>
    </div>
  )
}

function TabLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex flex-1 items-center justify-center text-sm text-[#E5E7EB] hover:text-[#10B981] transition-colors"
    >
      {label}
    </Link>
  )
}
```

Note: the existing M1 layout used a server-side guard; keep that behavior. If M1 had more (loading, errors), preserve it.

- [ ] **Step 3: Typecheck + commit**

```bash
npm run typecheck
git add src/app/\(app\)/layout.tsx
git commit -m "feat(m2): bottom tab bar in (app) layout"
```

---

## Task 20: UI primitives — NumberInput, Toast, LongPress, BottomSheet

**Files:** `src/components/ui/{NumberInput,Toast,LongPress,BottomSheet}.tsx`

- [ ] **Step 1: NumberInput**

`src/components/ui/NumberInput.tsx`:

```tsx
'use client'
import { useId } from 'react'

type Props = {
  value: number | null
  onChange: (v: number | null) => void
  step?: number
  min?: number
  max?: number
  placeholder?: string
  suffix?: string
}

export function NumberInput({ value, onChange, step = 1, min = 0, max = 999, placeholder, suffix }: Props) {
  const id = useId()
  const handle = (delta: number) => {
    const current = value ?? 0
    const next = Math.max(min, Math.min(max, Math.round((current + delta) * 100) / 100))
    onChange(next)
  }
  return (
    <div className="inline-flex items-center gap-1">
      <button
        type="button"
        aria-label="snížit"
        className="h-11 w-11 rounded-lg bg-[#1F2733] text-[#E5E7EB] active:bg-[#10B981]"
        onClick={() => handle(-step)}
      >
        −
      </button>
      <input
        id={id}
        type="number"
        inputMode="decimal"
        placeholder={placeholder}
        value={value ?? ''}
        onChange={(e) => {
          const v = e.target.value
          onChange(v === '' ? null : Number(v))
        }}
        className="h-11 w-20 rounded-lg border border-[#1F2733] bg-[#0A0E14] text-center text-[#E5E7EB]"
        step={step}
        min={min}
        max={max}
      />
      {suffix ? <span className="text-xs text-[#6B7280]">{suffix}</span> : null}
      <button
        type="button"
        aria-label="zvýšit"
        className="h-11 w-11 rounded-lg bg-[#1F2733] text-[#E5E7EB] active:bg-[#10B981]"
        onClick={() => handle(step)}
      >
        +
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Toast**

`src/components/ui/Toast.tsx`:

```tsx
'use client'
import { createContext, useContext, useState, useCallback } from 'react'

type Toast = { id: number; message: string; tone: 'success' | 'error' | 'info' }
type Ctx = { show: (message: string, tone?: Toast['tone']) => void }

const ToastContext = createContext<Ctx | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const show = useCallback<Ctx['show']>((message, tone = 'info') => {
    const id = Date.now() + Math.random()
    setToasts((t) => [...t, { id, message, tone }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500)
  }, [])
  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div className="pointer-events-none fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto rounded-lg px-4 py-2 text-sm shadow-lg ${
              t.tone === 'success'
                ? 'bg-[#10B981] text-[#0A0E14]'
                : t.tone === 'error'
                  ? 'bg-[#EF4444] text-white'
                  : 'bg-[#141A22] text-[#E5E7EB] border border-[#1F2733]'
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be inside ToastProvider')
  return ctx
}
```

Wire `ToastProvider` in `src/app/(app)/layout.tsx` as a client wrapper (or in root layout if simpler).

- [ ] **Step 3: LongPress**

`src/components/ui/LongPress.tsx`:

```tsx
'use client'
import { useRef } from 'react'

export function useLongPress(onLongPress: () => void, ms = 500) {
  const timer = useRef<number | null>(null)
  const start = () => {
    timer.current = window.setTimeout(onLongPress, ms)
  }
  const clear = () => {
    if (timer.current !== null) {
      clearTimeout(timer.current)
      timer.current = null
    }
  }
  return {
    onPointerDown: start,
    onPointerUp: clear,
    onPointerLeave: clear,
    onPointerCancel: clear,
  }
}
```

- [ ] **Step 4: BottomSheet (Radix Dialog)**

`src/components/ui/BottomSheet.tsx`:

```tsx
'use client'
import * as Dialog from '@radix-ui/react-dialog'

type Props = {
  open: boolean
  onOpenChange: (v: boolean) => void
  title?: string
  children: React.ReactNode
}

export function BottomSheet({ open, onOpenChange, title, children }: Props) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/50 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl border-t border-[#1F2733] bg-[#141A22] p-4 pb-8 text-[#E5E7EB] focus:outline-none data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom">
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-[#1F2733]" />
          {title ? <Dialog.Title className="mb-3 text-base font-semibold">{title}</Dialog.Title> : null}
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
```

- [ ] **Step 5: Typecheck + commit**

```bash
npm run typecheck
git add src/components/ui
git commit -m "feat(m2): UI primitives (NumberInput, Toast, LongPress, BottomSheet)"
```

---

## Task 21: RestTimer component

**Files:** `src/components/workout/RestTimer.tsx`

- [ ] **Step 1: Implement**

```tsx
'use client'
import { useSyncExternalStore, useEffect, useRef, useState } from 'react'
import { restTimerStore, remainingMs, requestWakeLock } from '@/lib/rest-timer'

export function RestTimer({ defaultDurationSec }: { defaultDurationSec: number }) {
  const state = useSyncExternalStore(
    restTimerStore.subscribe,
    restTimerStore.getSnapshot,
    () => null
  )
  const [, setTick] = useState(0)
  const releaseRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    if (!state) return
    const interval = window.setInterval(() => setTick((x) => x + 1), 1000)
    return () => window.clearInterval(interval)
  }, [state])

  useEffect(() => {
    let cancelled = false
    if (state) {
      requestWakeLock().then((release) => {
        if (cancelled) release()
        else releaseRef.current = release
      })
    }
    return () => {
      cancelled = true
      releaseRef.current?.()
      releaseRef.current = null
    }
  }, [state])

  useEffect(() => {
    if (!state) return
    const remaining = remainingMs(state)
    if (remaining === 0) {
      restTimerStore.stop()
      // simple audio beep
      try {
        const a = new Audio(
          'data:audio/wav;base64,UklGRmQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YUAAAAA='
        )
        a.play().catch(() => {})
      } catch {}
    }
  })

  const remaining = state ? remainingMs(state) : 0
  const mm = String(Math.floor(remaining / 60000)).padStart(2, '0')
  const ss = String(Math.floor((remaining % 60000) / 1000)).padStart(2, '0')

  return (
    <div className="rounded-lg bg-[#1F2733] p-3 text-center tabular-nums">
      {state ? (
        <>
          <div className="text-xs uppercase tracking-wider text-[#6B7280]">Rest</div>
          <div className="text-2xl font-bold text-[#F59E0B]">
            {mm}:{ss}
          </div>
          <button
            type="button"
            className="mt-1 text-xs text-[#6B7280] underline"
            onClick={() => restTimerStore.stop()}
          >
            Přeskočit
          </button>
        </>
      ) : (
        <button
          type="button"
          className="text-sm text-[#10B981]"
          onClick={() => restTimerStore.start(defaultDurationSec)}
        >
          ▶ Spustit rest ({defaultDurationSec} s)
        </button>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/workout/RestTimer.tsx
git commit -m "feat(m2): RestTimer with wake lock + localStorage"
```

---

## Task 22: SetInput, SetRow, SuggestionHint

**Files:** `src/components/workout/{SetInput,SetRow,SuggestionHint}.tsx`

- [ ] **Step 1: SuggestionHint**

```tsx
'use client'
import type { Suggestion } from '@/lib/progression'

export function SuggestionHint({ suggestion }: { suggestion: Suggestion }) {
  return (
    <div className="rounded-md border border-[#1F2733] bg-[#141A22] p-2 text-xs text-[#6B7280]">
      <span className="text-[#10B981] font-medium">Návrh: </span>
      {suggestion.weightKg !== null ? `${suggestion.weightKg} kg × ` : ''}
      {suggestion.reps ?? '?'}{' '}
      <span className="text-[#6B7280]">· {suggestion.reason}</span>
    </div>
  )
}
```

- [ ] **Step 2: SetInput (strict server-confirmed)**

```tsx
'use client'
import { useState } from 'react'
import { NumberInput } from '@/components/ui/NumberInput'

type Props = {
  initialWeightKg: number | null
  initialReps: number | null
  showRpe?: boolean
  submitting: boolean
  onSubmit: (v: { weightKg: number | null; reps: number | null; rpe: number | null }) => void
  exerciseIsBodyweight?: boolean
}

export function SetInput({ initialWeightKg, initialReps, showRpe = true, submitting, onSubmit, exerciseIsBodyweight }: Props) {
  const [weight, setWeight] = useState<number | null>(initialWeightKg)
  const [reps, setReps] = useState<number | null>(initialReps)
  const [rpe, setRpe] = useState<number | null>(null)

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        {!exerciseIsBodyweight ? (
          <NumberInput value={weight} onChange={setWeight} step={2.5} suffix="kg" />
        ) : null}
        <NumberInput value={reps} onChange={setReps} step={1} suffix="reps" />
        {showRpe ? <NumberInput value={rpe} onChange={setRpe} step={1} min={1} max={10} suffix="RPE" /> : null}
      </div>
      <button
        type="button"
        disabled={submitting || reps === null}
        onClick={() => onSubmit({ weightKg: weight, reps, rpe })}
        className="h-12 rounded-lg bg-[#10B981] font-semibold text-[#0A0E14] disabled:opacity-50"
      >
        {submitting ? 'Ukládám…' : '✓ Zapsat sérii'}
      </button>
    </div>
  )
}
```

- [ ] **Step 3: SetRow**

```tsx
'use client'

type SetData = {
  id: number
  setIndex: number
  weightKg: string | number | null
  reps: number | null
  rpe: number | null
}

export function SetRow({ set, onTap }: { set: SetData; onTap?: () => void }) {
  const w = set.weightKg !== null ? Number(set.weightKg) : null
  return (
    <button
      type="button"
      onClick={onTap}
      className="flex w-full items-center justify-between rounded-md bg-[#1F2733] px-3 py-2 text-sm text-[#10B981]"
    >
      <span className="text-[#6B7280]">Série {set.setIndex + 1}</span>
      <span>
        {w !== null ? `${w} × ` : ''}
        {set.reps}
        {set.rpe ? ` @${set.rpe}` : ''}
      </span>
    </button>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/workout
git commit -m "feat(m2): SetInput, SetRow, SuggestionHint components"
```

---

## Task 23: ExerciseCard

**Files:** `src/components/workout/ExerciseCard.tsx`

- [ ] **Step 1: Implement**

```tsx
'use client'
import { useEffect, useState } from 'react'
import { SetInput } from './SetInput'
import { SetRow } from './SetRow'
import { SuggestionHint } from './SuggestionHint'
import { RestTimer } from './RestTimer'
import { useToast } from '@/components/ui/Toast'
import { restTimerStore } from '@/lib/rest-timer'
import type { Suggestion } from '@/lib/progression'

type ApiSet = { id: number; setIndex: number; weightKg: string | null; reps: number | null; rpe: number | null }
type Exercise = {
  exerciseId: number
  name: string
  type: string
  targetSets: number
  repMin: number
  repMax: number
  restSec: number
  sets: ApiSet[]
}

type Props = {
  sessionId: number
  exercise: Exercise
  historyLabel: string | null                  // e.g. "Minule: 60×8, 8, 7"
  initialSuggestion: Suggestion                // computed server-side via progression.ts
  onSetLogged: () => void                      // parent refetches + advances
  onEditSet: (setId: number) => void
}

export function ExerciseCard({ sessionId, exercise, historyLabel, initialSuggestion, onSetLogged, onEditSet }: Props) {
  const [submitting, setSubmitting] = useState(false)
  const [suggestion, setSuggestion] = useState(initialSuggestion)
  const toast = useToast()

  const handleSubmit = async (v: { weightKg: number | null; reps: number | null; rpe: number | null }) => {
    setSubmitting(true)
    try {
      const res = await fetch(`/api/sessions/${sessionId}/sets`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          exerciseId: exercise.exerciseId,
          setIndex: exercise.sets.length,
          weightKg: v.weightKg,
          reps: v.reps,
          rpe: v.rpe,
        }),
      })
      if (!res.ok) throw new Error(`${res.status}`)
      const body = await res.json()
      toast.show(`+${body.xpDelta} XP${body.levelUp ? ' · LEVEL UP!' : ''}`, 'success')
      if (exercise.restSec > 0) restTimerStore.start(exercise.restSec)
      if (body.nextSuggestion) setSuggestion(body.nextSuggestion)
      onSetLogged()
    } catch (e) {
      toast.show('Set se neuložil, zkus znovu', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const targetRange = exercise.repMin && exercise.repMax
    ? `${exercise.repMin}–${exercise.repMax} × ${exercise.targetSets}`
    : 'ad-hoc'

  return (
    <div className="flex flex-col gap-3">
      <header>
        <h3 className="text-lg font-semibold text-[#E5E7EB]">{exercise.name}</h3>
        <p className="text-xs text-[#6B7280]">Cíl: {targetRange}</p>
        {historyLabel ? <p className="mt-1 text-xs text-[#6B7280]">{historyLabel}</p> : null}
      </header>
      <SuggestionHint suggestion={suggestion} />
      <SetInput
        initialWeightKg={suggestion.weightKg}
        initialReps={suggestion.reps}
        submitting={submitting}
        onSubmit={handleSubmit}
        exerciseIsBodyweight={exercise.type === 'bodyweight'}
      />
      <RestTimer defaultDurationSec={exercise.restSec || 90} />
      <div className="flex flex-col gap-1">
        {exercise.sets.map((s) => (
          <SetRow key={s.id} set={s} onTap={() => onEditSet(s.id)} />
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/workout/ExerciseCard.tsx
git commit -m "feat(m2): ExerciseCard with log flow + history + suggestion"
```

---

## Task 24: ExerciseStepper + StepperNav + AdHocAddButton

**Files:** `src/components/workout/{ExerciseStepper,StepperNav,AdHocAddButton}.tsx`

- [ ] **Step 1: StepperNav**

```tsx
'use client'

type Props = {
  total: number
  current: number
  onPrev: () => void
  onNext: () => void
  labels: { prev: string; next: string }
}

export function StepperNav({ total, current, onPrev, onNext, labels }: Props) {
  return (
    <div className="flex items-center justify-between text-xs text-[#6B7280]">
      <button type="button" onClick={onPrev} disabled={current === 0} className="px-2 disabled:opacity-30">
        ‹ {labels.prev}
      </button>
      <div className="flex gap-1">
        {Array.from({ length: total }).map((_, i) => (
          <span
            key={i}
            className={`h-2 w-2 rounded-full ${i === current ? 'bg-[#10B981]' : 'bg-[#1F2733]'}`}
          />
        ))}
      </div>
      <button type="button" onClick={onNext} disabled={current === total - 1} className="px-2 disabled:opacity-30">
        {labels.next} ›
      </button>
    </div>
  )
}
```

- [ ] **Step 2: AdHocAddButton**

```tsx
'use client'
import { useState } from 'react'
import { ExercisePicker } from './ExercisePicker'

export function AdHocAddButton({ onPicked }: { onPicked: (exerciseId: number, name: string) => void }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="h-10 rounded-lg border border-dashed border-[#1F2733] text-sm text-[#6B7280]"
      >
        + Přidat cvik
      </button>
      <ExercisePicker
        open={open}
        onOpenChange={setOpen}
        onPicked={(id, name) => {
          setOpen(false)
          onPicked(id, name)
        }}
      />
    </>
  )
}
```

- [ ] **Step 3: ExerciseStepper (main container)**

```tsx
'use client'
import { useState } from 'react'
import { useLongPress } from '@/components/ui/LongPress'
import { useRouter, useSearchParams } from 'next/navigation'
import { ExerciseCard } from './ExerciseCard'
import { StepperNav } from './StepperNav'
import { AdHocAddButton } from './AdHocAddButton'
import { EditSetSheet } from './EditSetSheet'
import type { Suggestion } from '@/lib/progression'

type Exercise = React.ComponentProps<typeof ExerciseCard>['exercise']

type Props = {
  sessionId: number
  exercises: Array<Exercise & { historyLabel: string | null; suggestion: Suggestion }>
  skipped: Set<number>
  onRefresh: () => void
  onSkip: (exerciseId: number) => void
  onAdHoc: (exerciseId: number) => void
  onFinish: () => void
}

export function ExerciseStepper({ sessionId, exercises, skipped, onRefresh, onSkip, onAdHoc, onFinish }: Props) {
  const router = useRouter()
  const search = useSearchParams()
  const exParam = search.get('ex')
  const initialIdx = exercises.findIndex((e) => String(e.exerciseId) === exParam)
  const [idx, setIdx] = useState(initialIdx >= 0 ? initialIdx : 0)
  const [editSetId, setEditSetId] = useState<number | null>(null)

  const navigate = (newIdx: number) => {
    setIdx(newIdx)
    const params = new URLSearchParams(search.toString())
    params.set('ex', String(exercises[newIdx]!.exerciseId))
    router.replace(`?${params.toString()}`)
  }

  const current = exercises[idx]
  if (!current) {
    return (
      <div className="flex flex-col gap-3 p-4">
        <p className="text-sm text-[#6B7280]">Žádné cviky v této session.</p>
        <AdHocAddButton onPicked={(id) => onAdHoc(id)} />
      </div>
    )
  }

  const longPress = useLongPress(() => {
    if (confirm(`Přeskočit ${current.name}?`)) onSkip(current.exerciseId)
  })

  return (
    <div className="flex flex-col gap-4 p-4">
      <div {...longPress}>
        <ExerciseCard
          sessionId={sessionId}
          exercise={current}
          historyLabel={current.historyLabel}
          initialSuggestion={current.suggestion}
          onSetLogged={onRefresh}
          onEditSet={(setId) => setEditSetId(setId)}
        />
      </div>
      <StepperNav
        total={exercises.length}
        current={idx}
        onPrev={() => navigate(Math.max(0, idx - 1))}
        onNext={() => navigate(Math.min(exercises.length - 1, idx + 1))}
        labels={{
          prev: exercises[idx - 1]?.name.split(' ')[0] ?? '—',
          next: exercises[idx + 1]?.name.split(' ')[0] ?? 'Shrnutí',
        }}
      />
      {idx === exercises.length - 1 ? (
        <button
          type="button"
          onClick={onFinish}
          className="h-12 rounded-lg bg-[#10B981] font-semibold text-[#0A0E14]"
        >
          Dokončit trénink
        </button>
      ) : null}
      <AdHocAddButton onPicked={(id) => onAdHoc(id)} />
      {editSetId !== null ? (
        <EditSetSheet
          sessionId={sessionId}
          setId={editSetId}
          onClose={() => setEditSetId(null)}
          onChanged={() => {
            setEditSetId(null)
            onRefresh()
          }}
        />
      ) : null}
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/workout
git commit -m "feat(m2): ExerciseStepper + StepperNav + AdHocAddButton"
```

---

## Task 25: ExercisePicker

**Files:** `src/components/workout/ExercisePicker.tsx`

- [ ] **Step 1: Implement**

```tsx
'use client'
import { useEffect, useState } from 'react'
import { BottomSheet } from '@/components/ui/BottomSheet'

type Exercise = { id: number; name: string; type: string; userId: string | null }

export function ExercisePicker({
  open,
  onOpenChange,
  onPicked,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  onPicked: (id: number, name: string) => void
}) {
  const [q, setQ] = useState('')
  const [items, setItems] = useState<Exercise[]>([])

  useEffect(() => {
    if (!open) return
    const url = new URL('/api/exercises', window.location.origin)
    if (q) url.searchParams.set('q', q)
    fetch(url).then((r) => r.json()).then(setItems).catch(() => setItems([]))
  }, [open, q])

  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} title="Vyber cvik">
      <input
        placeholder="Hledej..."
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="mb-3 h-11 w-full rounded-lg border border-[#1F2733] bg-[#0A0E14] px-3 text-[#E5E7EB]"
      />
      <ul className="max-h-[50vh] overflow-y-auto">
        {items.map((ex) => (
          <li key={ex.id}>
            <button
              type="button"
              onClick={() => onPicked(ex.id, ex.name)}
              className="flex w-full items-center justify-between py-3 text-left text-sm text-[#E5E7EB]"
            >
              <span>{ex.name}</span>
              <span className="text-xs text-[#6B7280]">{ex.type}</span>
            </button>
          </li>
        ))}
        {items.length === 0 ? <li className="py-3 text-xs text-[#6B7280]">Nic nenalezeno</li> : null}
      </ul>
    </BottomSheet>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/workout/ExercisePicker.tsx
git commit -m "feat(m2): ExercisePicker bottom sheet"
```

---

## Task 26: EditSetSheet

**Files:** `src/components/workout/EditSetSheet.tsx`

```tsx
'use client'
import { useEffect, useState } from 'react'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { NumberInput } from '@/components/ui/NumberInput'
import { useToast } from '@/components/ui/Toast'

type Props = {
  sessionId: number
  setId: number
  onClose: () => void
  onChanged: () => void
}

export function EditSetSheet({ setId, onClose, onChanged }: Props) {
  const [weight, setWeight] = useState<number | null>(null)
  const [reps, setReps] = useState<number | null>(null)
  const [rpe, setRpe] = useState<number | null>(null)
  const [loaded, setLoaded] = useState(false)
  const toast = useToast()

  useEffect(() => {
    // In practice, parent passes current values as props. Fetching here to keep boundary clean.
    setLoaded(true)
  }, [setId])

  const save = async () => {
    const res = await fetch(`/api/sets/${setId}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ weightKg: weight, reps, rpe }),
    })
    if (!res.ok) toast.show('Uložení selhalo', 'error')
    else onChanged()
  }

  const del = async () => {
    if (!confirm('Smazat sérii?')) return
    const res = await fetch(`/api/sets/${setId}`, { method: 'DELETE' })
    if (!res.ok) toast.show('Mazání selhalo', 'error')
    else onChanged()
  }

  return (
    <BottomSheet open={true} onOpenChange={(v) => !v && onClose()} title="Upravit sérii">
      <div className="flex flex-col gap-3">
        <NumberInput value={weight} onChange={setWeight} step={2.5} suffix="kg" />
        <NumberInput value={reps} onChange={setReps} step={1} suffix="reps" />
        <NumberInput value={rpe} onChange={setRpe} step={1} min={1} max={10} suffix="RPE" />
        <div className="flex gap-2">
          <button type="button" onClick={save} className="h-11 flex-1 rounded-lg bg-[#10B981] font-semibold text-[#0A0E14]">
            Uložit
          </button>
          <button type="button" onClick={del} className="h-11 rounded-lg border border-[#EF4444] px-4 text-[#EF4444]">
            Smazat
          </button>
        </div>
      </div>
    </BottomSheet>
  )
}
```

> Note: the parent should pass `initialWeight/Reps/Rpe` instead of fetching. Upgrade to take those as props in the assembling page step.

- [ ] **Step 1: Commit**

```bash
git add src/components/workout/EditSetSheet.tsx
git commit -m "feat(m2): EditSetSheet with save + delete"
```

---

## Task 27: PlateCalculatorSheet

**Files:** `src/components/workout/PlateCalculatorSheet.tsx`

```tsx
'use client'
import { useEffect, useState } from 'react'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { NumberInput } from '@/components/ui/NumberInput'
import { calculatePlates } from '@/lib/plates'

export function PlateCalculatorSheet({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const [target, setTarget] = useState<number | null>(60)
  const [bar, setBar] = useState(20)
  const [inventory, setInventory] = useState<Array<{ weightKg: number; pairs: number }>>([])

  useEffect(() => {
    if (!open) return
    fetch('/api/plates').then((r) => r.json()).then((d) => {
      setBar(d.barKg)
      setInventory(d.plates)
    })
  }, [open])

  const result = target && target >= bar
    ? calculatePlates({ targetKg: target, bar: { weightKg: bar }, inventory })
    : null

  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} title="Plate calculator">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <NumberInput value={target} onChange={setTarget} step={2.5} suffix="kg" />
          <span className="text-xs text-[#6B7280]">bar: {bar} kg</span>
        </div>
        {result ? (
          <>
            <div className="rounded-md bg-[#1F2733] p-3 text-sm">
              Per stranu:{' '}
              {result.perSide.length === 0
                ? 'žádné'
                : result.perSide.map((p) => `${p.weightKg}×${p.count}`).join(' + ')}
            </div>
            {result.missingKg > 0 ? (
              <div className="rounded-md bg-[#EF4444]/20 p-2 text-xs text-[#EF4444]">
                Chybí {result.missingKg} kg v inventáři
              </div>
            ) : null}
          </>
        ) : null}
      </div>
    </BottomSheet>
  )
}
```

- [ ] **Step 1: Commit**

```bash
git add src/components/workout/PlateCalculatorSheet.tsx
git commit -m "feat(m2): PlateCalculatorSheet reading from /api/plates"
```

---

## Task 28: ResumeBanner + PlanPicker + SessionHistoryList

**Files:** `src/components/workout/{ResumeBanner,PlanPicker,SessionHistoryList}.tsx`

```tsx
// ResumeBanner.tsx
'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'

type Active = { id: number; planName: string | null; planSlug: string | null; startedAt: string } | null

export function ResumeBanner() {
  const [active, setActive] = useState<Active>(null)
  useEffect(() => {
    fetch('/api/workout/active').then((r) => r.json()).then((d) => setActive(d.active))
  }, [])
  if (!active) return null
  const minutes = Math.floor((Date.now() - new Date(active.startedAt).getTime()) / 60000)
  return (
    <Link
      href={`/workout/${active.id}`}
      className="mb-3 flex items-center justify-between rounded-lg bg-[#F59E0B] px-3 py-2 text-sm font-semibold text-[#0A0E14]"
    >
      <span>⚡ Pokračuj v {active.planName ?? 'tréninku'} · {minutes} min</span>
      <span>›</span>
    </Link>
  )
}
```

```tsx
// PlanPicker.tsx
'use client'
import { useRouter } from 'next/navigation'

type Plan = { id: number; slug: string; name: string; order: number }

export function PlanPicker({ plans, recommendedId }: { plans: Plan[]; recommendedId: number | null }) {
  const router = useRouter()
  const start = async (planId: number | null) => {
    const res = await fetch('/api/sessions', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ planId }),
    })
    if (res.status === 409) {
      const body = await res.json()
      router.push(`/workout/${body.activeSessionId}`)
      return
    }
    const body = await res.json()
    router.push(`/workout/${body.id}`)
  }
  return (
    <div className="flex flex-col gap-2">
      {plans.map((p) => (
        <button
          key={p.id}
          type="button"
          onClick={() => start(p.id)}
          className={`flex items-center justify-between rounded-lg border p-3 text-left ${
            p.id === recommendedId ? 'border-[#10B981]' : 'border-[#1F2733]'
          }`}
        >
          <span>
            <strong>{p.name}</strong>{' '}
            {p.id === recommendedId ? (
              <span className="ml-2 rounded-full bg-[#1F2733] px-2 py-0.5 text-xs text-[#10B981]">doporučeno</span>
            ) : null}
          </span>
          <span className="text-xs text-[#6B7280]">{p.slug}</span>
        </button>
      ))}
      <button
        type="button"
        onClick={() => start(null)}
        className="rounded-lg border border-dashed border-[#1F2733] p-3 text-sm text-[#6B7280]"
      >
        + Ad-hoc trénink
      </button>
    </div>
  )
}
```

```tsx
// SessionHistoryList.tsx
import Link from 'next/link'

type Item = {
  id: number
  planId: number | null
  planSlug?: string | null
  planName?: string | null
  startedAt: string
  finishedAt: string | null
  setCount: number
  volumeKg: number
}

export function SessionHistoryList({ items }: { items: Item[] }) {
  return (
    <ul className="flex flex-col gap-2">
      {items.map((s) => (
        <li key={s.id}>
          <Link
            href={`/workout/${s.id}`}
            className="flex items-center justify-between rounded-md bg-[#141A22] px-3 py-2 text-sm"
          >
            <span>
              {new Date(s.startedAt).toLocaleDateString('cs-CZ')}{' '}
              {s.planSlug ? <span className="text-[#10B981]">{s.planSlug}</span> : 'ad-hoc'}
            </span>
            <span className="text-xs text-[#6B7280]">
              {s.setCount} sérií · {Number(s.volumeKg).toFixed(0)} kg
            </span>
          </Link>
        </li>
      ))}
      {items.length === 0 ? <li className="text-xs text-[#6B7280]">Zatím žádné tréninky.</li> : null}
    </ul>
  )
}
```

- [ ] **Step 1: Commit**

```bash
git add src/components/workout
git commit -m "feat(m2): ResumeBanner + PlanPicker + SessionHistoryList"
```

---

## Task 29: /dashboard page — level + streak + CTA

**Files:** `src/app/(app)/dashboard/page.tsx`

```tsx
import { and, desc, eq, isNull } from 'drizzle-orm'
import { db } from '@/db/client'
import { sessions, plans, users } from '@/db/schema'
import { requireSessionUser } from '@/lib/auth-helpers'
import { redirect } from 'next/navigation'
import { getTotalXp } from '@/lib/xp'
import { xpToLevel, xpForNextLevel } from '@/lib/xp-events'
import { checkAndFinishStaleSessions } from '@/lib/session-auto-finish'
import Link from 'next/link'

export default async function DashboardPage() {
  const user = await requireSessionUser()
  if (user instanceof Response) redirect('/login')

  await checkAndFinishStaleSessions(user.id, db)

  const totalXp = await getTotalXp(db, user.id)
  const level = xpToLevel(totalXp)
  const nextThreshold = xpForNextLevel(level)

  const [active] = await db
    .select({ id: sessions.id, planName: plans.name, startedAt: sessions.startedAt })
    .from(sessions)
    .leftJoin(plans, eq(plans.id, sessions.planId))
    .where(and(eq(sessions.userId, user.id), isNull(sessions.finishedAt)))
    .limit(1)

  // streak = consecutive training days (ending today or yesterday)
  const last7 = await db
    .select({ startedAt: sessions.startedAt })
    .from(sessions)
    .where(eq(sessions.userId, user.id))
    .orderBy(desc(sessions.startedAt))
    .limit(30)
  const streak = computeStreak(last7.map((r) => r.startedAt))

  // next plan suggestion (rotation)
  const userPlans = await db.select().from(plans).where(eq(plans.userId, user.id))
  const lastFinished = await db
    .select({ planId: sessions.planId })
    .from(sessions)
    .where(eq(sessions.userId, user.id))
    .orderBy(desc(sessions.startedAt))
    .limit(1)
  const lastPlanId = lastFinished[0]?.planId ?? null
  const sortedPlans = userPlans.sort((a, b) => a.order - b.order)
  const lastIdx = sortedPlans.findIndex((p) => p.id === lastPlanId)
  const nextPlan = sortedPlans[(lastIdx + 1) % Math.max(sortedPlans.length, 1)] ?? null

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-[#6B7280]">{new Date().toLocaleDateString('cs-CZ', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          <h1 className="text-xl">Ahoj, {user.name ?? user.email}</h1>
        </div>
        <div className="text-right text-xs">
          <div className="text-lg font-bold text-[#10B981]">L{level}</div>
          <div className="text-[#6B7280]">{totalXp}/{nextThreshold} XP</div>
        </div>
      </div>
      <div className="rounded-lg border border-[#1F2733] p-3 text-center">
        <div className="text-2xl">🔥 {streak}</div>
        <div className="text-xs text-[#6B7280]">denní streak</div>
      </div>
      {active ? (
        <Link href={`/workout/${active.id}`} className="h-12 rounded-lg bg-[#10B981] text-center font-semibold text-[#0A0E14] flex items-center justify-center">
          Pokračuj v {active.planName ?? 'tréninku'} ›
        </Link>
      ) : nextPlan ? (
        <Link href={`/workout`} className="h-12 rounded-lg bg-[#10B981] text-center font-semibold text-[#0A0E14] flex items-center justify-center">
          Začít {nextPlan.name} ›
        </Link>
      ) : (
        <Link href="/workout" className="h-12 rounded-lg border border-[#1F2733] text-center text-sm flex items-center justify-center">
          Do tréninku
        </Link>
      )}
    </div>
  )
}

function computeStreak(startedAts: Date[]): number {
  if (startedAts.length === 0) return 0
  const days = new Set(startedAts.map((d) => d.toISOString().slice(0, 10)))
  let streak = 0
  const cursor = new Date()
  cursor.setHours(0, 0, 0, 0)
  // allow today OR yesterday as starting point
  const todayKey = cursor.toISOString().slice(0, 10)
  if (!days.has(todayKey)) {
    cursor.setDate(cursor.getDate() - 1)
    if (!days.has(cursor.toISOString().slice(0, 10))) return 0
  }
  while (days.has(cursor.toISOString().slice(0, 10))) {
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}
```

- [ ] **Step 1: Commit**

```bash
npm run typecheck
git add src/app/\(app\)/dashboard/page.tsx
git commit -m "feat(m2): dashboard with level, streak, CTA"
```

---

## Task 30: /workout page — picker + resume + history

**Files:** `src/app/(app)/workout/page.tsx`

```tsx
import { desc, eq } from 'drizzle-orm'
import { db } from '@/db/client'
import { plans, sessions } from '@/db/schema'
import { requireSessionUser } from '@/lib/auth-helpers'
import { redirect } from 'next/navigation'
import { ResumeBanner } from '@/components/workout/ResumeBanner'
import { PlanPicker } from '@/components/workout/PlanPicker'
import { SessionHistoryList } from '@/components/workout/SessionHistoryList'
import { checkAndFinishStaleSessions } from '@/lib/session-auto-finish'
import { sql } from 'drizzle-orm'

export default async function WorkoutPage() {
  const user = await requireSessionUser()
  if (user instanceof Response) redirect('/login')
  await checkAndFinishStaleSessions(user.id, db)

  const userPlans = await db.select().from(plans).where(eq(plans.userId, user.id))
  const sortedPlans = userPlans.sort((a, b) => a.order - b.order)

  const lastFinished = await db
    .select({ planId: sessions.planId })
    .from(sessions)
    .where(eq(sessions.userId, user.id))
    .orderBy(desc(sessions.startedAt))
    .limit(1)
  const lastIdx = sortedPlans.findIndex((p) => p.id === (lastFinished[0]?.planId ?? -1))
  const recommended = sortedPlans[(lastIdx + 1) % Math.max(sortedPlans.length, 1)] ?? null

  const history = await db
    .select({
      id: sessions.id,
      planId: sessions.planId,
      planSlug: plans.slug,
      planName: plans.name,
      startedAt: sessions.startedAt,
      finishedAt: sessions.finishedAt,
      setCount: sql<number>`(SELECT COUNT(*) FROM session_sets WHERE session_sets.session_id = ${sessions.id})`,
      volumeKg: sql<number>`(SELECT COALESCE(SUM(weight_kg * reps), 0) FROM session_sets WHERE session_sets.session_id = ${sessions.id})`,
    })
    .from(sessions)
    .leftJoin(plans, eq(plans.id, sessions.planId))
    .where(eq(sessions.userId, user.id))
    .orderBy(desc(sessions.startedAt))
    .limit(10)

  return (
    <div className="flex flex-col gap-4 p-4">
      <ResumeBanner />
      <h1 className="text-xl">Vyber trénink</h1>
      <PlanPicker plans={sortedPlans} recommendedId={recommended?.id ?? null} />
      <h2 className="mt-4 text-sm text-[#6B7280]">Historie</h2>
      <SessionHistoryList items={history.map((h) => ({ ...h, volumeKg: Number(h.volumeKg), setCount: Number(h.setCount) }))} />
    </div>
  )
}
```

- [ ] **Step 1: Commit**

```bash
npm run typecheck
git add src/app/\(app\)/workout/page.tsx
git commit -m "feat(m2): /workout page with picker + resume + history"
```

---

## Task 31: /workout/[sessionId] page — stepper + summary + readonly

**Files:** `src/app/(app)/workout/[sessionId]/page.tsx`, `src/components/workout/{SessionSummary,SessionDetailView}.tsx`

- [ ] **Step 1: SessionSummary**

```tsx
// SessionSummary.tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Props = {
  sessionId: number
  totalSets: number
  totalVolume: number
  durationMin: number
  note: string | null
}

export function SessionSummary({ sessionId, totalSets, totalVolume, durationMin, note: initialNote }: Props) {
  const router = useRouter()
  const [note, setNote] = useState(initialNote ?? '')
  const [saving, setSaving] = useState(false)

  const finish = async () => {
    setSaving(true)
    await fetch(`/api/sessions/${sessionId}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ finishedAt: true, note: note || null }),
    })
    router.push('/dashboard')
  }

  return (
    <div className="flex flex-col gap-3 p-4">
      <h2 className="text-lg">Shrnutí</h2>
      <div className="grid grid-cols-3 gap-2 text-center">
        <Stat label="Sérií" value={String(totalSets)} />
        <Stat label="Tuny" value={`${(totalVolume / 1000).toFixed(1)}`} />
        <Stat label="Čas" value={`${durationMin} min`} />
      </div>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Poznámka (volitelné)"
        className="min-h-[80px] rounded-lg border border-[#1F2733] bg-[#0A0E14] p-2 text-sm"
      />
      <button
        type="button"
        onClick={finish}
        disabled={saving}
        className="h-12 rounded-lg bg-[#10B981] font-semibold text-[#0A0E14]"
      >
        {saving ? 'Ukládám…' : 'Dokončit trénink'}
      </button>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-[#141A22] p-2">
      <div className="text-lg font-bold text-[#10B981]">{value}</div>
      <div className="text-xs text-[#6B7280]">{label}</div>
    </div>
  )
}
```

- [ ] **Step 2: SessionDetailView (readonly + edit toggle)**

```tsx
// SessionDetailView.tsx
'use client'
import { useState } from 'react'
import { SetRow } from './SetRow'
import { EditSetSheet } from './EditSetSheet'
import { useRouter } from 'next/navigation'

type ExerciseBlock = {
  exerciseId: number
  name: string
  sets: Array<{ id: number; setIndex: number; weightKg: string | null; reps: number | null; rpe: number | null }>
}

export function SessionDetailView({
  sessionId,
  exercises,
  editMode,
}: {
  sessionId: number
  exercises: ExerciseBlock[]
  editMode: boolean
}) {
  const router = useRouter()
  const [editId, setEditId] = useState<number | null>(null)

  const toggleEdit = () => {
    const params = new URLSearchParams(window.location.search)
    if (editMode) params.delete('edit')
    else params.set('edit', '1')
    router.replace(`?${params.toString()}`)
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <button type="button" onClick={toggleEdit} className="self-end text-xs text-[#10B981]">
        {editMode ? 'Hotovo' : '✎ Upravit'}
      </button>
      {exercises.map((ex) => (
        <div key={ex.exerciseId} className="flex flex-col gap-1">
          <h3 className="text-sm font-semibold">{ex.name}</h3>
          {ex.sets.map((s) => (
            <SetRow key={s.id} set={s} onTap={editMode ? () => setEditId(s.id) : undefined} />
          ))}
        </div>
      ))}
      {editId !== null ? (
        <EditSetSheet
          sessionId={sessionId}
          setId={editId}
          onClose={() => setEditId(null)}
          onChanged={() => {
            setEditId(null)
            router.refresh()
          }}
        />
      ) : null}
    </div>
  )
}
```

- [ ] **Step 3: /workout/[sessionId]/page.tsx**

```tsx
import { redirect } from 'next/navigation'
import { requireSessionUser } from '@/lib/auth-helpers'
import { db } from '@/db/client'
import { sessions } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { ExerciseStepper } from '@/components/workout/ExerciseStepper'
import { SessionSummary } from '@/components/workout/SessionSummary'
import { SessionDetailView } from '@/components/workout/SessionDetailView'
import { suggestNextSet } from '@/lib/progression'

type SearchParams = Promise<{ edit?: string }>

export default async function WorkoutSessionPage({
  params,
  searchParams,
}: {
  params: Promise<{ sessionId: string }>
  searchParams: SearchParams
}) {
  const user = await requireSessionUser()
  if (user instanceof Response) redirect('/login')
  const { sessionId: idStr } = await params
  const { edit } = await searchParams
  const sessionId = Number(idStr)

  // Fetch session detail via internal API logic directly (reuse helpers)
  const res = await fetch(`${process.env.NEXTAUTH_URL ?? 'http://localhost:3000'}/api/sessions/${sessionId}`, {
    cache: 'no-store',
    headers: { cookie: (await import('next/headers')).cookies().toString() },
  })
  if (!res.ok) {
    return <div className="p-4 text-sm text-[#EF4444]">Session nenalezena.</div>
  }
  const detail = await res.json()

  if (detail.finishedAt) {
    return <SessionDetailView sessionId={sessionId} exercises={detail.exercises} editMode={edit === '1'} />
  }

  // Active session: hydrate per-exercise history + build suggestions server-side
  const { and, desc, eq, ne } = await import('drizzle-orm')
  const { sessionSets } = await import('@/db/schema')
  async function fetchHistory(exerciseId: number) {
    const sets = await db
      .select({
        weightKg: sessionSets.weightKg,
        reps: sessionSets.reps,
        rpe: sessionSets.rpe,
        sessionId: sessionSets.sessionId,
        completedAt: sessionSets.completedAt,
      })
      .from(sessionSets)
      .innerJoin(sessions, eq(sessions.id, sessionSets.sessionId))
      .where(
        and(
          eq(sessions.userId, user.id),
          eq(sessionSets.exerciseId, exerciseId),
          ne(sessions.id, sessionId)
        )
      )
      .orderBy(desc(sessionSets.completedAt))
      .limit(30)
    // Group by session (up to last 3)
    const bySession = new Map<number, typeof sets>()
    for (const s of sets) {
      const arr = bySession.get(s.sessionId) ?? []
      arr.push(s)
      bySession.set(s.sessionId, arr)
    }
    const sessionsSorted = [...bySession.values()].slice(0, 3)
    return sessionsSorted.map((setGroup) => ({
      startedAt: setGroup[0]!.completedAt ?? new Date(),
      sets: setGroup.map((s) => ({
        weightKg: s.weightKg !== null ? Number(s.weightKg) : null,
        reps: s.reps,
        rpe: s.rpe,
      })),
    }))
  }

  const exercisesWithSuggestions = await Promise.all(
    detail.exercises.map(async (ex: any) => {
      const history = await fetchHistory(ex.exerciseId)
      const suggestion = suggestNextSet({
        history,
        planExercise:
          ex.targetSets > 0
            ? {
                targetSets: ex.targetSets,
                repMin: ex.repMin,
                repMax: ex.repMax,
                exerciseType: ex.type,
              }
            : null,
        currentSessionSets: ex.sets.map((s: any) => ({
          setIndex: s.setIndex,
          weightKg: s.weightKg !== null ? Number(s.weightKg) : null,
          reps: s.reps,
          rpe: s.rpe,
        })),
      })
      const historyLabel =
        history[0]?.sets.length
          ? `Minule: ${history[0]!.sets
              .map((s) => `${s.weightKg ?? '—'}×${s.reps ?? 0}`)
              .join(', ')}`
          : null
      return { ex, suggestion, historyLabel }
    })
  ).then((rows) =>
    rows.map(({ ex, suggestion, historyLabel }) => ({
      exerciseId: ex.exerciseId,
      name: ex.name,
      type: ex.type,
      targetSets: ex.targetSets,
      repMin: ex.repMin,
      repMax: ex.repMax,
      restSec: ex.restSec,
      sets: ex.sets,
      historyLabel,
      suggestion,
    }))
  )

  const totalSets = detail.exercises.reduce((a: number, e: any) => a + e.sets.length, 0)
  const totalVolume = detail.exercises.reduce(
    (a: number, e: any) => a + e.sets.reduce((b: number, s: any) => b + (Number(s.weightKg ?? 0) * (s.reps ?? 0)), 0),
    0
  )
  const durationMin = Math.floor((Date.now() - new Date(detail.startedAt).getTime()) / 60000)

  return (
    <>
      <ExerciseStepper
        sessionId={sessionId}
        exercises={exercisesWithSuggestions}
        skipped={new Set()}
        onRefresh={() => {/* router.refresh in client context */}}
        onSkip={() => {}}
        onAdHoc={() => {}}
        onFinish={() => {}}
      />
      <SessionSummary
        sessionId={sessionId}
        totalSets={totalSets}
        totalVolume={totalVolume}
        durationMin={durationMin}
        note={detail.note}
      />
    </>
  )
}
```

> The server/client split above needs refinement: the stepper uses `useRouter().refresh()` to force server re-render after each POST. Upgrade `ExerciseStepper` to accept `onRefresh` as router.refresh from a tiny client wrapper, e.g. `WorkoutSessionClient.tsx` taking `exercisesWithSuggestions` + `sessionId` and wiring `router.refresh()`.

- [ ] **Step 4: Add WorkoutSessionClient.tsx wrapper**

```tsx
// WorkoutSessionClient.tsx
'use client'
import { useRouter } from 'next/navigation'
import { ExerciseStepper } from './ExerciseStepper'

export function WorkoutSessionClient(props: Omit<React.ComponentProps<typeof ExerciseStepper>, 'onRefresh' | 'onFinish' | 'onSkip' | 'onAdHoc'> & { sessionId: number }) {
  const router = useRouter()
  return (
    <ExerciseStepper
      {...props}
      onRefresh={() => router.refresh()}
      onSkip={() => router.refresh()}
      onAdHoc={() => router.refresh()}
      onFinish={() => router.push(`/workout/${props.sessionId}#summary`)}
    />
  )
}
```

Replace the stepper usage in the page with this wrapper.

- [ ] **Step 5: Commit**

```bash
npm run typecheck
git add src/app/\(app\)/workout src/components/workout
git commit -m "feat(m2): /workout/[id] page assembling stepper + summary + readonly"
```

---

## Task 32: /settings/plates page

**Files:** `src/app/(app)/settings/plates/page.tsx`, `src/components/workout/PlateInventoryForm.tsx`

```tsx
// PlateInventoryForm.tsx
'use client'
import { useState } from 'react'
import { NumberInput } from '@/components/ui/NumberInput'
import { useToast } from '@/components/ui/Toast'

type Plate = { weightKg: number; pairs: number }

export function PlateInventoryForm({ initial }: { initial: { barKg: number; plates: Plate[] } }) {
  const [barKg, setBarKg] = useState<number | null>(initial.barKg)
  const [plates, setPlates] = useState<Plate[]>(initial.plates)
  const toast = useToast()

  const save = async () => {
    const res = await fetch('/api/plates', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ barKg, plates }),
    })
    if (!res.ok) toast.show('Uložení selhalo', 'error')
    else toast.show('Inventář uložen', 'success')
  }

  const updatePlate = (idx: number, patch: Partial<Plate>) => {
    setPlates((p) => p.map((x, i) => (i === idx ? { ...x, ...patch } : x)))
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div>
        <label className="text-xs text-[#6B7280]">Bar</label>
        <NumberInput value={barKg} onChange={setBarKg} step={2.5} min={5} max={50} suffix="kg" />
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-xs text-[#6B7280]">Talíře (párové)</label>
        {plates.map((p, i) => (
          <div key={i} className="flex items-center gap-2">
            <NumberInput
              value={p.weightKg}
              onChange={(v) => updatePlate(i, { weightKg: v ?? 0 })}
              step={0.25}
              suffix="kg"
            />
            <NumberInput
              value={p.pairs}
              onChange={(v) => updatePlate(i, { pairs: v ?? 0 })}
              step={1}
              suffix="párů"
            />
            <button
              type="button"
              onClick={() => setPlates((p) => p.filter((_, j) => j !== i))}
              className="text-xs text-[#EF4444]"
            >
              smaž
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => setPlates((p) => [...p, { weightKg: 10, pairs: 1 }])}
          className="self-start text-sm text-[#10B981]"
        >
          + Přidat talíř
        </button>
      </div>
      <button
        type="button"
        onClick={save}
        className="h-12 rounded-lg bg-[#10B981] font-semibold text-[#0A0E14]"
      >
        Uložit
      </button>
    </div>
  )
}
```

```tsx
// page.tsx
import { requireSessionUser } from '@/lib/auth-helpers'
import { redirect } from 'next/navigation'
import { PlateInventoryForm } from '@/components/workout/PlateInventoryForm'
import { db } from '@/db/client'
import { plateInventories } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { DEFAULT_PLATE_INVENTORY } from '@/db/seed/plate-inventory'

export default async function PlatesPage() {
  const user = await requireSessionUser()
  if (user instanceof Response) redirect('/login')
  let row = await db.query.plateInventories.findFirst({ where: eq(plateInventories.userId, user.id) })
  if (!row) {
    await db.insert(plateInventories).values({
      userId: user.id,
      barKg: DEFAULT_PLATE_INVENTORY.barKg,
      plates: [...DEFAULT_PLATE_INVENTORY.plates],
    })
    row = await db.query.plateInventories.findFirst({ where: eq(plateInventories.userId, user.id) })
  }
  return (
    <PlateInventoryForm
      initial={{ barKg: Number(row!.barKg), plates: row!.plates }}
    />
  )
}
```

- [ ] **Step 1: Commit**

```bash
npm run typecheck
git add src/app/\(app\)/settings/plates src/components/workout/PlateInventoryForm.tsx
git commit -m "feat(m2): /settings/plates CRUD"
```

---

## Task 33: Playwright config + E2E tests

**Files:** `playwright.config.ts`, `tests/e2e/workout-flow.spec.ts`

- [ ] **Step 1: Config**

`playwright.config.ts`:

```typescript
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  use: {
    baseURL: 'http://localhost:3000',
    headless: true,
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
})
```

- [ ] **Step 2: Add script**

Edit `package.json`:

```json
"test:e2e": "playwright test"
```

- [ ] **Step 3: Write E2E spec**

`tests/e2e/workout-flow.spec.ts`:

```typescript
import { test, expect } from '@playwright/test'

// Precondition: the test user from M1 bootstrap is seeded. Credentials come from env.

const EMAIL = process.env.E2E_EMAIL ?? 'jakub@test.com'
const PASSWORD = process.env.E2E_PASSWORD ?? 'ChangeMe1'

async function login(page: any) {
  await page.goto('/login')
  await page.getByLabel(/email/i).fill(EMAIL)
  await page.getByLabel(/heslo/i).fill(PASSWORD)
  await page.getByRole('button', { name: /přihlásit/i }).click()
  await expect(page).toHaveURL(/\/dashboard/)
}

test('start workout, log 3 sets, finish', async ({ page }) => {
  await login(page)
  await page.goto('/workout')
  await page.getByRole('button', { name: /upper a/i }).click()
  await expect(page).toHaveURL(/\/workout\/\d+/)
  // Log 3 sets
  for (let i = 0; i < 3; i++) {
    await page.getByLabel('zvýšit').first().click()
    await page.getByRole('button', { name: /zapsat sérii/i }).click()
    await page.waitForResponse((r) => r.url().includes('/sets') && r.status() === 201)
  }
  await page.getByRole('button', { name: /dokončit trénink/i }).click()
  await expect(page).toHaveURL(/\/dashboard/)
})

test('add ad-hoc exercise in active session', async ({ page }) => {
  await login(page)
  await page.goto('/workout')
  await page.getByRole('button', { name: /upper a/i }).click()
  await page.getByRole('button', { name: /\+ přidat cvik/i }).click()
  await page.getByPlaceholder('Hledej...').fill('curl')
  await page.getByRole('button', { name: /.*curl.*/i }).first().click()
  // Assert it appears in stepper
  await expect(page.getByText(/curl/i)).toBeVisible()
})

test('edit set in finished session', async ({ page }) => {
  await login(page)
  // Navigate to most recent finished session via history list
  await page.goto('/workout')
  const first = page.locator('a[href^="/workout/"]').first()
  await first.click()
  await page.getByRole('button', { name: /upravit/i }).click()
  const firstSet = page.locator('button:has-text("Série")').first()
  await firstSet.click()
  await page.getByLabel('zvýšit').nth(1).click() // reps+1
  await page.getByRole('button', { name: /uložit/i }).click()
  // Sheet closes + page re-renders
  await expect(page.locator('[role="dialog"]')).toHaveCount(0)
})
```

- [ ] **Step 4: Run E2E**

Start services + run:

```bash
docker compose up -d hexis-mysql
npm run db:migrate
# ensure user is bootstrapped (M1 step)
npm run test:e2e
```

Expected: all 3 pass. If flaky (selector mismatch), refine selectors based on actual DOM.

- [ ] **Step 5: Commit**

```bash
git add playwright.config.ts tests/e2e package.json
git commit -m "test(m2): Playwright E2E — workout flow, ad-hoc, edit"
```

---

## Task 34: Final gates + roadmap update + push

**Files:** `docs/superpowers/roadmap/hexis-roadmap.md`

- [ ] **Step 1: Full gate run**

```bash
npm run typecheck
npm run lint
TEST_DATABASE_URL="mysql://root:test@localhost:3308/hexis_test" npm run test:run
```

Expected: all clean. Fix any issue and re-run.

- [ ] **Step 2: Update roadmap**

Mark M2 core tasks done. Keep Service Worker timer, grafy, avatar UI, export as explicit pending for later milestones.

- [ ] **Step 3: Manual QA checklist**

Follow DoD in the spec (section 13) — run through:
- Login → start UA → log 3 sets of bench → skip OHP → finish
- Open history → tap last session → edit one set
- Leave session open, wait past 12h or manipulate startedAt in DB → reload dashboard → toast fires
- /settings/plates change bar to 15 → save → verify persisted

- [ ] **Step 4: Commit roadmap + push**

```bash
git add docs/superpowers/roadmap/hexis-roadmap.md
git commit -m "docs(m2): mark workout logging milestone complete in roadmap"
git push -u origin m2-workout-logging
```

PR URL printed by git push — either open as draft or merge strategy per M1 pattern (rebase + ff).

---

## Completion Checklist

- [ ] All tasks 1–34 committed in order
- [ ] `npm run typecheck` clean
- [ ] `npm run lint` clean
- [ ] Unit + integration tests green (~95+ tests)
- [ ] Playwright E2E green (3 scenarios)
- [ ] Branch pushed to origin
- [ ] Roadmap updated
- [ ] Manual QA performed per spec section 13
