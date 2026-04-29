# SP5 PR-2 — Habits (streak tracker + XP milestones) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Habits feature — a strict daily/weekly streak tracker — under `/habits`, flip the sidebar slot from placeholder to active, and add a "Today's Checks" card on the dashboard. Crossing 7/30/100-day streak milestones emits a one-off XP event with weight-scaled XP (light ×0.5, standard ×1, heavy ×2).

**Architecture:** Two new tables (`habits`, `habit_completions`). Streak is computed read-time per-habit by reverse-walking completions until the first gap. Milestone detection runs synchronously inside `POST /api/habits/[id]/check` for daily habits, lazily inside `GET /api/habits` for weekly habits (current ISO week is in-flight; weekly streak only counts closed weeks). Server-rendered `/habits` page with a thin client wrapper for dialogs and optimistic check toggles; mutations go through REST routes under `/api/habits/*` and refresh via `router.refresh()`.

**Tech Stack:** Next.js 15 (App Router, server components default), Drizzle ORM (MySQL), Zod validators, Radix UI primitives via `src/components/ui`, Tailwind v4, Vitest 4 + React Testing Library, Playwright. Spec: `docs/superpowers/specs/2026-04-29-sp5-pr2-habits-design.md`.

---

## Pre-flight notes (read once before starting)

- **Worktree convention** — work happens in `.worktrees/sp5-pr2-habits/` per SP2 onwards. The repo root stays clean. Copy `.env.local` into the worktree before running integration tests.
- **DB connection** — integration tests connect to the shared `hexis-mysql` Docker container on port 3306 via `db` from `@/db/client`. Tests must clean up rows they insert (`afterAll` deleting by `userId` LIKE prefix).
- **Auth pattern** — API routes use `requireSessionUser()` from `@/lib/auth-helpers`; if the return value `instanceof Response` is true, return it directly. For row ownership use `requireOwnership()`.
- **No FK constraints** — project convention: no `references()` in Drizzle schemas; integrity is enforced in app code.
- **Migration generation** — `npm run db:generate` produces `src/db/migrations/NNNN_<name>.sql` from schema diff. Inspect the generated file before committing. The previous migration was `0003_sp5_pr1_rewards.sql`; this slice produces `0004_sp5_pr2_habits.sql`.
- **xpEvents enum extend** — adding `'habit_streak'` to `xpEvents.eventType` enum produces an `ALTER TABLE` in the migration. This is a non-destructive enum widen — safe to run on prod.
- **xpDelta column type** — `xpEvents.xpDelta` is `smallint` (range −32768..32767). Heaviest habit-streak XP = 1000 × 2 = 2000. Fits.
- **XP_DELTAS map is per-event constant** — habits cannot use it because XP varies by milestone × weight. This plan adds a sister helper `awardXpVariable` in `src/lib/xp.ts` that takes an explicit `xpDelta`, alongside the existing `awardXp` (which looks up `XP_DELTAS[event]`).
- **Existing nav e2e** — `tests/e2e/nav.spec.ts` line 45 asserts 3 disabled placeholders (`Habits`, `Player Bio`, `Quest Calendar`). This plan rewrites that assertion to expect 2 (`Player Bio`, `Quest Calendar`) plus a working `/habits` link.
- **Existing Sidebar unit test** — `src/tests/shell/Sidebar.test.tsx:31` lists `'Habits'` among placeholder labels. This plan moves `'Habits'` to the active-area assertion.
- **Czech vocabulary** is locked in spec §10.4. Use: `Návyky`, `Návyk` (sg), `Splněno dnes`, `Vráceno`, `Cadence` (untranslated, technický), `Obtížnost`, `Streak` (anglicismus, untranslated like `XP`), `Daily` / `Weekly` (untranslated header labels per DS pattern), `Archive`, `Tap = check, drž = vrátit zpět`.
- **Toast API** — `useToast()` hook from `@/components/ui` has `show(message, tone?: 'success' | 'error' | 'info')`. Auto-dismisses after 3.5s. Use `'success'` for milestone toasts, `'info'` for "Vráceno", `'error'` for failed mutations.
- **useLongPress API** — `useLongPress(callback, ms = 500)` from `@/components/ui` returns pointer event handlers (`onPointerDown`/`onPointerUp`/`onPointerLeave`/`onPointerCancel`). Spread onto the row element.
- **Test addressability** — components that ship interactive elements should expose `data-*` hooks for Playwright (`data-habit-id`, `data-habit-row`, `data-check-button`, `data-streak-count`). RTL prefers role/label queries; Playwright leans on `data-*` for stability.
- **Timezone** — `POST /api/habits/[id]/check` and `DELETE` accept `date` as `YYYY-MM-DD` string. The server validates ≤ "today in user TZ" using `X-User-Tz-Offset` header (offset minutes from `Date.getTimezoneOffset()`). Missing header → fall back to UTC + warn log. Cap offset to ±840 minutes (±14h).
- **ISO week boundaries** — for weekly streak / current-week progress we use ISO weeks (Monday 00:00 → Sunday 23:59). Helper: `isoWeekKey(date) → 'YYYY-Www'` (e.g., `'2026-W18'`). Implement in `src/lib/habits/streak.ts`.

---

## Task 0: Branch + worktree setup

**Files:** none (env only).

- [ ] **Step 1: Create the branch worktree**

```bash
git fetch origin main
git worktree add -b sp5-pr2-habits .worktrees/sp5-pr2-habits origin/main
cd .worktrees/sp5-pr2-habits
cp ../../.env.local .env.local
```

- [ ] **Step 2: Install deps + sanity check**

```bash
npm install
npm run typecheck
npm run lint
```

Expected: no errors. If `typecheck` or `lint` fails on `main`, stop and surface to the user — don't start work on a red baseline.

- [ ] **Step 3: Capture baseline test counts**

```bash
npm run test:run 2>&1 | tail -20
```

Note the `<N> passed` count from the bottom of the report — call it `BASELINE_UNIT`. The plan adds tests; the final verification task confirms new total = `BASELINE_UNIT + N` where `N` is the count of tests added.

---

## Task 1: Schema — extend `xpEvents` enum + add `habits` and `habit_completions` tables

**Files:**
- Modify: `src/db/schema.ts` (extend `xpEvents.eventType` enum; append two tables)
- Create (auto-generated): `src/db/migrations/0004_sp5_pr2_habits.sql`
- Create (auto-generated): `src/db/migrations/meta/0004_snapshot.json`
- Modify (auto-generated): `src/db/migrations/meta/_journal.json`

- [ ] **Step 1: Extend the `xpEvents` enum**

Open `src/db/schema.ts`. Locate `export const xpEvents = mysqlTable(...)` (line 243). Append `'habit_streak'` to the `eventType` enum array, **after** `'streak_day'`:

```ts
    eventType: mysqlEnum('event_type', [
      'session_complete',
      'set_logged',
      'measurement_added',
      'photo_uploaded',
      'nutrition_logged',
      'pr_achieved',
      'streak_day',
      'habit_streak',
    ]).notNull(),
```

Do not change anything else in `xpEvents`.

- [ ] **Step 2: Append the two new tables**

Locate the last existing table block (`rewardRedemptions`, ends near line 311). Append below it, before the file's final newline:

```ts
// ═══════════════════════════════════════════════════════════════════
// HABITS (streak tracker — milestone hits emit `habit_streak` xp_event)
// ═══════════════════════════════════════════════════════════════════

export const habits = mysqlTable(
  'habits',
  {
    id: int('id').primaryKey().autoincrement(),
    userId: varchar('user_id', { length: 26 }).notNull(),
    name: varchar('name', { length: 80 }).notNull(),
    cadence: mysqlEnum('cadence', ['daily', 'weekly']).notNull(),
    weeklyTarget: int('weekly_target'),
    weight: mysqlEnum('weight', ['light', 'standard', 'heavy']).notNull().default('standard'),
    archivedAt: timestamp('archived_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => ({
    byUserActive: index('idx_habits_user_active').on(t.userId, t.archivedAt),
  })
)

export const habitCompletions = mysqlTable(
  'habit_completions',
  {
    id: int('id').primaryKey().autoincrement(),
    habitId: int('habit_id').notNull(),
    userId: varchar('user_id', { length: 26 }).notNull(),
    completedOn: date('completed_on').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => ({
    byHabitDate: unique('uniq_habit_date').on(t.habitId, t.completedOn),
    byUserDate: index('idx_completions_user_date').on(t.userId, t.completedOn),
  })
)
```

(`unique` is already imported at the top of the file. `index` and `mysqlEnum` are already imported. No new imports needed.)

- [ ] **Step 3: Generate migration**

Run: `npm run db:generate`

Expected: `[✓] Your SQL migration file ➜ src/db/migrations/0004_<auto>.sql`. Drizzle picks its own slug — rename:

```bash
ls -1 src/db/migrations/*.sql | tail -1
# Rename whichever 0004 file Drizzle produced:
mv src/db/migrations/0004_<auto>.sql src/db/migrations/0004_sp5_pr2_habits.sql
```

- [ ] **Step 4: Inspect the generated SQL**

Open the renamed file. Confirm exactly three statements separated by `--> statement-breakpoint`:

1. **`ALTER TABLE xp_events MODIFY COLUMN event_type ENUM(... , 'habit_streak') NOT NULL`** — enum widen.
2. **`CREATE TABLE habits ...`** with the unique index `uniq_habit_date` declared inline or as a separate statement.
3. **`CREATE TABLE habit_completions ...`** plus `CREATE INDEX idx_completions_user_date` and the unique constraint.

If Drizzle generated additional ALTERs to unrelated tables, abort and re-check that `schema.ts` has no incidental edits.

- [ ] **Step 5: Apply migration to dev DB**

```bash
npm run db:migrate
```

Expected: migration `0004_sp5_pr2_habits` applied. Verify in MySQL CLI:

```bash
docker exec hexis-mysql mysql -uroot -proot hexis -e "SHOW TABLES LIKE 'habit%';"
docker exec hexis-mysql mysql -uroot -proot hexis -e "SHOW COLUMNS FROM xp_events WHERE Field='event_type';"
```

Expected:
- 2 rows: `habits`, `habit_completions`.
- `event_type` column shows enum including `'habit_streak'`.

- [ ] **Step 6: Commit**

```bash
git add src/db/schema.ts src/db/migrations/0004_sp5_pr2_habits.sql src/db/migrations/meta/
git commit -m "feat(habits): schema (habits + habit_completions tables, extend xp_events enum)"
```

---

## Task 2: Pure streak compute — `src/lib/habits/streak.ts` (TDD)

Pure functions, no DB, no Date side-effects (today injected). Two helpers + one public `computeStreak`.

**Files:**
- Create: `src/lib/habits/streak.ts`
- Create: `src/tests/lib/habits/streak.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/tests/lib/habits/streak.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import {
  countConsecutiveDays,
  countConsecutiveClosedWeeks,
  isoWeekKey,
} from '@/lib/habits/streak'

const d = (s: string) => s // YYYY-MM-DD strings; the helpers parse them

describe('countConsecutiveDays', () => {
  it('returns 0 for empty completions', () => {
    expect(countConsecutiveDays([], d('2026-04-29'))).toBe(0)
  })

  it('returns 1 when only today is checked', () => {
    expect(countConsecutiveDays([d('2026-04-29')], d('2026-04-29'))).toBe(1)
  })

  it('returns 1 when only yesterday is checked, today missing (in-flight day)', () => {
    expect(countConsecutiveDays([d('2026-04-28')], d('2026-04-29'))).toBe(1)
  })

  it('returns 0 when today missing AND yesterday missing', () => {
    expect(countConsecutiveDays([d('2026-04-27')], d('2026-04-29'))).toBe(0)
  })

  it('counts back through consecutive days ending today', () => {
    expect(
      countConsecutiveDays(
        [d('2026-04-29'), d('2026-04-28'), d('2026-04-27'), d('2026-04-26')],
        d('2026-04-29'),
      ),
    ).toBe(4)
  })

  it('stops at the first gap', () => {
    expect(
      countConsecutiveDays(
        [d('2026-04-29'), d('2026-04-28'), d('2026-04-26')], // gap at 27
        d('2026-04-29'),
      ),
    ).toBe(2)
  })

  it('ignores ordering of input array', () => {
    expect(
      countConsecutiveDays(
        [d('2026-04-26'), d('2026-04-29'), d('2026-04-28'), d('2026-04-27')],
        d('2026-04-29'),
      ),
    ).toBe(4)
  })

  it('deduplicates duplicate dates (defensive)', () => {
    expect(
      countConsecutiveDays(
        [d('2026-04-29'), d('2026-04-29'), d('2026-04-28')],
        d('2026-04-29'),
      ),
    ).toBe(2)
  })
})

describe('isoWeekKey', () => {
  it('returns YYYY-Www format', () => {
    expect(isoWeekKey('2026-04-29')).toMatch(/^\d{4}-W\d{2}$/)
  })

  it('Monday and Sunday of the same ISO week share a key', () => {
    // 2026-04-27 is Monday, 2026-05-03 is Sunday
    expect(isoWeekKey('2026-04-27')).toBe(isoWeekKey('2026-05-03'))
  })

  it('Sunday vs next Monday differ', () => {
    // 2026-05-03 Sun (W18), 2026-05-04 Mon (W19)
    expect(isoWeekKey('2026-05-03')).not.toBe(isoWeekKey('2026-05-04'))
  })

  it('handles ISO year rollover (Jan 1 in week 53 of prior year)', () => {
    // 2027-01-01 is Friday → ISO 2026-W53
    expect(isoWeekKey('2027-01-01')).toBe('2026-W53')
  })
})

describe('countConsecutiveClosedWeeks', () => {
  it('returns 0 for empty completions', () => {
    expect(countConsecutiveClosedWeeks([], 3, d('2026-04-29'))).toBe(0)
  })

  it('current week does NOT count toward streak even if target hit', () => {
    // 2026-04-29 is Wednesday in W18; target=3, we have 3 in current week, 0 in past
    expect(
      countConsecutiveClosedWeeks(
        [d('2026-04-27'), d('2026-04-28'), d('2026-04-29')],
        3,
        d('2026-04-29'),
      ),
    ).toBe(0)
  })

  it('counts last closed week if it hit target', () => {
    // Last closed week = W17 (2026-04-20..04-26); 3 completions there, target=3
    expect(
      countConsecutiveClosedWeeks(
        [d('2026-04-20'), d('2026-04-21'), d('2026-04-22')],
        3,
        d('2026-04-29'),
      ),
    ).toBe(1)
  })

  it('counts back through consecutive closed weeks', () => {
    // W17 = 3, W16 = 4, W15 = 3 — all hit target=3 → streak 3
    expect(
      countConsecutiveClosedWeeks(
        [
          d('2026-04-20'), d('2026-04-21'), d('2026-04-22'), // W17
          d('2026-04-13'), d('2026-04-14'), d('2026-04-15'), d('2026-04-16'), // W16
          d('2026-04-06'), d('2026-04-07'), d('2026-04-08'), // W15
        ],
        3,
        d('2026-04-29'),
      ),
    ).toBe(3)
  })

  it('stops at first closed week below target', () => {
    // W17 = 3, W16 = 2 (below target), W15 = 3 → streak 1 (only W17)
    expect(
      countConsecutiveClosedWeeks(
        [
          d('2026-04-20'), d('2026-04-21'), d('2026-04-22'), // W17 = 3
          d('2026-04-13'), d('2026-04-14'),                  // W16 = 2
          d('2026-04-06'), d('2026-04-07'), d('2026-04-08'), // W15 = 3
        ],
        3,
        d('2026-04-29'),
      ),
    ).toBe(1)
  })

  it('skips current in-flight week when computing streak', () => {
    // Current W18 = 5 (way over), last closed W17 = 0, W16 = 3 → streak 0 (W17 broke it)
    expect(
      countConsecutiveClosedWeeks(
        [
          d('2026-04-27'), d('2026-04-28'), d('2026-04-29'), // W18 current
          // W17 empty
          d('2026-04-13'), d('2026-04-14'), d('2026-04-15'), // W16 = 3
        ],
        3,
        d('2026-04-29'),
      ),
    ).toBe(0)
  })
})
```

- [ ] **Step 2: Run test, verify it fails**

```bash
npm run test:run -- src/tests/lib/habits/streak.test.ts
```

Expected: FAIL with module-resolution error (`Cannot find module '@/lib/habits/streak'`).

- [ ] **Step 3: Implement the module**

Create `src/lib/habits/streak.ts`:

