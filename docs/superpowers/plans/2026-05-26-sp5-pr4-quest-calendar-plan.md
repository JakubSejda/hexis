# SP5 PR-4 — Quest Calendar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the `/calendar` Quest Calendar destination (month grid, 4-signal day cells, day-detail modal, training-streak visualization, tomorrow's-plan forecast) + sidebar promotion in a single PR off `main`, per the design spec at `docs/superpowers/specs/2026-05-26-sp5-pr4-quest-calendar-design.md`.

**Architecture:** Server-rendered month grid (`?ym=YYYY-MM` URL param drives navigation). Four parallel per-source date queries → `Set<string>` of date keys → pure `composeCalendarMonth` builds `CalendarDay[]` → pure `detectTrainingStreaks` marks runs of ≥3 consecutive training days. Day-tap opens a client modal that lazy-fetches detail via a new `GET /api/calendar/day?date=…` route. Forecast on today+1 only, reusing `nextPlanAfter` from `today-quest.ts` (exported in Task 1).

**Tech Stack:** Next.js 15 App Router (this codebase has breaking changes — see `AGENTS.md`), Drizzle ORM (MySQL), Vitest + React Testing Library, Playwright e2e, Tailwind 4. **No new schema.** **No server actions** — API route + client islands (canonical pattern in this repo; mirrors PR-3).

---

## Spec → plan deviations (intentional)