```ts
/**
 * Pure streak helpers. No DB. No `new Date()` side-effects — all functions take
 * `today` as a YYYY-MM-DD string. The caller is responsible for resolving "today"
 * in the user's timezone before calling.
 *
 * All YYYY-MM-DD strings are interpreted as midnight UTC for arithmetic; this is
 * safe because we never compare across TZs — the caller is consistent.
 */

const MS_PER_DAY = 86_400_000

function parseYmd(ymd: string): Date {
  // Force UTC interpretation; `new Date('2026-04-29')` is already UTC midnight,
  // but we go via Date.UTC to be explicit.
  const [y, m, d] = ymd.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d))
}

function toYmd(date: Date): string {
  const y = date.getUTCFullYear()
  const m = String(date.getUTCMonth() + 1).padStart(2, '0')
  const d = String(date.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function addDaysYmd(ymd: string, delta: number): string {
  const t = parseYmd(ymd).getTime()
  return toYmd(new Date(t + delta * MS_PER_DAY))
}

/**
 * Count consecutive daily completions ending at `today` or `today-1` (in-flight grace).
 *
 * Streak rules:
 * - If today is in completions → walk back from today.
 * - Else if yesterday is in completions → walk back from yesterday.
 * - Else → 0 (today's not done AND yesterday's not done = chain broken).
 */
export function countConsecutiveDays(completions: string[], today: string): number {
  const set = new Set(completions)
  let cursor: string
  if (set.has(today)) {
    cursor = today
  } else if (set.has(addDaysYmd(today, -1))) {
    cursor = addDaysYmd(today, -1)
  } else {
    return 0
  }
  let n = 0
  while (set.has(cursor)) {
    n++
    cursor = addDaysYmd(cursor, -1)
  }
  return n
}

/**
 * ISO week key in `YYYY-Www` format (W01..W53).
 * Uses ISO 8601: weeks start on Monday; week 1 contains the first Thursday of the year.
 */
export function isoWeekKey(ymd: string): string {
  const date = parseYmd(ymd)
  // Algorithm: shift to Thursday of the same week, then compute year + week.
  const dayOfWeek = date.getUTCDay() || 7 // Sunday=0 → 7
  date.setUTCDate(date.getUTCDate() + 4 - dayOfWeek) // shift to Thursday
  const year = date.getUTCFullYear()
  const yearStart = new Date(Date.UTC(year, 0, 1))
  const week = Math.ceil(((date.getTime() - yearStart.getTime()) / MS_PER_DAY + 1) / 7)
  return `${year}-W${String(week).padStart(2, '0')}`
}

/**
 * Walk back through *closed* ISO weeks, counting consecutive weeks that hit the
 * weekly target. The current (in-flight) week is skipped: it's reported separately
 * as `completedThisWeek` in the API response.
 *
 * Stops at the first closed week below target.
 */
export function countConsecutiveClosedWeeks(
  completions: string[],
  weeklyTarget: number,
  today: string,
): number {
  const currentWeek = isoWeekKey(today)
  const counts = new Map<string, number>()
  for (const c of completions) {
    const key = isoWeekKey(c)
    if (key === currentWeek) continue // skip in-flight
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }

  // Walk back from "last closed week" = today shifted to previous Monday, then -1 day.
  // Easier: start cursor at today - 7 days; then keep stepping by -7 days.
  let cursor = addDaysYmd(today, -7)
  let n = 0
  // Cap at 200 weeks (≈ 4 years) to avoid runaway loops on bad data.
  for (let i = 0; i < 200; i++) {
    const key = isoWeekKey(cursor)
    if ((counts.get(key) ?? 0) >= weeklyTarget) {
      n++
      cursor = addDaysYmd(cursor, -7)
    } else {
      break
    }
  }
  return n
}
```

- [ ] **Step 4: Run tests, verify pass**

```bash
npm run test:run -- src/tests/lib/habits/streak.test.ts
```

Expected: all tests pass (≈18 tests total).

- [ ] **Step 5: Commit**

```bash
git add src/lib/habits/streak.ts src/tests/lib/habits/streak.test.ts
git commit -m "feat(habits): pure streak compute (daily + ISO-week)"
```

---

## Task 3: Pure milestone detection — `src/lib/habits/milestone.ts` (TDD)

**Files:**
- Create: `src/lib/habits/milestone.ts`
- Create: `src/tests/lib/habits/milestone.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/tests/lib/habits/milestone.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import {
  detectMilestone,
  xpForMilestone,
  HABIT_MILESTONES,
  MILESTONE_BASE_XP,
  WEIGHT_MULTIPLIER,
} from '@/lib/habits/milestone'

describe('detectMilestone', () => {
  it('returns null when streak does not match a milestone', () => {
    expect(detectMilestone(0)).toBeNull()
    expect(detectMilestone(1)).toBeNull()
    expect(detectMilestone(6)).toBeNull()
    expect(detectMilestone(8)).toBeNull()
    expect(detectMilestone(29)).toBeNull()
    expect(detectMilestone(101)).toBeNull()
    expect(detectMilestone(99)).toBeNull()
  })

  it('returns 7 / 30 / 100 when streak hits exactly', () => {
    expect(detectMilestone(7)).toBe(7)
    expect(detectMilestone(30)).toBe(30)
    expect(detectMilestone(100)).toBe(100)
  })
})

describe('xpForMilestone', () => {
  it('returns base XP for standard weight', () => {
    expect(xpForMilestone(7, 'standard')).toBe(50)
    expect(xpForMilestone(30, 'standard')).toBe(200)
    expect(xpForMilestone(100, 'standard')).toBe(1000)
  })

  it('halves XP for light weight', () => {
    expect(xpForMilestone(7, 'light')).toBe(25)
    expect(xpForMilestone(30, 'light')).toBe(100)
    expect(xpForMilestone(100, 'light')).toBe(500)
  })

  it('doubles XP for heavy weight', () => {
    expect(xpForMilestone(7, 'heavy')).toBe(100)
    expect(xpForMilestone(30, 'heavy')).toBe(400)
    expect(xpForMilestone(100, 'heavy')).toBe(2000)
  })

  it('always returns an integer', () => {
    for (const m of HABIT_MILESTONES) {
      for (const w of ['light', 'standard', 'heavy'] as const) {
        const xp = xpForMilestone(m, w)
        expect(Number.isInteger(xp)).toBe(true)
      }
    }
  })
})

describe('constants', () => {
  it('HABIT_MILESTONES is [7, 30, 100]', () => {
    expect(HABIT_MILESTONES).toEqual([7, 30, 100])
  })

  it('MILESTONE_BASE_XP covers all milestones', () => {
    expect(MILESTONE_BASE_XP[7]).toBe(50)
    expect(MILESTONE_BASE_XP[30]).toBe(200)
    expect(MILESTONE_BASE_XP[100]).toBe(1000)
  })

  it('WEIGHT_MULTIPLIER table', () => {
    expect(WEIGHT_MULTIPLIER.light).toBe(0.5)
    expect(WEIGHT_MULTIPLIER.standard).toBe(1)
    expect(WEIGHT_MULTIPLIER.heavy).toBe(2)
  })
})
```

- [ ] **Step 2: Run test, verify it fails**

```bash
npm run test:run -- src/tests/lib/habits/milestone.test.ts
```

Expected: FAIL with `Cannot find module '@/lib/habits/milestone'`.

- [ ] **Step 3: Implement the module**

Create `src/lib/habits/milestone.ts`:

```ts
export type HabitWeight = 'light' | 'standard' | 'heavy'
export type HabitMilestone = 7 | 30 | 100

export const HABIT_MILESTONES: readonly HabitMilestone[] = [7, 30, 100] as const

export const MILESTONE_BASE_XP: Record<HabitMilestone, number> = {
  7: 50,
  30: 200,
  100: 1000,
}

export const WEIGHT_MULTIPLIER: Record<HabitWeight, number> = {
  light: 0.5,
  standard: 1,
  heavy: 2,
}

/**
 * If `streak` equals one of the configured milestone thresholds, return that
 * threshold; otherwise null. Caller is responsible for de-duplicating against
 * already-emitted xp_events for this habit + milestone.
 */
export function detectMilestone(streak: number): HabitMilestone | null {
  if (streak === 7 || streak === 30 || streak === 100) return streak
  return null
}

/**
 * XP awarded when a habit hits `milestone` — base value scaled by the habit's
 * weight. Always returns an integer (base values × multipliers are int-safe).
 */
export function xpForMilestone(milestone: HabitMilestone, weight: HabitWeight): number {
  return MILESTONE_BASE_XP[milestone] * WEIGHT_MULTIPLIER[weight]
}

/**
 * Meta payload stored on `xp_events.meta` for habit_streak events. Used as a
 * dedup key when checking whether this milestone has already been awarded.
 */
export type HabitStreakMeta = {
  habitId: number
  milestone: HabitMilestone
  weight: HabitWeight
}
```

- [ ] **Step 4: Run tests, verify pass**

```bash
npm run test:run -- src/tests/lib/habits/milestone.test.ts
```

Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/habits/milestone.ts src/tests/lib/habits/milestone.test.ts
git commit -m "feat(habits): pure milestone detection (7/30/100, weighted XP)"
```

---

## Task 4: `awardXpVariable` helper — extend `src/lib/xp.ts`

The existing `awardXp` looks up XP from a fixed `XP_DELTAS` table. Habit milestones need an explicit per-call delta. Add a sister export.

**Files:**
- Modify: `src/lib/xp.ts`
- Create: `src/tests/lib/xp.variable.test.ts`

- [ ] **Step 1: Write the failing integration test**

Create `src/tests/lib/xp.variable.test.ts`:

```ts
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { db } from '@/db/client'
import { users, xpEvents } from '@/db/schema'
import { eq, like, and } from 'drizzle-orm'
import { awardXpVariable, getTotalXp } from '@/lib/xp'

const PREFIX = 'xpvtest_'
const USER = `${PREFIX}user000000000001`

beforeAll(async () => {
  await db.insert(users).values({
    id: USER,
    email: `${PREFIX}user@hexis.local`,
    name: 'XP Variable Test',
    passwordHash: 'x',
  })
})

afterAll(async () => {
  await db.delete(xpEvents).where(eq(xpEvents.userId, USER))
  await db.delete(users).where(like(users.id, `${PREFIX}%`))
})

beforeEach(async () => {
  await db.delete(xpEvents).where(eq(xpEvents.userId, USER))
})

describe('awardXpVariable', () => {
  it('inserts an xp_events row with the explicit delta and meta', async () => {
    await awardXpVariable({
      db,
      userId: USER,
      event: 'habit_streak',
      xpDelta: 50,
      meta: { habitId: 1, milestone: 7, weight: 'standard' },
    })
    const rows = await db.select().from(xpEvents).where(eq(xpEvents.userId, USER))
    expect(rows).toHaveLength(1)
    expect(rows[0].eventType).toBe('habit_streak')
    expect(rows[0].xpDelta).toBe(50)
    expect(rows[0].meta).toEqual({ habitId: 1, milestone: 7, weight: 'standard' })
  })

  it('updates user.level when xp crosses a level boundary', async () => {
    // Level 2 = 100 XP, level 3 = 400 XP. Award 500 → level 3.
    await awardXpVariable({
      db,
      userId: USER,
      event: 'habit_streak',
      xpDelta: 500,
      meta: { habitId: 1, milestone: 30, weight: 'heavy' },
    })
    const u = await db.query.users.findFirst({ where: eq(users.id, USER) })
    expect(u?.level).toBe(3) // sqrt(500/100) = 2.23, floor +1 = 3
  })

  it('contributes to getTotalXp', async () => {
    await awardXpVariable({
      db,
      userId: USER,
      event: 'habit_streak',
      xpDelta: 50,
      meta: { habitId: 1, milestone: 7, weight: 'standard' },
    })
    expect(await getTotalXp(db, USER)).toBe(50)
  })
})
```

- [ ] **Step 2: Run, verify fail**

```bash
npm run test:run -- src/tests/lib/xp.variable.test.ts
```

Expected: FAIL — `awardXpVariable` not exported.

- [ ] **Step 3: Add `awardXpVariable` to `src/lib/xp.ts`**

Open `src/lib/xp.ts`. Find the existing `awardXp` function (around the top of the file). Below `reverseXp` and above `appendXpEvent`, add:

```ts
type AwardVariableArgs = {
  db: DB
  userId: string
  event: XpEventType
  xpDelta: number
  sessionId?: number | null
  meta?: Record<string, unknown>
}

/**
 * Like `awardXp` but with an explicit delta — for events whose XP varies (e.g.
 * `habit_streak`, where the amount depends on milestone × weight).
 *
 * Use sparingly: most events should use `awardXp` so that XP_DELTAS remains the
 * single source of truth.
 */
export async function awardXpVariable(args: AwardVariableArgs) {
  return appendXpEvent({
    db: args.db,
    userId: args.userId,
    event: args.event,
    xpDelta: args.xpDelta,
    sessionId: args.sessionId ?? null,
    meta: args.meta,
  })
}
```

`DB` is the type alias already in scope. `appendXpEvent`, `XpEventType`, and the level-update logic remain unchanged.

If `XpEventType` does not yet include `'habit_streak'` because of a stale import, also update `src/lib/xp-events.ts`:

```ts
export const XP_DELTAS = {
  session_complete: 100,
  set_logged: 5,
  measurement_added: 20,
  photo_uploaded: 15,
  nutrition_logged: 10,
  pr_achieved: 50,
  streak_day: 10,
  habit_streak: 0, // sentinel — actual delta passed via awardXpVariable
} as const
```

The `0` sentinel is intentional: any code path that mistakenly calls `awardXp({ event: 'habit_streak' })` will award 0 (no-op) rather than awarding a wrong default. The contract is "habit_streak goes through awardXpVariable".

- [ ] **Step 4: Run, verify pass**

```bash
npm run test:run -- src/tests/lib/xp.variable.test.ts
```

Expected: 3 passed.

- [ ] **Step 5: Commit**

```bash
git add src/lib/xp.ts src/lib/xp-events.ts src/tests/lib/xp.variable.test.ts
git commit -m "feat(xp): add awardXpVariable for events with non-fixed deltas"
```

---

## Task 5: Validators — `src/lib/validators/habits.ts`

**Files:**
- Create: `src/lib/validators/habits.ts`
- Create: `src/tests/lib/validators/habits.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/tests/lib/validators/habits.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import {
  habitCreateSchema,
  habitPatchSchema,
  habitCheckSchema,
} from '@/lib/validators/habits'

describe('habitCreateSchema', () => {
  it('accepts a valid daily habit', () => {
    const r = habitCreateSchema.safeParse({
      name: 'Voda',
      cadence: 'daily',
      weight: 'standard',
    })
    expect(r.success).toBe(true)
  })

  it('rejects a daily habit with weeklyTarget', () => {
    const r = habitCreateSchema.safeParse({
      name: 'Voda',
      cadence: 'daily',
      weeklyTarget: 3,
      weight: 'standard',
    })
    expect(r.success).toBe(false)
  })

  it('accepts a weekly habit with target 1..7', () => {
    for (const t of [1, 3, 7]) {
      const r = habitCreateSchema.safeParse({
        name: 'Meditace',
        cadence: 'weekly',
        weeklyTarget: t,
        weight: 'light',
      })
      expect(r.success).toBe(true)
    }
  })

  it('rejects a weekly habit without weeklyTarget', () => {
    const r = habitCreateSchema.safeParse({
      name: 'Meditace',
      cadence: 'weekly',
      weight: 'light',
    })
    expect(r.success).toBe(false)
  })

  it('rejects weeklyTarget out of 1..7', () => {
    for (const t of [0, -1, 8, 100]) {
      const r = habitCreateSchema.safeParse({
        name: 'Meditace',
        cadence: 'weekly',
        weeklyTarget: t,
        weight: 'standard',
      })
      expect(r.success).toBe(false)
    }
  })

  it('trims name whitespace', () => {
    const r = habitCreateSchema.safeParse({
      name: '  Voda  ',
      cadence: 'daily',
      weight: 'standard',
    })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.name).toBe('Voda')
  })

  it('rejects empty name after trim', () => {
    const r = habitCreateSchema.safeParse({
      name: '   ',
      cadence: 'daily',
      weight: 'standard',
    })
    expect(r.success).toBe(false)
  })

  it('rejects name longer than 80 chars', () => {
    const r = habitCreateSchema.safeParse({
      name: 'a'.repeat(81),
      cadence: 'daily',
      weight: 'standard',
    })
    expect(r.success).toBe(false)
  })

  it('defaults weight to standard if omitted', () => {
    const r = habitCreateSchema.safeParse({ name: 'Voda', cadence: 'daily' })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.weight).toBe('standard')
  })
})

describe('habitPatchSchema', () => {
  it('accepts name-only patch', () => {
    expect(habitPatchSchema.safeParse({ name: 'Nový název' }).success).toBe(true)
  })

  it('accepts weight-only patch', () => {
    expect(habitPatchSchema.safeParse({ weight: 'heavy' }).success).toBe(true)
  })

  it('rejects empty patch', () => {
    expect(habitPatchSchema.safeParse({}).success).toBe(false)
  })

  it('rejects cadence patch (immutable)', () => {
    expect(habitPatchSchema.safeParse({ cadence: 'weekly' }).success).toBe(false)
  })

  it('rejects weeklyTarget patch (immutable)', () => {
    expect(habitPatchSchema.safeParse({ weeklyTarget: 5 }).success).toBe(false)
  })
})

describe('habitCheckSchema', () => {
  it('accepts YYYY-MM-DD', () => {
    expect(habitCheckSchema.safeParse({ date: '2026-04-29' }).success).toBe(true)
  })

  it('rejects malformed date', () => {
    expect(habitCheckSchema.safeParse({ date: '29-04-2026' }).success).toBe(false)
    expect(habitCheckSchema.safeParse({ date: '2026/04/29' }).success).toBe(false)
    expect(habitCheckSchema.safeParse({ date: '2026-4-29' }).success).toBe(false)
  })
})
```

- [ ] **Step 2: Run, verify fail**

```bash
npm run test:run -- src/tests/lib/validators/habits.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement validators**

Create `src/lib/validators/habits.ts`:

```ts
import { z } from 'zod'

const cadence = z.enum(['daily', 'weekly'])
const weight = z.enum(['light', 'standard', 'heavy'])

export const habitCreateSchema = z
  .object({
    name: z.string().trim().min(1).max(80),
    cadence,
    weeklyTarget: z.number().int().min(1).max(7).optional(),
    weight: weight.default('standard'),
  })
  .superRefine((val, ctx) => {
    if (val.cadence === 'daily' && val.weeklyTarget !== undefined) {
      ctx.addIssue({ code: 'custom', message: 'weeklyTarget must be omitted for daily cadence', path: ['weeklyTarget'] })
    }
    if (val.cadence === 'weekly' && val.weeklyTarget === undefined) {
      ctx.addIssue({ code: 'custom', message: 'weeklyTarget is required for weekly cadence', path: ['weeklyTarget'] })
    }
  })

// PATCH: only `name` and `weight` are mutable. cadence/weeklyTarget rejected.
export const habitPatchSchema = z
  .object({
    name: z.string().trim().min(1).max(80).optional(),
    weight: weight.optional(),
    archivedAt: z.union([z.string().datetime(), z.null()]).optional(),
  })
  .strict() // unknown keys (including cadence, weeklyTarget) → reject
  .refine((obj) => Object.keys(obj).length > 0, { message: 'patch must not be empty' })

export const habitCheckSchema = z.object({
  // strict YYYY-MM-DD format (no shortened months/days)
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'must be YYYY-MM-DD'),
})

export type HabitCreate = z.infer<typeof habitCreateSchema>
export type HabitPatch = z.infer<typeof habitPatchSchema>
export type HabitCheck = z.infer<typeof habitCheckSchema>
```

- [ ] **Step 4: Run, verify pass**

```bash
npm run test:run -- src/tests/lib/validators/habits.test.ts
```

Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/validators/habits.ts src/tests/lib/validators/habits.test.ts
git commit -m "feat(habits): zod validators (create/patch/check)"
```

---

## Task 6: Queries — `src/lib/queries/habits.ts` (TDD, integration)

Public exports: `fetchActiveHabitsWithStreak`, `fetchHabitWithCompletions`, `findActiveHabitByCaseInsensitiveName`, `hasMilestoneBeenAwarded`. Internal helper `loadCompletions(habitId, sinceDays)` lives un-exported.

**Files:**
- Create: `src/lib/queries/habits.ts`
- Create: `src/tests/lib/queries/habits.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/tests/lib/queries/habits.test.ts`:

```ts
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { db } from '@/db/client'
import { users, xpEvents, habits, habitCompletions } from '@/db/schema'
import { eq, like } from 'drizzle-orm'
import {
  fetchActiveHabitsWithStreak,
  fetchHabitWithCompletions,
  findActiveHabitByCaseInsensitiveName,
  hasMilestoneBeenAwarded,
} from '@/lib/queries/habits'

const PREFIX = 'hbtest_'
const USER = `${PREFIX}user000000000001`

beforeAll(async () => {
  await db.insert(users).values({
    id: USER,
    email: `${PREFIX}user@hexis.local`,
    name: 'Habits Test',
    passwordHash: 'x',
  })
})

afterAll(async () => {
  await db.delete(habitCompletions).where(eq(habitCompletions.userId, USER))
  await db.delete(habits).where(eq(habits.userId, USER))
  await db.delete(xpEvents).where(eq(xpEvents.userId, USER))
  await db.delete(users).where(like(users.id, `${PREFIX}%`))
})

beforeEach(async () => {
  await db.delete(habitCompletions).where(eq(habitCompletions.userId, USER))
  await db.delete(habits).where(eq(habits.userId, USER))
  await db.delete(xpEvents).where(eq(xpEvents.userId, USER))
})

const TODAY = '2026-04-29' // Wednesday in ISO W18

describe('fetchActiveHabitsWithStreak', () => {
  it('returns empty array when user has no habits', async () => {
    expect(await fetchActiveHabitsWithStreak(db, USER, TODAY)).toEqual([])
  })

  it('excludes archived habits', async () => {
    await db.insert(habits).values([
      { userId: USER, name: 'Active', cadence: 'daily', weight: 'standard' },
      { userId: USER, name: 'Old', cadence: 'daily', weight: 'standard', archivedAt: new Date() },
    ])
    const r = await fetchActiveHabitsWithStreak(db, USER, TODAY)
    expect(r).toHaveLength(1)
    expect(r[0].name).toBe('Active')
  })

  it('computes streak for daily habit', async () => {
    const [h] = await db.insert(habits).values({
      userId: USER,
      name: 'Voda',
      cadence: 'daily',
      weight: 'standard',
    })
    await db.insert(habitCompletions).values([
      { habitId: h.insertId, userId: USER, completedOn: '2026-04-29' },
      { habitId: h.insertId, userId: USER, completedOn: '2026-04-28' },
      { habitId: h.insertId, userId: USER, completedOn: '2026-04-27' },
    ])
    const [row] = await fetchActiveHabitsWithStreak(db, USER, TODAY)
    expect(row.currentStreak).toBe(3)
    expect(row.completedToday).toBe(true)
  })

  it('reports completedToday=false when today is not checked', async () => {
    const [h] = await db.insert(habits).values({
      userId: USER, name: 'Voda', cadence: 'daily', weight: 'standard',
    })
    await db.insert(habitCompletions).values({
      habitId: h.insertId, userId: USER, completedOn: '2026-04-28',
    })
    const [row] = await fetchActiveHabitsWithStreak(db, USER, TODAY)
    expect(row.completedToday).toBe(false)
    expect(row.currentStreak).toBe(1) // grace: yesterday counts
  })

  it('computes weekly streak + completedThisWeek progress', async () => {
    const [h] = await db.insert(habits).values({
      userId: USER, name: 'Meditace', cadence: 'weekly', weeklyTarget: 3, weight: 'light',
    })
    await db.insert(habitCompletions).values([
      // Current week (W18: 2026-04-27..05-03): 2 completions so far
      { habitId: h.insertId, userId: USER, completedOn: '2026-04-27' },
      { habitId: h.insertId, userId: USER, completedOn: '2026-04-28' },
      // Last closed week (W17: 2026-04-20..04-26): 3 completions, target hit
      { habitId: h.insertId, userId: USER, completedOn: '2026-04-20' },
      { habitId: h.insertId, userId: USER, completedOn: '2026-04-21' },
      { habitId: h.insertId, userId: USER, completedOn: '2026-04-22' },
    ])
    const [row] = await fetchActiveHabitsWithStreak(db, USER, TODAY)
    expect(row.currentStreak).toBe(1) // W17 closed and hit target
    expect(row.completedThisWeek).toBe(2)
  })
})

describe('fetchHabitWithCompletions', () => {
  it('returns null for non-existent habit', async () => {
    expect(await fetchHabitWithCompletions(db, USER, 99999)).toBeNull()
  })

  it('returns null when habit belongs to another user', async () => {
    const [h] = await db.insert(habits).values({
      userId: USER, name: 'Voda', cadence: 'daily', weight: 'standard',
    })
    expect(await fetchHabitWithCompletions(db, 'other_user', h.insertId)).toBeNull()
  })

  it('returns habit + last 200 completion dates desc', async () => {
    const [h] = await db.insert(habits).values({
      userId: USER, name: 'Voda', cadence: 'daily', weight: 'standard',
    })
    await db.insert(habitCompletions).values([
      { habitId: h.insertId, userId: USER, completedOn: '2026-04-29' },
      { habitId: h.insertId, userId: USER, completedOn: '2026-04-27' },
      { habitId: h.insertId, userId: USER, completedOn: '2026-04-28' },
    ])
    const r = await fetchHabitWithCompletions(db, USER, h.insertId)
    expect(r?.completionDates).toEqual(['2026-04-29', '2026-04-28', '2026-04-27'])
  })
})

describe('findActiveHabitByCaseInsensitiveName', () => {
  it('returns null when no match', async () => {
    expect(await findActiveHabitByCaseInsensitiveName(db, USER, 'Nope')).toBeNull()
  })

  it('matches case-insensitively', async () => {
    await db.insert(habits).values({
      userId: USER, name: 'Voda', cadence: 'daily', weight: 'standard',
    })
    const r = await findActiveHabitByCaseInsensitiveName(db, USER, 'voda')
    expect(r?.name).toBe('Voda')
  })

  it('ignores archived habits', async () => {
    await db.insert(habits).values({
      userId: USER, name: 'Voda', cadence: 'daily', weight: 'standard', archivedAt: new Date(),
    })
    expect(await findActiveHabitByCaseInsensitiveName(db, USER, 'voda')).toBeNull()
  })
})

describe('hasMilestoneBeenAwarded', () => {
  it('returns false when no xp_event for this habit/milestone', async () => {
    expect(await hasMilestoneBeenAwarded(db, USER, 1, 7)).toBe(false)
  })

  it('returns true after a habit_streak event was inserted', async () => {
    await db.insert(xpEvents).values({
      userId: USER,
      eventType: 'habit_streak',
      xpDelta: 50,
      meta: { habitId: 42, milestone: 7, weight: 'standard' },
    })
    expect(await hasMilestoneBeenAwarded(db, USER, 42, 7)).toBe(true)
    expect(await hasMilestoneBeenAwarded(db, USER, 42, 30)).toBe(false)
    expect(await hasMilestoneBeenAwarded(db, USER, 99, 7)).toBe(false)
  })
})
```

- [ ] **Step 2: Run, verify fail**

```bash
npm run test:run -- src/tests/lib/queries/habits.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement queries**

Create `src/lib/queries/habits.ts`:

```ts
import type { MySql2Database } from 'drizzle-orm/mysql2'
import { and, asc, desc, eq, isNull, sql } from 'drizzle-orm'
import * as schema from '@/db/schema'
import { habits, habitCompletions, xpEvents } from '@/db/schema'
import {
  countConsecutiveDays,
  countConsecutiveClosedWeeks,
  isoWeekKey,
} from '@/lib/habits/streak'
import type { HabitMilestone } from '@/lib/habits/milestone'

type DB = MySql2Database<typeof schema>

export type HabitRow = typeof habits.$inferSelect

export type HabitWithStreak = HabitRow & {
  currentStreak: number
  completedToday: boolean
  completedThisWeek?: number // only present when cadence === 'weekly'
}

/**
 * Load active habits for a user, joined with derived streak fields.
 * `today` is YYYY-MM-DD in the user's timezone (resolved upstream from header).
 */
export async function fetchActiveHabitsWithStreak(
  db: DB,
  userId: string,
  today: string,
): Promise<HabitWithStreak[]> {
  const rows = await db
    .select()
    .from(habits)
    .where(and(eq(habits.userId, userId), isNull(habits.archivedAt)))
    .orderBy(asc(habits.cadence), asc(habits.id)) // daily before weekly, stable order

  if (rows.length === 0) return []

  // Single bulk query for all completion dates of these habits, capped per habit at 200.
  // Simpler: just bulk-load all completions for this user (200 cap unlikely to matter).
  const all = await db
    .select({
      habitId: habitCompletions.habitId,
      completedOn: habitCompletions.completedOn,
    })
    .from(habitCompletions)
    .where(eq(habitCompletions.userId, userId))
    .orderBy(desc(habitCompletions.completedOn))

  const byHabit = new Map<number, string[]>()
  for (const r of all) {
    const ymd = ymdFromDb(r.completedOn)
    const arr = byHabit.get(r.habitId) ?? []
    arr.push(ymd)
    byHabit.set(r.habitId, arr)
  }

  const currentWeekKey = isoWeekKey(today)

  return rows.map((h) => {
    const dates = byHabit.get(h.id) ?? []
    if (h.cadence === 'daily') {
      return {
        ...h,
        currentStreak: countConsecutiveDays(dates, today),
        completedToday: dates.includes(today),
      }
    } else {
      const completedThisWeek = dates.filter((d) => isoWeekKey(d) === currentWeekKey).length
      return {
        ...h,
        currentStreak: countConsecutiveClosedWeeks(dates, h.weeklyTarget!, today),
        completedToday: dates.includes(today),
        completedThisWeek,
      }
    }
  })
}

export type HabitWithCompletions = HabitRow & { completionDates: string[] }

/**
 * Load a single habit owned by `userId` plus the last 200 completion dates (desc).
 * Returns null when the habit doesn't exist or doesn't belong to the user.
 */
export async function fetchHabitWithCompletions(
  db: DB,
  userId: string,
  habitId: number,
): Promise<HabitWithCompletions | null> {
  const row = await db.query.habits.findFirst({ where: eq(habits.id, habitId) })
  if (!row || row.userId !== userId) return null
  const completions = await db
    .select({ completedOn: habitCompletions.completedOn })
    .from(habitCompletions)
    .where(eq(habitCompletions.habitId, habitId))
    .orderBy(desc(habitCompletions.completedOn))
    .limit(200)
  return { ...row, completionDates: completions.map((c) => ymdFromDb(c.completedOn)) }
}

/**
 * Case-insensitive lookup against ACTIVE habits (archived ones don't count for dedup).
 */
export async function findActiveHabitByCaseInsensitiveName(
  db: DB,
  userId: string,
  name: string,
): Promise<HabitRow | null> {
  const trimmed = name.trim()
  if (!trimmed) return null
  const rows = await db
    .select()
    .from(habits)
    .where(
      and(
        eq(habits.userId, userId),
        isNull(habits.archivedAt),
        sql`LOWER(${habits.name}) = LOWER(${trimmed})`,
      ),
    )
    .limit(1)
  return rows[0] ?? null
}

/**
 * Has a `habit_streak` xp_event already been emitted for this habit + milestone?
 * Used as the dedup guard inside the check route.
 */
export async function hasMilestoneBeenAwarded(
  db: DB,
  userId: string,
  habitId: number,
  milestone: HabitMilestone,
): Promise<boolean> {
  const rows = await db
    .select({ id: xpEvents.id })
    .from(xpEvents)
    .where(
      and(
        eq(xpEvents.userId, userId),
        eq(xpEvents.eventType, 'habit_streak'),
        sql`JSON_EXTRACT(${xpEvents.meta}, '$.habitId') = ${habitId}`,
        sql`JSON_EXTRACT(${xpEvents.meta}, '$.milestone') = ${milestone}`,
      ),
    )
    .limit(1)
  return rows.length > 0
}

/** Drizzle returns `date` columns either as `Date` (TZ-shifted) or `string`. Coerce to YYYY-MM-DD. */
function ymdFromDb(value: Date | string): string {
  if (typeof value === 'string') return value.slice(0, 10)
  // Defensive: format in UTC to match how we wrote it (the column is `date`, no TZ).
  const y = value.getUTCFullYear()
  const m = String(value.getUTCMonth() + 1).padStart(2, '0')
  const d = String(value.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}
```

- [ ] **Step 4: Run, verify pass**

```bash
npm run test:run -- src/tests/lib/queries/habits.test.ts
```

Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/queries/habits.ts src/tests/lib/queries/habits.test.ts
git commit -m "feat(habits): query helpers (active list w/ streak, completions, milestone dedup)"
```

---

## Task 7: API — `GET` and `POST /api/habits`

**Files:**
- Create: `src/app/api/habits/route.ts`
- Create: `src/lib/habits/tz.ts` (helper for resolving "today" from request headers)
- Create: `src/tests/lib/habits/tz.test.ts`
- Create: `src/tests/api/habits/list-create.test.ts`

- [ ] **Step 1: Write the failing test for `tz.ts`**

Create `src/tests/lib/habits/tz.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { resolveUserToday } from '@/lib/habits/tz'

describe('resolveUserToday', () => {
  it('returns UTC today when offset header is absent', () => {
    const now = new Date('2026-04-29T14:00:00Z')
    expect(resolveUserToday(null, now)).toBe('2026-04-29')
  })

  it('shifts forward when offset is negative (UTC+2 = -120 from JS perspective)', () => {
    // 23:30 UTC, user is at UTC+2 → local time 01:30 next day
    const now = new Date('2026-04-29T23:30:00Z')
    expect(resolveUserToday('-120', now)).toBe('2026-04-30')
  })

  it('shifts backward when offset is positive (UTC-5 = +300)', () => {
    // 02:00 UTC, user at UTC-5 → local time 21:00 previous day
    const now = new Date('2026-04-29T02:00:00Z')
    expect(resolveUserToday('300', now)).toBe('2026-04-28')
  })

  it('caps offset at +/- 840 minutes (14h)', () => {
    const now = new Date('2026-04-29T12:00:00Z')
    // 9999 should be clamped to 840 → -14h → 2026-04-28 22:00 → 2026-04-28
    expect(resolveUserToday('9999', now)).toBe('2026-04-28')
  })

  it('falls back to UTC on garbage input', () => {
    const now = new Date('2026-04-29T14:00:00Z')
    expect(resolveUserToday('not-a-number', now)).toBe('2026-04-29')
  })
})
```

- [ ] **Step 2: Run, verify fail**

```bash
npm run test:run -- src/tests/lib/habits/tz.test.ts
```

- [ ] **Step 3: Implement `tz.ts`**

Create `src/lib/habits/tz.ts`:

```ts
const MAX_OFFSET = 840 // ±14h, max real timezone

/**
 * Resolve "today" as a YYYY-MM-DD string in the user's timezone.
 *
 * @param offsetHeader Value of `X-User-Tz-Offset` header — minutes returned by
 *                     `Date.prototype.getTimezoneOffset()` (positive for west of UTC).
 *                     Null/garbage falls back to UTC.
 * @param now          Current `Date` (injectable for tests).
 */
export function resolveUserToday(offsetHeader: string | null, now: Date = new Date()): string {
  let offsetMin = 0
  if (offsetHeader) {
    const parsed = Number(offsetHeader)
    if (Number.isFinite(parsed)) {
      offsetMin = Math.max(-MAX_OFFSET, Math.min(MAX_OFFSET, parsed))
    }
  }
  // JS getTimezoneOffset() = (UTC - local) in minutes; positive west.
  // Local epoch-ms = UTC epoch-ms - offsetMin * 60_000
  const localMs = now.getTime() - offsetMin * 60_000
  const local = new Date(localMs)
  const y = local.getUTCFullYear()
  const m = String(local.getUTCMonth() + 1).padStart(2, '0')
  const d = String(local.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}
```

- [ ] **Step 4: Run, verify pass**

```bash
npm run test:run -- src/tests/lib/habits/tz.test.ts
```

- [ ] **Step 5: Write the failing test for `GET / POST /api/habits`**

Create `src/tests/api/habits/list-create.test.ts`:

```ts
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest'
import { db } from '@/db/client'
import { users, habits, habitCompletions } from '@/db/schema'
import { eq, like } from 'drizzle-orm'
import { GET, POST } from '@/app/api/habits/route'

const PREFIX = 'hbapi_'
const USER = `${PREFIX}user000000000001`

vi.mock('@/lib/auth-helpers', async () => {
  const real = await vi.importActual<typeof import('@/lib/auth-helpers')>('@/lib/auth-helpers')
  return {
    ...real,
    requireSessionUser: vi.fn().mockResolvedValue({ id: USER, email: 't@t', name: 'T' }),
  }
})

beforeAll(async () => {
  await db.insert(users).values({
    id: USER, email: `${PREFIX}u@hexis.local`, name: 'API Test', passwordHash: 'x',
  })
})

afterAll(async () => {
  await db.delete(habitCompletions).where(eq(habitCompletions.userId, USER))
  await db.delete(habits).where(eq(habits.userId, USER))
  await db.delete(users).where(like(users.id, `${PREFIX}%`))
})

beforeEach(async () => {
  await db.delete(habitCompletions).where(eq(habitCompletions.userId, USER))
  await db.delete(habits).where(eq(habits.userId, USER))
})

function req(opts: { method: string; body?: unknown; tzOffset?: string }) {
  const headers = new Headers({ 'content-type': 'application/json' })
  if (opts.tzOffset) headers.set('X-User-Tz-Offset', opts.tzOffset)
  return new Request('http://test/api/habits', {
    method: opts.method,
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  })
}

describe('GET /api/habits', () => {
  it('returns empty list for new user', async () => {
    const res = await GET(req({ method: 'GET' }))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.habits).toEqual([])
  })

  it('returns active habits with derived streak fields', async () => {
    await db.insert(habits).values({
      userId: USER, name: 'Voda', cadence: 'daily', weight: 'standard',
    })
    const res = await GET(req({ method: 'GET' }))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.habits).toHaveLength(1)
    expect(json.habits[0]).toMatchObject({
      name: 'Voda',
      cadence: 'daily',
      weight: 'standard',
      currentStreak: 0,
      completedToday: false,
    })
  })
})