| Spec ref | Spec text | Plan choice | Reason |
|---|---|---|---|
| §5 habit query | "JOIN habits ON habit_id = habits.id WHERE habits.userId" | Direct query against `habit_completions.userId` (no JOIN) | `habit_completions` schema has its own `userId` column (denormalized, `idx_completions_user_date`); JOIN is unnecessary |
| §6 forecast | "Reuse `nextPlanAfter` exported from `today-quest.ts`" | Add `export` to existing `nextPlanAfter` function (it's currently file-local) | Additive 6-character change; otherwise duplicates the function |

---

## File structure

**New files:**
- `src/lib/calendar/types.ts` — shared types (`DaySignals`, `CalendarDay`, `DayDetailData`)
- `src/lib/calendar/compose.ts` — `composeCalendarMonth(args): CalendarDay[]`
- `src/lib/calendar/streaks.ts` — `detectTrainingStreaks(days: CalendarDay[]): void` (mutates in place)
- `src/lib/queries/calendar.ts` — 4 date-range Set queries + `fetchDayDetail`
- `src/app/api/calendar/day/route.ts` — `GET` lazy detail endpoint
- `src/app/(app)/calendar/page.tsx` — server page, `force-dynamic`
- `src/components/calendar/CalendarHeader.tsx`
- `src/components/calendar/CalendarGrid.tsx`
- `src/components/calendar/CalendarCell.tsx`
- `src/components/calendar/CalendarGridClient.tsx` — `'use client'`
- `src/components/calendar/DayDetailModal.tsx` — `'use client'`
- `src/components/calendar/CalendarLegend.tsx`
- `src/components/calendar/index.ts` — barrel
- Tests for each of the above
- `tests/e2e/calendar.spec.ts`

**Modified files:**
- `src/lib/today-quest.ts` — export `nextPlanAfter` (additive)
- `src/components/shell/area-meta.ts` — promote `calendar` to active area, delete `PlaceholderArea` type + `PLACEHOLDER_META` + `PLACEHOLDER_ORDER`
- `src/tests/shell/Sidebar.test.tsx` — drop placeholder section, add Calendar tests
- `tests/e2e/nav.spec.ts` — drop placeholder block, add Calendar nav assertion
- Any consumer of `PLACEHOLDER_META` / `PLACEHOLDER_ORDER` — grep + delete the empty-state branch

---

## Conventions to follow (from `project_sp5_code_patterns.md`)

- Test DB pattern (#2): use `db` from `@/db/client` (dev DB on :3306). PREFIX-based isolation. The plan-assumed `setupTestDb` helper does NOT exist; mirror rewards/habits/PR-3 pattern.
- Auth-mock pattern (#1): `vi.mock('@/lib/auth-helpers', () => ({ requireSessionUser: vi.fn() }))` declared BEFORE imports.
- Date in schema uses `mode: 'string'` — already true for `habit_completions.completedOn`, `measurements.weekStart`, `body_photos.takenAt`.
- `vi.setSystemTime` (#12) for every test that touches "today" / window math. Use `'2026-05-15T12:00:00Z'` as the anchor (mid-month, mid-week).
- Pre-push hook runs the FULL vitest suite — drive-by fix any date-window flakes that surface (mirror PR-3 commit `131f09c`).
- M5 photo URLs (#16): `/api/photos/{id}` and `/api/photos/{id}/thumb`. Never `photoPath()` (filesystem).
- Lightbox mock in component tests (#16): `vi.mock('@/components/photos/Lightbox', () => ({ Lightbox: ({ photos, initialIndex }) => <div role="dialog">{photos[initialIndex]?.takenAt}</div> }))`.
- Czech vocab is locked in spec §9 — assert verbatim in tests.
- Stack `gap` values are `2|3|4|6|8` (not 5, not 1).
- `npm` not `pnpm` in this project. Commands: `npm run test:run`, `npm run typecheck`, `npm run lint`, `npm run db:migrate`, `npm run lint:e2e`, `npm run test:e2e`.

---

## Task sequence overview

| # | Task | Touches | Test |
|---|---|---|---|
| 1 | Export `nextPlanAfter` + add types module | today-quest.ts, calendar/types.ts | unit (today-quest unchanged behavior) |
| 2 | `composeCalendarMonth` pure helper | calendar/compose.ts | unit |
| 3 | `detectTrainingStreaks` pure helper | calendar/streaks.ts | unit |
| 4 | 4 date-range query helpers | queries/calendar.ts | unit (test DB, PREFIX) |
| 5 | `fetchDayDetail` query helper | queries/calendar.ts (same file) | unit (test DB) |
| 6 | `GET /api/calendar/day` route | api/calendar/day/route.ts | unit (auth-mock + test DB) |
| 7 | `CalendarHeader` component | components/calendar/CalendarHeader.tsx | RTL |
| 8 | `CalendarCell` component | components/calendar/CalendarCell.tsx | RTL |
| 9 | `CalendarGrid` component | components/calendar/CalendarGrid.tsx | RTL |
| 10 | `CalendarLegend` component | components/calendar/CalendarLegend.tsx | RTL |
| 11 | `DayDetailModal` component | components/calendar/DayDetailModal.tsx | RTL |
| 12 | `CalendarGridClient` wrapper | components/calendar/CalendarGridClient.tsx | RTL |
| 13 | `/calendar` page integration | calendar/page.tsx + index.ts barrel | RTL integration |
| 14 | Sidebar promotion + placeholder cleanup | shell/area-meta.ts, Sidebar.test.tsx | unit |
| 15 | E2E + final integration | tests/e2e/calendar.spec.ts, nav.spec.ts | playwright |

Each task ends in a commit. PR opens after task 15.

---

## Task 1: Export `nextPlanAfter` + add shared types module

**Goal:** Make `nextPlanAfter` reusable from outside `today-quest.ts` and create the shared `src/lib/calendar/types.ts` module that subsequent tasks import.

**Files:**
- Modify: `src/lib/today-quest.ts:21` (add `export` keyword)
- Create: `src/lib/calendar/types.ts`

- [ ] **Step 1: Export `nextPlanAfter`**

In `src/lib/today-quest.ts:21`, change:

```ts
function nextPlanAfter(lastFinishedPlanId: number | null, sortedPlans: Plan[]): Plan | null {
```

to:

```ts
export function nextPlanAfter(lastFinishedPlanId: number | null, sortedPlans: Plan[]): Plan | null {
```

Also export the `Plan` type by adding `export` to its declaration earlier in the file:

```ts
export type Plan = { id: number; name: string; order: number }
```

(If `Plan` is already exported, skip the second change.)

- [ ] **Step 2: Create the types module**

Create `src/lib/calendar/types.ts`:

```ts
export type DaySignals = {
  training: boolean
  habit: boolean
  weigh: boolean
  photo: boolean
}

export type CalendarDay = {
  date: string                    // YYYY-MM-DD
  signals: DaySignals
  isToday: boolean
  isFuture: boolean
  inStreak: boolean
  forecastPlanName: string | null
}

export type DayDetailData = {
  date: string
  sessions: Array<{ id: number; planName: string; durationMin: number | null }>
  habits: Array<{ id: number; name: string }>
  measurement: { weightKg: number | null; waistCm: number | null } | null
  photos: Array<{ id: number; thumbUrl: string; fullUrl: string; pose: string }>
}
```

- [ ] **Step 3: Typecheck**

Run: `npm run typecheck`
Expected: clean. The `export` addition is non-breaking — `today-quest.ts`'s internal use of `nextPlanAfter` still resolves.

- [ ] **Step 4: Run existing tests**

Run: `npm run test:run -- src/tests/lib/today-quest`
Expected: green (no behavior change).

- [ ] **Step 5: Commit**

```bash
git add src/lib/today-quest.ts src/lib/calendar/types.ts
git commit -m "feat(calendar): SP5 PR-4 export nextPlanAfter + add shared calendar types"
```

---

## Task 2: `composeCalendarMonth` pure helper

**Goal:** Build a `CalendarDay[]` for one calendar month from raw signal Sets + plan rotation context.

**Files:**
- Create: `src/lib/calendar/compose.ts`
- Create: `src/tests/lib/calendar/compose.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/tests/lib/calendar/compose.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { composeCalendarMonth } from '@/lib/calendar/compose'

const PLAN_A = { id: 1, name: 'Plán A', order: 0 }
const PLAN_B = { id: 2, name: 'Plán B', order: 1 }

describe('composeCalendarMonth', () => {
  it('generates 31 days for May 2026', () => {
    const days = composeCalendarMonth({
      ym: '2026-05',
      today: '2026-05-15',
      sessionDates: new Set(),
      habitDates: new Set(),
      weighDates: new Set(),
      photoDates: new Set(),
      lastFinishedPlanId: null,
      plans: [],
    })
    expect(days).toHaveLength(31)
    expect(days[0]?.date).toBe('2026-05-01')
    expect(days[30]?.date).toBe('2026-05-31')
  })

  it('generates 28 days for Feb 2026 (non-leap)', () => {
    const days = composeCalendarMonth({
      ym: '2026-02',
      today: '2026-02-15',
      sessionDates: new Set(),
      habitDates: new Set(),
      weighDates: new Set(),
      photoDates: new Set(),
      lastFinishedPlanId: null,
      plans: [],
    })
    expect(days).toHaveLength(28)
    expect(days[27]?.date).toBe('2026-02-28')
  })

  it('generates 29 days for Feb 2028 (leap)', () => {
    const days = composeCalendarMonth({
      ym: '2028-02',
      today: '2028-02-15',
      sessionDates: new Set(),
      habitDates: new Set(),
      weighDates: new Set(),
      photoDates: new Set(),
      lastFinishedPlanId: null,
      plans: [],
    })
    expect(days).toHaveLength(29)
  })

  it('flags signals from the provided Sets', () => {
    const days = composeCalendarMonth({
      ym: '2026-05',
      today: '2026-05-15',
      sessionDates: new Set(['2026-05-03', '2026-05-04']),
      habitDates: new Set(['2026-05-04']),
      weighDates: new Set(['2026-05-07']),
      photoDates: new Set(['2026-05-04']),
      lastFinishedPlanId: null,
      plans: [],
    })
    const may3 = days.find((d) => d.date === '2026-05-03')!
    const may4 = days.find((d) => d.date === '2026-05-04')!
    const may7 = days.find((d) => d.date === '2026-05-07')!
    expect(may3.signals).toEqual({ training: true, habit: false, weigh: false, photo: false })
    expect(may4.signals).toEqual({ training: true, habit: true, weigh: false, photo: true })
    expect(may7.signals).toEqual({ training: false, habit: false, weigh: true, photo: false })
  })

  it('flags isToday / isFuture relative to `today`', () => {
    const days = composeCalendarMonth({
      ym: '2026-05',
      today: '2026-05-15',
      sessionDates: new Set(),
      habitDates: new Set(),
      weighDates: new Set(),
      photoDates: new Set(),
      lastFinishedPlanId: null,
      plans: [],
    })
    expect(days.find((d) => d.date === '2026-05-15')!.isToday).toBe(true)
    expect(days.find((d) => d.date === '2026-05-14')!.isFuture).toBe(false)
    expect(days.find((d) => d.date === '2026-05-16')!.isFuture).toBe(true)
  })

  it('injects forecastPlanName only on today+1 when rotation is known', () => {
    const days = composeCalendarMonth({
      ym: '2026-05',
      today: '2026-05-15',
      sessionDates: new Set(),
      habitDates: new Set(),
      weighDates: new Set(),
      photoDates: new Set(),
      lastFinishedPlanId: 1,
      plans: [PLAN_A, PLAN_B],
    })
    expect(days.find((d) => d.date === '2026-05-15')!.forecastPlanName).toBeNull()
    expect(days.find((d) => d.date === '2026-05-16')!.forecastPlanName).toBe('Plán B')
    expect(days.find((d) => d.date === '2026-05-17')!.forecastPlanName).toBeNull()
  })

  it('falls back to first plan when lastFinishedPlanId is null', () => {
    const days = composeCalendarMonth({
      ym: '2026-05',
      today: '2026-05-15',
      sessionDates: new Set(),
      habitDates: new Set(),
      weighDates: new Set(),
      photoDates: new Set(),
      lastFinishedPlanId: null,
      plans: [PLAN_A, PLAN_B],
    })
    expect(days.find((d) => d.date === '2026-05-16')!.forecastPlanName).toBe('Plán A')
  })

  it('leaves forecast null when there are no plans', () => {
    const days = composeCalendarMonth({
      ym: '2026-05',
      today: '2026-05-15',
      sessionDates: new Set(),
      habitDates: new Set(),
      weighDates: new Set(),
      photoDates: new Set(),
      lastFinishedPlanId: null,
      plans: [],
    })
    expect(days.find((d) => d.date === '2026-05-16')!.forecastPlanName).toBeNull()
  })

  it('does not inject forecast if today+1 is in next month', () => {
    const days = composeCalendarMonth({
      ym: '2026-05',
      today: '2026-05-31',
      sessionDates: new Set(),
      habitDates: new Set(),
      weighDates: new Set(),
      photoDates: new Set(),
      lastFinishedPlanId: null,
      plans: [PLAN_A, PLAN_B],
    })
    // forecast day is 2026-06-01 — not present in May
    expect(days.every((d) => d.forecastPlanName === null)).toBe(true)
  })

  it('inStreak defaults to false (streak detection is a separate pass)', () => {
    const days = composeCalendarMonth({
      ym: '2026-05',
      today: '2026-05-15',
      sessionDates: new Set(['2026-05-01', '2026-05-02', '2026-05-03']),
      habitDates: new Set(),
      weighDates: new Set(),
      photoDates: new Set(),
      lastFinishedPlanId: null,
      plans: [],
    })
    expect(days.every((d) => d.inStreak === false)).toBe(true)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:run -- src/tests/lib/calendar/compose.test.ts`
Expected: FAIL — module `@/lib/calendar/compose` not found.

- [ ] **Step 3: Implement compose**

Create `src/lib/calendar/compose.ts`:

```ts
import { nextPlanAfter, type Plan } from '@/lib/today-quest'
import type { CalendarDay } from './types'

const MS_PER_DAY = 86_400_000

function daysInMonth(year: number, monthIndex0: number): number {
  return new Date(Date.UTC(year, monthIndex0 + 1, 0)).getUTCDate()
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n)
}

function ymdAtUtc(year: number, monthIndex0: number, day: number): string {
  return `${year}-${pad2(monthIndex0 + 1)}-${pad2(day)}`
}

export type ComposeArgs = {
  ym: string                       // YYYY-MM
  today: string                    // YYYY-MM-DD (UTC calendar day)
  sessionDates: Set<string>
  habitDates: Set<string>
  weighDates: Set<string>
  photoDates: Set<string>
  lastFinishedPlanId: number | null
  plans: Plan[]
}

export function composeCalendarMonth(args: ComposeArgs): CalendarDay[] {
  const [yStr, mStr] = args.ym.split('-')
  const year = Number(yStr)
  const monthIndex0 = Number(mStr) - 1
  const total = daysInMonth(year, monthIndex0)

  const sortedPlans = [...args.plans].sort((a, b) => a.order - b.order)
  const forecast = nextPlanAfter(args.lastFinishedPlanId, sortedPlans)

  // today+1 in YYYY-MM-DD (UTC)
  const todayMs = Date.UTC(
    Number(args.today.slice(0, 4)),
    Number(args.today.slice(5, 7)) - 1,
    Number(args.today.slice(8, 10))
  )
  const tomorrowMs = todayMs + MS_PER_DAY
  const tomorrow = new Date(tomorrowMs)
  const tomorrowKey = ymdAtUtc(
    tomorrow.getUTCFullYear(),
    tomorrow.getUTCMonth(),
    tomorrow.getUTCDate()
  )

  const out: CalendarDay[] = []
  for (let d = 1; d <= total; d++) {
    const date = ymdAtUtc(year, monthIndex0, d)
    const isToday = date === args.today
    const isFuture = date > args.today
    const forecastPlanName = date === tomorrowKey && forecast ? forecast.name : null
    out.push({
      date,
      signals: {
        training: args.sessionDates.has(date),
        habit: args.habitDates.has(date),
        weigh: args.weighDates.has(date),
        photo: args.photoDates.has(date),
      },
      isToday,
      isFuture,
      inStreak: false,
      forecastPlanName,
    })
  }
  return out
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:run -- src/tests/lib/calendar/compose.test.ts`
Expected: PASS (10 cases).

- [ ] **Step 5: Commit**

```bash
git add src/lib/calendar/compose.ts src/tests/lib/calendar/compose.test.ts
git commit -m "feat(calendar): SP5 PR-4 add composeCalendarMonth helper"
```

---

## Task 3: `detectTrainingStreaks` pure helper

**Goal:** In-place marker for runs of ≥3 consecutive `signals.training === true` days; forecast cells excluded.

**Files:**
- Create: `src/lib/calendar/streaks.ts`
- Create: `src/tests/lib/calendar/streaks.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/tests/lib/calendar/streaks.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { detectTrainingStreaks } from '@/lib/calendar/streaks'
import type { CalendarDay } from '@/lib/calendar/types'

function makeDay(date: string, training: boolean, opts?: Partial<CalendarDay>): CalendarDay {
  return {
    date,
    signals: { training, habit: false, weigh: false, photo: false },
    isToday: false,
    isFuture: false,
    inStreak: false,
    forecastPlanName: null,
    ...opts,
  }
}

describe('detectTrainingStreaks', () => {
  it('does nothing on an empty array', () => {
    const days: CalendarDay[] = []
    detectTrainingStreaks(days)
    expect(days).toEqual([])
  })

  it('does not mark a run of length 2', () => {
    const days = [
      makeDay('2026-05-01', true),
      makeDay('2026-05-02', true),
      makeDay('2026-05-03', false),
    ]
    detectTrainingStreaks(days)
    expect(days.every((d) => d.inStreak === false)).toBe(true)
  })

  it('marks every day of a run of length 3', () => {
    const days = [
      makeDay('2026-05-01', true),
      makeDay('2026-05-02', true),
      makeDay('2026-05-03', true),
      makeDay('2026-05-04', false),
    ]
    detectTrainingStreaks(days)
    expect(days[0]!.inStreak).toBe(true)
    expect(days[1]!.inStreak).toBe(true)
    expect(days[2]!.inStreak).toBe(true)
    expect(days[3]!.inStreak).toBe(false)
  })

  it('marks long runs (length 10)', () => {
    const days = Array.from({ length: 10 }, (_, i) =>
      makeDay(`2026-05-${String(i + 1).padStart(2, '0')}`, true)
    )
    detectTrainingStreaks(days)
    expect(days.every((d) => d.inStreak === true)).toBe(true)
  })

  it('handles multiple separate runs in one month', () => {
    const days = [
      makeDay('2026-05-01', true),
      makeDay('2026-05-02', true),
      makeDay('2026-05-03', true),
      makeDay('2026-05-04', false),
      makeDay('2026-05-05', true),
      makeDay('2026-05-06', true),
      makeDay('2026-05-07', true),
    ]
    detectTrainingStreaks(days)
    expect(days[0]!.inStreak).toBe(true)
    expect(days[2]!.inStreak).toBe(true)
    expect(days[3]!.inStreak).toBe(false)
    expect(days[4]!.inStreak).toBe(true)
    expect(days[6]!.inStreak).toBe(true)
  })

  it('breaks the run on a gap (false day)', () => {
    const days = [
      makeDay('2026-05-01', true),
      makeDay('2026-05-02', true),
      makeDay('2026-05-03', false),
      makeDay('2026-05-04', true),
      makeDay('2026-05-05', true),
    ]
    detectTrainingStreaks(days)
    expect(days.every((d) => d.inStreak === false)).toBe(true)
  })

  it('excludes future/forecast cells from streak (forecast does not count even if training=true)', () => {
    const days = [
      makeDay('2026-05-13', true),
      makeDay('2026-05-14', true),
      makeDay('2026-05-15', true, { isToday: true }),
      makeDay('2026-05-16', true, { isFuture: true, forecastPlanName: 'Plán A' }),
    ]
    detectTrainingStreaks(days)
    expect(days[0]!.inStreak).toBe(true)
    expect(days[1]!.inStreak).toBe(true)
    expect(days[2]!.inStreak).toBe(true)
    // forecast day must remain false even though training=true was passed
    expect(days[3]!.inStreak).toBe(false)
  })
})
```

- [ ] **Step 2: Run to verify failure**

Run: `npm run test:run -- src/tests/lib/calendar/streaks.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

Create `src/lib/calendar/streaks.ts`:

```ts
import type { CalendarDay } from './types'

const MIN_STREAK = 3

export function detectTrainingStreaks(days: CalendarDay[]): void {
  let runStart = 0
  let runLen = 0
  for (let i = 0; i < days.length; i++) {
    const d = days[i]!
    const countsAsStreakDay = d.signals.training && !d.isFuture
    if (countsAsStreakDay) {
      if (runLen === 0) runStart = i
      runLen++
    } else {
      if (runLen >= MIN_STREAK) {
        for (let j = runStart; j < runStart + runLen; j++) {
          days[j]!.inStreak = true
        }
      }
      runLen = 0
    }
  }
  if (runLen >= MIN_STREAK) {
    for (let j = runStart; j < runStart + runLen; j++) {
      days[j]!.inStreak = true
    }
  }
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npm run test:run -- src/tests/lib/calendar/streaks.test.ts`
Expected: PASS (7).

- [ ] **Step 5: Commit**

```bash
git add src/lib/calendar/streaks.ts src/tests/lib/calendar/streaks.test.ts
git commit -m "feat(calendar): SP5 PR-4 add detectTrainingStreaks helper"
```

---

## Task 4: 4 date-range query helpers

**Goal:** Per-source date-range queries that return `Set<string>` of YYYY-MM-DD keys for the given user and bounds.

**Files:**
- Create: `src/lib/queries/calendar.ts` (partial — Task 5 appends `fetchDayDetail`)
- Create: `src/tests/lib/calendar-queries.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/tests/lib/calendar-queries.test.ts`:

```ts
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { like, inArray } from 'drizzle-orm'
import { db } from '@/db/client'
import {
  users,
  sessions,
  sessionSets,
  habits,
  habitCompletions,
  measurements,
  bodyPhotos,
} from '@/db/schema'
import {
  fetchSessionDatesInRange,
  fetchHabitDatesInRange,
  fetchMeasurementDatesInRange,
  fetchPhotoDatesInRange,
} from '@/lib/queries/calendar'

const PREFIX = 'caltq_'
const USER = `${PREFIX}user00000000000001`
const OTHER = `${PREFIX}user00000000000002`

async function cleanup() {
  const owned = await db
    .select({ id: sessions.id })
    .from(sessions)
    .where(like(sessions.userId, `${PREFIX}%`))
  const sessionIds = owned.map((r) => r.id)
  if (sessionIds.length) {
    await db.delete(sessionSets).where(inArray(sessionSets.sessionId, sessionIds))
  }
  await db.delete(sessions).where(like(sessions.userId, `${PREFIX}%`))
  await db.delete(habitCompletions).where(like(habitCompletions.userId, `${PREFIX}%`))
  await db.delete(habits).where(like(habits.userId, `${PREFIX}%`))
  await db.delete(measurements).where(like(measurements.userId, `${PREFIX}%`))
  await db.delete(bodyPhotos).where(like(bodyPhotos.userId, `${PREFIX}%`))
  await db.delete(users).where(like(users.id, `${PREFIX}%`))
}

beforeAll(cleanup)
afterAll(cleanup)

beforeEach(async () => {
  await cleanup()
  await db.insert(users).values([
    { id: USER, email: `${PREFIX}u@hexis.local` },
    { id: OTHER, email: `${PREFIX}o@hexis.local` },
  ])
})

describe('fetchSessionDatesInRange', () => {
  it('returns empty Set for user with no sessions', async () => {
    const out = await fetchSessionDatesInRange(db, USER, '2026-05-01', '2026-05-31')
    expect(out).toEqual(new Set())
  })

  it('returns dates of finished sessions in range', async () => {
    await db.insert(sessions).values([
      {
        userId: USER,
        startedAt: new Date('2026-05-10T10:00:00Z'),
        finishedAt: new Date('2026-05-10T11:00:00Z'),
      },
      {
        userId: USER,
        startedAt: new Date('2026-05-12T10:00:00Z'),
        finishedAt: null,
      },
      {
        userId: USER,
        startedAt: new Date('2026-04-30T10:00:00Z'),
        finishedAt: new Date('2026-04-30T11:00:00Z'),
      },
    ])
    const out = await fetchSessionDatesInRange(db, USER, '2026-05-01', '2026-05-31')
    expect(out.has('2026-05-10')).toBe(true)
    expect(out.has('2026-05-12')).toBe(false)
    expect(out.has('2026-04-30')).toBe(false)
    expect(out.size).toBe(1)
  })

  it('scopes by userId', async () => {
    await db.insert(sessions).values({
      userId: OTHER,
      startedAt: new Date('2026-05-10T10:00:00Z'),
      finishedAt: new Date('2026-05-10T11:00:00Z'),
    })
    const out = await fetchSessionDatesInRange(db, USER, '2026-05-01', '2026-05-31')
    expect(out).toEqual(new Set())
  })

  it('includes the from and to bounds (inclusive)', async () => {
    await db.insert(sessions).values([
      {
        userId: USER,
        startedAt: new Date('2026-05-01T08:00:00Z'),
        finishedAt: new Date('2026-05-01T09:00:00Z'),
      },
      {
        userId: USER,
        startedAt: new Date('2026-05-31T22:00:00Z'),
        finishedAt: new Date('2026-05-31T23:30:00Z'),
      },
    ])
    const out = await fetchSessionDatesInRange(db, USER, '2026-05-01', '2026-05-31')
    expect(out.has('2026-05-01')).toBe(true)
    expect(out.has('2026-05-31')).toBe(true)
  })
})

describe('fetchHabitDatesInRange', () => {
  it('returns empty Set for user with no completions', async () => {
    const out = await fetchHabitDatesInRange(db, USER, '2026-05-01', '2026-05-31')
    expect(out).toEqual(new Set())
  })

  it('returns completion dates in range, scoped by userId', async () => {
    const [h1] = (await db.insert(habits).values({
      userId: USER,
      name: 'Voda',
      cadence: 'daily',
      weight: 'standard',
    })) as unknown as [{ insertId: number }]
    await db.insert(habitCompletions).values([
      { habitId: h1.insertId, userId: USER, completedOn: '2026-05-03' },
      { habitId: h1.insertId, userId: USER, completedOn: '2026-05-04' },
      { habitId: h1.insertId, userId: USER, completedOn: '2026-04-30' },
    ])
    const out = await fetchHabitDatesInRange(db, USER, '2026-05-01', '2026-05-31')
    expect(out.has('2026-05-03')).toBe(true)
    expect(out.has('2026-05-04')).toBe(true)
    expect(out.has('2026-04-30')).toBe(false)
    expect(out.size).toBe(2)
  })

  it('deduplicates multiple completions on the same date', async () => {
    const [h1] = (await db.insert(habits).values({
      userId: USER,
      name: 'Voda',
      cadence: 'daily',
      weight: 'standard',
    })) as unknown as [{ insertId: number }]
    const [h2] = (await db.insert(habits).values({
      userId: USER,
      name: 'Strečink',
      cadence: 'daily',
      weight: 'light',
    })) as unknown as [{ insertId: number }]
    await db.insert(habitCompletions).values([
      { habitId: h1.insertId, userId: USER, completedOn: '2026-05-03' },
      { habitId: h2.insertId, userId: USER, completedOn: '2026-05-03' },
    ])
    const out = await fetchHabitDatesInRange(db, USER, '2026-05-01', '2026-05-31')
    expect(out.size).toBe(1)
    expect(out.has('2026-05-03')).toBe(true)
  })
})

describe('fetchMeasurementDatesInRange', () => {
  it('returns weekStart dates in range', async () => {
    await db.insert(measurements).values([
      { userId: USER, weekStart: '2026-05-04', weightKg: '82.50' },
      { userId: USER, weekStart: '2026-05-11', weightKg: '82.00' },
      { userId: USER, weekStart: '2026-04-27', weightKg: '83.00' },
    ])
    const out = await fetchMeasurementDatesInRange(db, USER, '2026-05-01', '2026-05-31')
    expect(out).toEqual(new Set(['2026-05-04', '2026-05-11']))
  })

  it('scopes by userId', async () => {
    await db.insert(measurements).values({ userId: OTHER, weekStart: '2026-05-04', weightKg: '70.00' })
    const out = await fetchMeasurementDatesInRange(db, USER, '2026-05-01', '2026-05-31')
    expect(out).toEqual(new Set())
  })
})

describe('fetchPhotoDatesInRange', () => {
  it('returns takenAt dates in range', async () => {
    await db.insert(bodyPhotos).values([
      {
        userId: USER,
        takenAt: '2026-05-04',
        weekStart: '2026-05-04',
        pose: 'front',
        storageKey: `${PREFIX}a`,
        widthPx: 100,
        heightPx: 100,
        byteSize: 1000,
      },
      {
        userId: USER,
        takenAt: '2026-04-30',
        weekStart: '2026-04-27',
        pose: 'front',
        storageKey: `${PREFIX}b`,
        widthPx: 100,
        heightPx: 100,
        byteSize: 1000,
      },
    ])
    const out = await fetchPhotoDatesInRange(db, USER, '2026-05-01', '2026-05-31')
    expect(out).toEqual(new Set(['2026-05-04']))
  })

  it('scopes by userId', async () => {
    await db.insert(bodyPhotos).values({
      userId: OTHER,
      takenAt: '2026-05-04',
      weekStart: '2026-05-04',
      pose: 'front',
      storageKey: `${PREFIX}o`,
      widthPx: 100,
      heightPx: 100,
      byteSize: 1000,
    })
    const out = await fetchPhotoDatesInRange(db, USER, '2026-05-01', '2026-05-31')
    expect(out).toEqual(new Set())
  })
})
```

- [ ] **Step 2: Run to verify failure**

Run: `npm run test:run -- src/tests/lib/calendar-queries.test.ts`
Expected: FAIL — module `@/lib/queries/calendar` not found.

- [ ] **Step 3: Implement**

Create `src/lib/queries/calendar.ts`:

```ts
import { and, eq, gte, isNotNull, lte, sql } from 'drizzle-orm'
import type { MySql2Database } from 'drizzle-orm/mysql2'
import * as schema from '@/db/schema'
import {
  sessions,
  habitCompletions,
  measurements,
  bodyPhotos,
} from '@/db/schema'

type DB = MySql2Database<typeof schema>

function setOf(rows: Array<{ d: unknown }>): Set<string> {
  const out = new Set<string>()
  for (const r of rows) {
    if (typeof r.d === 'string') out.add(r.d)
    else if (r.d instanceof Date) {
      const y = r.d.getUTCFullYear()
      const m = String(r.d.getUTCMonth() + 1).padStart(2, '0')
      const day = String(r.d.getUTCDate()).padStart(2, '0')
      out.add(`${y}-${m}-${day}`)
    }
  }
  return out
}

/** Sessions count on the day they finished, only when finishedAt IS NOT NULL. */
export async function fetchSessionDatesInRange(
  db: DB,
  userId: string,
  from: string,
  to: string
): Promise<Set<string>> {
  const rows = await db
    .select({ d: sql<string>`DATE(${sessions.finishedAt})` })
    .from(sessions)
    .where(
      and(
        eq(sessions.userId, userId),
        isNotNull(sessions.finishedAt),
        gte(sessions.finishedAt, new Date(`${from}T00:00:00Z`)),
        lte(sessions.finishedAt, new Date(`${to}T23:59:59Z`))
      )
    )
  return setOf(rows)
}

export async function fetchHabitDatesInRange(
  db: DB,
  userId: string,
  from: string,
  to: string
): Promise<Set<string>> {
  const rows = await db
    .select({ d: habitCompletions.completedOn })
    .from(habitCompletions)
    .where(
      and(
        eq(habitCompletions.userId, userId),
        gte(habitCompletions.completedOn, from),
        lte(habitCompletions.completedOn, to)
      )
    )
  return setOf(rows)
}

export async function fetchMeasurementDatesInRange(
  db: DB,
  userId: string,
  from: string,
  to: string
): Promise<Set<string>> {
  const rows = await db
    .select({ d: measurements.weekStart })
    .from(measurements)
    .where(
      and(
        eq(measurements.userId, userId),
        gte(measurements.weekStart, from),
        lte(measurements.weekStart, to)
      )
    )
  return setOf(rows)
}

export async function fetchPhotoDatesInRange(
  db: DB,
  userId: string,
  from: string,
  to: string
): Promise<Set<string>> {
  const rows = await db
    .select({ d: bodyPhotos.takenAt })
    .from(bodyPhotos)
    .where(
      and(
        eq(bodyPhotos.userId, userId),
        gte(bodyPhotos.takenAt, from),
        lte(bodyPhotos.takenAt, to)
      )
    )
  return setOf(rows)
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npm run test:run -- src/tests/lib/calendar-queries.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/queries/calendar.ts src/tests/lib/calendar-queries.test.ts
git commit -m "feat(queries): SP5 PR-4 add 4 calendar date-range queries"
```

---

## Task 5: `fetchDayDetail` query helper

**Goal:** Detailed pull for one day for use by the day-modal API route.

**Files:**
- Modify: `src/lib/queries/calendar.ts` (append `fetchDayDetail`)
- Modify: `src/tests/lib/calendar-queries.test.ts` (append `describe('fetchDayDetail', …)`)

- [ ] **Step 1: Write the failing test**

Append to `src/tests/lib/calendar-queries.test.ts` (above the closing of the file, after the existing `describe` blocks):

```ts
import { fetchDayDetail } from '@/lib/queries/calendar'

describe('fetchDayDetail', () => {
  it('returns empty shape for a day with no signals', async () => {
    const out = await fetchDayDetail(db, USER, '2026-05-15')
    expect(out).toEqual({
      date: '2026-05-15',
      sessions: [],
      habits: [],
      measurement: null,
      photos: [],
    })
  })

  it('returns sessions finished that day with planName + durationMin', async () => {
    const [planRow] = (await db.insert(schema.plans).values({
      userId: USER,
      name: 'Plán A',
      order: 0,
    })) as unknown as [{ insertId: number }]
    const [s] = (await db.insert(sessions).values({
      userId: USER,
      planId: planRow.insertId,
      startedAt: new Date('2026-05-15T10:00:00Z'),
      finishedAt: new Date('2026-05-15T11:30:00Z'),
    })) as unknown as [{ insertId: number }]
    const out = await fetchDayDetail(db, USER, '2026-05-15')
    expect(out.sessions.length).toBe(1)
    expect(out.sessions[0]?.id).toBe(s.insertId)
    expect(out.sessions[0]?.planName).toBe('Plán A')
    expect(out.sessions[0]?.durationMin).toBe(90)
  })

  it('returns habits completed that day', async () => {
    const [h] = (await db.insert(habits).values({
      userId: USER,
      name: 'Voda',
      cadence: 'daily',
      weight: 'standard',
    })) as unknown as [{ insertId: number }]
    await db.insert(habitCompletions).values({
      habitId: h.insertId,
      userId: USER,
      completedOn: '2026-05-15',
    })
    const out = await fetchDayDetail(db, USER, '2026-05-15')
    expect(out.habits.length).toBe(1)
    expect(out.habits[0]?.name).toBe('Voda')
  })

  it('returns measurement keyed by weekStart === date', async () => {
    await db.insert(measurements).values({
      userId: USER,
      weekStart: '2026-05-15',
      weightKg: '82.50',
      waistCm: '85.0',
    })
    const out = await fetchDayDetail(db, USER, '2026-05-15')
    expect(out.measurement).not.toBeNull()
    expect(Number(out.measurement?.weightKg)).toBe(82.5)
  })

  it('returns photos with API URLs', async () => {
    const [p] = (await db.insert(bodyPhotos).values({
      userId: USER,
      takenAt: '2026-05-15',
      weekStart: '2026-05-11',
      pose: 'front',
      storageKey: `${PREFIX}p1`,
      widthPx: 100,
      heightPx: 100,
      byteSize: 1000,
    })) as unknown as [{ insertId: number }]
    const out = await fetchDayDetail(db, USER, '2026-05-15')
    expect(out.photos.length).toBe(1)
    expect(out.photos[0]?.id).toBe(p.insertId)
    expect(out.photos[0]?.fullUrl).toBe(`/api/photos/${p.insertId}`)
    expect(out.photos[0]?.thumbUrl).toBe(`/api/photos/${p.insertId}/thumb`)
    expect(out.photos[0]?.pose).toBe('front')
  })

  it('scopes everything by userId', async () => {
    await db.insert(sessions).values({
      userId: OTHER,
      startedAt: new Date('2026-05-15T10:00:00Z'),
      finishedAt: new Date('2026-05-15T11:00:00Z'),
    })
    const out = await fetchDayDetail(db, USER, '2026-05-15')
    expect(out.sessions).toEqual([])
  })
})
```

(Make sure `import * as schema from '@/db/schema'` is at the top of the file — add if missing. Also add `plans` to the existing `cleanup()` deletion sweep: `await db.delete(schema.plans).where(like(schema.plans.userId, \`${PREFIX}%\`))` — inserted between sessions and habits cleanup.)

- [ ] **Step 2: Update cleanup for plans**

In `cleanup()`, after the sessions-delete and before habit cleanup, add:

```ts
await db.delete(schema.plans).where(like(schema.plans.userId, `${PREFIX}%`))
```

Also import `schema` at the top:

```ts
import * as schema from '@/db/schema'
```

(If already imported, skip.)

- [ ] **Step 3: Run failing test**

Run: `npm run test:run -- src/tests/lib/calendar-queries.test.ts`
Expected: FAIL — `fetchDayDetail` not exported.

- [ ] **Step 4: Append `fetchDayDetail` to `src/lib/queries/calendar.ts`**

Add this to the END of `src/lib/queries/calendar.ts`:

```ts
import { plans, habits } from '@/db/schema'
import type { DayDetailData } from '@/lib/calendar/types'

export async function fetchDayDetail(
  db: DB,
  userId: string,
  date: string
): Promise<DayDetailData> {
  const dayStart = new Date(`${date}T00:00:00Z`)
  const dayEnd = new Date(`${date}T23:59:59Z`)

  const [sessionRows, habitRows, measurementRow, photoRows] = await Promise.all([
    db
      .select({
        id: sessions.id,
        planName: plans.name,
        startedAt: sessions.startedAt,
        finishedAt: sessions.finishedAt,
      })
      .from(sessions)
      .leftJoin(plans, eq(plans.id, sessions.planId))
      .where(
        and(
          eq(sessions.userId, userId),
          isNotNull(sessions.finishedAt),
          gte(sessions.finishedAt, dayStart),
          lte(sessions.finishedAt, dayEnd)
        )
      ),
    db
      .select({ id: habits.id, name: habits.name })
      .from(habitCompletions)
      .innerJoin(habits, eq(habits.id, habitCompletions.habitId))
      .where(
        and(
          eq(habitCompletions.userId, userId),
          eq(habitCompletions.completedOn, date)
        )
      ),
    db
      .select({ weightKg: measurements.weightKg, waistCm: measurements.waistCm })
      .from(measurements)
      .where(and(eq(measurements.userId, userId), eq(measurements.weekStart, date)))
      .limit(1),
    db
      .select({ id: bodyPhotos.id, pose: bodyPhotos.pose })
      .from(bodyPhotos)
      .where(and(eq(bodyPhotos.userId, userId), eq(bodyPhotos.takenAt, date))),
  ])

  return {
    date,
    sessions: sessionRows.map((r) => ({
      id: r.id,
      planName: r.planName ?? 'trénink',
      durationMin:
        r.startedAt && r.finishedAt
          ? Math.round((r.finishedAt.getTime() - r.startedAt.getTime()) / 60_000)
          : null,
    })),
    habits: habitRows.map((r) => ({ id: r.id, name: r.name })),
    measurement: measurementRow[0]
      ? {
          weightKg: measurementRow[0].weightKg ? Number(measurementRow[0].weightKg) : null,
          waistCm: measurementRow[0].waistCm ? Number(measurementRow[0].waistCm) : null,
        }
      : null,
    photos: photoRows.map((r) => ({
      id: r.id,
      pose: r.pose,
      fullUrl: `/api/photos/${r.id}`,
      thumbUrl: `/api/photos/${r.id}/thumb`,
    })),
  }
}
```

- [ ] **Step 5: Run passing**

Run: `npm run test:run -- src/tests/lib/calendar-queries.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/queries/calendar.ts src/tests/lib/calendar-queries.test.ts
git commit -m "feat(queries): SP5 PR-4 add fetchDayDetail helper"
```

---

## Task 6: `GET /api/calendar/day` route

**Goal:** Lazy endpoint that the modal calls when opened. Guards session, validates date, returns `DayDetailData` JSON.

**Files:**
- Create: `src/app/api/calendar/day/route.ts`
- Create: `src/tests/api/calendar-day.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/tests/api/calendar-day.test.ts`:

```ts
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest'
import { like } from 'drizzle-orm'

vi.mock('@/lib/auth-helpers', () => ({
  requireSessionUser: vi.fn(),
}))

import { db } from '@/db/client'
import { users, sessions } from '@/db/schema'
import { requireSessionUser } from '@/lib/auth-helpers'
import { GET } from '@/app/api/calendar/day/route'

const PREFIX = 'apicd_'
const USER = `${PREFIX}user00000000000001`

async function cleanup() {
  await db.delete(sessions).where(like(sessions.userId, `${PREFIX}%`))
  await db.delete(users).where(like(users.id, `${PREFIX}%`))
}

beforeAll(cleanup)
afterAll(cleanup)

beforeEach(async () => {
  await cleanup()
  await db.insert(users).values({ id: USER, email: `${PREFIX}u@hexis.local` })
  vi.mocked(requireSessionUser).mockResolvedValue({
    id: USER,
    email: `${PREFIX}u@hexis.local`,
    name: null,
  } as never)
})

describe('GET /api/calendar/day', () => {
  it('returns 200 with empty shape on a no-data day', async () => {
    const res = await GET(new Request('http://test/api/calendar/day?date=2026-05-15'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toEqual({
      date: '2026-05-15',
      sessions: [],
      habits: [],
      measurement: null,
      photos: [],
    })
  })

  it('returns 200 with sessions when data exists', async () => {
    await db.insert(sessions).values({
      userId: USER,
      startedAt: new Date('2026-05-15T10:00:00Z'),
      finishedAt: new Date('2026-05-15T11:00:00Z'),
    })
    const res = await GET(new Request('http://test/api/calendar/day?date=2026-05-15'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.sessions.length).toBe(1)
  })

  it('returns 401 when no session', async () => {
    vi.mocked(requireSessionUser).mockResolvedValue(
      new Response('Unauthorized', { status: 401 }) as never
    )
    const res = await GET(new Request('http://test/api/calendar/day?date=2026-05-15'))
    expect(res.status).toBe(401)
  })

  it('returns 400 on malformed date', async () => {
    const res = await GET(new Request('http://test/api/calendar/day?date=2026/05/15'))
    expect(res.status).toBe(400)
  })

  it('returns 400 when date param is missing', async () => {
    const res = await GET(new Request('http://test/api/calendar/day'))
    expect(res.status).toBe(400)
  })
})
```

- [ ] **Step 2: Run failing**

Run: `npm run test:run -- src/tests/api/calendar-day.test.ts`
Expected: FAIL — route module not found.

- [ ] **Step 3: Implement the route**

Create `src/app/api/calendar/day/route.ts`:

```ts
import { db } from '@/db/client'
import { requireSessionUser } from '@/lib/auth-helpers'
import { fetchDayDetail } from '@/lib/queries/calendar'

const YMD = /^\d{4}-\d{2}-\d{2}$/

export async function GET(req: Request) {
  const user = await requireSessionUser()
  if (user instanceof Response) return user

  const url = new URL(req.url)
  const date = url.searchParams.get('date')
  if (!date || !YMD.test(date)) {
    return Response.json({ error: 'Invalid date' }, { status: 400 })
  }

  const detail = await fetchDayDetail(db, user.id, date)
  return Response.json(detail)
}
```

- [ ] **Step 4: Run passing**

Run: `npm run test:run -- src/tests/api/calendar-day.test.ts`
Expected: PASS (5).

- [ ] **Step 5: Commit**

```bash
git add src/app/api/calendar/day/route.ts src/tests/api/calendar-day.test.ts
git commit -m "feat(api): SP5 PR-4 add GET /api/calendar/day"
```

---

## Task 7: `CalendarHeader` component

**Goal:** Top bar: cs-CZ month label + prev/next arrow links + "Dnes" button (hidden on current month).

**Files:**
- Create: `src/components/calendar/CalendarHeader.tsx`
- Create: `src/tests/calendar/CalendarHeader.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/tests/calendar/CalendarHeader.test.tsx`:

```tsx
// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CalendarHeader } from '@/components/calendar/CalendarHeader'

describe('CalendarHeader', () => {
  it('renders cs-CZ month + year label', () => {
    render(<CalendarHeader ym="2026-05" currentYm="2026-05" />)
    expect(screen.getByText(/květen 2026/i)).toBeInTheDocument()
  })

  it('renders prev link to ?ym=2026-04', () => {
    render(<CalendarHeader ym="2026-05" currentYm="2026-05" />)
    const prev = screen.getByRole('link', { name: /předchozí měsíc/i })
    expect(prev).toHaveAttribute('href', '/calendar?ym=2026-04')
  })

  it('renders next link to ?ym=2026-06', () => {
    render(<CalendarHeader ym="2026-05" currentYm="2026-05" />)
    const next = screen.getByRole('link', { name: /další měsíc/i })
    expect(next).toHaveAttribute('href', '/calendar?ym=2026-06')
  })

  it('handles year wrap on prev (Jan → previous Dec)', () => {
    render(<CalendarHeader ym="2026-01" currentYm="2026-05" />)
    expect(screen.getByRole('link', { name: /předchozí měsíc/i })).toHaveAttribute(
      'href',
      '/calendar?ym=2025-12'
    )
  })

  it('handles year wrap on next (Dec → next Jan)', () => {
    render(<CalendarHeader ym="2026-12" currentYm="2026-05" />)
    expect(screen.getByRole('link', { name: /další měsíc/i })).toHaveAttribute(
      'href',
      '/calendar?ym=2027-01'
    )
  })

  it('hides "Dnes" button on current month', () => {
    render(<CalendarHeader ym="2026-05" currentYm="2026-05" />)
    expect(screen.queryByRole('link', { name: /^dnes$/i })).not.toBeInTheDocument()
  })

  it('shows "Dnes" button when not current month, linking to /calendar (no ?ym)', () => {
    render(<CalendarHeader ym="2026-04" currentYm="2026-05" />)
    const dnes = screen.getByRole('link', { name: /^dnes$/i })
    expect(dnes).toHaveAttribute('href', '/calendar')
  })
})
```

- [ ] **Step 2: Run failing**

Run: `npm run test:run -- src/tests/calendar/CalendarHeader.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement**

Create `src/components/calendar/CalendarHeader.tsx`:

```tsx
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'

type Props = {
  ym: string         // YYYY-MM (visible month)
  currentYm: string  // YYYY-MM (today's month)
}

const FMT = new Intl.DateTimeFormat('cs-CZ', { month: 'long', year: 'numeric' })

function shiftMonth(ym: string, delta: number): string {
  const y = Number(ym.slice(0, 4))
  const m = Number(ym.slice(5, 7))
  const next0 = m - 1 + delta
  const newY = y + Math.floor(next0 / 12)
  const newM0 = ((next0 % 12) + 12) % 12
  return `${newY}-${String(newM0 + 1).padStart(2, '0')}`
}

export function CalendarHeader({ ym, currentYm }: Props) {
  const y = Number(ym.slice(0, 4))
  const m0 = Number(ym.slice(5, 7)) - 1
  const label = FMT.format(new Date(Date.UTC(y, m0, 15)))
  const prev = shiftMonth(ym, -1)
  const next = shiftMonth(ym, +1)
  const onCurrent = ym === currentYm

  return (
    <div className="flex items-center justify-between gap-3">
      <Link
        href={`/calendar?ym=${prev}`}
        aria-label="Předchozí měsíc"
        className="border-border text-muted hover:border-accent rounded-md border p-2"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden />
      </Link>
      <div className="flex flex-col items-center gap-1">
        <h1 className="text-foreground text-lg font-bold capitalize">{label}</h1>
        {!onCurrent && (
          <Link href="/calendar" className="text-muted hover:text-accent text-xs">
            Dnes
          </Link>
        )}
      </div>
      <Link
        href={`/calendar?ym=${next}`}
        aria-label="Další měsíc"
        className="border-border text-muted hover:border-accent rounded-md border p-2"
      >
        <ChevronRight className="h-4 w-4" aria-hidden />
      </Link>
    </div>
  )
}
```

- [ ] **Step 4: Run passing**

Run: `npm run test:run -- src/tests/calendar/CalendarHeader.test.tsx`
Expected: PASS (7).

- [ ] **Step 5: Commit**

```bash
git add src/components/calendar/CalendarHeader.tsx src/tests/calendar/CalendarHeader.test.tsx
git commit -m "feat(calendar): SP5 PR-4 add CalendarHeader component"
```

---

## Task 8: `CalendarCell` component

**Goal:** Single day cell — day number, 4 mini dots, today/streak/forecast visual states.

**Files:**
- Create: `src/components/calendar/CalendarCell.tsx`
- Create: `src/tests/calendar/CalendarCell.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/tests/calendar/CalendarCell.test.tsx`:

```tsx
// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CalendarCell } from '@/components/calendar/CalendarCell'
import type { CalendarDay } from '@/lib/calendar/types'

function day(over: Partial<CalendarDay> = {}): CalendarDay {
  return {
    date: '2026-05-15',
    signals: { training: false, habit: false, weigh: false, photo: false },
    isToday: false,
    isFuture: false,
    inStreak: false,
    forecastPlanName: null,
    ...over,
  }
}

describe('CalendarCell', () => {
  it('renders the day number', () => {
    render(<CalendarCell day={day({ date: '2026-05-15' })} />)
    expect(screen.getByText('15')).toBeInTheDocument()
  })

  it('renders 4 dot indicators with data-signal attrs', () => {
    const { container } = render(
      <CalendarCell day={day({ signals: { training: true, habit: true, weigh: false, photo: true } })} />
    )
    const trainingDot = container.querySelector('[data-signal="training"]')
    const habitDot = container.querySelector('[data-signal="habit"]')
    const weighDot = container.querySelector('[data-signal="weigh"]')
    const photoDot = container.querySelector('[data-signal="photo"]')
    expect(trainingDot).toHaveAttribute('data-active', 'true')
    expect(habitDot).toHaveAttribute('data-active', 'true')
    expect(weighDot).toHaveAttribute('data-active', 'false')
    expect(photoDot).toHaveAttribute('data-active', 'true')
  })

  it('sets data-today on today', () => {
    const { container } = render(<CalendarCell day={day({ isToday: true })} />)
    expect(container.querySelector('[data-today="true"]')).toBeInTheDocument()
  })

  it('sets data-streak on inStreak cells', () => {
    const { container } = render(
      <CalendarCell day={day({ inStreak: true, signals: { training: true, habit: false, weigh: false, photo: false } })} />
    )
    expect(container.querySelector('[data-streak="true"]')).toBeInTheDocument()
  })

  it('renders forecast plan label and dotted treatment on forecast day', () => {
    render(<CalendarCell day={day({ isFuture: true, forecastPlanName: 'Plán A' })} />)
    expect(screen.getByText(/plán a\?/i)).toBeInTheDocument()
  })

  it('dims plain future cells (no forecast, no signals shown)', () => {
    const { container } = render(<CalendarCell day={day({ isFuture: true })} />)
    expect(container.querySelector('[data-future="true"]')).toBeInTheDocument()
  })

  it('exposes data-date for click delegation', () => {
    const { container } = render(<CalendarCell day={day({ date: '2026-05-15' })} />)
    expect(container.querySelector('[data-date="2026-05-15"]')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run failing**

Run: `npm run test:run -- src/tests/calendar/CalendarCell.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement**

Create `src/components/calendar/CalendarCell.tsx`:

```tsx
import type { CalendarDay } from '@/lib/calendar/types'

type Props = { day: CalendarDay }

const SIGNAL_KEYS = ['training', 'habit', 'weigh', 'photo'] as const

const DOT_BG: Record<(typeof SIGNAL_KEYS)[number], string> = {
  training: 'bg-accent',
  habit: 'bg-emerald-500',
  weigh: 'bg-blue-500',
  photo: 'bg-purple-500',
}

export function CalendarCell({ day }: Props) {
  const dayNum = Number(day.date.slice(8, 10))
  const isDimmed = day.isFuture && !day.forecastPlanName
  const baseClasses = [
    'relative',
    'aspect-square',
    'rounded-md',
    'border',
    'border-border',
    'bg-surface',
    'flex',
    'flex-col',
    'items-start',
    'justify-between',
    'p-1',
  ]
  if (day.isToday) baseClasses.push('ring-2', 'ring-accent')
  if (day.inStreak) baseClasses.push('bg-accent/10', 'border-accent/40')
  if (day.forecastPlanName) baseClasses.push('border-dashed', 'border-accent/60')
  if (isDimmed) baseClasses.push('opacity-30')

  return (
    <div
      data-date={day.date}
      data-today={day.isToday ? 'true' : undefined}
      data-future={day.isFuture ? 'true' : undefined}
      data-streak={day.inStreak ? 'true' : undefined}
      data-forecast={day.forecastPlanName ? 'true' : undefined}
      className={baseClasses.join(' ')}
    >
      <span className="text-foreground text-sm font-medium">{dayNum}</span>
      {day.forecastPlanName ? (
        <span className="text-muted text-[10px] truncate w-full">{day.forecastPlanName}?</span>
      ) : isDimmed ? null : (
        <div className="flex gap-[3px]">
          {SIGNAL_KEYS.map((key) => (
            <span
              key={key}
              data-signal={key}
              data-active={day.signals[key] ? 'true' : 'false'}
              className={`h-[6px] w-[6px] rounded-full ${day.signals[key] ? DOT_BG[key] : 'bg-border'}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Run passing**

Run: `npm run test:run -- src/tests/calendar/CalendarCell.test.tsx`
Expected: PASS (7).

- [ ] **Step 5: Commit**

```bash
git add src/components/calendar/CalendarCell.tsx src/tests/calendar/CalendarCell.test.tsx
git commit -m "feat(calendar): SP5 PR-4 add CalendarCell component"
```

---

## Task 9: `CalendarGrid` component

**Goal:** 7-column grid with Czech weekday headers + leading empty cells so day 1 lands on the correct weekday (ISO Monday-start).

**Files:**
- Create: `src/components/calendar/CalendarGrid.tsx`
- Create: `src/tests/calendar/CalendarGrid.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/tests/calendar/CalendarGrid.test.tsx`:

```tsx
// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CalendarGrid } from '@/components/calendar/CalendarGrid'
import type { CalendarDay } from '@/lib/calendar/types'

function makeMay2026(): CalendarDay[] {
  return Array.from({ length: 31 }, (_, i) => ({
    date: `2026-05-${String(i + 1).padStart(2, '0')}`,
    signals: { training: false, habit: false, weigh: false, photo: false },
    isToday: false,
    isFuture: false,
    inStreak: false,
    forecastPlanName: null,
  }))
}

describe('CalendarGrid', () => {
  it('renders all 7 weekday headers in Czech (Po Út St Čt Pá So Ne)', () => {
    render(<CalendarGrid days={makeMay2026()} />)
    ;['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'].forEach((d) => {
      expect(screen.getByText(d)).toBeInTheDocument()
    })
  })

  it('renders one cell per day', () => {
    const { container } = render(<CalendarGrid days={makeMay2026()} />)
    expect(container.querySelectorAll('[data-date]').length).toBe(31)
  })

  it('inserts leading empty cells so the 1st sits under the correct weekday header', () => {
    // 2026-05-01 is a Friday → leading 4 empty cells (Po Út St Čt)
    const { container } = render(<CalendarGrid days={makeMay2026()} />)
    const blankCells = container.querySelectorAll('[data-blank="true"]')
    expect(blankCells.length).toBe(4)
  })
})
```

- [ ] **Step 2: Run failing**

Run: `npm run test:run -- src/tests/calendar/CalendarGrid.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement**

Create `src/components/calendar/CalendarGrid.tsx`:

```tsx
import type { CalendarDay } from '@/lib/calendar/types'
import { CalendarCell } from './CalendarCell'

type Props = { days: CalendarDay[] }

const WEEKDAYS = ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne']

/** Returns 0..6 where Monday is 0 (ISO week start). */
function isoWeekday(date: string): number {
  const d = new Date(`${date}T00:00:00Z`)
  const js = d.getUTCDay() // 0..6, Sunday is 0
  return (js + 6) % 7
}

export function CalendarGrid({ days }: Props) {
  if (days.length === 0) return null
  const leading = isoWeekday(days[0]!.date)
  return (
    <div className="grid grid-cols-7 gap-2">
      {WEEKDAYS.map((d) => (
        <div key={d} className="text-muted text-center text-[10px] uppercase tracking-[0.2em]">
          {d}
        </div>
      ))}
      {Array.from({ length: leading }, (_, i) => (
        <div key={`blank-${i}`} data-blank="true" aria-hidden />
      ))}
      {days.map((day) => (
        <CalendarCell key={day.date} day={day} />
      ))}
    </div>
  )
}
```

- [ ] **Step 4: Run passing**

Run: `npm run test:run -- src/tests/calendar/CalendarGrid.test.tsx`
Expected: PASS (3).

- [ ] **Step 5: Commit**

```bash
git add src/components/calendar/CalendarGrid.tsx src/tests/calendar/CalendarGrid.test.tsx
git commit -m "feat(calendar): SP5 PR-4 add CalendarGrid component"
```

---

## Task 10: `CalendarLegend` component

**Goal:** Static legend rendered under the grid: 4 colored dots with labels + a streak swatch.

**Files:**
- Create: `src/components/calendar/CalendarLegend.tsx`
- Create: `src/tests/calendar/CalendarLegend.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CalendarLegend } from '@/components/calendar/CalendarLegend'

describe('CalendarLegend', () => {
  it('renders 4 signal labels and the streak swatch', () => {
    render(<CalendarLegend />)
    expect(screen.getByText('Training')).toBeInTheDocument()
    expect(screen.getByText('Návyk')).toBeInTheDocument()
    expect(screen.getByText('Vážení')).toBeInTheDocument()
    expect(screen.getByText('Foto')).toBeInTheDocument()
    expect(screen.getByText(/3\+ den streak/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run failing**

Run: `npm run test:run -- src/tests/calendar/CalendarLegend.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement**

Create `src/components/calendar/CalendarLegend.tsx`:

```tsx
const ITEMS: Array<{ label: string; dot: string }> = [
  { label: 'Training', dot: 'bg-accent' },
  { label: 'Návyk', dot: 'bg-emerald-500' },
  { label: 'Vážení', dot: 'bg-blue-500' },
  { label: 'Foto', dot: 'bg-purple-500' },
]

export function CalendarLegend() {
  return (
    <div className="text-muted flex flex-wrap items-center gap-4 text-xs">
      {ITEMS.map((it) => (
        <span key={it.label} className="inline-flex items-center gap-2">
          <span className={`h-[6px] w-[6px] rounded-full ${it.dot}`} aria-hidden />
          {it.label}
        </span>
      ))}
      <span className="inline-flex items-center gap-2">
        <span
          className="border-accent/40 bg-accent/10 inline-block h-3 w-3 rounded-sm border"
          aria-hidden
        />
        3+ den streak
      </span>
    </div>
  )
}
```

- [ ] **Step 4: Run passing**

Run: `npm run test:run -- src/tests/calendar/CalendarLegend.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/calendar/CalendarLegend.tsx src/tests/calendar/CalendarLegend.test.tsx
git commit -m "feat(calendar): SP5 PR-4 add CalendarLegend component"
```

---

## Task 11: `DayDetailModal` component

**Goal:** Bottom-sheet / centered modal. On open, fetches `/api/calendar/day?date=…` and renders 4 sections (only the truthy ones) + "Nic se nedělo" empty state.

**Files:**
- Create: `src/components/calendar/DayDetailModal.tsx`
- Create: `src/tests/calendar/DayDetailModal.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { DayDetailModal } from '@/components/calendar/DayDetailModal'

vi.mock('@/components/photos/Lightbox', () => ({
  Lightbox: ({ photos, initialIndex }: { photos: { takenAt: string }[]; initialIndex: number }) => (
    <div role="dialog" data-testid="lightbox">
      {photos[initialIndex]?.takenAt}
    </div>
  ),
}))

const fetchMock = vi.fn()

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
  fetchMock.mockReset()
})

describe('DayDetailModal', () => {
  it('does not fetch when date is null', () => {
    render(<DayDetailModal date={null} onClose={() => {}} />)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('fetches when date is provided', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          date: '2026-05-15',
          sessions: [],
          habits: [],
          measurement: null,
          photos: [],
        }),
        { status: 200 }
      )
    )
    render(<DayDetailModal date="2026-05-15" onClose={() => {}} />)
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/calendar/day?date=2026-05-15'))
  })

  it('renders Nic se nedělo when all sections are empty', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          date: '2026-05-15',
          sessions: [],
          habits: [],
          measurement: null,
          photos: [],
        }),
        { status: 200 }
      )
    )
    render(<DayDetailModal date="2026-05-15" onClose={() => {}} />)
    await waitFor(() => expect(screen.getByText(/nic se nedělo/i)).toBeInTheDocument())
  })

  it('renders only the truthy sections', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          date: '2026-05-15',
          sessions: [{ id: 1, planName: 'Plán A', durationMin: 90 }],
          habits: [],
          measurement: null,
          photos: [],
        }),
        { status: 200 }
      )
    )
    render(<DayDetailModal date="2026-05-15" onClose={() => {}} />)
    await waitFor(() => expect(screen.getByText(/^training$/i)).toBeInTheDocument())
    expect(screen.queryByText(/^návyky$/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/^vážení$/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/^fotky$/i)).not.toBeInTheDocument()
  })

  it('close button calls onClose', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          date: '2026-05-15',
          sessions: [],
          habits: [],
          measurement: null,
          photos: [],
        }),
        { status: 200 }
      )
    )
    const onClose = vi.fn()
    render(<DayDetailModal date="2026-05-15" onClose={onClose} />)
    await waitFor(() => screen.getByText(/nic se nedělo/i))
    fireEvent.click(screen.getByRole('button', { name: /zavřít/i }))
    expect(onClose).toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run failing**

Run: `npm run test:run -- src/tests/calendar/DayDetailModal.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement**

Create `src/components/calendar/DayDetailModal.tsx`:

```tsx
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { X } from 'lucide-react'
import { Lightbox } from '@/components/photos/Lightbox'
import type { DayDetailData } from '@/lib/calendar/types'

const CS_DATE = new Intl.DateTimeFormat('cs-CZ', { day: 'numeric', month: 'long', year: 'numeric' })

function formatDate(date: string): string {
  const d = new Date(`${date}T00:00:00Z`)
  return CS_DATE.format(d)
}

type Props = {
  date: string | null
  onClose: () => void
}

export function DayDetailModal({ date, onClose }: Props) {
  const [data, setData] = useState<DayDetailData | null>(null)
  const [loading, setLoading] = useState(false)
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null)

  useEffect(() => {
    if (!date) {
      setData(null)
      return
    }
    let cancelled = false
    setLoading(true)
    fetch(`/api/calendar/day?date=${date}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: DayDetailData | null) => {
        if (!cancelled) setData(d)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [date])

  if (!date) return null

  const isEmpty =
    data &&
    data.sessions.length === 0 &&
    data.habits.length === 0 &&
    data.measurement === null &&
    data.photos.length === 0

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center"
      onClick={onClose}
    >
      <div
        className="bg-surface w-full max-w-md rounded-t-xl border border-border p-4 sm:rounded-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-foreground font-semibold">{formatDate(date)}</h2>
          <button
            type="button"
            aria-label="Zavřít"
            onClick={onClose}
            className="text-muted hover:text-foreground"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        {loading && <div className="text-muted py-6 text-center text-sm">Načítám…</div>}

        {!loading && data && isEmpty && (
          <div className="text-muted py-6 text-center text-sm">Nic se nedělo</div>
        )}

        {!loading && data && !isEmpty && (
          <div className="mt-4 flex flex-col gap-4">
            {data.sessions.length > 0 && (
              <section>
                <h3 className="text-muted text-[10px] uppercase tracking-[0.2em]">Training</h3>
                <ul className="mt-2 flex flex-col gap-1">
                  {data.sessions.map((s) => (
                    <li key={s.id} className="flex items-center justify-between text-sm">
                      <span className="text-foreground">{s.planName}</span>
                      <Link
                        href={`/training/${s.id}`}
                        className="text-accent hover:underline text-xs"
                      >
                        Zobrazit session
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {data.habits.length > 0 && (
              <section>
                <h3 className="text-muted text-[10px] uppercase tracking-[0.2em]">Návyky</h3>
                <ul className="mt-2 flex flex-col gap-1">
                  {data.habits.map((h) => (
                    <li key={h.id} className="text-foreground text-sm">
                      {h.name}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {data.measurement && (
              <section>
                <h3 className="text-muted text-[10px] uppercase tracking-[0.2em]">Vážení</h3>
                <div className="text-foreground mt-2 flex items-center justify-between text-sm">
                  <span>
                    {data.measurement.weightKg !== null
                      ? `${data.measurement.weightKg} kg`
                      : '—'}
                  </span>
                  <Link href="/progress" className="text-accent hover:underline text-xs">
                    Upravit vážení
                  </Link>
                </div>
              </section>
            )}

            {data.photos.length > 0 && (
              <section>
                <h3 className="text-muted text-[10px] uppercase tracking-[0.2em]">Fotky</h3>
                <div className="mt-2 flex gap-2 overflow-x-auto">
                  {data.photos.map((p, i) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setLightboxIdx(i)}
                      aria-label={`Otevřít fotku ${i + 1}`}
                      className="border-border hover:border-accent shrink-0 rounded border bg-black"
                    >
                      <Image
                        src={p.thumbUrl}
                        alt={`Photo ${i + 1}`}
                        width={64}
                        height={96}
                        unoptimized
                        className="h-24 w-16 object-cover"
                      />
                    </button>
                  ))}
                </div>
                {lightboxIdx !== null && (
                  <Lightbox
                    photos={data.photos.map((p) => ({
                      id: p.id,
                      takenAt: data.date,
                      pose: p.pose,
                      fullUrl: p.fullUrl,
                    }))}
                    initialIndex={lightboxIdx}
                    onClose={() => setLightboxIdx(null)}
                    onDeleted={() => {}}
                  />
                )}
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run passing**

Run: `npm run test:run -- src/tests/calendar/DayDetailModal.test.tsx`
Expected: PASS (5).

- [ ] **Step 5: Commit**

```bash
git add src/components/calendar/DayDetailModal.tsx src/tests/calendar/DayDetailModal.test.tsx
git commit -m "feat(calendar): SP5 PR-4 add DayDetailModal component"
```

---

## Task 12: `CalendarGridClient` wrapper

**Goal:** Client island that owns `openDate` state and delegates day-click → `DayDetailModal`.

**Files:**
- Create: `src/components/calendar/CalendarGridClient.tsx`
- Create: `src/tests/calendar/CalendarGridClient.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CalendarGridClient } from '@/components/calendar/CalendarGridClient'
import type { CalendarDay } from '@/lib/calendar/types'

vi.stubGlobal(
  'fetch',
  vi.fn(
    async () =>
      new Response(
        JSON.stringify({
          date: '2026-05-15',
          sessions: [],
          habits: [],
          measurement: null,
          photos: [],
        }),
        { status: 200 }
      )
  )
)

const day = (date: string, over: Partial<CalendarDay> = {}): CalendarDay => ({
  date,
  signals: { training: false, habit: false, weigh: false, photo: false },
  isToday: false,
  isFuture: false,
  inStreak: false,
  forecastPlanName: null,
  ...over,
})

describe('CalendarGridClient', () => {
  it('renders the grid and opens modal when a day is clicked', async () => {
    render(<CalendarGridClient days={[day('2026-05-15', { isToday: true }), day('2026-05-16')]} />)
    expect(screen.queryByRole('button', { name: /zavřít/i })).not.toBeInTheDocument()
    const cell = document.querySelector('[data-date="2026-05-15"]') as HTMLElement
    fireEvent.click(cell)
    expect(await screen.findByRole('button', { name: /zavřít/i })).toBeInTheDocument()
  })

  it('does not open modal for blank cells', () => {
    render(<CalendarGridClient days={[day('2026-05-15')]} />)
    // blank cells live in the grid header rendering — clicking outside data-date should not open
    const grid = document.querySelector('.grid') as HTMLElement
    fireEvent.click(grid)
    expect(screen.queryByRole('button', { name: /zavřít/i })).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run failing**

Run: `npm run test:run -- src/tests/calendar/CalendarGridClient.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement**

Create `src/components/calendar/CalendarGridClient.tsx`:

```tsx
'use client'

import { useState, type MouseEvent } from 'react'
import { CalendarGrid } from './CalendarGrid'
import { DayDetailModal } from './DayDetailModal'
import type { CalendarDay } from '@/lib/calendar/types'

type Props = { days: CalendarDay[] }

export function CalendarGridClient({ days }: Props) {
  const [openDate, setOpenDate] = useState<string | null>(null)

  function onClickDay(e: MouseEvent<HTMLDivElement>) {
    const target = (e.target as HTMLElement).closest('[data-date]')
    if (!target) return
    const date = target.getAttribute('data-date')
    if (!date) return
    setOpenDate(date)
  }

  return (
    <div onClick={onClickDay}>
      <CalendarGrid days={days} />
      <DayDetailModal date={openDate} onClose={() => setOpenDate(null)} />
    </div>
  )
}
```

- [ ] **Step 4: Run passing**

Run: `npm run test:run -- src/tests/calendar/CalendarGridClient.test.tsx`
Expected: PASS (2).

- [ ] **Step 5: Commit**

```bash
git add src/components/calendar/CalendarGridClient.tsx src/tests/calendar/CalendarGridClient.test.tsx
git commit -m "feat(calendar): SP5 PR-4 add CalendarGridClient wrapper"
```

---

## Task 13: `/calendar` page integration

**Goal:** Server page that ties everything together — validates `?ym`, fetches all 5 source sets in parallel, composes days, detects streaks, passes to the grid client. Add the components barrel.

**Files:**
- Create: `src/components/calendar/index.ts`
- Create: `src/app/(app)/calendar/page.tsx`
- Create: `src/tests/calendar/page.test.tsx`

- [ ] **Step 1: Add the barrel**

Create `src/components/calendar/index.ts`:

```ts
export { CalendarHeader } from './CalendarHeader'
export { CalendarGrid } from './CalendarGrid'
export { CalendarCell } from './CalendarCell'
export { CalendarGridClient } from './CalendarGridClient'
export { CalendarLegend } from './CalendarLegend'
export { DayDetailModal } from './DayDetailModal'
```

- [ ] **Step 2: Write the failing test**

Create `src/tests/calendar/page.test.tsx`:

```tsx
// @vitest-environment jsdom
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest'
import { eq, like, inArray } from 'drizzle-orm'
import { render, screen } from '@testing-library/react'

vi.mock('@/lib/auth-helpers', () => ({
  requireSessionUser: vi.fn(),
}))
vi.mock('next/navigation', async () => {
  const actual = (await vi.importActual('next/navigation')) as Record<string, unknown>
  return { ...actual, redirect: vi.fn() }
})
vi.mock('@/components/photos/Lightbox', () => ({
  Lightbox: () => null,
}))

import { db } from '@/db/client'
import * as schema from '@/db/schema'
import { users, sessions, habits, habitCompletions, measurements, bodyPhotos } from '@/db/schema'
import { requireSessionUser } from '@/lib/auth-helpers'
import CalendarPage from '@/app/(app)/calendar/page'

const PREFIX = 'calpg_'
const USER = `${PREFIX}user00000000000001`

async function cleanup() {
  await db.delete(sessions).where(like(sessions.userId, `${PREFIX}%`))
  await db.delete(habitCompletions).where(like(habitCompletions.userId, `${PREFIX}%`))
  await db.delete(habits).where(like(habits.userId, `${PREFIX}%`))
  await db.delete(measurements).where(like(measurements.userId, `${PREFIX}%`))
  await db.delete(bodyPhotos).where(like(bodyPhotos.userId, `${PREFIX}%`))
  await db.delete(schema.plans).where(like(schema.plans.userId, `${PREFIX}%`))
  await db.delete(users).where(like(users.id, `${PREFIX}%`))
}

beforeAll(cleanup)
afterAll(cleanup)

beforeEach(async () => {
  vi.setSystemTime(new Date('2026-05-15T12:00:00Z'))
  await cleanup()
  await db.insert(users).values({ id: USER, email: `${PREFIX}c@hexis.local` })
  vi.mocked(requireSessionUser).mockResolvedValue({
    id: USER,
    email: `${PREFIX}c@hexis.local`,
    name: null,
  } as never)
})

describe('/calendar page', () => {
  it('renders header + grid + legend in empty state', async () => {
    const ui = await CalendarPage({ searchParams: Promise.resolve({}) })
    render(ui)
    expect(screen.getByText(/květen 2026/i)).toBeInTheDocument()
    expect(screen.getByText('Training')).toBeInTheDocument()
    expect(screen.getByText(/3\+ den streak/i)).toBeInTheDocument()
  })

  it('honors ?ym param when valid', async () => {
    const ui = await CalendarPage({ searchParams: Promise.resolve({ ym: '2026-04' }) })
    render(ui)
    expect(screen.getByText(/duben 2026/i)).toBeInTheDocument()
  })

  it('falls back to current month on invalid ?ym', async () => {
    const ui = await CalendarPage({ searchParams: Promise.resolve({ ym: 'bogus' }) })
    render(ui)
    expect(screen.getByText(/květen 2026/i)).toBeInTheDocument()
  })

  it('marks today cell with data-today', async () => {
    const ui = await CalendarPage({ searchParams: Promise.resolve({}) })
    render(ui)
    const todayCell = document.querySelector('[data-date="2026-05-15"]')
    expect(todayCell?.getAttribute('data-today')).toBe('true')
  })

  it('renders streak treatment when 3+ consecutive training days exist', async () => {
    await db.insert(sessions).values([
      {
        userId: USER,
        startedAt: new Date('2026-05-10T10:00:00Z'),
        finishedAt: new Date('2026-05-10T11:00:00Z'),
      },
      {
        userId: USER,
        startedAt: new Date('2026-05-11T10:00:00Z'),
        finishedAt: new Date('2026-05-11T11:00:00Z'),
      },
      {
        userId: USER,
        startedAt: new Date('2026-05-12T10:00:00Z'),
        finishedAt: new Date('2026-05-12T11:00:00Z'),
      },
    ])
    const ui = await CalendarPage({ searchParams: Promise.resolve({}) })
    render(ui)
    expect(document.querySelector('[data-date="2026-05-10"]')?.getAttribute('data-streak')).toBe(
      'true'
    )
    expect(document.querySelector('[data-date="2026-05-12"]')?.getAttribute('data-streak')).toBe(
      'true'
    )
  })

  it('injects forecast plan label on today+1 when plans exist', async () => {
    await db
      .insert(schema.plans)
      .values([{ userId: USER, name: 'Plán A', order: 0 }])
    const ui = await CalendarPage({ searchParams: Promise.resolve({}) })
    render(ui)
    expect(document.querySelector('[data-date="2026-05-16"]')?.getAttribute('data-forecast')).toBe(
      'true'
    )
  })
})
```

- [ ] **Step 3: Run failing**

Run: `npm run test:run -- src/tests/calendar/page.test.tsx`
Expected: FAIL — page module not found.

- [ ] **Step 4: Implement the page**

Create `src/app/(app)/calendar/page.tsx`:

```tsx
import { redirect } from 'next/navigation'
import { and, desc, eq } from 'drizzle-orm'
import { db } from '@/db/client'
import { requireSessionUser } from '@/lib/auth-helpers'
import { plans, sessions } from '@/db/schema'
import {
  fetchSessionDatesInRange,
  fetchHabitDatesInRange,
  fetchMeasurementDatesInRange,
  fetchPhotoDatesInRange,
} from '@/lib/queries/calendar'
import { composeCalendarMonth } from '@/lib/calendar/compose'
import { detectTrainingStreaks } from '@/lib/calendar/streaks'
import { Container, Stack } from '@/components/ui'
import {
  CalendarHeader,
  CalendarGridClient,
  CalendarLegend,
} from '@/components/calendar'

export const dynamic = 'force-dynamic'

const YM = /^\d{4}-\d{2}$/

function todayYmdUtc(now: Date): string {
  const y = now.getUTCFullYear()
  const m = String(now.getUTCMonth() + 1).padStart(2, '0')
  const d = String(now.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function ymOfDate(date: string): string {
  return date.slice(0, 7)
}

function monthBounds(ym: string): { from: string; to: string } {
  const y = Number(ym.slice(0, 4))
  const m0 = Number(ym.slice(5, 7)) - 1
  const last = new Date(Date.UTC(y, m0 + 1, 0)).getUTCDate()
  return {
    from: `${ym}-01`,
    to: `${ym}-${String(last).padStart(2, '0')}`,
  }
}

type Search = { ym?: string }

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<Search>
}) {
  const user = await requireSessionUser()
  if (user instanceof Response) redirect('/login')

  const sp = await searchParams
  const now = new Date()
  const today = todayYmdUtc(now)
  const currentYm = ymOfDate(today)
  const ym = sp.ym && YM.test(sp.ym) ? sp.ym : currentYm
  const { from, to } = monthBounds(ym)

  const [sessionDates, habitDates, weighDates, photoDates, userPlans, lastFinishedRow] =
    await Promise.all([
      fetchSessionDatesInRange(db, user.id, from, to),
      fetchHabitDatesInRange(db, user.id, from, to),
      fetchMeasurementDatesInRange(db, user.id, from, to),
      fetchPhotoDatesInRange(db, user.id, from, to),
      db.select().from(plans).where(eq(plans.userId, user.id)),
      db
        .select({ planId: sessions.planId, finishedAt: sessions.finishedAt })
        .from(sessions)
        .where(and(eq(sessions.userId, user.id)))
        .orderBy(desc(sessions.startedAt))
        .limit(1),
    ])

  const lastFinishedPlanId = lastFinishedRow[0]?.finishedAt
    ? lastFinishedRow[0].planId
    : null

  const days = composeCalendarMonth({
    ym,
    today,
    sessionDates,
    habitDates,
    weighDates,
    photoDates,
    lastFinishedPlanId,
    plans: userPlans.map((p) => ({ id: p.id, name: p.name, order: p.order })),
  })
  detectTrainingStreaks(days)

  return (
    <Container>
      <Stack gap={4} className="py-6">
        <CalendarHeader ym={ym} currentYm={currentYm} />
        <CalendarGridClient days={days} />
        <CalendarLegend />
      </Stack>
    </Container>
  )
}
```

- [ ] **Step 5: Run passing**

Run: `npm run typecheck && npm run test:run -- src/tests/calendar/page.test.tsx`
Expected: clean typecheck + PASS (6).

- [ ] **Step 6: Commit**

```bash
git add 'src/app/(app)/calendar' src/components/calendar/index.ts src/tests/calendar/page.test.tsx
git commit -m "feat(calendar): SP5 PR-4 wire /calendar page integration"
```

---

## Task 14: Sidebar promotion + placeholder cleanup

**Goal:** Promote `calendar` to an active area; delete `PlaceholderArea`, `PLACEHOLDER_META`, `PLACEHOLDER_ORDER` entirely (no placeholders remain after this slice).

**Files:**
- Modify: `src/components/shell/area-meta.ts`
- Modify: `src/tests/shell/Sidebar.test.tsx`
- Modify: any consumer of `PLACEHOLDER_META` / `PLACEHOLDER_ORDER` / `PlaceholderArea` — grep first

- [ ] **Step 1: Grep for consumers**

Run:
```bash
grep -rn "PlaceholderArea\|PLACEHOLDER_META\|PLACEHOLDER_ORDER" src/ tests/ 2>/dev/null
```

For each hit outside `area-meta.ts` and `Sidebar.test.tsx`, replace the placeholder rendering with a no-op (the design now has zero placeholders). If a component renders the placeholder list (e.g. inside `Sidebar.tsx`), remove that block.

- [ ] **Step 2: Update Sidebar test (TDD reverse — assert new state)**

Open `src/tests/shell/Sidebar.test.tsx`. Replace the existing placeholder block (the test that asserts "Quest Calendar" disabled) with the active-link assertions:

```tsx
it('renders Quest Calendar as an active sidebar link', () => {
  vi.mocked(usePathname).mockReturnValue('/dashboard')
  render(<Sidebar />)
  const link = screen.getByRole('link', { name: /^quest calendar$/i })
  expect(link).toHaveAttribute('href', '/calendar')
  expect(link).not.toHaveAttribute('aria-disabled')
})

it('marks Quest Calendar active on /calendar', () => {
  vi.mocked(usePathname).mockReturnValue('/calendar')
  render(<Sidebar />)
  const link = screen.getByRole('link', { name: /^quest calendar$/i })
  expect(link).toHaveAttribute('aria-current', 'page')
})

it('renders no SP5 placeholder items', () => {
  vi.mocked(usePathname).mockReturnValue('/dashboard')
  render(<Sidebar />)
  expect(screen.queryByText(/quest calendar/i)?.closest('[aria-disabled="true"]')).toBeFalsy()
  expect(document.querySelector('[aria-disabled="true"]')).toBeNull()
})
```

- [ ] **Step 3: Run Sidebar tests, see them fail**

Run: `npm run test:run -- src/tests/shell/Sidebar.test.tsx`
Expected: FAIL — `Quest Calendar` is still a placeholder (no active link).

- [ ] **Step 4: Update area-meta.ts**

Modify `src/components/shell/area-meta.ts`:

1. Drop `'bio'` from `PlaceholderArea` (already done in PR-3) and drop the type entirely. Replace:

   ```ts
   export type PlaceholderArea = 'calendar'
   ```

   with: nothing (delete the type line).

2. Extend `Area` union: add `'calendar'` (before `'settings'`).

3. Add to `AREA_META`:

   ```ts
   calendar: {
     label: 'Quest Calendar',
     href: '/calendar',
     icon: CalendarDays,
     matches: (p) => p === '/calendar' || p.startsWith('/calendar/'),
   },
   ```

4. Append `'calendar'` to `SIDEBAR_AREAS`:

   ```ts
   export const SIDEBAR_AREAS: readonly Area[] = [
     'dashboard',
     'training',
     'nutrition',
     'progress',
     'stats',
     'habits',
     'rewards',
     'bio',
     'calendar',
   ] as const
   ```

5. Delete `PLACEHOLDER_META` and `PLACEHOLDER_ORDER` entirely.

6. Remove unused imports (`CalendarDays` stays because of the new AREA_META entry; remove anything that becomes orphaned).

- [ ] **Step 5: Update Sidebar component if it consumed placeholders**

If `src/components/shell/Sidebar.tsx` rendered the placeholder list (using `PLACEHOLDER_ORDER` / `PLACEHOLDER_META`), delete that block. The grep from step 1 told you where.

- [ ] **Step 6: Run sidebar tests**

Run: `npm run test:run -- src/tests/shell/Sidebar.test.tsx`
Expected: PASS.

- [ ] **Step 7: Run full suite + typecheck**

Run: `npm run typecheck && npm run test:run`
Expected: clean. If any other test still references `PlaceholderArea` / placeholder labels, surface them and update.

- [ ] **Step 8: Commit**

```bash
git add src/components/shell/area-meta.ts src/components/shell/Sidebar.tsx src/tests/shell/Sidebar.test.tsx
git commit -m "feat(shell): SP5 PR-4 promote Quest Calendar + remove placeholder system"
```

(Adjust the `git add` list to match files that actually changed in your grep sweep.)

---

## Task 15: E2E coverage + final integration

**Files:**
- Create: `tests/e2e/calendar.spec.ts`
- Modify: `tests/e2e/nav.spec.ts`

- [ ] **Step 1: Update nav.spec.ts**

Open `tests/e2e/nav.spec.ts`. Remove the "SP5 placeholder items exist and are disabled" test entirely. Add a Calendar nav assertion (model after the existing Habits/Rewards/Player Bio tests):

```ts
test('Quest Calendar is an active sidebar link and navigates to /calendar', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await login(page)
  await page.getByRole('link', { name: /^quest calendar$/i }).click()
  await expect(page).toHaveURL(/\/calendar$/)
})
```

- [ ] **Step 2: Create bio-style e2e**

Create `tests/e2e/calendar.spec.ts`:

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

test.describe('/calendar', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('renders header, grid, legend', async ({ page }) => {
    await page.goto('/calendar')
    await expect(page.getByText(/Training/).first()).toBeVisible()
    await expect(page.getByText(/3\+ den streak/i)).toBeVisible()
  })

  test('prev/next nav updates ?ym', async ({ page }) => {
    await page.goto('/calendar')
    await page.getByRole('link', { name: /předchozí měsíc/i }).click()
    await expect(page).toHaveURL(/\?ym=\d{4}-\d{2}/)
  })

  test('day click opens modal', async ({ page }) => {
    await page.goto('/calendar')
    // First non-blank cell — generic selector via [data-date]
    const firstCell = page.locator('[data-date]').first()
    await firstCell.click()
    await expect(page.getByRole('button', { name: /zavřít/i })).toBeVisible()
    await page.getByRole('button', { name: /zavřít/i }).click()
    await expect(page.getByRole('button', { name: /zavřít/i })).not.toBeVisible()
  })
})
```

- [ ] **Step 3: Run lint + typecheck**

Run: `npm run lint && npm run typecheck`
Expected: clean.

- [ ] **Step 4: Full unit suite**

Run: `npm run test:run`
Expected: all green. Pre-existing date-window flakes were already pinned in PR-3 (`131f09c`); if any new flake surfaces, drive-by fix it now (pin time via `vi.setSystemTime`).

- [ ] **Step 5: Commit**

```bash
git add tests/e2e/calendar.spec.ts tests/e2e/nav.spec.ts
git commit -m "test(e2e): SP5 PR-4 cover /calendar render + modal + nav"
```

---

## Final integration steps (single PR off `main`)

- [ ] **Open PR**

```bash
git push -u origin <branch-name>
gh pr create --title "SP5 PR-4 — Quest Calendar" --body "$(cat <<'EOF'
## Summary
- Ships `/calendar` Quest Calendar destination — month grid (7×N) with 4-signal day cells (training / habit / weigh / photo), day-tap modal with lazy detail fetch, training-streak visualization (runs ≥3), forecast hint on today+1 from active plan rotation
- All-time history via `?ym=YYYY-MM` URL nav, no infinite scroll
- Reuses M5 `Lightbox` for photo detail
- Promotes the final sidebar placeholder to an active area; deletes the placeholder system entirely (`PlaceholderArea`, `PLACEHOLDER_META`, `PLACEHOLDER_ORDER`)

## Test plan
- [ ] `npm run test:run` — all unit + RTL passing
- [ ] `npm run typecheck` — clean
- [ ] `npm run lint` — clean
- [ ] `npm run test:e2e tests/e2e/calendar.spec.ts tests/e2e/nav.spec.ts` — green locally
- [ ] Manual smoke at mobile 360px + desktop 1280px, empty + populated user

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Confirm CI green** before merging (no CI today — `gh pr checks` will report none; manual review only).

- [ ] **Update memory** after merge:
  - Mark SP5 PR-4 as closed in `project_design_overhaul.md`
  - Initiative SP5 → fully closed; design overhaul initiative complete
  - Add any new code-pattern learnings to `project_sp5_code_patterns.md` (especially: date-set `Set<string>` query pattern, click delegation pattern for cell grids, modal lazy-fetch pattern)

---

## Self-review notes

- **Spec coverage:** every numbered spec section maps to a task — §2 IA → Task 14; §3 route → Task 13; §4 data model → Task 1 (types); §5 queries → Tasks 4–5; §6 compose+streaks → Tasks 2–3; §7 day API → Task 6; §8 components → Tasks 7–12; §9 vocab → asserted in Tasks 7, 10, 11, 13; §10 testing → present at each task; §11 risks → addressed in code (forecast `?` suffix, streak month-boundary documented in §3 of Task 3 test).
- **Placeholders:** none. Every step has executable code or commands.
- **Type consistency:** `CalendarDay`, `DaySignals`, `DayDetailData` defined in Task 1, consumed verbatim throughout. `nextPlanAfter`/`Plan` types from `today-quest.ts` exported in Task 1, consumed in Task 2.
- **Notable execution-time verifications:**
  1. `Plan` type may already be exported from `today-quest.ts` — confirm in Task 1 Step 1; skip the duplicate export if so.
  2. The exact set of consumers of `PLACEHOLDER_META` / `PLACEHOLDER_ORDER` is unknown until Task 14 Step 1 grep — adjust the cleanup as needed.
  3. Tailwind tokens for `bg-blue-500` / `bg-emerald-500` / `bg-purple-500` may not all be in the project palette — if the tokens map differs, swap to whatever the DS uses; data attrs in cell tests are colour-agnostic so they won't break.