describe('POST /api/habits', () => {
  it('creates a daily habit', async () => {
    const res = await POST(req({
      method: 'POST',
      body: { name: 'Voda', cadence: 'daily', weight: 'standard' },
    }))
    expect(res.status).toBe(201)
    const json = await res.json()
    expect(json.habit).toMatchObject({ name: 'Voda', cadence: 'daily', weeklyTarget: null, weight: 'standard' })
  })

  it('creates a weekly habit', async () => {
    const res = await POST(req({
      method: 'POST',
      body: { name: 'Meditace', cadence: 'weekly', weeklyTarget: 3, weight: 'light' },
    }))
    expect(res.status).toBe(201)
    const json = await res.json()
    expect(json.habit).toMatchObject({ name: 'Meditace', cadence: 'weekly', weeklyTarget: 3, weight: 'light' })
  })

  it('rejects duplicate name (case-insensitive) on the same user', async () => {
    await db.insert(habits).values({
      userId: USER, name: 'Voda', cadence: 'daily', weight: 'standard',
    })
    const res = await POST(req({
      method: 'POST',
      body: { name: 'voda', cadence: 'daily', weight: 'standard' },
    }))
    expect(res.status).toBe(409)
  })

  it('allows duplicate name if the existing one is archived', async () => {
    await db.insert(habits).values({
      userId: USER, name: 'Voda', cadence: 'daily', weight: 'standard', archivedAt: new Date(),
    })
    const res = await POST(req({
      method: 'POST',
      body: { name: 'Voda', cadence: 'daily', weight: 'standard' },
    }))
    expect(res.status).toBe(201)
  })

  it('rejects body that fails validation', async () => {
    const res = await POST(req({
      method: 'POST',
      body: { name: '', cadence: 'daily' },
    }))
    expect(res.status).toBe(400)
  })

  it('rejects daily habit with weeklyTarget', async () => {
    const res = await POST(req({
      method: 'POST',
      body: { name: 'X', cadence: 'daily', weeklyTarget: 3 },
    }))
    expect(res.status).toBe(400)
  })
})
```

- [ ] **Step 6: Run, verify fail**

```bash
npm run test:run -- src/tests/api/habits/list-create.test.ts
```

Expected: FAIL — route module not found.

- [ ] **Step 7: Implement route**

Create `src/app/api/habits/route.ts`:

```ts
import { db } from '@/db/client'
import { habits } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { requireSessionUser } from '@/lib/auth-helpers'
import { habitCreateSchema } from '@/lib/validators/habits'
import { fetchActiveHabitsWithStreak, findActiveHabitByCaseInsensitiveName } from '@/lib/queries/habits'
import { resolveUserToday } from '@/lib/habits/tz'

export async function GET(req: Request) {
  const user = await requireSessionUser()
  if (user instanceof Response) return user
  const today = resolveUserToday(req.headers.get('X-User-Tz-Offset'))
  const list = await fetchActiveHabitsWithStreak(db, user.id, today)
  return Response.json({ habits: list })
}

export async function POST(req: Request) {
  const user = await requireSessionUser()
  if (user instanceof Response) return user
  const body = await req.json().catch(() => null)
  const parsed = habitCreateSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: 'Invalid body', issues: parsed.error.issues }, { status: 400 })
  }
  const { name, cadence, weeklyTarget, weight } = parsed.data
  const existing = await findActiveHabitByCaseInsensitiveName(db, user.id, name)
  if (existing) {
    return Response.json({ error: 'Duplicate name' }, { status: 409 })
  }
  const [insert] = await db.insert(habits).values({
    userId: user.id,
    name,
    cadence,
    weeklyTarget: cadence === 'weekly' ? weeklyTarget! : null,
    weight,
  })
  const row = await db.query.habits.findFirst({ where: eq(habits.id, insert.insertId) })
  return Response.json({ habit: row }, { status: 201 })
}
```

- [ ] **Step 8: Run, verify pass**

```bash
npm run test:run -- src/tests/api/habits/list-create.test.ts
```

Expected: all pass.

- [ ] **Step 9: Commit**

```bash
git add src/lib/habits/tz.ts src/tests/lib/habits/tz.test.ts \
  src/app/api/habits/route.ts src/tests/api/habits/list-create.test.ts
git commit -m "feat(habits): API GET/POST /api/habits + tz helper"
```

---

## Task 8: API — `PATCH /api/habits/[id]` and `POST /api/habits/[id]/archive`

**Files:**
- Create: `src/app/api/habits/[id]/route.ts`
- Create: `src/app/api/habits/[id]/archive/route.ts`
- Create: `src/tests/api/habits/patch-archive.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/tests/api/habits/patch-archive.test.ts`:

```ts
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest'
import { db } from '@/db/client'
import { users, habits, habitCompletions } from '@/db/schema'
import { eq, like } from 'drizzle-orm'
import { PATCH } from '@/app/api/habits/[id]/route'
import { POST as ARCHIVE } from '@/app/api/habits/[id]/archive/route'

const PREFIX = 'hbpa_'
const USER = `${PREFIX}user000000000001`
const OTHER = `${PREFIX}user000000000002`

vi.mock('@/lib/auth-helpers', async () => {
  const real = await vi.importActual<typeof import('@/lib/auth-helpers')>('@/lib/auth-helpers')
  return {
    ...real,
    requireSessionUser: vi.fn().mockResolvedValue({ id: USER, email: 't@t', name: 'T' }),
  }
})

beforeAll(async () => {
  await db.insert(users).values([
    { id: USER, email: `${PREFIX}u1@hexis.local`, name: 'P1', passwordHash: 'x' },
    { id: OTHER, email: `${PREFIX}u2@hexis.local`, name: 'P2', passwordHash: 'x' },
  ])
})

afterAll(async () => {
  await db.delete(habitCompletions).where(like(habitCompletions.userId, `${PREFIX}%`))
  await db.delete(habits).where(like(habits.userId, `${PREFIX}%`))
  await db.delete(users).where(like(users.id, `${PREFIX}%`))
})

beforeEach(async () => {
  await db.delete(habitCompletions).where(like(habitCompletions.userId, `${PREFIX}%`))
  await db.delete(habits).where(like(habits.userId, `${PREFIX}%`))
})

function patchReq(body: unknown) {
  return new Request('http://test', {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('PATCH /api/habits/[id]', () => {
  it('updates name and weight', async () => {
    const [h] = await db.insert(habits).values({
      userId: USER, name: 'Voda', cadence: 'daily', weight: 'standard',
    })
    const res = await PATCH(patchReq({ name: 'Voda 2L', weight: 'heavy' }), {
      params: Promise.resolve({ id: String(h.insertId) }),
    })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.habit).toMatchObject({ name: 'Voda 2L', weight: 'heavy' })
  })

  it('rejects cadence patch (immutable)', async () => {
    const [h] = await db.insert(habits).values({
      userId: USER, name: 'Voda', cadence: 'daily', weight: 'standard',
    })
    const res = await PATCH(patchReq({ cadence: 'weekly' }), {
      params: Promise.resolve({ id: String(h.insertId) }),
    })
    expect(res.status).toBe(400)
  })

  it('rejects weeklyTarget patch (immutable)', async () => {
    const [h] = await db.insert(habits).values({
      userId: USER, name: 'M', cadence: 'weekly', weeklyTarget: 3, weight: 'light',
    })
    const res = await PATCH(patchReq({ weeklyTarget: 5 }), {
      params: Promise.resolve({ id: String(h.insertId) }),
    })
    expect(res.status).toBe(400)
  })

  it("returns 404 when habit belongs to someone else (no leak)", async () => {
    const [h] = await db.insert(habits).values({
      userId: OTHER, name: 'Other', cadence: 'daily', weight: 'standard',
    })
    const res = await PATCH(patchReq({ name: 'X' }), {
      params: Promise.resolve({ id: String(h.insertId) }),
    })
    expect(res.status).toBe(404)
  })

  it('rejects empty patch', async () => {
    const [h] = await db.insert(habits).values({
      userId: USER, name: 'Voda', cadence: 'daily', weight: 'standard',
    })
    const res = await PATCH(patchReq({}), {
      params: Promise.resolve({ id: String(h.insertId) }),
    })
    expect(res.status).toBe(400)
  })

  it('rejects duplicate name on rename (case-insensitive)', async () => {
    await db.insert(habits).values({
      userId: USER, name: 'Voda', cadence: 'daily', weight: 'standard',
    })
    const [h2] = await db.insert(habits).values({
      userId: USER, name: 'Čtení', cadence: 'daily', weight: 'standard',
    })
    const res = await PATCH(patchReq({ name: 'voda' }), {
      params: Promise.resolve({ id: String(h2.insertId) }),
    })
    expect(res.status).toBe(409)
  })
})

describe('POST /api/habits/[id]/archive', () => {
  it('sets archivedAt to now', async () => {
    const [h] = await db.insert(habits).values({
      userId: USER, name: 'Voda', cadence: 'daily', weight: 'standard',
    })
    const res = await ARCHIVE(new Request('http://test', { method: 'POST' }), {
      params: Promise.resolve({ id: String(h.insertId) }),
    })
    expect(res.status).toBe(200)
    const row = await db.query.habits.findFirst({ where: eq(habits.id, h.insertId) })
    expect(row?.archivedAt).not.toBeNull()
  })

  it('is idempotent (re-archiving an archived habit returns 200)', async () => {
    const [h] = await db.insert(habits).values({
      userId: USER, name: 'V', cadence: 'daily', weight: 'standard', archivedAt: new Date(),
    })
    const res = await ARCHIVE(new Request('http://test', { method: 'POST' }), {
      params: Promise.resolve({ id: String(h.insertId) }),
    })
    expect(res.status).toBe(200)
  })

  it('returns 404 for someone else\'s habit', async () => {
    const [h] = await db.insert(habits).values({
      userId: OTHER, name: 'X', cadence: 'daily', weight: 'standard',
    })
    const res = await ARCHIVE(new Request('http://test', { method: 'POST' }), {
      params: Promise.resolve({ id: String(h.insertId) }),
    })
    expect(res.status).toBe(404)
  })
})
```

- [ ] **Step 2: Run, verify fail**

```bash
npm run test:run -- src/tests/api/habits/patch-archive.test.ts
```

- [ ] **Step 3: Implement PATCH route**

Create `src/app/api/habits/[id]/route.ts`:

```ts
import { db } from '@/db/client'
import { habits } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { requireSessionUser, requireOwnership } from '@/lib/auth-helpers'
import { habitPatchSchema } from '@/lib/validators/habits'
import { findActiveHabitByCaseInsensitiveName } from '@/lib/queries/habits'

type Ctx = { params: Promise<{ id: string }> }

export async function PATCH(req: Request, ctx: Ctx) {
  const user = await requireSessionUser()
  if (user instanceof Response) return user
  const { id: idStr } = await ctx.params
  const id = Number(idStr)
  if (!Number.isInteger(id) || id <= 0) {
    return Response.json({ error: 'Invalid id' }, { status: 400 })
  }
  const row = await requireOwnership(
    db.query.habits.findFirst({ where: eq(habits.id, id) }),
    user.id,
  )
  if (row instanceof Response) return row

  const body = await req.json().catch(() => null)
  const parsed = habitPatchSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: 'Invalid body', issues: parsed.error.issues }, { status: 400 })
  }

  // Case-insensitive duplicate guard on rename
  if (parsed.data.name && parsed.data.name.toLowerCase() !== row.name.toLowerCase()) {
    const dup = await findActiveHabitByCaseInsensitiveName(db, user.id, parsed.data.name)
    if (dup && dup.id !== row.id) {
      return Response.json({ error: 'Duplicate name' }, { status: 409 })
    }
  }

  const updates: Record<string, unknown> = {}
  if (parsed.data.name !== undefined) updates.name = parsed.data.name
  if (parsed.data.weight !== undefined) updates.weight = parsed.data.weight
  if (parsed.data.archivedAt !== undefined) {
    updates.archivedAt = parsed.data.archivedAt === null ? null : new Date(parsed.data.archivedAt)
  }
  await db.update(habits).set(updates).where(eq(habits.id, id))
  const fresh = await db.query.habits.findFirst({ where: eq(habits.id, id) })
  return Response.json({ habit: fresh })
}
```

- [ ] **Step 4: Implement archive route**

Create `src/app/api/habits/[id]/archive/route.ts`:

```ts
import { db } from '@/db/client'
import { habits } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { requireSessionUser, requireOwnership } from '@/lib/auth-helpers'

type Ctx = { params: Promise<{ id: string }> }

export async function POST(_req: Request, ctx: Ctx) {
  const user = await requireSessionUser()
  if (user instanceof Response) return user
  const { id: idStr } = await ctx.params
  const id = Number(idStr)
  if (!Number.isInteger(id) || id <= 0) {
    return Response.json({ error: 'Invalid id' }, { status: 400 })
  }
  const row = await requireOwnership(
    db.query.habits.findFirst({ where: eq(habits.id, id) }),
    user.id,
  )
  if (row instanceof Response) return row

  if (!row.archivedAt) {
    await db.update(habits).set({ archivedAt: new Date() }).where(eq(habits.id, id))
  }
  const fresh = await db.query.habits.findFirst({ where: eq(habits.id, id) })
  return Response.json({ habit: fresh })
}
```

- [ ] **Step 5: Run, verify pass**

```bash
npm run test:run -- src/tests/api/habits/patch-archive.test.ts
```

- [ ] **Step 6: Commit**

```bash
git add src/app/api/habits/[id]/route.ts src/app/api/habits/[id]/archive/route.ts \
  src/tests/api/habits/patch-archive.test.ts
git commit -m "feat(habits): API PATCH + archive routes"
```

---

## Task 9: API — `POST` and `DELETE /api/habits/[id]/check`

This is the central route: it inserts the completion, computes the new streak (daily synchronously), detects + emits the milestone XP event with idempotency, and returns the updated streak. Weekly milestones are NOT detected here — they fire lazily in `GET /api/habits` when a closed week first appears in the streak (handled in Task 10's adjustment to the queries module).

**Files:**
- Create: `src/app/api/habits/[id]/check/route.ts`
- Create: `src/tests/api/habits/check.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/tests/api/habits/check.test.ts`:

```ts
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest'
import { db } from '@/db/client'
import { users, habits, habitCompletions, xpEvents } from '@/db/schema'
import { eq, like, and } from 'drizzle-orm'
import { POST, DELETE } from '@/app/api/habits/[id]/check/route'

const PREFIX = 'hbck_'
const USER = `${PREFIX}user000000000001`

vi.mock('@/lib/auth-helpers', async () => {
  const real = await vi.importActual<typeof import('@/lib/auth-helpers')>('@/lib/auth-helpers')
  return {
    ...real,
    requireSessionUser: vi.fn().mockResolvedValue({ id: USER, email: 't@t', name: 'T' }),
  }
})

beforeAll(async () => {
  await db.insert(users).values({
    id: USER, email: `${PREFIX}u@hexis.local`, name: 'Check', passwordHash: 'x',
  })
})

afterAll(async () => {
  await db.delete(xpEvents).where(eq(xpEvents.userId, USER))
  await db.delete(habitCompletions).where(eq(habitCompletions.userId, USER))
  await db.delete(habits).where(eq(habits.userId, USER))
  await db.delete(users).where(like(users.id, `${PREFIX}%`))
})

beforeEach(async () => {
  await db.delete(xpEvents).where(eq(xpEvents.userId, USER))
  await db.delete(habitCompletions).where(eq(habitCompletions.userId, USER))
  await db.delete(habits).where(eq(habits.userId, USER))
})

function postReq(body: unknown, tz?: string) {
  const headers = new Headers({ 'content-type': 'application/json' })
  if (tz) headers.set('X-User-Tz-Offset', tz)
  return new Request('http://test', { method: 'POST', headers, body: JSON.stringify(body) })
}

function delReq(date: string) {
  return new Request(`http://test?date=${date}`, { method: 'DELETE' })
}

const TODAY = '2026-04-29'

async function makeDailyHabit(weight: 'light' | 'standard' | 'heavy' = 'standard') {
  const [h] = await db.insert(habits).values({
    userId: USER, name: 'Voda', cadence: 'daily', weight,
  })
  return h.insertId
}

async function seedCompletions(habitId: number, dates: string[]) {
  await db.insert(habitCompletions).values(
    dates.map((d) => ({ habitId, userId: USER, completedOn: d })),
  )
}

describe('POST /api/habits/[id]/check', () => {
  it('inserts a completion and returns streak=1 for first check', async () => {
    const id = await makeDailyHabit()
    const res = await POST(postReq({ date: TODAY }), {
      params: Promise.resolve({ id: String(id) }),
    })
    expect(res.status).toBe(201)
    const json = await res.json()
    expect(json.streak).toBe(1)
    expect(json.milestoneAwardedXp).toBeUndefined()
  })

  it('is idempotent on the same date (returns existing, streak unchanged)', async () => {
    const id = await makeDailyHabit()
    await POST(postReq({ date: TODAY }), { params: Promise.resolve({ id: String(id) }) })
    const res2 = await POST(postReq({ date: TODAY }), { params: Promise.resolve({ id: String(id) }) })
    expect(res2.status).toBe(201)
    const rows = await db.select().from(habitCompletions).where(eq(habitCompletions.habitId, id))
    expect(rows).toHaveLength(1)
  })

  it('emits milestone xp_event when crossing 7-day streak (standard weight = +50)', async () => {
    const id = await makeDailyHabit('standard')
    // seed 6 prior consecutive days
    await seedCompletions(id, [
      '2026-04-23', '2026-04-24', '2026-04-25',
      '2026-04-26', '2026-04-27', '2026-04-28',
    ])
    const res = await POST(postReq({ date: TODAY }), {
      params: Promise.resolve({ id: String(id) }),
    })
    expect(res.status).toBe(201)
    const json = await res.json()
    expect(json.streak).toBe(7)
    expect(json.milestoneAwardedXp).toBe(50)
    const xp = await db.select().from(xpEvents).where(eq(xpEvents.userId, USER))
    expect(xp).toHaveLength(1)
    expect(xp[0].eventType).toBe('habit_streak')
    expect(xp[0].xpDelta).toBe(50)
    expect(xp[0].meta).toMatchObject({ habitId: id, milestone: 7, weight: 'standard' })
  })

  it('emits weighted XP for heavy weight (×2)', async () => {
    const id = await makeDailyHabit('heavy')
    await seedCompletions(id, [
      '2026-04-23', '2026-04-24', '2026-04-25',
      '2026-04-26', '2026-04-27', '2026-04-28',
    ])
    const res = await POST(postReq({ date: TODAY }), {
      params: Promise.resolve({ id: String(id) }),
    })
    const json = await res.json()
    expect(json.milestoneAwardedXp).toBe(100)
  })

  it('does not emit milestone twice for the same habit + threshold', async () => {
    const id = await makeDailyHabit()
    await seedCompletions(id, [
      '2026-04-23', '2026-04-24', '2026-04-25',
      '2026-04-26', '2026-04-27', '2026-04-28',
    ])
    // First check fires milestone
    const res1 = await POST(postReq({ date: TODAY }), {
      params: Promise.resolve({ id: String(id) }),
    })
    expect((await res1.json()).milestoneAwardedXp).toBe(50)
    // Uncheck + recheck same day → no second emission
    await DELETE(delReq(TODAY), { params: Promise.resolve({ id: String(id) }) })
    const res2 = await POST(postReq({ date: TODAY }), {
      params: Promise.resolve({ id: String(id) }),
    })
    const json2 = await res2.json()
    expect(json2.streak).toBe(7)
    expect(json2.milestoneAwardedXp).toBeUndefined()
    const xp = await db.select().from(xpEvents).where(eq(xpEvents.userId, USER))
    expect(xp).toHaveLength(1) // still only one
  })

  it('rejects future date', async () => {
    const id = await makeDailyHabit()
    const res = await POST(postReq({ date: '2030-01-01' }), {
      params: Promise.resolve({ id: String(id) }),
    })
    expect(res.status).toBe(400)
  })

  it('returns 404 for non-existent habit', async () => {
    const res = await POST(postReq({ date: TODAY }), {
      params: Promise.resolve({ id: '999999' }),
    })
    expect(res.status).toBe(404)
  })

  it('returns 400 for malformed date', async () => {
    const id = await makeDailyHabit()
    const res = await POST(postReq({ date: '29-04-2026' }), {
      params: Promise.resolve({ id: String(id) }),
    })
    expect(res.status).toBe(400)
  })
})

describe('DELETE /api/habits/[id]/check', () => {
  it('deletes the completion for the given date', async () => {
    const id = await makeDailyHabit()
    await POST(postReq({ date: TODAY }), { params: Promise.resolve({ id: String(id) }) })
    const res = await DELETE(delReq(TODAY), { params: Promise.resolve({ id: String(id) }) })
    expect(res.status).toBe(204)
    const rows = await db.select().from(habitCompletions).where(eq(habitCompletions.habitId, id))
    expect(rows).toHaveLength(0)
  })

  it('is idempotent: deleting non-existent completion returns 204', async () => {
    const id = await makeDailyHabit()
    const res = await DELETE(delReq(TODAY), { params: Promise.resolve({ id: String(id) }) })
    expect(res.status).toBe(204)
  })

  it('does NOT remove milestone XP event (level never decreases)', async () => {
    const id = await makeDailyHabit()
    await seedCompletions(id, [
      '2026-04-23', '2026-04-24', '2026-04-25',
      '2026-04-26', '2026-04-27', '2026-04-28',
    ])
    await POST(postReq({ date: TODAY }), { params: Promise.resolve({ id: String(id) }) })
    await DELETE(delReq(TODAY), { params: Promise.resolve({ id: String(id) }) })
    const xp = await db.select().from(xpEvents).where(eq(xpEvents.userId, USER))
    expect(xp).toHaveLength(1) // milestone XP stays
  })
})
```

- [ ] **Step 2: Run, verify fail**

```bash
npm run test:run -- src/tests/api/habits/check.test.ts
```

- [ ] **Step 3: Implement check route**

Create `src/app/api/habits/[id]/check/route.ts`:

```ts
import { db } from '@/db/client'
import { habits, habitCompletions } from '@/db/schema'
import { and, eq } from 'drizzle-orm'
import { requireSessionUser, requireOwnership } from '@/lib/auth-helpers'
import { habitCheckSchema } from '@/lib/validators/habits'
import {
  fetchHabitWithCompletions,
  hasMilestoneBeenAwarded,
} from '@/lib/queries/habits'
import {
  countConsecutiveDays,
  countConsecutiveClosedWeeks,
} from '@/lib/habits/streak'
import { detectMilestone, xpForMilestone } from '@/lib/habits/milestone'
import { resolveUserToday } from '@/lib/habits/tz'
import { awardXpVariable } from '@/lib/xp'

type Ctx = { params: Promise<{ id: string }> }

export async function POST(req: Request, ctx: Ctx) {
  const user = await requireSessionUser()
  if (user instanceof Response) return user
  const { id: idStr } = await ctx.params
  const id = Number(idStr)
  if (!Number.isInteger(id) || id <= 0) {
    return Response.json({ error: 'Invalid id' }, { status: 400 })
  }
  const habitRow = await requireOwnership(
    db.query.habits.findFirst({ where: eq(habits.id, id) }),
    user.id,
  )
  if (habitRow instanceof Response) return habitRow

  const body = await req.json().catch(() => null)
  const parsed = habitCheckSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: 'Invalid body', issues: parsed.error.issues }, { status: 400 })
  }
  const { date } = parsed.data

  const today = resolveUserToday(req.headers.get('X-User-Tz-Offset'))
  if (date > today) {
    return Response.json({ error: 'date is in the future' }, { status: 400 })
  }

  // Idempotent insert: rely on the unique (habit_id, completed_on) index.
  // INSERT IGNORE → no row inserted if duplicate; we look up afterward.
  await db
    .insert(habitCompletions)
    .values({ habitId: id, userId: user.id, completedOn: date })
    .onDuplicateKeyUpdate({ set: { habitId: id } }) // no-op: keep existing row

  // Recompute streak from current completions
  const habitWithDates = await fetchHabitWithCompletions(db, user.id, id)
  if (!habitWithDates) {
    // Should be impossible — we already verified ownership — but guard anyway.
    return Response.json({ error: 'Not found' }, { status: 404 })
  }
  const streak =
    habitWithDates.cadence === 'daily'
      ? countConsecutiveDays(habitWithDates.completionDates, today)
      : countConsecutiveClosedWeeks(
          habitWithDates.completionDates,
          habitWithDates.weeklyTarget!,
          today,
        )

  // Milestone detection — daily only at check-time (weekly fires from GET).
  let milestoneAwardedXp: number | undefined = undefined
  if (habitWithDates.cadence === 'daily') {
    const milestone = detectMilestone(streak)
    if (milestone) {
      const already = await hasMilestoneBeenAwarded(db, user.id, id, milestone)
      if (!already) {
        const delta = xpForMilestone(milestone, habitWithDates.weight)
        await awardXpVariable({
          db,
          userId: user.id,
          event: 'habit_streak',
          xpDelta: delta,
          meta: { habitId: id, milestone, weight: habitWithDates.weight },
        })
        milestoneAwardedXp = delta
      }
    }
  }

  return Response.json({ streak, milestoneAwardedXp }, { status: 201 })
}

export async function DELETE(req: Request, ctx: Ctx) {
  const user = await requireSessionUser()
  if (user instanceof Response) return user
  const { id: idStr } = await ctx.params
  const id = Number(idStr)
  if (!Number.isInteger(id) || id <= 0) {
    return Response.json({ error: 'Invalid id' }, { status: 400 })
  }
  const habitRow = await requireOwnership(
    db.query.habits.findFirst({ where: eq(habits.id, id) }),
    user.id,
  )
  if (habitRow instanceof Response) return habitRow

  const url = new URL(req.url)
  const date = url.searchParams.get('date') ?? ''
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return Response.json({ error: 'date query param required (YYYY-MM-DD)' }, { status: 400 })
  }
  await db
    .delete(habitCompletions)
    .where(and(eq(habitCompletions.habitId, id), eq(habitCompletions.completedOn, date)))
  return new Response(null, { status: 204 })
}
```

- [ ] **Step 4: Run, verify pass**

```bash
npm run test:run -- src/tests/api/habits/check.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/app/api/habits/[id]/check/route.ts src/tests/api/habits/check.test.ts
git commit -m "feat(habits): API POST/DELETE /api/habits/[id]/check + milestone emit"
```

---

## Task 10: Weekly milestone emission inside `fetchActiveHabitsWithStreak`

Weekly streak only advances when an ISO week closes — that happens between `GET` calls, not during a `check`. So weekly-habit milestones are detected lazily during `GET /api/habits`. We extend the existing query to perform the emission as a side effect (idempotency guard same as in the check route).

**Files:**
- Modify: `src/lib/queries/habits.ts`
- Modify: `src/tests/lib/queries/habits.test.ts` (add weekly-milestone tests)

- [ ] **Step 1: Append failing tests for weekly milestone emission**

Append to `src/tests/lib/queries/habits.test.ts`:

```ts
describe('weekly milestone emission inside fetchActiveHabitsWithStreak', () => {
  it('emits xp_event when weekly streak crosses 7 (standard weight = +50)', async () => {
    const [h] = await db.insert(habits).values({
      userId: USER, name: 'Pondělky', cadence: 'weekly', weeklyTarget: 1, weight: 'standard',
    })
    // Seed 7 consecutive prior closed weeks each with 1 completion.
    // Today = 2026-04-29 (W18). Prior closed weeks: W17..W11.
    const dates = [
      '2026-04-20', // W17
      '2026-04-13', // W16
      '2026-04-06', // W15
      '2026-03-30', // W14
      '2026-03-23', // W13
      '2026-03-16', // W12
      '2026-03-09', // W11
    ]
    await db.insert(habitCompletions).values(
      dates.map((d) => ({ habitId: h.insertId, userId: USER, completedOn: d })),
    )

    const result = await fetchActiveHabitsWithStreak(db, USER, TODAY)
    expect(result[0].currentStreak).toBe(7)

    const xp = await db.select().from(xpEvents).where(eq(xpEvents.userId, USER))
    expect(xp).toHaveLength(1)
    expect(xp[0].eventType).toBe('habit_streak')
    expect(xp[0].xpDelta).toBe(50)
    expect(xp[0].meta).toMatchObject({ habitId: h.insertId, milestone: 7, weight: 'standard' })
  })

  it('does not double-emit weekly milestone on subsequent GET', async () => {
    const [h] = await db.insert(habits).values({
      userId: USER, name: 'Pondělky', cadence: 'weekly', weeklyTarget: 1, weight: 'standard',
    })
    const dates = [
      '2026-04-20', '2026-04-13', '2026-04-06', '2026-03-30',
      '2026-03-23', '2026-03-16', '2026-03-09',
    ]
    await db.insert(habitCompletions).values(
      dates.map((d) => ({ habitId: h.insertId, userId: USER, completedOn: d })),
    )
    await fetchActiveHabitsWithStreak(db, USER, TODAY)
    await fetchActiveHabitsWithStreak(db, USER, TODAY)
    const xp = await db.select().from(xpEvents).where(eq(xpEvents.userId, USER))
    expect(xp).toHaveLength(1)
  })

  it('does NOT emit when streak is below threshold', async () => {
    const [h] = await db.insert(habits).values({
      userId: USER, name: 'P', cadence: 'weekly', weeklyTarget: 1, weight: 'standard',
    })
    await db.insert(habitCompletions).values([
      { habitId: h.insertId, userId: USER, completedOn: '2026-04-20' }, // W17
      { habitId: h.insertId, userId: USER, completedOn: '2026-04-13' }, // W16
    ])
    await fetchActiveHabitsWithStreak(db, USER, TODAY)
    const xp = await db.select().from(xpEvents).where(eq(xpEvents.userId, USER))
    expect(xp).toHaveLength(0)
  })

  it('does NOT emit for daily habits (those fire from /check route)', async () => {
    const [h] = await db.insert(habits).values({
      userId: USER, name: 'Voda', cadence: 'daily', weight: 'standard',
    })
    // Seed 7 consecutive days ending TODAY
    const dates = [
      '2026-04-23', '2026-04-24', '2026-04-25', '2026-04-26',
      '2026-04-27', '2026-04-28', '2026-04-29',
    ]
    await db.insert(habitCompletions).values(
      dates.map((d) => ({ habitId: h.insertId, userId: USER, completedOn: d })),
    )
    await fetchActiveHabitsWithStreak(db, USER, TODAY)
    const xp = await db.select().from(xpEvents).where(eq(xpEvents.userId, USER))
    expect(xp).toHaveLength(0) // daily milestones are emitted by /check, not by GET
  })
})
```

- [ ] **Step 2: Run, verify fail**

```bash
npm run test:run -- src/tests/lib/queries/habits.test.ts
```

The new four tests fail because the side effect doesn't exist yet.

- [ ] **Step 3: Add weekly emission inside `fetchActiveHabitsWithStreak`**

Open `src/lib/queries/habits.ts`. Replace the `fetchActiveHabitsWithStreak` function body (and add new imports at top of file):

```ts
import { detectMilestone, xpForMilestone } from '@/lib/habits/milestone'
import { awardXpVariable } from '@/lib/xp'
```

```ts
export async function fetchActiveHabitsWithStreak(
  db: DB,
  userId: string,
  today: string,
): Promise<HabitWithStreak[]> {
  const rows = await db
    .select()
    .from(habits)
    .where(and(eq(habits.userId, userId), isNull(habits.archivedAt)))
    .orderBy(asc(habits.cadence), asc(habits.id))

  if (rows.length === 0) return []

  const all = await db
    .select({ habitId: habitCompletions.habitId, completedOn: habitCompletions.completedOn })
    .from(habitCompletions)
    .where(eq(habitCompletions.userId, userId))
    .orderBy(desc(habitCompletions.completedOn))

  const byHabit = new Map<number, string[]>()
  for (const r of all) {
    const ymd = ymdFromDb(r.completedOn)
    const arr = byHabit.get(r.habitId) ?? []
    arr.push(ymd)
    byHabit.set(r.habitId, arr)
  }

  const currentWeekKey = isoWeekKey(today)

  const result: HabitWithStreak[] = []
  for (const h of rows) {
    const dates = byHabit.get(h.id) ?? []
    if (h.cadence === 'daily') {
      result.push({
        ...h,
        currentStreak: countConsecutiveDays(dates, today),
        completedToday: dates.includes(today),
      })
    } else {
      const completedThisWeek = dates.filter((d) => isoWeekKey(d) === currentWeekKey).length
      const currentStreak = countConsecutiveClosedWeeks(dates, h.weeklyTarget!, today)

      // Lazy weekly milestone emission: weekly streak only advances on week close,
      // which happens between GETs. Detect + emit here, dedup against xp_events.
      const milestone = detectMilestone(currentStreak)
      if (milestone) {
        const already = await hasMilestoneBeenAwarded(db, userId, h.id, milestone)
        if (!already) {
          await awardXpVariable({
            db,
            userId,
            event: 'habit_streak',
            xpDelta: xpForMilestone(milestone, h.weight),
            meta: { habitId: h.id, milestone, weight: h.weight },
          })
        }
      }

      result.push({
        ...h,
        currentStreak,
        completedToday: dates.includes(today),
        completedThisWeek,
      })
    }
  }
  return result
}
```

- [ ] **Step 4: Run, verify pass**

```bash
npm run test:run -- src/tests/lib/queries/habits.test.ts
```

Expected: all (existing + 4 new) pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/queries/habits.ts src/tests/lib/queries/habits.test.ts
git commit -m "feat(habits): lazy weekly milestone emission in GET /api/habits"
```

---

## Task 11: `HabitDailyRow` component

**Files:**
- Create: `src/components/habits/HabitDailyRow.tsx`
- Create: `src/components/habits/index.ts` (barrel)
- Create: `src/tests/components/habits/HabitDailyRow.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/tests/components/habits/HabitDailyRow.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HabitDailyRow } from '@/components/habits/HabitDailyRow'

afterEach(cleanup)

const baseProps = {
  habit: {
    id: 1,
    name: 'Voda',
    weight: 'standard' as const,
    currentStreak: 5,
    completedToday: false,
  },
}

describe('HabitDailyRow', () => {
  it('renders name, weight pill, and streak', () => {
    render(<HabitDailyRow {...baseProps} onCheck={vi.fn()} onUncheck={vi.fn()} />)
    expect(screen.getByText('Voda')).toBeInTheDocument()
    expect(screen.getByText('×1.0')).toBeInTheDocument()
    expect(screen.getByText('🔥 5')).toBeInTheDocument()
  })

  it('shows ×0.5 for light weight, ×2.0 for heavy', () => {
    render(<HabitDailyRow habit={{ ...baseProps.habit, weight: 'light' }} onCheck={vi.fn()} onUncheck={vi.fn()} />)
    expect(screen.getByText('×0.5')).toBeInTheDocument()
    cleanup()
    render(<HabitDailyRow habit={{ ...baseProps.habit, weight: 'heavy' }} onCheck={vi.fn()} onUncheck={vi.fn()} />)
    expect(screen.getByText('×2.0')).toBeInTheDocument()
  })

  it('renders unchecked checkbox when completedToday=false', () => {
    render(<HabitDailyRow {...baseProps} onCheck={vi.fn()} onUncheck={vi.fn()} />)
    const cb = screen.getByRole('checkbox')
    expect(cb).not.toBeChecked()
  })

  it('renders checked checkbox when completedToday=true', () => {
    render(<HabitDailyRow habit={{ ...baseProps.habit, completedToday: true }} onCheck={vi.fn()} onUncheck={vi.fn()} />)
    expect(screen.getByRole('checkbox')).toBeChecked()
  })

  it('calls onCheck when row is tapped while unchecked', async () => {
    const onCheck = vi.fn()
    render(<HabitDailyRow {...baseProps} onCheck={onCheck} onUncheck={vi.fn()} />)
    await userEvent.click(screen.getByRole('checkbox'))
    expect(onCheck).toHaveBeenCalledWith(1)
  })

  it('does NOT call onCheck when tapping a checked row (long-press required)', async () => {
    const onCheck = vi.fn()
    const onUncheck = vi.fn()
    render(<HabitDailyRow habit={{ ...baseProps.habit, completedToday: true }} onCheck={onCheck} onUncheck={onUncheck} />)
    await userEvent.click(screen.getByRole('checkbox'))
    expect(onCheck).not.toHaveBeenCalled()
    expect(onUncheck).not.toHaveBeenCalled()
  })

  it('exposes data-habit-id and data-habit-row for e2e', () => {
    const { container } = render(<HabitDailyRow {...baseProps} onCheck={vi.fn()} onUncheck={vi.fn()} />)
    expect(container.querySelector('[data-habit-row][data-habit-id="1"]')).toBeTruthy()
  })
})
```

- [ ] **Step 2: Run, verify fail**

```bash
npm run test:run -- src/tests/components/habits/HabitDailyRow.test.tsx
```

- [ ] **Step 3: Implement component**

Create `src/components/habits/HabitDailyRow.tsx`:

```tsx
'use client'
import { useLongPress } from '@/components/ui'

type Props = {
  habit: {
    id: number
    name: string
    weight: 'light' | 'standard' | 'heavy'
    currentStreak: number
    completedToday: boolean
  }
  onCheck: (id: number) => void
  onUncheck: (id: number) => void
}

const WEIGHT_LABEL: Record<Props['habit']['weight'], string> = {
  light: '×0.5',
  standard: '×1.0',
  heavy: '×2.0',
}

export function HabitDailyRow({ habit, onCheck, onUncheck }: Props) {
  const longPress = useLongPress(() => {
    if (habit.completedToday) onUncheck(habit.id)
  })

  const handleClick = () => {
    if (!habit.completedToday) onCheck(habit.id)
    // tap on a checked row is a no-op; undo requires long-press
  }

  return (
    <div
      data-habit-row
      data-habit-id={habit.id}
      className="border-border bg-surface flex items-center gap-3 rounded-lg border px-3 py-2.5"
      {...longPress}
    >
      <input
        type="checkbox"
        checked={habit.completedToday}
        onChange={handleClick}
        aria-label={habit.name}
        className="size-5 cursor-pointer"
      />
      <span className="text-foreground flex-1 truncate text-sm font-medium">{habit.name}</span>
      <span className="text-muted-foreground rounded-full bg-black/5 px-2 py-0.5 text-xs">
        {WEIGHT_LABEL[habit.weight]}
      </span>
      <span data-streak-count className="text-foreground text-xs tabular-nums">
        🔥 {habit.currentStreak}
      </span>
    </div>
  )
}
```

- [ ] **Step 4: Create barrel**

Create `src/components/habits/index.ts`:

```ts
export { HabitDailyRow } from './HabitDailyRow'
```

(More exports added in later tasks.)

- [ ] **Step 5: Run, verify pass**

```bash
npm run test:run -- src/tests/components/habits/HabitDailyRow.test.tsx
```

- [ ] **Step 6: Commit**

```bash
git add src/components/habits/HabitDailyRow.tsx src/components/habits/index.ts \
  src/tests/components/habits/HabitDailyRow.test.tsx
git commit -m "feat(habits): HabitDailyRow component (tap-check, long-press undo)"
```

---

## Task 12: `HabitWeeklyRow` component

**Files:**
- Create: `src/components/habits/HabitWeeklyRow.tsx`
- Modify: `src/components/habits/index.ts`
- Create: `src/tests/components/habits/HabitWeeklyRow.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/tests/components/habits/HabitWeeklyRow.test.tsx`:

```tsx
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HabitWeeklyRow } from '@/components/habits/HabitWeeklyRow'

afterEach(cleanup)

const baseHabit = {
  id: 7,
  name: 'Pondělky meditace',
  weight: 'light' as const,
  weeklyTarget: 4,
  completedThisWeek: 2,
  completedToday: false,
  currentStreak: 6,
}

describe('HabitWeeklyRow', () => {
  it('renders name, weight pill, progress, and streak in týdnech', () => {
    render(<HabitWeeklyRow habit={baseHabit} onCheck={vi.fn()} />)
    expect(screen.getByText('Pondělky meditace')).toBeInTheDocument()
    expect(screen.getByText('×0.5')).toBeInTheDocument()
    expect(screen.getByText('2/4 tento týden')).toBeInTheDocument()
    expect(screen.getByText('🔥 6 t')).toBeInTheDocument()
  })

  it('shows "Splněno dnes" button when not yet checked today', () => {
    render(<HabitWeeklyRow habit={baseHabit} onCheck={vi.fn()} />)
    expect(screen.getByRole('button', { name: /splněno dnes/i })).toBeEnabled()
  })

  it('disables button after today is already checked', () => {
    render(<HabitWeeklyRow habit={{ ...baseHabit, completedToday: true }} onCheck={vi.fn()} />)
    expect(screen.getByRole('button', { name: /splněno dnes/i })).toBeDisabled()
  })

  it('calls onCheck when button clicked', async () => {
    const onCheck = vi.fn()
    render(<HabitWeeklyRow habit={baseHabit} onCheck={onCheck} />)
    await userEvent.click(screen.getByRole('button', { name: /splněno dnes/i }))
    expect(onCheck).toHaveBeenCalledWith(7)
  })

  it('shows progress bar filled to (completedThisWeek / weeklyTarget)', () => {
    const { container } = render(<HabitWeeklyRow habit={{ ...baseHabit, completedThisWeek: 3 }} onCheck={vi.fn()} />)
    const bar = container.querySelector('[data-progress-fill]') as HTMLElement
    expect(bar.style.width).toBe('75%') // 3/4
  })

  it('caps progress at 100%', () => {
    const { container } = render(<HabitWeeklyRow habit={{ ...baseHabit, completedThisWeek: 9 }} onCheck={vi.fn()} />)
    const bar = container.querySelector('[data-progress-fill]') as HTMLElement
    expect(bar.style.width).toBe('100%')
  })
})
```

- [ ] **Step 2: Run, verify fail**

```bash
npm run test:run -- src/tests/components/habits/HabitWeeklyRow.test.tsx
```

- [ ] **Step 3: Implement component**

Create `src/components/habits/HabitWeeklyRow.tsx`:

```tsx
'use client'
import { Button } from '@/components/ui'

type Props = {
  habit: {
    id: number
    name: string
    weight: 'light' | 'standard' | 'heavy'
    weeklyTarget: number
    completedThisWeek: number
    completedToday: boolean
    currentStreak: number
  }
  onCheck: (id: number) => void
}

const WEIGHT_LABEL: Record<Props['habit']['weight'], string> = {
  light: '×0.5',
  standard: '×1.0',
  heavy: '×2.0',
}

export function HabitWeeklyRow({ habit, onCheck }: Props) {
  const pct = Math.min(100, Math.round((habit.completedThisWeek / habit.weeklyTarget) * 100))

  return (
    <div
      data-habit-row
      data-habit-id={habit.id}
      className="border-border bg-surface space-y-2 rounded-lg border px-3 py-2.5"
    >
      <div className="flex items-center gap-3">
        <span className="text-foreground flex-1 truncate text-sm font-medium">{habit.name}</span>
        <span className="text-muted-foreground rounded-full bg-black/5 px-2 py-0.5 text-xs">
          {WEIGHT_LABEL[habit.weight]}
        </span>
        <span data-streak-count className="text-foreground text-xs tabular-nums">
          🔥 {habit.currentStreak} t
        </span>
      </div>

      <div className="flex items-center gap-3">
        <div className="border-border h-2 flex-1 overflow-hidden rounded-full bg-black/5">
          <div
            data-progress-fill
            className="bg-primary h-full"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-muted-foreground text-xs tabular-nums">
          {habit.completedThisWeek}/{habit.weeklyTarget} tento týden
        </span>
        <Button
          size="sm"
          variant="secondary"
          disabled={habit.completedToday}
          onClick={() => onCheck(habit.id)}
        >
          Splněno dnes
        </Button>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Add to barrel**

Modify `src/components/habits/index.ts`:

```ts
export { HabitDailyRow } from './HabitDailyRow'
export { HabitWeeklyRow } from './HabitWeeklyRow'
```

- [ ] **Step 5: Run, verify pass**

```bash
npm run test:run -- src/tests/components/habits/HabitWeeklyRow.test.tsx
```

- [ ] **Step 6: Commit**

```bash
git add src/components/habits/HabitWeeklyRow.tsx src/components/habits/index.ts \
  src/tests/components/habits/HabitWeeklyRow.test.tsx
git commit -m "feat(habits): HabitWeeklyRow component (progress bar + Splněno dnes)"
```

---

## Task 13: `HabitDialog` (create + edit modal)

Mirrors `RewardDialog` pattern from SP5 PR-1. Handles both create and edit. Edit mode disables `cadence` and `weeklyTarget` (immutable fields).

**Files:**
- Create: `src/components/habits/HabitDialog.tsx`
- Modify: `src/components/habits/index.ts`
- Create: `src/tests/components/habits/HabitDialog.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/tests/components/habits/HabitDialog.test.tsx`:

```tsx
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HabitDialog } from '@/components/habits/HabitDialog'

afterEach(cleanup)

describe('HabitDialog (create mode)', () => {
  it('renders create title and disabled weeklyTarget when cadence=daily', () => {
    render(<HabitDialog open mode="create" onClose={vi.fn()} onSubmit={vi.fn()} />)
    expect(screen.getByText(/nový návyk/i)).toBeInTheDocument()
    // weeklyTarget input is hidden for daily
    expect(screen.queryByLabelText(/×\/týden/i)).not.toBeInTheDocument()
  })

  it('shows weeklyTarget input when cadence=weekly is selected', async () => {
    render(<HabitDialog open mode="create" onClose={vi.fn()} onSubmit={vi.fn()} />)
    await userEvent.click(screen.getByRole('radio', { name: /weekly/i }))
    expect(screen.getByLabelText(/×\/týden/i)).toBeInTheDocument()
  })

  it('updates the XP info text when weight changes', async () => {
    render(<HabitDialog open mode="create" onClose={vi.fn()} onSubmit={vi.fn()} />)
    expect(screen.getByText(/50 \/ 200 \/ 1000 XP/)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('radio', { name: /heavy/i }))
    expect(screen.getByText(/100 \/ 400 \/ 2000 XP/)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('radio', { name: /light/i }))
    expect(screen.getByText(/25 \/ 100 \/ 500 XP/)).toBeInTheDocument()
  })

  it('submits a valid daily habit', async () => {
    const onSubmit = vi.fn()
    render(<HabitDialog open mode="create" onClose={vi.fn()} onSubmit={onSubmit} />)
    await userEvent.type(screen.getByLabelText(/název návyku/i), 'Voda')
    await userEvent.click(screen.getByRole('button', { name: /vytvořit/i }))
    expect(onSubmit).toHaveBeenCalledWith({
      name: 'Voda',
      cadence: 'daily',
      weeklyTarget: undefined,
      weight: 'standard',
    })
  })

  it('submits a valid weekly habit with target', async () => {
    const onSubmit = vi.fn()
    render(<HabitDialog open mode="create" onClose={vi.fn()} onSubmit={onSubmit} />)
    await userEvent.type(screen.getByLabelText(/název návyku/i), 'Meditace')
    await userEvent.click(screen.getByRole('radio', { name: /weekly/i }))
    const target = screen.getByLabelText(/×\/týden/i)
    await userEvent.clear(target)
    await userEvent.type(target, '4')
    await userEvent.click(screen.getByRole('button', { name: /vytvořit/i }))
    expect(onSubmit).toHaveBeenCalledWith({
      name: 'Meditace',
      cadence: 'weekly',
      weeklyTarget: 4,
      weight: 'standard',
    })
  })
})

describe('HabitDialog (edit mode)', () => {
  const habit = {
    id: 1,
    name: 'Voda',
    cadence: 'daily' as const,
    weeklyTarget: null,
    weight: 'standard' as const,
  }

  it('renders Upravit title + immutable cadence note', () => {
    render(<HabitDialog open mode="edit" habit={habit} onClose={vi.fn()} onSubmit={vi.fn()} />)
    expect(screen.getByText(/upravit návyk/i)).toBeInTheDocument()
    expect(screen.getByText(/cadence nelze měnit/i)).toBeInTheDocument()
  })

  it('disables cadence radios in edit mode', () => {
    render(<HabitDialog open mode="edit" habit={habit} onClose={vi.fn()} onSubmit={vi.fn()} />)
    expect(screen.getByRole('radio', { name: /daily/i })).toBeDisabled()
    expect(screen.getByRole('radio', { name: /weekly/i })).toBeDisabled()
  })

  it('submits only mutable fields (name + weight)', async () => {
    const onSubmit = vi.fn()
    render(<HabitDialog open mode="edit" habit={habit} onClose={vi.fn()} onSubmit={onSubmit} />)
    const nameInput = screen.getByLabelText(/název návyku/i)
    await userEvent.clear(nameInput)
    await userEvent.type(nameInput, 'Voda 2L')
    await userEvent.click(screen.getByRole('radio', { name: /heavy/i }))
    await userEvent.click(screen.getByRole('button', { name: /uložit/i }))
    expect(onSubmit).toHaveBeenCalledWith({ name: 'Voda 2L', weight: 'heavy' })
  })
})
```

- [ ] **Step 2: Run, verify fail**

```bash
npm run test:run -- src/tests/components/habits/HabitDialog.test.tsx
```

- [ ] **Step 3: Implement component**

Create `src/components/habits/HabitDialog.tsx`:

```tsx
'use client'
import { useState, useMemo } from 'react'
import { Dialog, Button } from '@/components/ui'
import { MILESTONE_BASE_XP, WEIGHT_MULTIPLIER } from '@/lib/habits/milestone'

type Cadence = 'daily' | 'weekly'
type Weight = 'light' | 'standard' | 'heavy'

type CreateProps = {
  open: boolean
  mode: 'create'
  habit?: undefined
  onClose: () => void
  onSubmit: (payload: {
    name: string
    cadence: Cadence
    weeklyTarget: number | undefined
    weight: Weight
  }) => void
}

type EditProps = {
  open: boolean
  mode: 'edit'
  habit: { id: number; name: string; cadence: Cadence; weeklyTarget: number | null; weight: Weight }
  onClose: () => void
  onSubmit: (payload: { name: string; weight: Weight }) => void
}

type Props = CreateProps | EditProps

export function HabitDialog(props: Props) {
  const isEdit = props.mode === 'edit'
  const initial = isEdit ? props.habit : null

  const [name, setName] = useState(initial?.name ?? '')
  const [cadence, setCadence] = useState<Cadence>(initial?.cadence ?? 'daily')
  const [weeklyTarget, setWeeklyTarget] = useState<number>(initial?.weeklyTarget ?? 3)
  const [weight, setWeight] = useState<Weight>(initial?.weight ?? 'standard')

  const xpPreview = useMemo(() => {
    const m = WEIGHT_MULTIPLIER[weight]
    return [
      MILESTONE_BASE_XP[7] * m,
      MILESTONE_BASE_XP[30] * m,
      MILESTONE_BASE_XP[100] * m,
    ]
  }, [weight])

  const submit = () => {
    const trimmed = name.trim()
    if (!trimmed) return
    if (isEdit) {
      props.onSubmit({ name: trimmed, weight })
    } else {
      props.onSubmit({
        name: trimmed,
        cadence,
        weeklyTarget: cadence === 'weekly' ? weeklyTarget : undefined,
        weight,
      })
    }
  }

  return (
    <Dialog open={props.open} onOpenChange={(v) => { if (!v) props.onClose() }}>
      <div className="space-y-5 p-4">
        <h2 className="text-foreground text-lg font-semibold">
          {isEdit ? 'Upravit návyk' : 'Nový návyk'}
        </h2>

        <label className="block space-y-1.5">
          <span className="text-muted-foreground text-xs uppercase tracking-wider">Název návyku</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={80}
            className="border-border bg-background text-foreground w-full rounded-md border px-3 py-2 text-sm"
            aria-label="Název návyku"
          />
        </label>

        <fieldset className="space-y-2" disabled={isEdit}>
          <legend className="text-muted-foreground text-xs uppercase tracking-wider">Cadence</legend>
          <div className="flex gap-4">
            {(['daily', 'weekly'] as const).map((c) => (
              <label key={c} className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="cadence"
                  value={c}
                  checked={cadence === c}
                  onChange={() => setCadence(c)}
                  disabled={isEdit}
                />
                {c === 'daily' ? 'Daily' : 'Weekly'}
              </label>
            ))}
          </div>
          {isEdit && (
            <p className="text-muted-foreground text-xs">
              Cadence nelze měnit. Archivuj a založ nový.
            </p>
          )}
        </fieldset>

        {!isEdit && cadence === 'weekly' && (
          <label className="block space-y-1.5">
            <span className="text-muted-foreground text-xs uppercase tracking-wider">×/týden</span>
            <input
              type="number"
              min={1}
              max={7}
              value={weeklyTarget}
              onChange={(e) => setWeeklyTarget(Math.max(1, Math.min(7, Number(e.target.value) || 1)))}
              className="border-border bg-background text-foreground w-24 rounded-md border px-3 py-2 text-sm"
              aria-label="×/týden"
            />
          </label>
        )}

        <fieldset className="space-y-2">
          <legend className="text-muted-foreground text-xs uppercase tracking-wider">Obtížnost</legend>
          <div className="flex gap-4">
            {(['light', 'standard', 'heavy'] as const).map((w) => (
              <label key={w} className="flex items-center gap-2 text-sm capitalize">
                <input
                  type="radio"
                  name="weight"
                  value={w}
                  checked={weight === w}
                  onChange={() => setWeight(w)}
                />
                {w}
              </label>
            ))}
          </div>
        </fieldset>

        <p className="text-muted-foreground text-xs leading-relaxed">
          Při streaku 7 / 30 / 100 dní získáš {xpPreview[0]} / {xpPreview[1]} / {xpPreview[2]} XP.
        </p>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={props.onClose}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!name.trim()}>
            {isEdit ? 'Uložit' : 'Vytvořit'}
          </Button>
        </div>
      </div>
    </Dialog>
  )
}
```

If `Dialog` from `@/components/ui` does not yet support a controlled `open + onOpenChange` API, check `src/components/ui/compound/Dialog.tsx` and either match it or fall back to `RewardDialog.tsx`'s exact API. Mirror whichever the existing rewards dialog uses verbatim.

- [ ] **Step 4: Add to barrel**

Modify `src/components/habits/index.ts`:

```ts
export { HabitDailyRow } from './HabitDailyRow'
export { HabitWeeklyRow } from './HabitWeeklyRow'
export { HabitDialog } from './HabitDialog'
```

- [ ] **Step 5: Run, verify pass**

```bash
npm run test:run -- src/tests/components/habits/HabitDialog.test.tsx
```

- [ ] **Step 6: Commit**

```bash
git add src/components/habits/HabitDialog.tsx src/components/habits/index.ts \
  src/tests/components/habits/HabitDialog.test.tsx
git commit -m "feat(habits): HabitDialog (create + edit modal)"
```

---

## Task 14: `/habits` page — server component + `HabitsPageClient`

**Files:**
- Create: `src/app/(app)/habits/page.tsx`
- Create: `src/components/habits/HabitsPageClient.tsx`
- Modify: `src/components/habits/index.ts`
- Create: `src/tests/components/habits/HabitsPageClient.test.tsx`

- [ ] **Step 1: Write the failing test for the client**

Create `src/tests/components/habits/HabitsPageClient.test.tsx`:

```tsx
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { render, screen, cleanup, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HabitsPageClient } from '@/components/habits/HabitsPageClient'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}))

const refreshMock = vi.fn()
vi.mock('@/components/ui', async () => {
  const actual = await vi.importActual<typeof import('@/components/ui')>('@/components/ui')
  return { ...actual, useToast: () => ({ show: vi.fn() }) }
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  refreshMock.mockClear()
})

beforeEach(() => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: () => Promise.resolve({ streak: 1 }),
  })
})

const dailyHabit = {
  id: 1,
  name: 'Voda',
  cadence: 'daily' as const,
  weeklyTarget: null,
  weight: 'standard' as const,
  currentStreak: 0,
  completedToday: false,
  archivedAt: null,
}

describe('HabitsPageClient — empty state', () => {
  it('renders empty CTA when no active habits', () => {
    render(<HabitsPageClient initialHabits={[]} initialArchived={[]} />)
    expect(screen.getByText(/založ první návyk/i)).toBeInTheDocument()
    expect(screen.getByText(/tap = check, drž = vrátit zpět/i)).toBeInTheDocument()
  })
})

describe('HabitsPageClient — sections', () => {
  it('renders Daily section header when daily habits exist', () => {
    render(<HabitsPageClient initialHabits={[dailyHabit]} initialArchived={[]} />)
    expect(screen.getByText('Daily')).toBeInTheDocument()
  })

  it('renders Weekly section when weekly habits exist', () => {
    const w = {
      id: 2, name: 'M', cadence: 'weekly' as const, weeklyTarget: 3,
      weight: 'light' as const, currentStreak: 0, completedToday: false,
      completedThisWeek: 0, archivedAt: null,
    }
    render(<HabitsPageClient initialHabits={[w]} initialArchived={[]} />)
    expect(screen.getByText('Weekly')).toBeInTheDocument()
  })

  it('renders Archive section header with count when archived exist', () => {
    const arch = { ...dailyHabit, id: 3, archivedAt: new Date().toISOString() }
    render(<HabitsPageClient initialHabits={[]} initialArchived={[arch]} />)
    expect(screen.getByText(/archive \(1\)/i)).toBeInTheDocument()
  })
})

describe('HabitsPageClient — interactions', () => {
  it('opens create dialog when "+ Nový" is clicked', async () => {
    render(<HabitsPageClient initialHabits={[]} initialArchived={[]} />)
    await userEvent.click(screen.getByRole('button', { name: /\+ nový/i }))
    expect(screen.getByText(/nový návyk/i)).toBeInTheDocument()
  })

  it('POSTs to /api/habits/[id]/check on row tap (optimistic)', async () => {
    render(<HabitsPageClient initialHabits={[dailyHabit]} initialArchived={[]} />)
    await userEvent.click(screen.getByRole('checkbox', { name: /voda/i }))
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringMatching(/\/api\/habits\/1\/check/),
        expect.objectContaining({ method: 'POST' }),
      )
    })
  })
})
```

- [ ] **Step 2: Run, verify fail**

```bash
npm run test:run -- src/tests/components/habits/HabitsPageClient.test.tsx
```

- [ ] **Step 3: Implement client wrapper**

Create `src/components/habits/HabitsPageClient.tsx`:

```tsx
'use client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button, useToast } from '@/components/ui'
import { HabitDailyRow } from './HabitDailyRow'
import { HabitWeeklyRow } from './HabitWeeklyRow'
import { HabitDialog } from './HabitDialog'
import type { HabitWithStreak } from '@/lib/queries/habits'

type Props = {
  initialHabits: HabitWithStreak[]
  initialArchived: Array<HabitWithStreak & { archivedAt: string | Date | null }>
}

function getTzOffsetHeader(): Record<string, string> {
  if (typeof window === 'undefined') return {}
  return { 'X-User-Tz-Offset': String(new Date().getTimezoneOffset()) }
}

function todayYmd(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

export function HabitsPageClient({ initialHabits, initialArchived }: Props) {
  const router = useRouter()
  const toast = useToast()
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<HabitWithStreak | null>(null)
  const [archiveOpen, setArchiveOpen] = useState(false)
  // optimistic state: which habit ids are locally checked-today
  const [localChecks, setLocalChecks] = useState<Record<number, boolean>>({})

  const daily = initialHabits.filter((h) => h.cadence === 'daily')
  const weekly = initialHabits.filter((h) => h.cadence === 'weekly')

  const isCheckedToday = (h: HabitWithStreak) =>
    h.id in localChecks ? localChecks[h.id] : h.completedToday

  const handleCheck = async (id: number) => {
    setLocalChecks((s) => ({ ...s, [id]: true }))
    const res = await fetch(`/api/habits/${id}/check`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...getTzOffsetHeader() },
      body: JSON.stringify({ date: todayYmd() }),
    })
    if (!res.ok) {
      setLocalChecks((s) => ({ ...s, [id]: false }))
      toast.show('Nepodařilo se uložit', 'error')
      return
    }
    const json = await res.json()
    if (typeof json.milestoneAwardedXp === 'number') {
      const m = json.streak
      toast.show(`🔥 Streak ${m} dní!  +${json.milestoneAwardedXp} XP`, 'success')
    }
    router.refresh()
  }

  const handleUncheck = async (id: number) => {
    setLocalChecks((s) => ({ ...s, [id]: false }))
    const res = await fetch(`/api/habits/${id}/check?date=${todayYmd()}`, {
      method: 'DELETE',
      headers: getTzOffsetHeader(),
    })
    if (!res.ok) {
      setLocalChecks((s) => ({ ...s, [id]: true }))
      toast.show('Nepodařilo se vrátit', 'error')
      return
    }
    toast.show('Vráceno', 'info')
    router.refresh()
  }

  const handleCreate = async (payload: {
    name: string
    cadence: 'daily' | 'weekly'
    weeklyTarget: number | undefined
    weight: 'light' | 'standard' | 'heavy'
  }) => {
    const res = await fetch('/api/habits', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const json = await res.json().catch(() => null)
      toast.show(json?.error === 'Duplicate name' ? 'Návyk s tímto názvem už existuje' : 'Nepodařilo se vytvořit', 'error')
      return
    }
    setCreating(false)
    router.refresh()
  }

  const handleEdit = async (payload: { name: string; weight: 'light' | 'standard' | 'heavy' }) => {
    if (!editing) return
    const res = await fetch(`/api/habits/${editing.id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      toast.show('Nepodařilo se uložit', 'error')
      return
    }
    setEditing(null)
    router.refresh()
  }

  if (initialHabits.length === 0 && initialArchived.length === 0) {
    return (
      <div className="space-y-4 py-12 text-center">
        <p className="text-muted-foreground text-sm">Zatím nemáš žádné návyky.</p>
        <Button onClick={() => setCreating(true)}>+ Založ první návyk</Button>
        <p className="text-muted-foreground text-xs">Tap = check, drž = vrátit zpět.</p>
        <HabitDialog open={creating} mode="create" onClose={() => setCreating(false)} onSubmit={handleCreate} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={() => setCreating(true)}>+ Nový</Button>
      </div>

      {daily.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-muted-foreground text-xs uppercase tracking-[0.2em]">Daily</h2>
          <div className="space-y-2">
            {daily.map((h) => (
              <HabitDailyRow
                key={h.id}
                habit={{ ...h, completedToday: isCheckedToday(h) }}
                onCheck={handleCheck}
                onUncheck={handleUncheck}
              />
            ))}
          </div>
        </section>
      )}

      {weekly.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-muted-foreground text-xs uppercase tracking-[0.2em]">Weekly</h2>
          <div className="space-y-2">
            {weekly.map((h) => (
              <HabitWeeklyRow
                key={h.id}
                habit={{
                  id: h.id, name: h.name, weight: h.weight,
                  weeklyTarget: h.weeklyTarget!, completedThisWeek: h.completedThisWeek ?? 0,
                  completedToday: isCheckedToday(h), currentStreak: h.currentStreak,
                }}
                onCheck={handleCheck}
              />
            ))}
          </div>
        </section>
      )}

      {initialArchived.length > 0 && (
        <section className="space-y-2">
          <button
            type="button"
            onClick={() => setArchiveOpen((s) => !s)}
            className="text-muted-foreground flex w-full items-center justify-between text-xs uppercase tracking-[0.2em]"
          >
            <span>Archive ({initialArchived.length})</span>
            <span>{archiveOpen ? '▲' : '▼'}</span>
          </button>
          {archiveOpen && (
            <div className="space-y-2 opacity-60">
              {initialArchived.map((h) => (
                <div
                  key={h.id}
                  data-archived-row
                  className="border-border bg-surface flex items-center gap-3 rounded-lg border px-3 py-2.5"
                >
                  <span className="flex-1 text-sm">{h.name}</span>
                  <span className="text-muted-foreground text-xs">🔥 {h.currentStreak}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      <HabitDialog open={creating} mode="create" onClose={() => setCreating(false)} onSubmit={handleCreate} />
      {editing && (
        <HabitDialog
          open
          mode="edit"
          habit={editing}
          onClose={() => setEditing(null)}
          onSubmit={handleEdit}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 4: Implement server page**

Create `src/app/(app)/habits/page.tsx`:

```tsx
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { db } from '@/db/client'
import { requireSessionUser } from '@/lib/auth-helpers'
import { habits } from '@/db/schema'
import { and, desc, eq, isNotNull } from 'drizzle-orm'
import {
  fetchActiveHabitsWithStreak,
  type HabitWithStreak,
} from '@/lib/queries/habits'
import { resolveUserToday } from '@/lib/habits/tz'
import { HabitsPageClient } from '@/components/habits/HabitsPageClient'

export const dynamic = 'force-dynamic'

export default async function HabitsPage() {
  const user = await requireSessionUser()
  if (user instanceof Response) {
    redirect('/login')
  }

  const h = await headers()
  const today = resolveUserToday(h.get('x-user-tz-offset'))

  const [active, archivedRows] = await Promise.all([
    fetchActiveHabitsWithStreak(db, user.id, today),
    db
      .select()
      .from(habits)
      .where(and(eq(habits.userId, user.id), isNotNull(habits.archivedAt)))
      .orderBy(desc(habits.archivedAt))
      .limit(50),
  ])

  // Archive rows are read-only display; we don't compute their streak (parked).
  const archived = archivedRows.map((r) => ({
    ...r,
    currentStreak: 0,
    completedToday: false,
  })) as Array<HabitWithStreak & { archivedAt: Date | null }>

  return (
    <main className="mx-auto w-full max-w-2xl space-y-6 p-4">
      <h1 className="text-foreground text-2xl font-bold">Návyky</h1>
      <HabitsPageClient initialHabits={active} initialArchived={archived} />
    </main>
  )
}
```

(`isNotNull` is exported by `drizzle-orm`; verified by grepping `src/lib/queries/rewards.ts` which uses `isNull` from the same module.)

- [ ] **Step 5: Run, verify pass**

```bash
npm run test:run -- src/tests/components/habits/HabitsPageClient.test.tsx
```

- [ ] **Step 6: Run typecheck (page is a server component, must compile)**

```bash
npm run typecheck
```

Expected: clean. If `isNotNull` import is wrong, typecheck will catch it — fix per the existing codebase usage.

- [ ] **Step 7: Commit**

```bash
git add src/app/\(app\)/habits/page.tsx src/components/habits/HabitsPageClient.tsx \
  src/components/habits/index.ts \
  src/tests/components/habits/HabitsPageClient.test.tsx
git commit -m "feat(habits): /habits page (CRUD + checklist + archive accordion)"
```

---

## Task 15: Dashboard "Today's Checks" card

**Files:**
- Create: `src/components/dashboard/TodaysChecksCard.tsx`
- Modify: dashboard page (add the card to the existing grid)
- Create: `src/tests/components/dashboard/TodaysChecksCard.test.tsx`

- [ ] **Step 1: Find the dashboard insertion point**

Open `src/app/(app)/dashboard/page.tsx`. Locate where `Today's Quest` is rendered. The new card slots immediately below it. Capture the existing layout pattern (grid columns, gap, region header style).

- [ ] **Step 2: Write the failing test**

Create `src/tests/components/dashboard/TodaysChecksCard.test.tsx`:

```tsx
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { render, screen, cleanup, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TodaysChecksCard } from '@/components/dashboard/TodaysChecksCard'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}))
vi.mock('@/components/ui', async () => {
  const actual = await vi.importActual<typeof import('@/components/ui')>('@/components/ui')
  return { ...actual, useToast: () => ({ show: vi.fn() }) }
})

afterEach(cleanup)
beforeEach(() => {
  global.fetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({ streak: 1 }) })
})

const make = (overrides = {}) => ({
  id: 1, name: 'Voda', cadence: 'daily' as const, weeklyTarget: null,
  weight: 'standard' as const, currentStreak: 5, completedToday: false,
  archivedAt: null, userId: 'u1', createdAt: new Date(),
  ...overrides,
})

describe('TodaysChecksCard', () => {
  it('renders nothing when there are no daily habits', () => {
    const { container } = render(<TodaysChecksCard dailyHabits={[]} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders all daily habits up to 5', () => {
    const habits = Array.from({ length: 7 }, (_, i) => make({ id: i + 1, name: `H${i + 1}` }))
    render(<TodaysChecksCard dailyHabits={habits} />)
    expect(screen.getByText('H1')).toBeInTheDocument()
    expect(screen.getByText('H5')).toBeInTheDocument()
    expect(screen.queryByText('H6')).not.toBeInTheDocument()
    expect(screen.getByText(/a 2 další/i)).toBeInTheDocument()
  })

  it('shows "X ze Y hotovo" footer count', () => {
    const habits = [
      make({ id: 1, completedToday: true }),
      make({ id: 2, completedToday: true }),
      make({ id: 3, completedToday: false }),
    ]
    render(<TodaysChecksCard dailyHabits={habits} />)
    expect(screen.getByText(/2 ze 3 hotovo/)).toBeInTheDocument()
  })

  it('links to /habits via "Otevřít"', () => {
    render(<TodaysChecksCard dailyHabits={[make()]} />)
    expect(screen.getByRole('link', { name: /otevřít/i })).toHaveAttribute('href', '/habits')
  })

  it('calls /api/habits/[id]/check on tap', async () => {
    render(<TodaysChecksCard dailyHabits={[make()]} />)
    await userEvent.click(screen.getByRole('checkbox', { name: /voda/i }))
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringMatching(/\/api\/habits\/1\/check/),
        expect.objectContaining({ method: 'POST' }),
      )
    })
  })
})
```

- [ ] **Step 3: Run, verify fail**

```bash
npm run test:run -- src/tests/components/dashboard/TodaysChecksCard.test.tsx
```

- [ ] **Step 4: Implement card**

Create `src/components/dashboard/TodaysChecksCard.tsx`:

```tsx
'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useToast } from '@/components/ui'
import { HabitDailyRow } from '@/components/habits/HabitDailyRow'
import type { HabitWithStreak } from '@/lib/queries/habits'

type Props = { dailyHabits: HabitWithStreak[] }

const MAX_VISIBLE = 5

function todayYmd(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

export function TodaysChecksCard({ dailyHabits }: Props) {
  const router = useRouter()
  const toast = useToast()
  const [localChecks, setLocalChecks] = useState<Record<number, boolean>>({})

  if (dailyHabits.length === 0) return null

  const visible = dailyHabits.slice(0, MAX_VISIBLE)
  const overflow = dailyHabits.length - visible.length
  const isChecked = (h: HabitWithStreak) =>
    h.id in localChecks ? localChecks[h.id] : h.completedToday
  const doneCount = dailyHabits.filter((h) => isChecked(h)).length

  const handleCheck = async (id: number) => {
    setLocalChecks((s) => ({ ...s, [id]: true }))
    const res = await fetch(`/api/habits/${id}/check`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'X-User-Tz-Offset': String(new Date().getTimezoneOffset()),
      },
      body: JSON.stringify({ date: todayYmd() }),
    })
    if (!res.ok) {
      setLocalChecks((s) => ({ ...s, [id]: false }))
      toast.show('Nepodařilo se uložit', 'error')
      return
    }
    const json = await res.json()
    if (typeof json.milestoneAwardedXp === 'number') {
      toast.show(`🔥 Streak ${json.streak} dní!  +${json.milestoneAwardedXp} XP`, 'success')
    }
    router.refresh()
  }

  const handleUncheck = async (id: number) => {
    setLocalChecks((s) => ({ ...s, [id]: false }))
    const res = await fetch(`/api/habits/${id}/check?date=${todayYmd()}`, {
      method: 'DELETE',
      headers: { 'X-User-Tz-Offset': String(new Date().getTimezoneOffset()) },
    })
    if (!res.ok) {
      setLocalChecks((s) => ({ ...s, [id]: true }))
      toast.show('Nepodařilo se vrátit', 'error')
      return
    }
    toast.show('Vráceno', 'info')
    router.refresh()
  }

  return (
    <section
      data-todays-checks-card
      className="border-border bg-surface space-y-3 rounded-xl border p-4"
    >
      <h2 className="text-muted-foreground text-xs uppercase tracking-[0.2em]">Today's Checks</h2>
      <div className="space-y-2">
        {visible.map((h) => (
          <HabitDailyRow
            key={h.id}
            habit={{ ...h, completedToday: isChecked(h) }}
            onCheck={handleCheck}
            onUncheck={handleUncheck}
          />
        ))}
      </div>
      {overflow > 0 && (
        <p className="text-muted-foreground text-xs">…a {overflow} další</p>
      )}
      <div className="border-border flex items-center justify-between border-t pt-3 text-xs">
        <span className="text-muted-foreground tabular-nums">
          {doneCount} ze {dailyHabits.length} hotovo
        </span>
        <Link href="/habits" className="text-primary hover:underline">
          Otevřít
        </Link>
      </div>
    </section>
  )
}
```

- [ ] **Step 5: Wire the card into the dashboard page**

Open `src/app/(app)/dashboard/page.tsx`. Add imports at the top:

```ts
import { headers } from 'next/headers'
import { fetchActiveHabitsWithStreak } from '@/lib/queries/habits'
import { resolveUserToday } from '@/lib/habits/tz'
import { TodaysChecksCard } from '@/components/dashboard/TodaysChecksCard'
```

In the component body, alongside the existing data loads, add:

```ts
const h = await headers()
const today = resolveUserToday(h.get('x-user-tz-offset'))
const habitRows = await fetchActiveHabitsWithStreak(db, user.id, today)
const dailyHabits = habitRows.filter((r) => r.cadence === 'daily')
```

Then in the JSX, place `<TodaysChecksCard dailyHabits={dailyHabits} />` immediately below the existing "Today's Quest" card (preserve the surrounding layout — same grid column, same gap as siblings).

- [ ] **Step 6: Run, verify pass**

```bash
npm run test:run -- src/tests/components/dashboard/TodaysChecksCard.test.tsx
npm run typecheck
```

- [ ] **Step 7: Commit**

```bash
git add src/components/dashboard/TodaysChecksCard.tsx \
  src/app/\(app\)/dashboard/page.tsx \
  src/tests/components/dashboard/TodaysChecksCard.test.tsx
git commit -m "feat(habits): dashboard Today's Checks card"
```

---

## Task 16: Sidebar promotion — flip `Habits` from placeholder to active area

**Files:**
- Modify: `src/components/shell/area-meta.ts`
- Modify: `src/tests/shell/Sidebar.test.tsx`
- Modify: `tests/e2e/nav.spec.ts`

- [ ] **Step 1: Update `area-meta.ts`**

Open `src/components/shell/area-meta.ts`. Apply the diff (compare with current content):

```ts
export type Area =
  | 'dashboard'
  | 'training'
  | 'progress'
  | 'nutrition'
  | 'stats'
  | 'habits'   // ← added
  | 'rewards'
  | 'settings'

export type PlaceholderArea = 'bio' | 'calendar'   // ← removed 'habits'
```

Inside `AREA_META`, between the existing `stats` and `rewards` entries (or just before `settings` — match the order shown in the diff), add:

```ts
  habits: {
    label: 'Habits',
    href: '/habits',
    icon: ListChecks,
    matches: (p) => p === '/habits' || p.startsWith('/habits/'),
  },
```

`ListChecks` is already imported at the top of the file. No new import needed.

Update `SIDEBAR_AREAS`:

```ts
export const SIDEBAR_AREAS: readonly Area[] = [
  'dashboard',
  'training',
  'nutrition',
  'progress',
  'stats',
  'habits',   // ← added
  'rewards',
] as const
```

Update `PLACEHOLDER_META` — remove the `habits` entry:

```ts
export const PLACEHOLDER_META: Record<
  PlaceholderArea,
  { label: string; icon: ComponentType<SVGProps<SVGSVGElement>> }
> = {
  bio: { label: 'Player Bio', icon: UserCircle2 },
  calendar: { label: 'Quest Calendar', icon: CalendarDays },
}
```

Update `PLACEHOLDER_ORDER`:

```ts
export const PLACEHOLDER_ORDER: readonly PlaceholderArea[] = ['bio', 'calendar'] as const
```

Leave `MOBILE_TABS` unchanged.

- [ ] **Step 2: Update the Sidebar unit test**

Open `src/tests/shell/Sidebar.test.tsx`. Find the assertion at line ~28 listing 3 placeholder labels:

```ts
  it('renders 3 disabled SP5 placeholder items with aria-disabled', () => {
    // ...
    ;['Habits', 'Player Bio', 'Quest Calendar'].forEach((label) => {
```

Change the test description and label list to expect 2 placeholders, and add an assertion that `Habits` is now an active link (with an href, not aria-disabled):

```ts
  it('renders 2 disabled SP5 placeholder items with aria-disabled', () => {
    // ... existing setup ...
    ;['Player Bio', 'Quest Calendar'].forEach((label) => {
      // ... existing per-label assertion body ...
    })
  })

  it('renders Habits as an active sidebar link', () => {
    // ... use the same existing render setup as the other Sidebar tests ...
    const link = screen.getByRole('link', { name: /^habits$/i })
    expect(link).toHaveAttribute('href', '/habits')
    expect(link).not.toHaveAttribute('aria-disabled')
  })
```

Match the existing test scaffolding pattern (the file already renders the Sidebar with a router mock).

- [ ] **Step 3: Update the e2e nav test**

Open `tests/e2e/nav.spec.ts`. Find the `'SP5 placeholder items'` test (line ~42):

```ts
  test('SP5 placeholder items exist and are disabled', async ({ page }) => {
    // ...
    for (const label of ['Habits', 'Player Bio', 'Quest Calendar']) {
```

Change the loop to drop `Habits`, then add a fresh assertion that the active `Habits` link works:

```ts
  test('SP5 placeholder items exist and are disabled', async ({ page }) => {
    // ... unchanged setup ...
    for (const label of ['Player Bio', 'Quest Calendar']) {
      // ... existing per-label assertions ...
    }
  })

  test('Habits is an active sidebar link and navigates to /habits', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await login(page)
    await page.getByRole('link', { name: /^habits$/i }).click()
    await expect(page).toHaveURL(/\/habits/)
  })
```

Use the exact same `login` helper and viewport conventions as the other tests in this file.

- [ ] **Step 4: Run unit tests**

```bash
npm run test:run -- src/tests/shell/Sidebar.test.tsx
```

Expected: pass.

- [ ] **Step 5: Typecheck**

```bash
npm run typecheck
```

- [ ] **Step 6: Commit**

```bash
git add src/components/shell/area-meta.ts \
  src/tests/shell/Sidebar.test.tsx \
  tests/e2e/nav.spec.ts
git commit -m "chore(habits): wire sidebar — promote habits from placeholder to active area"
```

---

## Task 17: E2E tests — happy path + milestone

**Files:**
- Create: `tests/e2e/habits.spec.ts`

- [ ] **Step 1: Author the e2e suite**

Create `tests/e2e/habits.spec.ts`:

```ts
import { test, expect, type Page } from '@playwright/test'

const EMAIL = process.env.E2E_EMAIL ?? 'jakub@test.com'
const PASSWORD = process.env.E2E_PASSWORD ?? 'ChangeMe1'

async function login(page: Page) {
  await page.goto('/login')
  await page.getByLabel(/email/i).fill(EMAIL)
  await page.getByLabel(/heslo/i).fill(PASSWORD)
  await page.getByRole('button', { name: /přihlásit/i }).click()
  await expect(page).toHaveURL(/\/dashboard/)
}

async function archiveAllHabits(page: Page) {
  // Helper: clean up after each test by archiving any leftover habits via UI.
  // Skip if no habits exist — page.goto would already work.
  await page.goto('/habits')
  // best-effort: if Habits page shows a list, this suite leaves rows for the next
  // test. Tests below scope themselves with unique names and clean DB-side via
  // the api-helpers mechanism if present. If your project has none, accept that
  // the suite leaves rows; subsequent runs scope by created-name uniqueness.
}

test.describe('SP5 PR-2 Habits', () => {
  test('happy path: create daily habit, check today, see streak, uncheck, see 0', async ({ page }) => {
    await login(page)
    await page.getByRole('link', { name: /^habits$/i }).click()
    await expect(page).toHaveURL(/\/habits/)

    const uniqueName = `e2e-voda-${Date.now()}`
    await page.getByRole('button', { name: /\+ založ první návyk|\+ nový/i }).click()
    await page.getByLabel(/název návyku/i).fill(uniqueName)
    await page.getByRole('button', { name: /vytvořit/i }).click()

    // Wait for the row to render
    const row = page.locator(`[data-habit-row]:has-text("${uniqueName}")`)
    await expect(row).toBeVisible()

    // Check today
    await row.getByRole('checkbox').check()
    await expect(row.locator('[data-streak-count]')).toContainText('🔥 1')

    // Reload — streak persists
    await page.reload()
    const rowAfter = page.locator(`[data-habit-row]:has-text("${uniqueName}")`)
    await expect(rowAfter.getByRole('checkbox')).toBeChecked()
    await expect(rowAfter.locator('[data-streak-count]')).toContainText('🔥 1')

    // Long-press undo (Playwright simulates with mousedown + 600ms delay + mouseup)
    const cb = rowAfter.getByRole('checkbox')
    const box = await cb.boundingBox()
    if (!box) throw new Error('checkbox not visible')
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    await page.mouse.down()
    await page.waitForTimeout(700)
    await page.mouse.up()

    // After undo, streak should drop to 0
    await page.reload()
    const rowFinal = page.locator(`[data-habit-row]:has-text("${uniqueName}")`)
    await expect(rowFinal.getByRole('checkbox')).not.toBeChecked()
    await expect(rowFinal.locator('[data-streak-count]')).toContainText('🔥 0')
  })

  test('Today\'s Checks card appears on dashboard after creating a daily habit', async ({ page }) => {
    await login(page)
    await page.goto('/habits')
    const uniqueName = `e2e-dash-${Date.now()}`
    await page.getByRole('button', { name: /\+ založ první návyk|\+ nový/i }).click()
    await page.getByLabel(/název návyku/i).fill(uniqueName)
    await page.getByRole('button', { name: /vytvořit/i }).click()
    await expect(page.locator(`[data-habit-row]:has-text("${uniqueName}")`)).toBeVisible()

    await page.goto('/dashboard')
    const card = page.locator('[data-todays-checks-card]')
    await expect(card).toBeVisible()
    await expect(card).toContainText("Today's Checks")
    await expect(card).toContainText(uniqueName)
  })
})
```

Notes:
- The 7-day streak milestone test requires either DB-seeding via a test helper or 7 sequential days of completions. Doing that in pure Playwright would require a backdoor route or a DB-fixture script. Many projects already have such a helper in `tests/e2e/_helpers` or invoke `npm run db:seed:e2e`. If neither exists, **the milestone path is covered by the unit tests in `src/tests/api/habits/check.test.ts`**, and the e2e suite stays focused on the user-visible happy path. Acknowledge this in the commit message and surface it to the user during review — adding a backdoor is out of scope for this slice.

- [ ] **Step 2: Run e2e**

```bash
npx playwright test tests/e2e/habits.spec.ts tests/e2e/nav.spec.ts
```

Expected: both spec files green. If `nav.spec.ts` fails because the dev server isn't picking up the schema migration, run `npm run db:migrate` once on the dev DB.

- [ ] **Step 3: Commit**

```bash
git add tests/e2e/habits.spec.ts
git commit -m "test(habits): e2e happy path + dashboard card visibility"
```

---

## Task 18: Final verification

**Files:** none (CI parity only).

- [ ] **Step 1: Full unit + integration suite**

```bash
npm run test:run 2>&1 | tail -30
```

Expected: green. Total `<N> passed` ≥ `BASELINE_UNIT` + (rough new-test count): streak ≈ 18 + milestone ≈ 14 + xp variable 3 + validators ≈ 12 + queries ≈ 12 + tz ≈ 5 + api list/create ≈ 8 + patch/archive ≈ 8 + check ≈ 9 + components (HabitDailyRow ≈ 6, Weekly ≈ 6, Dialog ≈ 7, HabitsPageClient ≈ 5, TodaysChecksCard ≈ 5) ≈ 29 = ~118 new tests. The exact total can vary with refactors; the critical check is "no failures, no skips."

- [ ] **Step 2: Typecheck + lint**

```bash
npm run typecheck
npm run lint
```

Expected: clean.

- [ ] **Step 3: Build**

```bash
npm run build
```

Expected: clean Next.js build. Watch for any runtime warnings about `dynamic = 'force-dynamic'` — `/habits` page must be dynamic (uses headers + per-user data).

- [ ] **Step 4: Manual smoke (browser)**

Start the dev server:

```bash
npm run dev
```

Walk:
1. Log in. Sidebar shows `Habits` (no longer disabled).
2. Click `Habits` → `/habits` empty state shows "Založ první návyk".
3. Create a daily habit "Voda" with weight=standard. Row appears under "Daily" header.
4. Tap checkbox. Streak goes 🔥 0 → 🔥 1.
5. Reload — streak persists.
6. Long-press the checked row (~500 ms hold). Toast "Vráceno", streak drops to 🔥 0.
7. Create a weekly habit "Meditace", target=3, weight=light. Row appears under "Weekly" header. No checkbox; "Splněno dnes" button + progress bar.
8. Click "Splněno dnes". Progress bar fills to 1/3. Button becomes disabled.
9. Open dashboard. "Today's Checks" card appears below "Today's Quest" listing only "Voda" (not weekly).
10. Toggle the dashboard checkbox. Verify it stays in sync between /dashboard and /habits after navigating.
11. Edit "Voda" via the row's edit affordance (whichever DS pattern matches RewardsPageClient). Verify cadence is disabled and the help text "Cadence nelze měnit" is visible.
12. Archive a habit. It moves to the Archive accordion, collapsed by default; expand reveals a read-only entry.

- [ ] **Step 5: Push and open PR**

```bash
git push -u origin sp5-pr2-habits
gh pr create --title "SP5 PR-2 — Habits (streak tracker + XP milestones)" \
  --body "$(cat <<'EOF'
## Summary
- New `/habits` route with daily/weekly strict streak tracker (CRUD, archive accordion).
- Dashboard "Today's Checks" card lists daily habits with one-tap completion + long-press undo.
- Crossing 7/30/100-day streak milestones emits a one-off `habit_streak` xp_event with weight-scaled XP (light ×0.5, standard ×1, heavy ×2).
- Schema: two new tables (`habits`, `habit_completions`), `xp_events.event_type` enum widened to include `habit_streak`. Migration `0004_sp5_pr2_habits`.
- Sidebar slot `Habits` flipped from placeholder to active area; `MOBILE_TABS` unchanged.

Spec: `docs/superpowers/specs/2026-04-29-sp5-pr2-habits-design.md`
Plan: `docs/superpowers/plans/2026-04-29-sp5-pr2-habits-plan.md`

## Test plan
- [x] Unit + integration: `npm run test:run`
- [x] Typecheck + lint: `npm run typecheck && npm run lint`
- [x] Build: `npm run build`
- [x] E2E (subset): `tests/e2e/habits.spec.ts` + updated `tests/e2e/nav.spec.ts`
- [ ] Reviewer manual check: walk steps 1–12 in plan §18 step 4

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

## Plan self-review notes

- **Spec coverage** — every section of the spec is mapped to at least one task: §3 decisions (Tasks 1, 9, 10, 14), §4 data model (Task 1), §4.4 streak (Task 2), §4.5 milestone (Tasks 3, 9, 10), §5 API (Tasks 7, 8, 9), §6 UI (Tasks 11, 12, 13, 14, 15), §7 sidebar (Task 16), §8 testing (every task includes its tests), §9 commit shape (one commit per task), §10 risks (TZ in Task 7; query cost acknowledged in plan; race documented in Task 9 — `onDuplicateKeyUpdate` no-op handles the completions race; the milestone double-emit race is mitigated by the dedup query but the plan does NOT add a functional unique index — that is captured in spec §10.3 as an open follow-up).
- **Type consistency** — `HabitWithStreak` is defined in Task 6, used in Tasks 7, 14, 15. `HabitMilestone`, `HabitWeight`, `xpForMilestone`, `detectMilestone` defined in Task 3 and used in Tasks 9, 10. `awardXpVariable` defined in Task 4 used in Tasks 9, 10.
- **No placeholders** — no `TODO`/`TBD` left in the plan.
- **Skipped scope** — milestone-double-emit functional unique index, e2e milestone happy-path (requires DB seed backdoor), and weekly streak in-flight reset on Sunday→Monday boundary on a stale page are all explicitly acknowledged here and in the spec; not in plan tasks.
