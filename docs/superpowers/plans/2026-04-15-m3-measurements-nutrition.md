# M3 Measurements & Nutrition Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the M3 milestone — weekly measurements grid with sparklines, monthly nutrition calendar with heatmap, dashboard widgets, and a macros preferences page.

**Architecture:** Server Components for pages, client islands for inline editing and modals. Drizzle upserts on `(userId, weekStart)` and `(userId, date)` natural keys. XP awarded only on insert (detected via MySQL `affectedRows`). Hand-rolled SVG sparklines, no chart library. Heatmap is CSS grid. Reuses existing primitives: `NumberInput`, `BottomSheet`, `Toast`.

**Tech Stack:** Next.js 16.2 (App Router, Turbopack), React 19.2, TypeScript 5 strict, MySQL 8 + Drizzle 0.45, NextAuth v5, Tailwind 4, Vitest 4.1, Playwright 1.59, Radix Dialog.

**Spec:** `docs/superpowers/specs/2026-04-14-m3-measurements-nutrition-design.md`

---

## File Structure

**Schema migration:**
- `src/db/migrations/0002_m3_macros.sql` — alter measurements + nutrition_days + users
- `src/db/schema.ts` — extend tables with new columns

**Lib (pure logic, no I/O):**
- `src/lib/week.ts` — `toWeekStart(date)`, `weekRange(weeks)`
- `src/lib/sparkline.ts` — SVG path generator from `(number | null)[]`
- `src/lib/nutrition-classify.ts` — kcal background classifier + macro dot classifier
- `src/lib/nutrition-streak.ts` — streak counter from days
- `src/lib/measurement-delta.ts` — week-over-week delta calculator

**Lib (DB queries):**
- `src/lib/queries/measurements.ts` — fetchRange, upsertWeek, deleteById
- `src/lib/queries/nutrition.ts` — fetchMonth, upsertDay, deleteById, getStreak
- `src/lib/queries/user-prefs.ts` — getMacros, setMacros

**API routes:**
- `src/app/api/measurements/route.ts` — GET, PUT
- `src/app/api/measurements/[id]/route.ts` — DELETE
- `src/app/api/nutrition/route.ts` — GET, PUT
- `src/app/api/nutrition/[id]/route.ts` — DELETE
- `src/app/api/user/macros/route.ts` — GET, PUT

**UI primitives (`src/components/ui/`):**
- `Sparkline.tsx` — SVG component
- `SegmentControl.tsx` — generic toggle for N segments
- `ProgressBar.tsx` — value/max bar with color states
- `Switch.tsx` — boolean toggle (Radix or HTML-based)

**Measurements components (`src/components/measurements/`):**
- `MeasurementCell.tsx` — editable number cell
- `MeasurementRow.tsx` — table row with cells + expandable note
- `MeasurementGrid.tsx` — table wrapper, lazy-loads older weeks
- `SparklineCard.tsx` — carousel card

**Nutrition components (`src/components/nutrition/`):**
- `CalendarDay.tsx` — single day cell (color + dots + number)
- `NutritionCalendar.tsx` — month grid with navigation
- `MonthStats.tsx` — month summary panel
- `NutritionStreak.tsx` — streak number + week dots
- `DailyModal.tsx` — BottomSheet with day form

**Dashboard widgets (`src/components/dashboard/`):**
- `TodayNutritionCard.tsx`
- `WeekMeasurementCard.tsx`
- `NutritionStreakCard.tsx`

**Pages:**
- `src/app/(app)/progress/layout.tsx` — header + segment control
- `src/app/(app)/progress/page.tsx` — redirect to /progress/body
- `src/app/(app)/progress/body/page.tsx`
- `src/app/(app)/progress/nutrition/page.tsx`
- `src/app/(app)/settings/macros/page.tsx`

**Modified:**
- `src/app/(app)/layout.tsx` — add Progres tab
- `src/app/(app)/dashboard/page.tsx` — render new widget cards

**Tests:**
- `src/tests/lib/week.test.ts`
- `src/tests/lib/sparkline.test.ts`
- `src/tests/lib/nutrition-classify.test.ts`
- `src/tests/lib/nutrition-streak.test.ts`
- `src/tests/lib/measurement-delta.test.ts`
- `src/tests/api/measurements.test.ts`
- `src/tests/api/nutrition.test.ts`
- `src/tests/api/user-macros.test.ts`
- `tests/e2e/measurements.spec.ts`
- `tests/e2e/nutrition.spec.ts`
- `tests/e2e/dashboard-m3.spec.ts`

---

## Phase 1 — Schema & Lib Helpers

### Task 1: Schema migration

**Files:**
- Create: `src/db/migrations/0002_m3_macros.sql`
- Modify: `src/db/schema.ts`

- [ ] **Step 1: Write the migration SQL**

```sql
ALTER TABLE `measurements`
  ADD COLUMN `target_protein_g` smallint AFTER `target_kcal`,
  ADD COLUMN `target_carbs_g` smallint AFTER `target_protein_g`,
  ADD COLUMN `target_fat_g` smallint AFTER `target_carbs_g`,
  ADD COLUMN `target_sugar_g` smallint AFTER `target_fat_g`;
--> statement-breakpoint
ALTER TABLE `nutrition_days`
  ADD COLUMN `carbs_g` smallint AFTER `protein_g`,
  ADD COLUMN `fat_g` smallint AFTER `carbs_g`,
  ADD COLUMN `sugar_g` smallint AFTER `fat_g`;
--> statement-breakpoint
ALTER TABLE `users`
  ADD COLUMN `tracked_macros` json NOT NULL DEFAULT (JSON_ARRAY('kcal', 'protein'));
--> statement-breakpoint
CREATE INDEX `idx_measurements_user_week` ON `measurements` (`user_id`, `week_start` DESC);
--> statement-breakpoint
CREATE INDEX `idx_nutrition_user_date` ON `nutrition_days` (`user_id`, `date` DESC);
```

- [ ] **Step 2: Update Drizzle schema — measurements**

In `src/db/schema.ts`, replace the existing `measurements` table definition (lines 161-178) with:

```typescript
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
    targetProteinG: smallint('target_protein_g'),
    targetCarbsG: smallint('target_carbs_g'),
    targetFatG: smallint('target_fat_g'),
    targetSugarG: smallint('target_sugar_g'),
    note: text('note'),
  },
  (t) => ({
    uniq: unique('uniq_user_week').on(t.userId, t.weekStart),
    idxUserWeek: index('idx_measurements_user_week').on(t.userId, t.weekStart),
  })
)
```

- [ ] **Step 3: Update Drizzle schema — nutrition_days**

In `src/db/schema.ts`, replace the existing `nutritionDays` table definition (lines 184-197) with:

```typescript
export const nutritionDays = mysqlTable(
  'nutrition_days',
  {
    id: int('id').primaryKey().autoincrement(),
    userId: varchar('user_id', { length: 26 }).notNull(),
    date: date('date').notNull(),
    kcalActual: smallint('kcal_actual'),
    proteinG: smallint('protein_g'),
    carbsG: smallint('carbs_g'),
    fatG: smallint('fat_g'),
    sugarG: smallint('sugar_g'),
    note: text('note'),
  },
  (t) => ({
    uniq: unique('uniq_user_date').on(t.userId, t.date),
    idxUserDate: index('idx_nutrition_user_date').on(t.userId, t.date),
  })
)
```

- [ ] **Step 4: Update Drizzle schema — users**

In `src/db/schema.ts`, modify the `users` table to add `trackedMacros`:

```typescript
export const users = mysqlTable('users', {
  id: varchar('id', { length: 26 }).primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }),
  name: varchar('name', { length: 100 }),
  level: tinyint('level').default(1).notNull(),
  trackedMacros: json('tracked_macros').$type<string[]>().notNull().default(['kcal', 'protein']),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})
```

- [ ] **Step 5: Run the migration**

```bash
npm run db:migrate
```

Expected: migration `0002_m3_macros` applied successfully.

- [ ] **Step 6: Verify schema**

```bash
docker compose exec mysql mysql -uroot -proot hexis -e "SHOW COLUMNS FROM measurements; SHOW COLUMNS FROM nutrition_days; SHOW COLUMNS FROM users;"
```

Expected: new columns present.

- [ ] **Step 7: Commit**

```bash
git add src/db/migrations/0002_m3_macros.sql src/db/schema.ts src/db/migrations/meta/
git commit -m "feat(m3): schema — add macro targets, macro logging, user prefs"
```

---

### Task 2: `toWeekStart` and `weekRange` helpers

**Files:**
- Create: `src/lib/week.ts`
- Test: `src/tests/lib/week.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect } from 'vitest'
import { toWeekStart, weekRange } from '@/lib/week'

describe('toWeekStart', () => {
  it('returns Monday for a Wednesday', () => {
    expect(toWeekStart(new Date('2026-04-15'))).toBe('2026-04-13')
  })
  it('returns same day for a Monday', () => {
    expect(toWeekStart(new Date('2026-04-13'))).toBe('2026-04-13')
  })
  it('returns previous Monday for a Sunday', () => {
    expect(toWeekStart(new Date('2026-04-19'))).toBe('2026-04-13')
  })
  it('handles year boundary correctly', () => {
    expect(toWeekStart(new Date('2026-01-01'))).toBe('2025-12-29')
  })
})

describe('weekRange', () => {
  it('returns N consecutive Mondays ending at this week', () => {
    const range = weekRange(new Date('2026-04-15'), 3)
    expect(range).toEqual(['2026-03-30', '2026-04-06', '2026-04-13'])
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/tests/lib/week.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

```typescript
// src/lib/week.ts

/** Returns the Monday of the ISO week containing `date` as YYYY-MM-DD. */
export function toWeekStart(date: Date): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  const dayOfWeek = d.getUTCDay() // 0 = Sun, 1 = Mon, ..., 6 = Sat
  const offset = dayOfWeek === 0 ? 6 : dayOfWeek - 1
  d.setUTCDate(d.getUTCDate() - offset)
  return d.toISOString().slice(0, 10)
}

/** Returns N consecutive week-start dates ending with the week of `endDate`. */
export function weekRange(endDate: Date, weeks: number): string[] {
  const end = toWeekStart(endDate)
  const out: string[] = []
  const cursor = new Date(`${end}T00:00:00Z`)
  for (let i = weeks - 1; i >= 0; i--) {
    const d = new Date(cursor)
    d.setUTCDate(d.getUTCDate() - i * 7)
    out.push(d.toISOString().slice(0, 10))
  }
  return out
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run src/tests/lib/week.test.ts
```

Expected: PASS — 5/5.

- [ ] **Step 5: Commit**

```bash
git add src/lib/week.ts src/tests/lib/week.test.ts
git commit -m "feat(m3): toWeekStart + weekRange helpers"
```

---

### Task 3: Sparkline SVG path generator

**Files:**
- Create: `src/lib/sparkline.ts`
- Test: `src/tests/lib/sparkline.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect } from 'vitest'
import { sparklinePath } from '@/lib/sparkline'

describe('sparklinePath', () => {
  it('returns null for empty data', () => {
    expect(sparklinePath([], 100, 32)).toBeNull()
  })
  it('returns null when all values are null', () => {
    expect(sparklinePath([null, null], 100, 32)).toBeNull()
  })
  it('produces straight horizontal line for constant values', () => {
    const path = sparklinePath([5, 5, 5], 100, 32)
    expect(path).toMatch(/M 0 16 L 50 16 L 100 16/)
  })
  it('skips null values and connects neighbors', () => {
    const path = sparklinePath([1, null, 3], 100, 32)
    // Two points only: index 0 and index 2
    expect(path).toMatch(/M 0 \d+ L 100 \d+/)
  })
  it('maps min value to bottom, max to top (y-inverted)', () => {
    const path = sparklinePath([0, 10], 100, 32)!
    // y for 0 (min) should be 32, y for 10 (max) should be 0 (with no padding)
    expect(path).toContain('M 0 32')
    expect(path).toContain('L 100 0')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/tests/lib/sparkline.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

```typescript
// src/lib/sparkline.ts

/**
 * Generates an SVG path string for a sparkline.
 * Returns null if no plottable data.
 * Y axis is inverted (max value at top).
 */
export function sparklinePath(
  values: (number | null)[],
  width: number,
  height: number
): string | null {
  const points = values
    .map((v, i) => (v === null ? null : { i, v }))
    .filter((p): p is { i: number; v: number } => p !== null)
  if (points.length === 0) return null
  const nums = points.map((p) => p.v)
  const min = Math.min(...nums)
  const max = Math.max(...nums)
  const range = max - min || 1
  const stepX = values.length > 1 ? width / (values.length - 1) : 0
  const segs = points.map((p, idx) => {
    const x = p.i * stepX
    const y = height - ((p.v - min) / range) * height
    return `${idx === 0 ? 'M' : 'L'} ${round(x)} ${round(y)}`
  })
  return segs.join(' ')
}

function round(n: number): number {
  return Math.round(n * 100) / 100
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run src/tests/lib/sparkline.test.ts
```

Expected: PASS — 5/5.

- [ ] **Step 5: Commit**

```bash
git add src/lib/sparkline.ts src/tests/lib/sparkline.test.ts
git commit -m "feat(m3): sparkline SVG path generator"
```

---

### Task 4: Nutrition classifier (background + dots)

**Files:**
- Create: `src/lib/nutrition-classify.ts`
- Test: `src/tests/lib/nutrition-classify.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect } from 'vitest'
import { classifyDay, classifyMacro } from '@/lib/nutrition-classify'

describe('classifyDay (background heatmap)', () => {
  it('returns "empty" when no actual data', () => {
    expect(classifyDay({ kcalActual: null, targetKcal: 2000 })).toBe('empty')
  })
  it('returns "empty" when no target', () => {
    expect(classifyDay({ kcalActual: 1800, targetKcal: null })).toBe('empty')
  })
  it('returns "hit" when kcal <= target * 1.1', () => {
    expect(classifyDay({ kcalActual: 2200, targetKcal: 2000 })).toBe('hit')
    expect(classifyDay({ kcalActual: 1500, targetKcal: 2000 })).toBe('hit')
  })
  it('returns "miss" when kcal > target * 1.1', () => {
    expect(classifyDay({ kcalActual: 2300, targetKcal: 2000 })).toBe('miss')
  })
})

describe('classifyMacro (dot color)', () => {
  it('returns "none" when no target', () => {
    expect(classifyMacro({ actual: 100, target: null })).toBe('none')
  })
  it('returns "none" when no actual', () => {
    expect(classifyMacro({ actual: null, target: 150 })).toBe('none')
  })
  it('returns "hit" when actual <= target', () => {
    expect(classifyMacro({ actual: 150, target: 150 })).toBe('hit')
    expect(classifyMacro({ actual: 100, target: 150 })).toBe('hit')
  })
  it('returns "near" when actual within (target, target*1.1]', () => {
    expect(classifyMacro({ actual: 160, target: 150 })).toBe('near')
    expect(classifyMacro({ actual: 165, target: 150 })).toBe('near')
  })
  it('returns "miss" when actual > target * 1.1', () => {
    expect(classifyMacro({ actual: 170, target: 150 })).toBe('miss')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/tests/lib/nutrition-classify.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

```typescript
// src/lib/nutrition-classify.ts

export type DayClass = 'hit' | 'miss' | 'empty'
export type MacroClass = 'hit' | 'near' | 'miss' | 'none'

export function classifyDay(args: {
  kcalActual: number | null
  targetKcal: number | null
}): DayClass {
  if (args.kcalActual == null || args.targetKcal == null) return 'empty'
  return args.kcalActual <= args.targetKcal * 1.1 ? 'hit' : 'miss'
}

export function classifyMacro(args: {
  actual: number | null
  target: number | null
}): MacroClass {
  if (args.actual == null || args.target == null) return 'none'
  if (args.actual <= args.target) return 'hit'
  if (args.actual <= args.target * 1.1) return 'near'
  return 'miss'
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run src/tests/lib/nutrition-classify.test.ts
```

Expected: PASS — 9/9.

- [ ] **Step 5: Commit**

```bash
git add src/lib/nutrition-classify.ts src/tests/lib/nutrition-classify.test.ts
git commit -m "feat(m3): nutrition heatmap + macro dot classifiers"
```

---

### Task 5: Nutrition streak counter

**Files:**
- Create: `src/lib/nutrition-streak.ts`
- Test: `src/tests/lib/nutrition-streak.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect } from 'vitest'
import { calcStreak } from '@/lib/nutrition-streak'

describe('calcStreak', () => {
  it('returns 0 when no days', () => {
    expect(calcStreak({ today: new Date('2026-04-15'), days: [] })).toBe(0)
  })
  it('counts back from yesterday, ignoring today', () => {
    expect(
      calcStreak({
        today: new Date('2026-04-15'), // Wednesday
        days: [
          { date: '2026-04-15', class: 'empty' }, // today, ignored
          { date: '2026-04-14', class: 'hit' },
          { date: '2026-04-13', class: 'hit' },
          { date: '2026-04-12', class: 'hit' },
        ],
      })
    ).toBe(3)
  })
  it('breaks on a miss', () => {
    expect(
      calcStreak({
        today: new Date('2026-04-15'),
        days: [
          { date: '2026-04-14', class: 'hit' },
          { date: '2026-04-13', class: 'miss' },
          { date: '2026-04-12', class: 'hit' },
        ],
      })
    ).toBe(1)
  })
  it('breaks on an empty day', () => {
    expect(
      calcStreak({
        today: new Date('2026-04-15'),
        days: [
          { date: '2026-04-14', class: 'hit' },
          { date: '2026-04-13', class: 'empty' },
          { date: '2026-04-12', class: 'hit' },
        ],
      })
    ).toBe(1)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/tests/lib/nutrition-streak.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

```typescript
// src/lib/nutrition-streak.ts
import type { DayClass } from './nutrition-classify'

export function calcStreak(args: {
  today: Date
  days: { date: string; class: DayClass }[]
}): number {
  // Build a map for O(1) lookup
  const byDate = new Map(args.days.map((d) => [d.date, d.class]))
  let streak = 0
  const cursor = new Date(
    Date.UTC(args.today.getUTCFullYear(), args.today.getUTCMonth(), args.today.getUTCDate())
  )
  // Start from yesterday
  cursor.setUTCDate(cursor.getUTCDate() - 1)
  // Walk back, accumulating hits, stop on first non-hit
  for (let i = 0; i < 365; i++) {
    const key = cursor.toISOString().slice(0, 10)
    if (byDate.get(key) === 'hit') {
      streak++
    } else {
      break
    }
    cursor.setUTCDate(cursor.getUTCDate() - 1)
  }
  return streak
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run src/tests/lib/nutrition-streak.test.ts
```

Expected: PASS — 4/4.

- [ ] **Step 5: Commit**

```bash
git add src/lib/nutrition-streak.ts src/tests/lib/nutrition-streak.test.ts
git commit -m "feat(m3): nutrition streak calculator"
```

---

### Task 6: Measurement delta calculator

**Files:**
- Create: `src/lib/measurement-delta.ts`
- Test: `src/tests/lib/measurement-delta.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect } from 'vitest'
import { calcDelta, deltaDirection } from '@/lib/measurement-delta'

describe('calcDelta', () => {
  it('returns null when current is null', () => {
    expect(calcDelta(null, 67.5)).toBeNull()
  })
  it('returns null when previous is null', () => {
    expect(calcDelta(67.5, null)).toBeNull()
  })
  it('returns difference when both present', () => {
    expect(calcDelta(67.5, 68.0)).toBeCloseTo(-0.5, 2)
    expect(calcDelta(68.0, 67.5)).toBeCloseTo(0.5, 2)
  })
})

describe('deltaDirection', () => {
  it('returns "neutral" for null delta', () => {
    expect(deltaDirection(null, 'lower-is-good')).toBe('neutral')
  })
  it('lower-is-good: negative delta is good', () => {
    expect(deltaDirection(-0.5, 'lower-is-good')).toBe('good')
    expect(deltaDirection(0.5, 'lower-is-good')).toBe('bad')
  })
  it('higher-is-good: positive delta is good', () => {
    expect(deltaDirection(0.5, 'higher-is-good')).toBe('good')
    expect(deltaDirection(-0.5, 'higher-is-good')).toBe('bad')
  })
  it('zero delta is neutral', () => {
    expect(deltaDirection(0, 'lower-is-good')).toBe('neutral')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/tests/lib/measurement-delta.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

```typescript
// src/lib/measurement-delta.ts

export type Goal = 'lower-is-good' | 'higher-is-good'
export type Direction = 'good' | 'bad' | 'neutral'

export function calcDelta(current: number | null, previous: number | null): number | null {
  if (current == null || previous == null) return null
  return current - previous
}

export function deltaDirection(delta: number | null, goal: Goal): Direction {
  if (delta == null || delta === 0) return 'neutral'
  if (goal === 'lower-is-good') return delta < 0 ? 'good' : 'bad'
  return delta > 0 ? 'good' : 'bad'
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run src/tests/lib/measurement-delta.test.ts
```

Expected: PASS — 7/7.

- [ ] **Step 5: Commit**

```bash
git add src/lib/measurement-delta.ts src/tests/lib/measurement-delta.test.ts
git commit -m "feat(m3): measurement delta + direction helpers"
```

---

### Task 7: Measurement DB queries

**Files:**
- Create: `src/lib/queries/measurements.ts`

- [ ] **Step 1: Implement (no separate test — covered by API integration tests in Task 11)**

```typescript
// src/lib/queries/measurements.ts
import { and, asc, desc, eq, gte, lte, sql } from 'drizzle-orm'
import type { MySql2Database } from 'drizzle-orm/mysql2'
import * as schema from '@/db/schema'
import { measurements } from '@/db/schema'

type DB = MySql2Database<typeof schema>

export type MeasurementRow = typeof measurements.$inferSelect

export type MeasurementUpsertInput = {
  weekStart: string // YYYY-MM-DD
  weightKg?: number | null
  waistCm?: number | null
  chestCm?: number | null
  thighCm?: number | null
  bicepsCm?: number | null
  targetKcal?: number | null
  targetProteinG?: number | null
  targetCarbsG?: number | null
  targetFatG?: number | null
  targetSugarG?: number | null
  note?: string | null
}

/** Returns rows in ascending weekStart order. */
export async function fetchRange(
  db: DB,
  userId: string,
  fromWeek: string,
  toWeek: string
): Promise<MeasurementRow[]> {
  return db
    .select()
    .from(measurements)
    .where(
      and(
        eq(measurements.userId, userId),
        gte(measurements.weekStart, fromWeek),
        lte(measurements.weekStart, toWeek)
      )
    )
    .orderBy(asc(measurements.weekStart))
}

/** Returns up to `limit` weeks ending at `beforeWeek` (exclusive), descending order. */
export async function fetchOlder(
  db: DB,
  userId: string,
  beforeWeek: string,
  limit: number
): Promise<MeasurementRow[]> {
  return db
    .select()
    .from(measurements)
    .where(
      and(eq(measurements.userId, userId), sql`${measurements.weekStart} < ${beforeWeek}`)
    )
    .orderBy(desc(measurements.weekStart))
    .limit(limit)
}

/**
 * Upserts a measurement row keyed on (userId, weekStart).
 * Returns { affectedRows, id } — affectedRows === 1 on insert, 2 on update.
 */
export async function upsertWeek(
  db: DB,
  userId: string,
  input: MeasurementUpsertInput
): Promise<{ affectedRows: number; id: number }> {
  const decimalCols = ['weightKg', 'waistCm', 'chestCm', 'thighCm', 'bicepsCm'] as const
  const values: Record<string, unknown> = { userId, weekStart: input.weekStart }
  for (const k of decimalCols) {
    if (k in input) values[k] = input[k] == null ? null : String(input[k])
  }
  const intCols = [
    'targetKcal',
    'targetProteinG',
    'targetCarbsG',
    'targetFatG',
    'targetSugarG',
  ] as const
  for (const k of intCols) {
    if (k in input) values[k] = input[k] ?? null
  }
  if ('note' in input) values.note = input.note ?? null
  const updateSet = Object.fromEntries(Object.entries(values).filter(([k]) => k !== 'userId' && k !== 'weekStart'))
  const result = (await db
    .insert(measurements)
    .values(values as typeof measurements.$inferInsert)
    .onDuplicateKeyUpdate({ set: updateSet })) as unknown as [
    { affectedRows: number; insertId: number },
  ]
  const affectedRows = result[0].affectedRows
  let id = result[0].insertId
  if (id === 0) {
    const existing = await db.query.measurements.findFirst({
      where: and(eq(measurements.userId, userId), eq(measurements.weekStart, input.weekStart)),
      columns: { id: true },
    })
    id = existing?.id ?? 0
  }
  return { affectedRows, id }
}

export async function deleteById(
  db: DB,
  userId: string,
  id: number
): Promise<{ deleted: boolean }> {
  const result = (await db
    .delete(measurements)
    .where(and(eq(measurements.id, id), eq(measurements.userId, userId)))) as unknown as [
    { affectedRows: number },
  ]
  return { deleted: result[0].affectedRows > 0 }
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/queries/measurements.ts
git commit -m "feat(m3): measurement DB queries — fetchRange, upsertWeek, deleteById"
```

---

### Task 8: Nutrition DB queries

**Files:**
- Create: `src/lib/queries/nutrition.ts`

- [ ] **Step 1: Implement**

```typescript
// src/lib/queries/nutrition.ts
import { and, asc, eq, gte, lte } from 'drizzle-orm'
import type { MySql2Database } from 'drizzle-orm/mysql2'
import * as schema from '@/db/schema'
import { nutritionDays } from '@/db/schema'

type DB = MySql2Database<typeof schema>

export type NutritionRow = typeof nutritionDays.$inferSelect

export type NutritionUpsertInput = {
  date: string // YYYY-MM-DD
  kcalActual?: number | null
  proteinG?: number | null
  carbsG?: number | null
  fatG?: number | null
  sugarG?: number | null
  note?: string | null
}

export async function fetchRange(
  db: DB,
  userId: string,
  fromDate: string,
  toDate: string
): Promise<NutritionRow[]> {
  return db
    .select()
    .from(nutritionDays)
    .where(
      and(
        eq(nutritionDays.userId, userId),
        gte(nutritionDays.date, fromDate),
        lte(nutritionDays.date, toDate)
      )
    )
    .orderBy(asc(nutritionDays.date))
}

/** First and last date of `monthYYYY-MM` formatted as YYYY-MM-DD. */
export function monthBounds(month: string): { from: string; to: string } {
  const [y, m] = month.split('-').map(Number)
  if (!y || !m) throw new Error(`invalid month: ${month}`)
  const from = `${month}-01`
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate()
  const to = `${month}-${String(last).padStart(2, '0')}`
  return { from, to }
}

export async function upsertDay(
  db: DB,
  userId: string,
  input: NutritionUpsertInput
): Promise<{ affectedRows: number; id: number }> {
  const intCols = ['kcalActual', 'proteinG', 'carbsG', 'fatG', 'sugarG'] as const
  const values: Record<string, unknown> = { userId, date: input.date }
  for (const k of intCols) {
    if (k in input) values[k] = input[k] ?? null
  }
  if ('note' in input) values.note = input.note ?? null
  const updateSet = Object.fromEntries(
    Object.entries(values).filter(([k]) => k !== 'userId' && k !== 'date')
  )
  const result = (await db
    .insert(nutritionDays)
    .values(values as typeof nutritionDays.$inferInsert)
    .onDuplicateKeyUpdate({ set: updateSet })) as unknown as [
    { affectedRows: number; insertId: number },
  ]
  const affectedRows = result[0].affectedRows
  let id = result[0].insertId
  if (id === 0) {
    const existing = await db.query.nutritionDays.findFirst({
      where: and(eq(nutritionDays.userId, userId), eq(nutritionDays.date, input.date)),
      columns: { id: true },
    })
    id = existing?.id ?? 0
  }
  return { affectedRows, id }
}

export async function deleteById(
  db: DB,
  userId: string,
  id: number
): Promise<{ deleted: boolean }> {
  const result = (await db
    .delete(nutritionDays)
    .where(and(eq(nutritionDays.id, id), eq(nutritionDays.userId, userId)))) as unknown as [
    { affectedRows: number },
  ]
  return { deleted: result[0].affectedRows > 0 }
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/queries/nutrition.ts
git commit -m "feat(m3): nutrition DB queries — fetchRange, monthBounds, upsertDay, deleteById"
```

---

### Task 9: User prefs queries (tracked macros)

**Files:**
- Create: `src/lib/queries/user-prefs.ts`

- [ ] **Step 1: Implement**

```typescript
// src/lib/queries/user-prefs.ts
import { eq } from 'drizzle-orm'
import type { MySql2Database } from 'drizzle-orm/mysql2'
import * as schema from '@/db/schema'
import { users } from '@/db/schema'

type DB = MySql2Database<typeof schema>

export const ALL_MACROS = ['kcal', 'protein', 'carbs', 'fat', 'sugar'] as const
export type Macro = (typeof ALL_MACROS)[number]
export const REQUIRED_MACROS: Macro[] = ['kcal', 'protein']

export async function getMacros(db: DB, userId: string): Promise<Macro[]> {
  const row = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { trackedMacros: true },
  })
  const arr = (row?.trackedMacros ?? ['kcal', 'protein']) as string[]
  return arr.filter((m): m is Macro => (ALL_MACROS as readonly string[]).includes(m))
}

/**
 * Sets tracked macros. Always coerces to include kcal + protein.
 * Throws if input contains an unknown macro.
 */
export async function setMacros(db: DB, userId: string, macros: string[]): Promise<Macro[]> {
  for (const m of macros) {
    if (!(ALL_MACROS as readonly string[]).includes(m)) {
      throw new Error(`unknown macro: ${m}`)
    }
  }
  const set = new Set<Macro>([...REQUIRED_MACROS, ...(macros as Macro[])])
  const ordered = ALL_MACROS.filter((m) => set.has(m))
  await db.update(users).set({ trackedMacros: ordered }).where(eq(users.id, userId))
  return ordered
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/queries/user-prefs.ts
git commit -m "feat(m3): user prefs queries — getMacros, setMacros (kcal+protein required)"
```

---

## Phase 2 — API Routes

### Task 10: GET /api/measurements

**Files:**
- Create: `src/app/api/measurements/route.ts` (GET only first; PUT added in Task 11)

- [ ] **Step 1: Implement GET**

```typescript
// src/app/api/measurements/route.ts
import { db } from '@/db/client'
import { getSessionUser } from '@/lib/auth-helpers'
import { fetchRange, fetchOlder } from '@/lib/queries/measurements'
import { toWeekStart, weekRange } from '@/lib/week'

export async function GET(req: Request) {
  const user = await getSessionUser()
  if (!user) return unauth()
  const url = new URL(req.url)
  const beforeWeek = url.searchParams.get('beforeWeek')
  const limit = Math.min(Number(url.searchParams.get('limit') ?? 8), 52)

  if (beforeWeek) {
    const items = await fetchOlder(db, user.id, beforeWeek, limit)
    return Response.json({ items })
  }
  // Default: most recent N weeks ending this week
  const weeks = weekRange(new Date(), limit)
  const items = await fetchRange(db, user.id, weeks[0]!, weeks[weeks.length - 1]!)
  return Response.json({ items })
}

function unauth() {
  return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
}
```

- [ ] **Step 2: Write integration test**

```typescript
// src/tests/api/measurements.test.ts
import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { db } from '@/db/client'
import { measurements, users, xpEvents } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { ulid } from '@/lib/ulid'

const TEST_USER_ID = ulid()

async function seedUser() {
  await db.delete(users).where(eq(users.id, TEST_USER_ID))
  await db.insert(users).values({
    id: TEST_USER_ID,
    email: `m3-test-${TEST_USER_ID}@hexis.test`,
    level: 1,
    trackedMacros: ['kcal', 'protein'],
  })
}

async function clean() {
  await db.delete(xpEvents).where(eq(xpEvents.userId, TEST_USER_ID))
  await db.delete(measurements).where(eq(measurements.userId, TEST_USER_ID))
  await db.delete(users).where(eq(users.id, TEST_USER_ID))
}

beforeEach(async () => {
  await clean()
  await seedUser()
})

afterAll(async () => {
  await clean()
})

// Helper to mock the auth session for these route handlers
import * as authHelpers from '@/lib/auth-helpers'
import { vi } from 'vitest'
vi.spyOn(authHelpers, 'getSessionUser').mockResolvedValue({
  id: TEST_USER_ID,
  email: 'm3-test@hexis.test',
} as never)

import { GET } from '@/app/api/measurements/route'

describe('GET /api/measurements', () => {
  it('returns empty list for new user', async () => {
    const res = await GET(new Request('http://localhost/api/measurements'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.items).toEqual([])
  })

  it('returns measurements within default 8-week window', async () => {
    await db.insert(measurements).values({
      userId: TEST_USER_ID,
      weekStart: '2026-04-13',
      weightKg: '67.5',
    })
    const res = await GET(new Request('http://localhost/api/measurements'))
    const body = await res.json()
    expect(body.items).toHaveLength(1)
    expect(body.items[0].weekStart).toBe('2026-04-13')
  })
})
```

- [ ] **Step 3: Run integration tests**

```bash
docker compose up -d mysql-test
DATABASE_URL=mysql://root:root@127.0.0.1:3308/hexis npm run db:migrate -- --config drizzle-test.config.ts || true
DATABASE_URL=mysql://root:root@127.0.0.1:3308/hexis npx vitest run src/tests/api/measurements.test.ts
```

Expected: PASS — 2/2.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/measurements/route.ts src/tests/api/measurements.test.ts
git commit -m "feat(m3): GET /api/measurements with default 8-week window + cursor"
```

---

### Task 11: PUT /api/measurements (with XP)

**Files:**
- Modify: `src/app/api/measurements/route.ts`
- Modify: `src/tests/api/measurements.test.ts`

- [ ] **Step 1: Add PUT handler**

Append to `src/app/api/measurements/route.ts`:

```typescript
import { z } from 'zod'
import { upsertWeek } from '@/lib/queries/measurements'
import { awardXp } from '@/lib/xp'

const putSchema = z.object({
  weekStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  weightKg: z.number().positive().nullable().optional(),
  waistCm: z.number().positive().nullable().optional(),
  chestCm: z.number().positive().nullable().optional(),
  thighCm: z.number().positive().nullable().optional(),
  bicepsCm: z.number().positive().nullable().optional(),
  targetKcal: z.number().int().min(0).max(10000).nullable().optional(),
  targetProteinG: z.number().int().min(0).max(1000).nullable().optional(),
  targetCarbsG: z.number().int().min(0).max(1000).nullable().optional(),
  targetFatG: z.number().int().min(0).max(1000).nullable().optional(),
  targetSugarG: z.number().int().min(0).max(1000).nullable().optional(),
  note: z.string().max(500).nullable().optional(),
})

export async function PUT(req: Request) {
  const user = await getSessionUser()
  if (!user) return unauth()
  const body = await req.json().catch(() => ({}))
  const parsed = putSchema.safeParse(body)
  if (!parsed.success) return badRequest(parsed.error)

  // Verify weekStart is a Monday
  if (toWeekStart(new Date(`${parsed.data.weekStart}T00:00:00Z`)) !== parsed.data.weekStart) {
    return badRequest({ message: 'weekStart must be a Monday' })
  }

  const { affectedRows, id } = await upsertWeek(db, user.id, parsed.data)
  let xpDelta = 0
  if (affectedRows === 1) {
    const xp = await awardXp({ event: 'measurement_added', db, userId: user.id, meta: { measurementId: id } })
    xpDelta = xp.xpDelta
  }
  return Response.json({ id, xpDelta }, { status: affectedRows === 1 ? 201 : 200 })
}

function badRequest(err: unknown) {
  return new Response(JSON.stringify({ error: 'Invalid body', details: err }), { status: 400 })
}
```

- [ ] **Step 2: Add PUT integration tests**

Append to `src/tests/api/measurements.test.ts`:

```typescript
import { PUT } from '@/app/api/measurements/route'

describe('PUT /api/measurements', () => {
  it('inserts a new week and awards XP', async () => {
    const res = await PUT(
      new Request('http://localhost/api/measurements', {
        method: 'PUT',
        body: JSON.stringify({ weekStart: '2026-04-13', weightKg: 67.5 }),
        headers: { 'content-type': 'application/json' },
      })
    )
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.id).toBeGreaterThan(0)
    expect(body.xpDelta).toBe(20)

    const xp = await db.select().from(xpEvents).where(eq(xpEvents.userId, TEST_USER_ID))
    expect(xp).toHaveLength(1)
    expect(xp[0]!.eventType).toBe('measurement_added')
    expect(xp[0]!.xpDelta).toBe(20)
  })

  it('updates existing week without awarding XP', async () => {
    await PUT(
      new Request('http://localhost/api/measurements', {
        method: 'PUT',
        body: JSON.stringify({ weekStart: '2026-04-13', weightKg: 67.5 }),
        headers: { 'content-type': 'application/json' },
      })
    )
    const res = await PUT(
      new Request('http://localhost/api/measurements', {
        method: 'PUT',
        body: JSON.stringify({ weekStart: '2026-04-13', weightKg: 67.4 }),
        headers: { 'content-type': 'application/json' },
      })
    )
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.xpDelta).toBe(0)
  })

  it('rejects non-Monday weekStart', async () => {
    const res = await PUT(
      new Request('http://localhost/api/measurements', {
        method: 'PUT',
        body: JSON.stringify({ weekStart: '2026-04-15', weightKg: 67.5 }),
        headers: { 'content-type': 'application/json' },
      })
    )
    expect(res.status).toBe(400)
  })
})
```

- [ ] **Step 3: Run integration tests**

```bash
DATABASE_URL=mysql://root:root@127.0.0.1:3308/hexis npx vitest run src/tests/api/measurements.test.ts
```

Expected: PASS — 5/5. Adjust the `xp` assertion in the first PUT test based on the actual `awardXp` behavior (it may insert exactly one event row per call — verify with a console.log if uncertain).

- [ ] **Step 4: Commit**

```bash
git add src/app/api/measurements/route.ts src/tests/api/measurements.test.ts
git commit -m "feat(m3): PUT /api/measurements upsert with XP on insert"
```

---

### Task 12: DELETE /api/measurements/[id]

**Files:**
- Create: `src/app/api/measurements/[id]/route.ts`

- [ ] **Step 1: Implement**

```typescript
// src/app/api/measurements/[id]/route.ts
import { and, eq } from 'drizzle-orm'
import { db } from '@/db/client'
import { measurements } from '@/db/schema'
import { getSessionUser } from '@/lib/auth-helpers'
import { deleteById } from '@/lib/queries/measurements'
import { reverseXp } from '@/lib/xp'

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser()
  if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  const { id: idStr } = await params
  const id = Number(idStr)
  if (!Number.isInteger(id) || id <= 0) {
    return new Response(JSON.stringify({ error: 'Invalid id' }), { status: 400 })
  }
  const row = await db.query.measurements.findFirst({
    where: and(eq(measurements.id, id), eq(measurements.userId, user.id)),
    columns: { id: true },
  })
  if (!row) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 })
  const { deleted } = await deleteById(db, user.id, id)
  if (!deleted) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 })
  await reverseXp({ event: 'measurement_added', db, userId: user.id, sessionId: null, meta: { deletedMeasurementId: id } })
  return new Response(null, { status: 204 })
}
```

- [ ] **Step 2: Add DELETE integration test**

Append to `src/tests/api/measurements.test.ts`:

```typescript
import { DELETE } from '@/app/api/measurements/[id]/route'

describe('DELETE /api/measurements/[id]', () => {
  it('deletes and reverses XP', async () => {
    const putRes = await PUT(
      new Request('http://localhost/api/measurements', {
        method: 'PUT',
        body: JSON.stringify({ weekStart: '2026-04-13', weightKg: 67.5 }),
        headers: { 'content-type': 'application/json' },
      })
    )
    const { id } = await putRes.json()
    const res = await DELETE(new Request(`http://localhost/api/measurements/${id}`, { method: 'DELETE' }), {
      params: Promise.resolve({ id: String(id) }),
    })
    expect(res.status).toBe(204)
    const remaining = await db.select().from(measurements).where(eq(measurements.userId, TEST_USER_ID))
    expect(remaining).toHaveLength(0)
    // Net XP should be 0 (award +20, reversal -20)
    const xp = await db.select().from(xpEvents).where(eq(xpEvents.userId, TEST_USER_ID))
    const sum = xp.reduce((acc, e) => acc + e.xpDelta, 0)
    expect(sum).toBe(0)
  })
  it('returns 404 for foreign id', async () => {
    const res = await DELETE(new Request('http://localhost/api/measurements/999999', { method: 'DELETE' }), {
      params: Promise.resolve({ id: '999999' }),
    })
    expect(res.status).toBe(404)
  })
})
```

- [ ] **Step 3: Run integration tests**

```bash
DATABASE_URL=mysql://root:root@127.0.0.1:3308/hexis npx vitest run src/tests/api/measurements.test.ts
```

Expected: PASS — 7/7.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/measurements/\[id\]/route.ts src/tests/api/measurements.test.ts
git commit -m "feat(m3): DELETE /api/measurements/[id] with XP reversal"
```

---

### Task 13: GET /api/nutrition

**Files:**
- Create: `src/app/api/nutrition/route.ts` (GET only first)
- Create: `src/tests/api/nutrition.test.ts`

- [ ] **Step 1: Implement GET**

```typescript
// src/app/api/nutrition/route.ts
import { db } from '@/db/client'
import { getSessionUser } from '@/lib/auth-helpers'
import { fetchRange, monthBounds } from '@/lib/queries/nutrition'

export async function GET(req: Request) {
  const user = await getSessionUser()
  if (!user) return unauth()
  const url = new URL(req.url)
  const month = url.searchParams.get('month')
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return new Response(JSON.stringify({ error: 'month=YYYY-MM required' }), { status: 400 })
  }
  const { from, to } = monthBounds(month)
  const items = await fetchRange(db, user.id, from, to)
  return Response.json({ items })
}

function unauth() {
  return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
}
```

- [ ] **Step 2: Write GET integration test**

```typescript
// src/tests/api/nutrition.test.ts
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { eq } from 'drizzle-orm'
import { db } from '@/db/client'
import { nutritionDays, users, xpEvents } from '@/db/schema'
import { ulid } from '@/lib/ulid'

const TEST_USER_ID = ulid()

import * as authHelpers from '@/lib/auth-helpers'
vi.spyOn(authHelpers, 'getSessionUser').mockResolvedValue({
  id: TEST_USER_ID,
  email: 'm3-nut@hexis.test',
} as never)

async function seedUser() {
  await db.delete(users).where(eq(users.id, TEST_USER_ID))
  await db.insert(users).values({
    id: TEST_USER_ID,
    email: `m3-nut-${TEST_USER_ID}@hexis.test`,
    level: 1,
    trackedMacros: ['kcal', 'protein'],
  })
}

async function clean() {
  await db.delete(xpEvents).where(eq(xpEvents.userId, TEST_USER_ID))
  await db.delete(nutritionDays).where(eq(nutritionDays.userId, TEST_USER_ID))
  await db.delete(users).where(eq(users.id, TEST_USER_ID))
}

beforeEach(async () => {
  await clean()
  await seedUser()
})
afterAll(async () => {
  await clean()
})

import { GET } from '@/app/api/nutrition/route'

describe('GET /api/nutrition', () => {
  it('rejects without month query', async () => {
    const res = await GET(new Request('http://localhost/api/nutrition'))
    expect(res.status).toBe(400)
  })
  it('returns items within month bounds', async () => {
    await db.insert(nutritionDays).values([
      { userId: TEST_USER_ID, date: '2026-04-01', kcalActual: 2000 },
      { userId: TEST_USER_ID, date: '2026-04-30', kcalActual: 2100 },
      { userId: TEST_USER_ID, date: '2026-03-31', kcalActual: 1900 }, // outside
    ])
    const res = await GET(new Request('http://localhost/api/nutrition?month=2026-04'))
    const body = await res.json()
    expect(body.items).toHaveLength(2)
  })
})
```

- [ ] **Step 3: Run tests**

```bash
DATABASE_URL=mysql://root:root@127.0.0.1:3308/hexis npx vitest run src/tests/api/nutrition.test.ts
```

Expected: PASS — 2/2.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/nutrition/route.ts src/tests/api/nutrition.test.ts
git commit -m "feat(m3): GET /api/nutrition?month=YYYY-MM"
```

---

### Task 14: PUT /api/nutrition (with XP)

**Files:**
- Modify: `src/app/api/nutrition/route.ts`
- Modify: `src/tests/api/nutrition.test.ts`

- [ ] **Step 1: Add PUT handler**

Append to `src/app/api/nutrition/route.ts`:

```typescript
import { z } from 'zod'
import { upsertDay } from '@/lib/queries/nutrition'
import { awardXp } from '@/lib/xp'

const putSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  kcalActual: z.number().int().min(0).max(15000).nullable().optional(),
  proteinG: z.number().int().min(0).max(2000).nullable().optional(),
  carbsG: z.number().int().min(0).max(2000).nullable().optional(),
  fatG: z.number().int().min(0).max(1000).nullable().optional(),
  sugarG: z.number().int().min(0).max(2000).nullable().optional(),
  note: z.string().max(500).nullable().optional(),
})

export async function PUT(req: Request) {
  const user = await getSessionUser()
  if (!user) return unauth()
  const body = await req.json().catch(() => ({}))
  const parsed = putSchema.safeParse(body)
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: 'Invalid body', details: parsed.error }), { status: 400 })
  }
  const { affectedRows, id } = await upsertDay(db, user.id, parsed.data)
  let xpDelta = 0
  if (affectedRows === 1) {
    const xp = await awardXp({ event: 'nutrition_logged', db, userId: user.id, meta: { nutritionId: id } })
    xpDelta = xp.xpDelta
  }
  return Response.json({ id, xpDelta }, { status: affectedRows === 1 ? 201 : 200 })
}
```

- [ ] **Step 2: Add PUT integration tests**

Append to `src/tests/api/nutrition.test.ts`:

```typescript
import { PUT } from '@/app/api/nutrition/route'

describe('PUT /api/nutrition', () => {
  it('inserts a new day and awards 10 XP', async () => {
    const res = await PUT(
      new Request('http://localhost/api/nutrition', {
        method: 'PUT',
        body: JSON.stringify({ date: '2026-04-15', kcalActual: 1800, proteinG: 140 }),
        headers: { 'content-type': 'application/json' },
      })
    )
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.xpDelta).toBe(10)
  })

  it('updates existing day without XP', async () => {
    await PUT(
      new Request('http://localhost/api/nutrition', {
        method: 'PUT',
        body: JSON.stringify({ date: '2026-04-15', kcalActual: 1800 }),
        headers: { 'content-type': 'application/json' },
      })
    )
    const res = await PUT(
      new Request('http://localhost/api/nutrition', {
        method: 'PUT',
        body: JSON.stringify({ date: '2026-04-15', kcalActual: 1900 }),
        headers: { 'content-type': 'application/json' },
      })
    )
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.xpDelta).toBe(0)
  })
})
```

- [ ] **Step 3: Run tests**

```bash
DATABASE_URL=mysql://root:root@127.0.0.1:3308/hexis npx vitest run src/tests/api/nutrition.test.ts
```

Expected: PASS — 4/4.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/nutrition/route.ts src/tests/api/nutrition.test.ts
git commit -m "feat(m3): PUT /api/nutrition upsert with XP on insert"
```

---

### Task 15: DELETE /api/nutrition/[id]

**Files:**
- Create: `src/app/api/nutrition/[id]/route.ts`
- Modify: `src/tests/api/nutrition.test.ts`

- [ ] **Step 1: Implement**

```typescript
// src/app/api/nutrition/[id]/route.ts
import { and, eq } from 'drizzle-orm'
import { db } from '@/db/client'
import { nutritionDays } from '@/db/schema'
import { getSessionUser } from '@/lib/auth-helpers'
import { deleteById } from '@/lib/queries/nutrition'
import { reverseXp } from '@/lib/xp'

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser()
  if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  const { id: idStr } = await params
  const id = Number(idStr)
  if (!Number.isInteger(id) || id <= 0) {
    return new Response(JSON.stringify({ error: 'Invalid id' }), { status: 400 })
  }
  const row = await db.query.nutritionDays.findFirst({
    where: and(eq(nutritionDays.id, id), eq(nutritionDays.userId, user.id)),
    columns: { id: true },
  })
  if (!row) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 })
  const { deleted } = await deleteById(db, user.id, id)
  if (!deleted) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 })
  await reverseXp({ event: 'nutrition_logged', db, userId: user.id, sessionId: null, meta: { deletedNutritionId: id } })
  return new Response(null, { status: 204 })
}
```

- [ ] **Step 2: Add DELETE test**

Append to `src/tests/api/nutrition.test.ts`:

```typescript
import { DELETE } from '@/app/api/nutrition/[id]/route'

describe('DELETE /api/nutrition/[id]', () => {
  it('deletes and reverses XP', async () => {
    const putRes = await PUT(
      new Request('http://localhost/api/nutrition', {
        method: 'PUT',
        body: JSON.stringify({ date: '2026-04-15', kcalActual: 1800 }),
        headers: { 'content-type': 'application/json' },
      })
    )
    const { id } = await putRes.json()
    const res = await DELETE(new Request(`http://localhost/api/nutrition/${id}`, { method: 'DELETE' }), {
      params: Promise.resolve({ id: String(id) }),
    })
    expect(res.status).toBe(204)
    const xp = await db.select().from(xpEvents).where(eq(xpEvents.userId, TEST_USER_ID))
    const sum = xp.reduce((acc, e) => acc + e.xpDelta, 0)
    expect(sum).toBe(0)
  })
})
```

- [ ] **Step 3: Run tests and commit**

```bash
DATABASE_URL=mysql://root:root@127.0.0.1:3308/hexis npx vitest run src/tests/api/nutrition.test.ts
```

Expected: PASS — 5/5.

```bash
git add src/app/api/nutrition/\[id\]/route.ts src/tests/api/nutrition.test.ts
git commit -m "feat(m3): DELETE /api/nutrition/[id] with XP reversal"
```

---

### Task 16: GET + PUT /api/user/macros

**Files:**
- Create: `src/app/api/user/macros/route.ts`
- Create: `src/tests/api/user-macros.test.ts`

- [ ] **Step 1: Implement**

```typescript
// src/app/api/user/macros/route.ts
import { z } from 'zod'
import { db } from '@/db/client'
import { getSessionUser } from '@/lib/auth-helpers'
import { ALL_MACROS, getMacros, setMacros } from '@/lib/queries/user-prefs'

export async function GET() {
  const user = await getSessionUser()
  if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  const macros = await getMacros(db, user.id)
  return Response.json({ macros })
}

const putSchema = z.object({
  macros: z.array(z.enum(ALL_MACROS)),
})

export async function PUT(req: Request) {
  const user = await getSessionUser()
  if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  const body = await req.json().catch(() => ({}))
  const parsed = putSchema.safeParse(body)
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: 'Invalid body', details: parsed.error }), { status: 400 })
  }
  const macros = await setMacros(db, user.id, parsed.data.macros)
  return Response.json({ macros })
}
```

- [ ] **Step 2: Tests**

```typescript
// src/tests/api/user-macros.test.ts
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { eq } from 'drizzle-orm'
import { db } from '@/db/client'
import { users } from '@/db/schema'
import { ulid } from '@/lib/ulid'

const TEST_USER_ID = ulid()

import * as authHelpers from '@/lib/auth-helpers'
vi.spyOn(authHelpers, 'getSessionUser').mockResolvedValue({
  id: TEST_USER_ID,
  email: 'macros@hexis.test',
} as never)

beforeEach(async () => {
  await db.delete(users).where(eq(users.id, TEST_USER_ID))
  await db.insert(users).values({
    id: TEST_USER_ID,
    email: `macros-${TEST_USER_ID}@hexis.test`,
    level: 1,
    trackedMacros: ['kcal', 'protein'],
  })
})
afterAll(async () => {
  await db.delete(users).where(eq(users.id, TEST_USER_ID))
})

import { GET, PUT } from '@/app/api/user/macros/route'

describe('GET /api/user/macros', () => {
  it('returns default kcal+protein for new user', async () => {
    const res = await GET()
    const body = await res.json()
    expect(body.macros).toEqual(['kcal', 'protein'])
  })
})

describe('PUT /api/user/macros', () => {
  it('always coerces required macros into the result', async () => {
    const res = await PUT(
      new Request('http://localhost/api/user/macros', {
        method: 'PUT',
        body: JSON.stringify({ macros: ['carbs'] }),
        headers: { 'content-type': 'application/json' },
      })
    )
    const body = await res.json()
    expect(body.macros).toContain('kcal')
    expect(body.macros).toContain('protein')
    expect(body.macros).toContain('carbs')
  })
  it('rejects unknown macro', async () => {
    const res = await PUT(
      new Request('http://localhost/api/user/macros', {
        method: 'PUT',
        body: JSON.stringify({ macros: ['vitamins'] }),
        headers: { 'content-type': 'application/json' },
      })
    )
    expect(res.status).toBe(400)
  })
})
```

- [ ] **Step 3: Run tests**

```bash
DATABASE_URL=mysql://root:root@127.0.0.1:3308/hexis npx vitest run src/tests/api/user-macros.test.ts
```

Expected: PASS — 3/3.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/user/macros/route.ts src/tests/api/user-macros.test.ts
git commit -m "feat(m3): GET+PUT /api/user/macros"
```

---

## Phase 3 — UI Primitives

### Task 17: Sparkline component

**Files:**
- Create: `src/components/ui/Sparkline.tsx`

- [ ] **Step 1: Implement**

```tsx
// src/components/ui/Sparkline.tsx
import { sparklinePath } from '@/lib/sparkline'

type Props = {
  values: (number | null)[]
  width?: number
  height?: number
  color?: string
  showEndDot?: boolean
  className?: string
}

export function Sparkline({
  values,
  width = 120,
  height = 32,
  color = 'currentColor',
  showEndDot = true,
  className,
}: Props) {
  const path = sparklinePath(values, width, height)
  if (!path) return <svg width={width} height={height} className={className} aria-hidden />
  // Find last non-null index for end dot
  let endIdx = -1
  for (let i = values.length - 1; i >= 0; i--) {
    if (values[i] != null) {
      endIdx = i
      break
    }
  }
  const stepX = values.length > 1 ? width / (values.length - 1) : 0
  const endX = endIdx * stepX
  const nums = values.filter((v): v is number => v != null)
  const min = Math.min(...nums)
  const max = Math.max(...nums)
  const range = max - min || 1
  const endY = height - ((values[endIdx] as number) - min) / range * height
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      aria-hidden
    >
      <path d={path} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      {showEndDot && endIdx >= 0 && <circle cx={endX} cy={endY} r={3} fill={color} />}
    </svg>
  )
}
```

- [ ] **Step 2: Type-check + commit**

```bash
npx tsc --noEmit
git add src/components/ui/Sparkline.tsx
git commit -m "feat(m3): Sparkline UI component"
```

---

### Task 18: SegmentControl component

**Files:**
- Create: `src/components/ui/SegmentControl.tsx`

- [ ] **Step 1: Implement**

```tsx
// src/components/ui/SegmentControl.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

type Segment = {
  href: string
  label: string
}

type Props = {
  segments: Segment[]
  active: string // matches segment.href
}

export function SegmentControl({ segments, active }: Props) {
  return (
    <div
      role="tablist"
      className="flex gap-1 rounded-lg bg-[#141a22] p-1"
    >
      {segments.map((s) => {
        const isActive = s.href === active
        return (
          <Link
            key={s.href}
            href={s.href}
            role="tab"
            aria-selected={isActive}
            className={
              'flex-1 text-center rounded-md px-3 py-2 text-sm transition-colors ' +
              (isActive
                ? 'bg-[#10b981] text-[#0a0e14] font-semibold'
                : 'text-[#6b7280] hover:text-[#e5e7eb]')
            }
          >
            {s.label}
          </Link>
        )
      })}
    </div>
  )
}

/** Convenience wrapper for /progress segment control — auto-detects active path. */
export function ProgressSegmentControl() {
  const pathname = usePathname()
  const active = pathname?.startsWith('/progress/nutrition') ? '/progress/nutrition' : '/progress/body'
  return (
    <SegmentControl
      segments={[
        { href: '/progress/body', label: 'Tělo' },
        { href: '/progress/nutrition', label: 'Výživa' },
      ]}
      active={active}
    />
  )
}
```

- [ ] **Step 2: Type-check + commit**

```bash
npx tsc --noEmit
git add src/components/ui/SegmentControl.tsx
git commit -m "feat(m3): SegmentControl primitive"
```

---

### Task 19: ProgressBar component

**Files:**
- Create: `src/components/ui/ProgressBar.tsx`

- [ ] **Step 1: Implement**

```tsx
// src/components/ui/ProgressBar.tsx
type Tone = 'primary' | 'success' | 'warn' | 'danger' | 'muted'

type Props = {
  value: number | null
  max: number | null
  height?: number
  tone?: Tone
  className?: string
}

const TONE: Record<Tone, string> = {
  primary: '#10b981',
  success: '#10b981',
  warn: '#f59e0b',
  danger: '#ef4444',
  muted: '#6b7280',
}

export function ProgressBar({ value, max, height = 8, tone = 'primary', className }: Props) {
  const pct = value != null && max != null && max > 0 ? Math.min((value / max) * 100, 100) : 0
  return (
    <div
      className={'overflow-hidden rounded-full bg-[#1f2733] ' + (className ?? '')}
      style={{ height }}
      role="progressbar"
      aria-valuenow={value ?? undefined}
      aria-valuemax={max ?? undefined}
    >
      <div
        className="h-full rounded-full transition-[width] duration-200"
        style={{ width: `${pct}%`, background: TONE[tone] }}
      />
    </div>
  )
}
```

- [ ] **Step 2: Type-check + commit**

```bash
npx tsc --noEmit
git add src/components/ui/ProgressBar.tsx
git commit -m "feat(m3): ProgressBar primitive"
```

---

### Task 20: Switch component

**Files:**
- Create: `src/components/ui/Switch.tsx`

- [ ] **Step 1: Implement**

```tsx
// src/components/ui/Switch.tsx
'use client'

type Props = {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  label?: string
  id?: string
}

export function Switch({ checked, onChange, disabled, label, id }: Props) {
  return (
    <button
      type="button"
      id={id}
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={
        'relative inline-flex h-6 w-10 items-center rounded-full transition-colors ' +
        (disabled ? 'opacity-50 cursor-not-allowed ' : 'cursor-pointer ') +
        (checked ? 'bg-[#10b981]' : 'bg-[#1f2733]')
      }
    >
      <span
        className={
          'inline-block h-4 w-4 transform rounded-full bg-white transition-transform ' +
          (checked ? 'translate-x-5' : 'translate-x-1')
        }
      />
    </button>
  )
}
```

- [ ] **Step 2: Type-check + commit**

```bash
npx tsc --noEmit
git add src/components/ui/Switch.tsx
git commit -m "feat(m3): Switch primitive"
```

---

## Phase 4 — Settings: Macros

### Task 21: /settings/macros page

**Files:**
- Create: `src/app/(app)/settings/macros/page.tsx`

- [ ] **Step 1: Implement**

```tsx
// src/app/(app)/settings/macros/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { Switch } from '@/components/ui/Switch'

const ALL: { key: string; label: string; required?: boolean }[] = [
  { key: 'kcal', label: 'Kalorie', required: true },
  { key: 'protein', label: 'Protein', required: true },
  { key: 'carbs', label: 'Sacharidy' },
  { key: 'fat', label: 'Tuky' },
  { key: 'sugar', label: 'Cukry' },
]

export default function MacrosPage() {
  const [macros, setMacros] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/user/macros')
      .then((r) => r.json())
      .then((data) => {
        setMacros(data.macros)
        setLoading(false)
      })
  }, [])

  async function toggle(key: string) {
    if (key === 'kcal' || key === 'protein') return
    setSaving(true)
    const next = macros.includes(key) ? macros.filter((m) => m !== key) : [...macros, key]
    const res = await fetch('/api/user/macros', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ macros: next }),
    })
    if (res.ok) {
      const data = await res.json()
      setMacros(data.macros)
    }
    setSaving(false)
  }

  if (loading) return <div className="p-4 text-[#6b7280]">Načítání…</div>

  return (
    <div className="space-y-4 p-4">
      <h1 className="text-xl font-semibold">Sledovaná makra</h1>
      <p className="text-sm text-[#6b7280]">Kalorie a protein jsou vždy zapnuté.</p>
      <ul className="space-y-2">
        {ALL.map((m) => (
          <li
            key={m.key}
            className="flex items-center justify-between rounded-lg border border-[#1f2733] bg-[#141a22] p-3"
          >
            <span className="text-[#e5e7eb]">{m.label}</span>
            <Switch
              checked={macros.includes(m.key)}
              disabled={m.required || saving}
              onChange={() => toggle(m.key)}
              label={m.label}
            />
          </li>
        ))}
      </ul>
    </div>
  )
}
```

- [ ] **Step 2: Type-check + commit**

```bash
npx tsc --noEmit
git add 'src/app/(app)/settings/macros/page.tsx'
git commit -m "feat(m3): /settings/macros page"
```

---

## Phase 5 — Measurements UI

### Task 22: SparklineCard component

**Files:**
- Create: `src/components/measurements/SparklineCard.tsx`

- [ ] **Step 1: Implement**

```tsx
// src/components/measurements/SparklineCard.tsx
import { Sparkline } from '@/components/ui/Sparkline'
import type { Goal, Direction } from '@/lib/measurement-delta'
import { calcDelta, deltaDirection } from '@/lib/measurement-delta'

const COLOR: Record<Direction, string> = {
  good: '#10b981',
  bad: '#ef4444',
  neutral: '#6b7280',
}

type Props = {
  label: string
  values: (number | null)[]
  goal: Goal
  unit?: string
  precision?: number
}

export function SparklineCard({ label, values, goal, unit, precision = 1 }: Props) {
  // Find last and second-to-last non-null
  const nonNull = values
    .map((v, i) => ({ v, i }))
    .filter((p): p is { v: number; i: number } => p.v != null)
  const last = nonNull[nonNull.length - 1]?.v ?? null
  const prev = nonNull[nonNull.length - 2]?.v ?? null
  const delta = calcDelta(last, prev)
  const direction = deltaDirection(delta, goal)
  const color = COLOR[direction]
  const sign = delta == null ? '—' : delta > 0 ? `+${delta.toFixed(precision)}` : delta.toFixed(precision)
  return (
    <div className="min-w-[140px] rounded-lg border border-[#1f2733] bg-[#141a22] p-3">
      <div className="text-xs text-[#6b7280]">{label}</div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-xl font-bold text-[#e5e7eb]">
          {last == null ? '—' : last.toFixed(precision)}
        </span>
        <span className="text-xs" style={{ color }}>
          {sign}
        </span>
      </div>
      <Sparkline values={values} width={120} height={32} color={color} className="mt-1.5 block" />
      {unit && <div className="text-[10px] text-[#6b7280]">{unit}</div>}
    </div>
  )
}
```

- [ ] **Step 2: Type-check + commit**

```bash
npx tsc --noEmit
git add src/components/measurements/SparklineCard.tsx
git commit -m "feat(m3): SparklineCard with delta + colored sparkline"
```

---

### Task 23: MeasurementCell + MeasurementRow components

**Files:**
- Create: `src/components/measurements/MeasurementCell.tsx`
- Create: `src/components/measurements/MeasurementRow.tsx`

- [ ] **Step 1: Implement MeasurementCell**

```tsx
// src/components/measurements/MeasurementCell.tsx
'use client'

import { useState, useRef, useEffect } from 'react'

type Props = {
  value: number | null
  precision: number
  align?: 'left' | 'right'
  onCommit: (value: number | null) => Promise<void>
}

export function MeasurementCell({ value, precision, align = 'right', onCommit }: Props) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<string>(value == null ? '' : value.toFixed(precision))
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setDraft(value == null ? '' : value.toFixed(precision))
  }, [value, precision])

  useEffect(() => {
    if (editing) inputRef.current?.focus()
  }, [editing])

  async function commit() {
    setEditing(false)
    const trimmed = draft.trim()
    const next = trimmed === '' ? null : Number(trimmed)
    if (next != null && Number.isNaN(next)) return
    if (next === value) return
    await onCommit(next)
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className={
          'block w-full rounded px-1 py-1 text-sm hover:bg-[#1f2733] ' +
          (align === 'right' ? 'text-right ' : 'text-left ') +
          (value == null ? 'text-[#6b7280]' : 'text-[#e5e7eb]')
        }
      >
        {value == null ? '—' : value.toFixed(precision)}
      </button>
    )
  }

  return (
    <input
      ref={inputRef}
      type="number"
      inputMode="decimal"
      step={1 / Math.pow(10, precision)}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => void commit()}
      onKeyDown={(e) => {
        if (e.key === 'Enter') void commit()
        if (e.key === 'Escape') {
          setDraft(value == null ? '' : value.toFixed(precision))
          setEditing(false)
        }
      }}
      className={
        'block w-full rounded border border-[#10b981] bg-[#0a0e14] px-1 py-1 text-sm text-[#e5e7eb] outline-none ' +
        (align === 'right' ? 'text-right' : 'text-left')
      }
    />
  )
}
```

- [ ] **Step 2: Implement MeasurementRow**

```tsx
// src/components/measurements/MeasurementRow.tsx
'use client'

import { useState } from 'react'
import { MeasurementCell } from './MeasurementCell'
import { calcDelta, deltaDirection } from '@/lib/measurement-delta'

export type MeasurementValues = {
  weightKg: number | null
  waistCm: number | null
  chestCm: number | null
  thighCm: number | null
  bicepsCm: number | null
  targetKcal: number | null
  note: string | null
}

type Props = {
  weekStart: string // YYYY-MM-DD
  isCurrent: boolean
  values: MeasurementValues
  prevWeightKg: number | null
  onCommitValue: (key: keyof MeasurementValues, value: number | null) => Promise<void>
  onCommitNote: (note: string | null) => Promise<void>
}

const DELTA_COLOR = {
  good: '#10b981',
  bad: '#ef4444',
  neutral: '#6b7280',
}

export function MeasurementRow({
  weekStart,
  isCurrent,
  values,
  prevWeightKg,
  onCommitValue,
  onCommitNote,
}: Props) {
  const [showNote, setShowNote] = useState(false)
  const [draftNote, setDraftNote] = useState(values.note ?? '')
  const delta = calcDelta(values.weightKg, prevWeightKg)
  const dir = deltaDirection(delta, 'lower-is-good')
  const dateLabel = formatWeekLabel(weekStart)

  return (
    <>
      <tr className={isCurrent ? 'border-b border-[#1f2733] bg-[#141a22]' : 'border-b border-[#1f2733]'}>
        <td
          className={
            'whitespace-nowrap px-1.5 py-2.5 text-xs ' +
            (isCurrent ? 'font-semibold text-[#10b981]' : 'text-[#6b7280]')
          }
        >
          <button onClick={() => setShowNote((s) => !s)}>{dateLabel}</button>
        </td>
        <td className="px-1.5 py-2.5">
          <MeasurementCell
            value={values.weightKg}
            precision={2}
            onCommit={(v) => onCommitValue('weightKg', v)}
          />
        </td>
        <td className="px-1.5 py-2.5 text-right text-xs" style={{ color: DELTA_COLOR[dir] }}>
          {delta == null ? '—' : delta > 0 ? `+${delta.toFixed(2)}` : delta.toFixed(2)}
        </td>
        <td className="px-1.5 py-2.5">
          <MeasurementCell value={values.waistCm} precision={1} onCommit={(v) => onCommitValue('waistCm', v)} />
        </td>
        <td className="px-1.5 py-2.5">
          <MeasurementCell value={values.chestCm} precision={1} onCommit={(v) => onCommitValue('chestCm', v)} />
        </td>
        <td className="px-1.5 py-2.5">
          <MeasurementCell value={values.thighCm} precision={1} onCommit={(v) => onCommitValue('thighCm', v)} />
        </td>
        <td className="px-1.5 py-2.5">
          <MeasurementCell value={values.bicepsCm} precision={1} onCommit={(v) => onCommitValue('bicepsCm', v)} />
        </td>
        <td className="px-1.5 py-2.5">
          <MeasurementCell
            value={values.targetKcal}
            precision={0}
            align="right"
            onCommit={(v) => onCommitValue('targetKcal', v)}
          />
        </td>
      </tr>
      {showNote && (
        <tr className="border-b border-[#1f2733]">
          <td colSpan={8} className="px-3 py-2">
            <textarea
              value={draftNote}
              onChange={(e) => setDraftNote(e.target.value)}
              onBlur={() => void onCommitNote(draftNote.trim() === '' ? null : draftNote)}
              placeholder="Poznámka k týdnu…"
              className="w-full rounded border border-[#1f2733] bg-[#0a0e14] p-2 text-sm text-[#e5e7eb] outline-none"
              rows={2}
            />
          </td>
        </tr>
      )}
    </>
  )
}

function formatWeekLabel(weekStart: string): string {
  const [, m, d] = weekStart.split('-').map(Number)
  return `${d}. ${m}.`
}
```

- [ ] **Step 3: Type-check + commit**

```bash
npx tsc --noEmit
git add src/components/measurements/MeasurementCell.tsx src/components/measurements/MeasurementRow.tsx
git commit -m "feat(m3): MeasurementCell (inline edit) + MeasurementRow (with note expand)"
```

---

### Task 24: MeasurementGrid (table wrapper with lazy load)

**Files:**
- Create: `src/components/measurements/MeasurementGrid.tsx`

- [ ] **Step 1: Implement**

```tsx
// src/components/measurements/MeasurementGrid.tsx
'use client'

import { useCallback, useMemo, useState } from 'react'
import { MeasurementRow, type MeasurementValues } from './MeasurementRow'
import { toWeekStart, weekRange } from '@/lib/week'

type ApiRow = {
  id: number
  weekStart: string
  weightKg: string | null
  waistCm: string | null
  chestCm: string | null
  thighCm: string | null
  bicepsCm: string | null
  targetKcal: number | null
  note: string | null
}

type Props = {
  initialRows: ApiRow[]
}

const HEADERS = ['Týden', 'Váha', 'Δ', 'Pas', 'Hrudník', 'Stehno', 'Biceps', 'kcal cíl']

export function MeasurementGrid({ initialRows }: Props) {
  const [rows, setRows] = useState<ApiRow[]>(initialRows)
  const [loadingMore, setLoadingMore] = useState(false)
  const [done, setDone] = useState(false)
  const todayWeek = toWeekStart(new Date())

  // Build display set: 8 most recent weeks (by weekStart desc)
  const displayWeeks = useMemo(() => {
    const set = new Set(rows.map((r) => r.weekStart))
    weekRange(new Date(), 8).forEach((w) => set.add(w))
    return Array.from(set).sort((a, b) => (a < b ? 1 : -1))
  }, [rows])

  const byWeek = useMemo(() => new Map(rows.map((r) => [r.weekStart, r])), [rows])

  const upsert = useCallback(
    async (weekStart: string, patch: Partial<MeasurementValues>) => {
      const existing = byWeek.get(weekStart)
      const merged: Record<string, unknown> = { weekStart }
      for (const [k, v] of Object.entries(patch)) merged[k] = v
      const res = await fetch('/api/measurements', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(merged),
      })
      if (!res.ok) return
      const body = (await res.json()) as { id: number }
      const next: ApiRow = {
        id: existing?.id ?? body.id,
        weekStart,
        weightKg: existing?.weightKg ?? null,
        waistCm: existing?.waistCm ?? null,
        chestCm: existing?.chestCm ?? null,
        thighCm: existing?.thighCm ?? null,
        bicepsCm: existing?.bicepsCm ?? null,
        targetKcal: existing?.targetKcal ?? null,
        note: existing?.note ?? null,
      }
      for (const [k, v] of Object.entries(patch)) {
        if (k === 'note') {
          next.note = v as string | null
        } else if (k === 'targetKcal') {
          next.targetKcal = v as number | null
        } else {
          ;(next as Record<string, unknown>)[k] = v == null ? null : String(v)
        }
      }
      setRows((prev) => {
        const filtered = prev.filter((r) => r.weekStart !== weekStart)
        return [...filtered, next].sort((a, b) => (a.weekStart < b.weekStart ? 1 : -1))
      })
    },
    [byWeek]
  )

  async function loadMore() {
    if (loadingMore || done) return
    setLoadingMore(true)
    const oldest = rows[rows.length - 1]?.weekStart ?? todayWeek
    const res = await fetch(`/api/measurements?beforeWeek=${oldest}&limit=8`)
    const body = (await res.json()) as { items: ApiRow[] }
    if (body.items.length === 0) setDone(true)
    setRows((prev) => [...prev, ...body.items])
    setLoadingMore(false)
  }

  return (
    <div className="overflow-x-auto p-4">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-[#1f2733]">
            {HEADERS.map((h) => (
              <th
                key={h}
                className="px-1.5 py-2 text-right text-[11px] font-medium text-[#6b7280] first:text-left"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {displayWeeks.map((weekStart) => {
            const r = byWeek.get(weekStart)
            const idx = displayWeeks.indexOf(weekStart)
            const prevWeekStart = displayWeeks[idx + 1] // next in desc order = earlier week
            const prev = prevWeekStart ? byWeek.get(prevWeekStart) : undefined
            const values: MeasurementValues = {
              weightKg: r?.weightKg ? Number(r.weightKg) : null,
              waistCm: r?.waistCm ? Number(r.waistCm) : null,
              chestCm: r?.chestCm ? Number(r.chestCm) : null,
              thighCm: r?.thighCm ? Number(r.thighCm) : null,
              bicepsCm: r?.bicepsCm ? Number(r.bicepsCm) : null,
              targetKcal: r?.targetKcal ?? null,
              note: r?.note ?? null,
            }
            return (
              <MeasurementRow
                key={weekStart}
                weekStart={weekStart}
                isCurrent={weekStart === todayWeek}
                values={values}
                prevWeightKg={prev?.weightKg ? Number(prev.weightKg) : null}
                onCommitValue={(k, v) => upsert(weekStart, { [k]: v } as Partial<MeasurementValues>)}
                onCommitNote={(note) => upsert(weekStart, { note } as Partial<MeasurementValues>)}
              />
            )
          })}
        </tbody>
      </table>
      <div className="py-3 text-center text-xs text-[#6b7280]">
        {done ? (
          'Žádné starší týdny.'
        ) : (
          <button onClick={loadMore} disabled={loadingMore}>
            {loadingMore ? 'Načítání…' : '↓ Načíst starší týdny'}
          </button>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Type-check + commit**

```bash
npx tsc --noEmit
git add src/components/measurements/MeasurementGrid.tsx
git commit -m "feat(m3): MeasurementGrid with lazy load + inline upsert"
```

---

### Task 25: /progress layout + page

**Files:**
- Create: `src/app/(app)/progress/layout.tsx`
- Create: `src/app/(app)/progress/page.tsx`

- [ ] **Step 1: Layout with segment control**

```tsx
// src/app/(app)/progress/layout.tsx
import { ProgressSegmentControl } from '@/components/ui/SegmentControl'

export default function ProgressLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-3 p-4">
      <h1 className="text-xl font-semibold">Progres</h1>
      <ProgressSegmentControl />
      {children}
    </div>
  )
}
```

Note: `ProgressSegmentControl` is a thin client wrapper exported from `src/components/ui/SegmentControl.tsx` that uses `usePathname()` to compute the active segment — see Task 18 amendment below.

- [ ] **Step 2: Index redirect**

```tsx
// src/app/(app)/progress/page.tsx
import { redirect } from 'next/navigation'

export default function ProgressIndex() {
  redirect('/progress/body')
}
```

- [ ] **Step 3: Type-check + commit**

```bash
npx tsc --noEmit
git add 'src/app/(app)/progress/layout.tsx' 'src/app/(app)/progress/page.tsx'
git commit -m "feat(m3): /progress layout with segment control + redirect index"
```

---

### Task 26: /progress/body page

**Files:**
- Create: `src/app/(app)/progress/body/page.tsx`

- [ ] **Step 1: Implement (server component fetches initial 8 weeks)**

```tsx
// src/app/(app)/progress/body/page.tsx
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/db/client'
import { fetchRange } from '@/lib/queries/measurements'
import { weekRange } from '@/lib/week'
import { MeasurementGrid } from '@/components/measurements/MeasurementGrid'
import { SparklineCard } from '@/components/measurements/SparklineCard'

export default async function BodyPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const weeks = weekRange(new Date(), 8)
  const rows = await fetchRange(db, session.user.id, weeks[0]!, weeks[weeks.length - 1]!)
  // Build by-week map for sparklines
  const byWeek = new Map(rows.map((r) => [r.weekStart, r]))
  const series = (key: 'weightKg' | 'waistCm' | 'chestCm' | 'thighCm' | 'bicepsCm') =>
    weeks.map((w) => {
      const v = byWeek.get(w)?.[key]
      return v == null ? null : Number(v)
    })

  // Plain serializable shape for client component
  const initialRows = rows.map((r) => ({
    id: r.id,
    weekStart: r.weekStart,
    weightKg: r.weightKg ?? null,
    waistCm: r.waistCm ?? null,
    chestCm: r.chestCm ?? null,
    thighCm: r.thighCm ?? null,
    bicepsCm: r.bicepsCm ?? null,
    targetKcal: r.targetKcal ?? null,
    note: r.note ?? null,
  }))

  return (
    <div className="space-y-3">
      <div className="flex gap-2 overflow-x-auto pb-2">
        <SparklineCard label="Váha" values={series('weightKg')} goal="lower-is-good" unit="kg" precision={1} />
        <SparklineCard label="Pas" values={series('waistCm')} goal="lower-is-good" unit="cm" precision={1} />
        <SparklineCard label="Hrudník" values={series('chestCm')} goal="higher-is-good" unit="cm" precision={1} />
        <SparklineCard label="Stehno" values={series('thighCm')} goal="higher-is-good" unit="cm" precision={1} />
        <SparklineCard label="Biceps" values={series('bicepsCm')} goal="higher-is-good" unit="cm" precision={1} />
      </div>
      <MeasurementGrid initialRows={initialRows} />
    </div>
  )
}
```

- [ ] **Step 2: Type-check + commit**

```bash
npx tsc --noEmit
git add 'src/app/(app)/progress/body/page.tsx'
git commit -m "feat(m3): /progress/body page — sparklines + grid"
```

---

## Phase 6 — Nutrition UI

### Task 27: CalendarDay component

**Files:**
- Create: `src/components/nutrition/CalendarDay.tsx`

- [ ] **Step 1: Implement**

```tsx
// src/components/nutrition/CalendarDay.tsx
import type { DayClass, MacroClass } from '@/lib/nutrition-classify'

const BG: Record<DayClass, string> = {
  hit: '#065f46',
  miss: '#7f1d1d',
  empty: '#1f2733',
}
const DOT: Record<MacroClass, string> = {
  hit: '#10b981',
  near: '#f59e0b',
  miss: '#ef4444',
  none: 'transparent',
}

type Props = {
  date: string
  dayNumber: number
  klass: DayClass
  macros: MacroClass[] // ordered, one per tracked macro
  isToday: boolean
  isFuture: boolean
  onClick?: () => void
}

export function CalendarDay({ dayNumber, klass, macros, isToday, isFuture, onClick }: Props) {
  if (isFuture) {
    return (
      <div className="flex aspect-square items-center justify-center">
        <span className="text-sm text-[#374151]">{dayNumber}</span>
      </div>
    )
  }
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ background: BG[klass], outline: isToday ? '2px solid #10b981' : 'none', outlineOffset: -2 }}
      className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-lg"
      aria-label={`Den ${dayNumber}`}
    >
      <span
        className={
          'text-sm ' +
          (isToday ? 'font-bold text-[#10b981]' : klass === 'empty' ? 'text-[#6b7280]' : 'font-semibold text-[#e5e7eb]')
        }
      >
        {dayNumber}
      </span>
      {macros.length > 0 && (
        <div className="mt-1 flex gap-1">
          {macros.map((m, i) => (
            <span
              key={i}
              className="block h-1.5 w-1.5 rounded-full"
              style={{ background: DOT[m], display: m === 'none' ? 'none' : 'block' }}
            />
          ))}
        </div>
      )}
    </button>
  )
}
```

- [ ] **Step 2: Type-check + commit**

```bash
npx tsc --noEmit
git add src/components/nutrition/CalendarDay.tsx
git commit -m "feat(m3): CalendarDay cell"
```

---

### Task 28: NutritionCalendar component

**Files:**
- Create: `src/components/nutrition/NutritionCalendar.tsx`

- [ ] **Step 1: Implement**

```tsx
// src/components/nutrition/NutritionCalendar.tsx
'use client'

import { useMemo, useState } from 'react'
import { CalendarDay } from './CalendarDay'
import { classifyDay, classifyMacro, type DayClass, type MacroClass } from '@/lib/nutrition-classify'

type DayRow = {
  id?: number
  date: string
  kcalActual: number | null
  proteinG: number | null
  carbsG: number | null
  fatG: number | null
  sugarG: number | null
  note: string | null
}

type WeekTargets = {
  targetKcal: number | null
  targetProteinG: number | null
  targetCarbsG: number | null
  targetFatG: number | null
  targetSugarG: number | null
}

type Props = {
  month: string // YYYY-MM
  days: DayRow[]
  trackedMacros: string[]
  targetsByWeek: Record<string, WeekTargets> // weekStart -> targets
  weekStartFor: (date: string) => string
  onSelectDay: (date: string) => void
}

const MONTH_NAMES = [
  'Leden',
  'Únor',
  'Březen',
  'Duben',
  'Květen',
  'Červen',
  'Červenec',
  'Srpen',
  'Září',
  'Říjen',
  'Listopad',
  'Prosinec',
]
const DAY_HEADERS = ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne']

export function NutritionCalendar({
  month,
  days,
  trackedMacros,
  targetsByWeek,
  weekStartFor,
  onSelectDay,
}: Props) {
  const byDate = useMemo(() => new Map(days.map((d) => [d.date, d])), [days])
  const today = new Date().toISOString().slice(0, 10)
  const [y, m] = month.split('-').map(Number)
  const firstDay = new Date(Date.UTC(y!, (m! - 1), 1))
  // 0-indexed weekday with Mon=0
  const firstDow = (firstDay.getUTCDay() + 6) % 7
  const lastDate = new Date(Date.UTC(y!, m!, 0)).getUTCDate()

  function classifyForDay(d: string, row: DayRow | undefined): DayClass {
    if (!row) return 'empty'
    const t = targetsByWeek[weekStartFor(d)]
    return classifyDay({ kcalActual: row.kcalActual, targetKcal: t?.targetKcal ?? null })
  }

  function macroDots(d: string, row: DayRow | undefined): MacroClass[] {
    if (!row) return trackedMacros.map(() => 'none' as const)
    const t = targetsByWeek[weekStartFor(d)]
    return trackedMacros.map((m) => {
      switch (m) {
        case 'kcal':
          return classifyMacro({ actual: row.kcalActual, target: t?.targetKcal ?? null })
        case 'protein':
          return classifyMacro({ actual: row.proteinG, target: t?.targetProteinG ?? null })
        case 'carbs':
          return classifyMacro({ actual: row.carbsG, target: t?.targetCarbsG ?? null })
        case 'fat':
          return classifyMacro({ actual: row.fatG, target: t?.targetFatG ?? null })
        case 'sugar':
          return classifyMacro({ actual: row.sugarG, target: t?.targetSugarG ?? null })
        default:
          return 'none' as const
      }
    })
  }

  const cells: React.ReactNode[] = []
  for (let i = 0; i < firstDow; i++) cells.push(<div key={`pad-${i}`} />)
  for (let d = 1; d <= lastDate; d++) {
    const date = `${month}-${String(d).padStart(2, '0')}`
    const row = byDate.get(date)
    cells.push(
      <CalendarDay
        key={date}
        date={date}
        dayNumber={d}
        klass={classifyForDay(date, row)}
        macros={macroDots(date, row)}
        isToday={date === today}
        isFuture={date > today}
        onClick={() => onSelectDay(date)}
      />
    )
  }

  return (
    <div className="space-y-2">
      <div className="px-4 text-center text-base font-semibold text-[#e5e7eb]">
        {MONTH_NAMES[m! - 1]} {y}
      </div>
      <div className="grid grid-cols-7 gap-1 px-4">
        {DAY_HEADERS.map((h) => (
          <div key={h} className="py-1 text-center text-[11px] text-[#6b7280]">
            {h}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1 px-4">{cells}</div>
    </div>
  )
}
```

- [ ] **Step 2: Type-check + commit**

```bash
npx tsc --noEmit
git add src/components/nutrition/NutritionCalendar.tsx
git commit -m "feat(m3): NutritionCalendar with heatmap + macro dots"
```

---

### Task 29: MonthStats + NutritionStreak components

**Files:**
- Create: `src/components/nutrition/MonthStats.tsx`
- Create: `src/components/nutrition/NutritionStreak.tsx`

- [ ] **Step 1: MonthStats**

```tsx
// src/components/nutrition/MonthStats.tsx
type Props = {
  hits: number
  misses: number
  empties: number
}

export function MonthStats({ hits, misses, empties }: Props) {
  const denom = hits + misses
  const pct = denom > 0 ? Math.round((hits / denom) * 100) : 0
  return (
    <div className="mx-4 my-2 flex justify-around rounded-lg border border-[#1f2733] bg-[#141a22] p-3">
      <Stat value={hits} label="dní hit" color="#10b981" />
      <Stat value={misses} label="dní miss" color="#ef4444" />
      <Stat value={empties} label="prázdných" color="#6b7280" />
      <Stat value={`${pct}%`} label="úspěšnost" color="#f59e0b" />
    </div>
  )
}

function Stat({ value, label, color }: { value: number | string; label: string; color: string }) {
  return (
    <div className="text-center">
      <div className="text-2xl font-bold" style={{ color }}>
        {value}
      </div>
      <div className="text-[11px] text-[#6b7280]">{label}</div>
    </div>
  )
}
```

- [ ] **Step 2: NutritionStreak**

```tsx
// src/components/nutrition/NutritionStreak.tsx
import type { DayClass } from '@/lib/nutrition-classify'

type Props = {
  streak: number
  thisWeek: { dayLabel: string; klass: DayClass }[] // 7 entries Po..Ne
}

const BG: Record<DayClass, string> = {
  hit: '#065f46',
  miss: '#7f1d1d',
  empty: '#1f2733',
}

export function NutritionStreak({ streak, thisWeek }: Props) {
  return (
    <div className="rounded-xl border border-[#1f2733] bg-[#141a22] p-3.5">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-[#e5e7eb]">Výživa streak</div>
          <div className="text-xs text-[#6b7280]">Dní v řadě s hitem</div>
        </div>
        <div className="text-3xl font-bold text-[#f59e0b]">{streak}</div>
      </div>
      <div className="mt-2.5 flex justify-center gap-1.5">
        {thisWeek.map((d, i) => (
          <div
            key={i}
            className={
              'flex h-6 w-6 items-center justify-center rounded text-[10px] font-semibold ' +
              (d.klass === 'empty' ? 'text-[#6b7280]' : 'text-white')
            }
            style={{ background: BG[d.klass] }}
          >
            {d.dayLabel}
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Type-check + commit**

```bash
npx tsc --noEmit
git add src/components/nutrition/MonthStats.tsx src/components/nutrition/NutritionStreak.tsx
git commit -m "feat(m3): MonthStats + NutritionStreak components"
```

---

### Task 30: DailyModal component

**Files:**
- Create: `src/components/nutrition/DailyModal.tsx`

- [ ] **Step 1: Implement**

```tsx
// src/components/nutrition/DailyModal.tsx
'use client'

import { useEffect, useState } from 'react'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { NumberInput } from '@/components/ui/NumberInput'
import { classifyDay, classifyMacro } from '@/lib/nutrition-classify'

type DayRow = {
  date: string
  kcalActual: number | null
  proteinG: number | null
  carbsG: number | null
  fatG: number | null
  sugarG: number | null
  note: string | null
}

type WeekTargets = {
  targetKcal: number | null
  targetProteinG: number | null
  targetCarbsG: number | null
  targetFatG: number | null
  targetSugarG: number | null
}

type Props = {
  open: boolean
  date: string | null
  initial: DayRow | null
  trackedMacros: string[]
  targets: WeekTargets | null
  onClose: () => void
  onSaved: (row: DayRow) => void
}

export function DailyModal({ open, date, initial, trackedMacros, targets, onClose, onSaved }: Props) {
  const [draft, setDraft] = useState<DayRow | null>(initial)

  useEffect(() => {
    setDraft(initial ?? (date ? { date, kcalActual: null, proteinG: null, carbsG: null, fatG: null, sugarG: null, note: null } : null))
  }, [initial, date])

  if (!open || !date || !draft) return null

  async function save() {
    const res = await fetch('/api/nutrition', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        date: draft!.date,
        kcalActual: draft!.kcalActual,
        proteinG: draft!.proteinG,
        carbsG: trackedMacros.includes('carbs') ? draft!.carbsG : undefined,
        fatG: trackedMacros.includes('fat') ? draft!.fatG : undefined,
        sugarG: trackedMacros.includes('sugar') ? draft!.sugarG : undefined,
        note: draft!.note,
      }),
    })
    if (res.ok) {
      onSaved(draft!)
      onClose()
    }
  }

  const kcalClass = classifyDay({ kcalActual: draft.kcalActual, targetKcal: targets?.targetKcal ?? null })
  const proteinClass = classifyMacro({ actual: draft.proteinG, target: targets?.targetProteinG ?? null })

  return (
    <BottomSheet open={open} onClose={onClose} title={formatDate(date)}>
      <div className="space-y-4 p-4">
        <Field
          label="Kalorie"
          value={draft.kcalActual}
          target={targets?.targetKcal ?? null}
          unit="kcal"
          tone={kcalClass === 'hit' ? 'success' : kcalClass === 'miss' ? 'danger' : 'muted'}
          onChange={(v) => setDraft({ ...draft, kcalActual: v })}
        />
        <Field
          label="Protein"
          value={draft.proteinG}
          target={targets?.targetProteinG ?? null}
          unit="g"
          tone={proteinClass === 'hit' ? 'success' : proteinClass === 'miss' ? 'danger' : proteinClass === 'near' ? 'warn' : 'muted'}
          onChange={(v) => setDraft({ ...draft, proteinG: v })}
        />

        {(trackedMacros.includes('carbs') || trackedMacros.includes('fat') || trackedMacros.includes('sugar')) && (
          <div className="rounded-lg bg-[#0a0e14] p-3">
            <div className="mb-2 text-[11px] text-[#6b7280]">Volitelná makra</div>
            <div className="grid grid-cols-2 gap-2">
              {trackedMacros.includes('carbs') && (
                <SimpleMacro
                  label="Sacharidy"
                  value={draft.carbsG}
                  onChange={(v) => setDraft({ ...draft, carbsG: v })}
                />
              )}
              {trackedMacros.includes('fat') && (
                <SimpleMacro
                  label="Tuky"
                  value={draft.fatG}
                  onChange={(v) => setDraft({ ...draft, fatG: v })}
                />
              )}
              {trackedMacros.includes('sugar') && (
                <SimpleMacro
                  label="Cukry"
                  value={draft.sugarG}
                  onChange={(v) => setDraft({ ...draft, sugarG: v })}
                />
              )}
            </div>
          </div>
        )}

        <div>
          <div className="mb-1.5 text-xs text-[#6b7280]">Poznámka</div>
          <textarea
            value={draft.note ?? ''}
            onChange={(e) => setDraft({ ...draft, note: e.target.value || null })}
            className="min-h-[40px] w-full rounded-lg border border-[#1f2733] bg-[#0a0e14] p-2.5 text-sm text-[#e5e7eb]"
            rows={2}
          />
        </div>

        <button
          type="button"
          onClick={save}
          className="w-full rounded-lg bg-[#10b981] py-2.5 font-semibold text-[#0a0e14]"
        >
          Uložit
        </button>
      </div>
    </BottomSheet>
  )
}

function Field({
  label,
  value,
  target,
  unit,
  tone,
  onChange,
}: {
  label: string
  value: number | null
  target: number | null
  unit: string
  tone: 'success' | 'danger' | 'warn' | 'muted'
  onChange: (v: number | null) => void
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-xs text-[#6b7280]">{label}</span>
        <NumberInput
          value={value}
          onChange={onChange}
          step={1}
          min={0}
          suffix={target ? ` / ${target} ${unit}` : ` ${unit}`}
        />
      </div>
      <ProgressBar value={value} max={target} tone={tone} />
    </div>
  )
}

function SimpleMacro({
  label,
  value,
  onChange,
}: {
  label: string
  value: number | null
  onChange: (v: number | null) => void
}) {
  return (
    <div>
      <div className="text-[11px] text-[#6b7280]">{label}</div>
      <NumberInput value={value} onChange={onChange} step={1} min={0} suffix=" g" />
    </div>
  )
}

function formatDate(d: string): string {
  return new Date(d + 'T00:00:00Z').toLocaleDateString('cs-CZ', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })
}
```

- [ ] **Step 2: Type-check + commit**

```bash
npx tsc --noEmit
git add src/components/nutrition/DailyModal.tsx
git commit -m "feat(m3): DailyModal — BottomSheet form for daily nutrition"
```

---

### Task 31: /progress/nutrition page

**Files:**
- Create: `src/app/(app)/progress/nutrition/page.tsx`
- Create: `src/components/nutrition/NutritionPageClient.tsx`

- [ ] **Step 1: Server component (page)**

```tsx
// src/app/(app)/progress/nutrition/page.tsx
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/db/client'
import { fetchRange, monthBounds } from '@/lib/queries/nutrition'
import { fetchRange as fetchMeasurements } from '@/lib/queries/measurements'
import { getMacros } from '@/lib/queries/user-prefs'
import { toWeekStart } from '@/lib/week'
import { NutritionPageClient } from '@/components/nutrition/NutritionPageClient'

export default async function NutritionPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const today = new Date()
  const month = `${today.getUTCFullYear()}-${String(today.getUTCMonth() + 1).padStart(2, '0')}`
  const { from, to } = monthBounds(month)

  const [days, macros, measurements] = await Promise.all([
    fetchRange(db, session.user.id, from, to),
    getMacros(db, session.user.id),
    fetchMeasurements(db, session.user.id, toWeekStart(new Date(from + 'T00:00:00Z')), to),
  ])

  const targetsByWeek: Record<string, {
    targetKcal: number | null
    targetProteinG: number | null
    targetCarbsG: number | null
    targetFatG: number | null
    targetSugarG: number | null
  }> = {}
  for (const m of measurements) {
    targetsByWeek[m.weekStart] = {
      targetKcal: m.targetKcal ?? null,
      targetProteinG: m.targetProteinG ?? null,
      targetCarbsG: m.targetCarbsG ?? null,
      targetFatG: m.targetFatG ?? null,
      targetSugarG: m.targetSugarG ?? null,
    }
  }

  return (
    <NutritionPageClient
      initialMonth={month}
      initialDays={days.map((d) => ({
        id: d.id,
        date: d.date,
        kcalActual: d.kcalActual ?? null,
        proteinG: d.proteinG ?? null,
        carbsG: d.carbsG ?? null,
        fatG: d.fatG ?? null,
        sugarG: d.sugarG ?? null,
        note: d.note ?? null,
      }))}
      trackedMacros={macros}
      targetsByWeek={targetsByWeek}
    />
  )
}
```

- [ ] **Step 2: Client wrapper**

```tsx
// src/components/nutrition/NutritionPageClient.tsx
'use client'

import { useMemo, useState } from 'react'
import { NutritionCalendar } from './NutritionCalendar'
import { DailyModal } from './DailyModal'
import { MonthStats } from './MonthStats'
import { classifyDay } from '@/lib/nutrition-classify'
import { toWeekStart } from '@/lib/week'

type DayRow = {
  id?: number
  date: string
  kcalActual: number | null
  proteinG: number | null
  carbsG: number | null
  fatG: number | null
  sugarG: number | null
  note: string | null
}

type Props = {
  initialMonth: string
  initialDays: DayRow[]
  trackedMacros: string[]
  targetsByWeek: Record<string, {
    targetKcal: number | null
    targetProteinG: number | null
    targetCarbsG: number | null
    targetFatG: number | null
    targetSugarG: number | null
  }>
}

export function NutritionPageClient({ initialMonth, initialDays, trackedMacros, targetsByWeek: initialTargets }: Props) {
  const [month, setMonth] = useState(initialMonth)
  const [days, setDays] = useState<DayRow[]>(initialDays)
  const [targetsByWeek, setTargetsByWeek] = useState(initialTargets)
  const [selected, setSelected] = useState<string | null>(null)

  function weekStartFor(d: string): string {
    return toWeekStart(new Date(d + 'T00:00:00Z'))
  }

  // Month nav
  async function changeMonth(delta: number) {
    const [y, m] = month.split('-').map(Number)
    const next = new Date(Date.UTC(y!, m! - 1 + delta, 1))
    const nextMonth = `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, '0')}`
    setMonth(nextMonth)
    const res = await fetch(`/api/nutrition?month=${nextMonth}`)
    const body = (await res.json()) as { items: DayRow[] }
    setDays(body.items)
    // Targets fetch could be added similarly via /api/measurements range
  }

  const stats = useMemo(() => {
    let hits = 0,
      misses = 0,
      empties = 0
    for (const d of days) {
      const t = targetsByWeek[weekStartFor(d.date)]
      const c = classifyDay({ kcalActual: d.kcalActual, targetKcal: t?.targetKcal ?? null })
      if (c === 'hit') hits++
      else if (c === 'miss') misses++
      else empties++
    }
    return { hits, misses, empties }
  }, [days, targetsByWeek])

  const selectedRow = useMemo(() => days.find((d) => d.date === selected) ?? null, [days, selected])
  const selectedTargets = selected ? targetsByWeek[weekStartFor(selected)] ?? null : null

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-4">
        <button onClick={() => changeMonth(-1)} className="text-2xl text-[#6b7280]">
          ‹
        </button>
        <button onClick={() => changeMonth(1)} className="text-2xl text-[#6b7280]">
          ›
        </button>
      </div>
      <NutritionCalendar
        month={month}
        days={days}
        trackedMacros={trackedMacros}
        targetsByWeek={targetsByWeek}
        weekStartFor={weekStartFor}
        onSelectDay={setSelected}
      />
      <MonthStats {...stats} />
      <DailyModal
        open={selected != null}
        date={selected}
        initial={selectedRow}
        trackedMacros={trackedMacros}
        targets={selectedTargets}
        onClose={() => setSelected(null)}
        onSaved={(saved) => {
          setDays((prev) => {
            const filtered = prev.filter((d) => d.date !== saved.date)
            return [...filtered, saved].sort((a, b) => (a.date < b.date ? -1 : 1))
          })
        }}
      />
    </div>
  )
}
```

- [ ] **Step 3: Type-check + commit**

```bash
npx tsc --noEmit
git add 'src/app/(app)/progress/nutrition/page.tsx' src/components/nutrition/NutritionPageClient.tsx
git commit -m "feat(m3): /progress/nutrition page — calendar + month stats + daily modal"
```

---

## Phase 7 — Dashboard widgets + tab bar

### Task 32: TodayNutritionCard

**Files:**
- Create: `src/components/dashboard/TodayNutritionCard.tsx`

- [ ] **Step 1: Implement**

```tsx
// src/components/dashboard/TodayNutritionCard.tsx
import Link from 'next/link'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { classifyDay, classifyMacro } from '@/lib/nutrition-classify'

type Props = {
  today: {
    kcalActual: number | null
    proteinG: number | null
    carbsG: number | null
    fatG: number | null
    sugarG: number | null
  } | null
  targets: {
    targetKcal: number | null
    targetProteinG: number | null
    targetCarbsG: number | null
    targetFatG: number | null
    targetSugarG: number | null
  } | null
  trackedMacros: string[]
}

export function TodayNutritionCard({ today, targets, trackedMacros }: Props) {
  if (!today && !targets) {
    return (
      <Card>
        <Header label="Dnešní výživa" cta="Zalogovat →" />
        <p className="text-sm text-[#6b7280]">Zatím žádná data pro dnešek.</p>
      </Card>
    )
  }
  const kcal = classifyDay({ kcalActual: today?.kcalActual ?? null, targetKcal: targets?.targetKcal ?? null })
  const protein = classifyMacro({ actual: today?.proteinG ?? null, target: targets?.targetProteinG ?? null })
  return (
    <Card>
      <Header label="Dnešní výživa" cta="Upravit →" />
      <Stat
        label="Kalorie"
        actual={today?.kcalActual ?? null}
        target={targets?.targetKcal ?? null}
        unit="kcal"
        tone={kcal === 'hit' ? 'success' : kcal === 'miss' ? 'danger' : 'muted'}
        height={10}
      />
      <Stat
        label="Protein"
        actual={today?.proteinG ?? null}
        target={targets?.targetProteinG ?? null}
        unit="g"
        tone={protein === 'hit' ? 'success' : protein === 'miss' ? 'danger' : protein === 'near' ? 'warn' : 'muted'}
        height={6}
      />
      {(trackedMacros.includes('carbs') || trackedMacros.includes('fat')) && (
        <div className="grid grid-cols-2 gap-2">
          {trackedMacros.includes('carbs') && (
            <Mini label="Sacharidy" actual={today?.carbsG ?? null} target={targets?.targetCarbsG ?? null} unit="g" />
          )}
          {trackedMacros.includes('fat') && (
            <Mini label="Tuky" actual={today?.fatG ?? null} target={targets?.targetFatG ?? null} unit="g" />
          )}
        </div>
      )}
    </Card>
  )
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-2.5 rounded-xl border border-[#1f2733] bg-[#141a22] p-3.5">{children}</div>
  )
}

function Header({ label, cta }: { label: string; cta: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm font-semibold text-[#e5e7eb]">{label}</span>
      <Link href="/progress/nutrition" className="text-xs text-[#10b981]">
        {cta}
      </Link>
    </div>
  )
}

function Stat({
  label,
  actual,
  target,
  unit,
  tone,
  height,
}: {
  label: string
  actual: number | null
  target: number | null
  unit: string
  tone: 'success' | 'danger' | 'warn' | 'muted'
  height: number
}) {
  return (
    <div>
      <div className="mb-1 flex justify-between">
        <span className="text-xs text-[#6b7280]">{label}</span>
        <span className="text-xs font-semibold text-[#e5e7eb]">
          {actual ?? '—'} / {target ?? '—'} {unit}
        </span>
      </div>
      <ProgressBar value={actual} max={target} tone={tone} height={height} />
    </div>
  )
}

function Mini({
  label,
  actual,
  target,
  unit,
}: {
  label: string
  actual: number | null
  target: number | null
  unit: string
}) {
  return (
    <div>
      <div className="mb-0.5 flex justify-between">
        <span className="text-[11px] text-[#6b7280]">{label}</span>
        <span className="text-[11px] text-[#6b7280]">
          {actual ?? '—'} {unit}
        </span>
      </div>
      <ProgressBar value={actual} max={target} tone="muted" height={4} />
    </div>
  )
}
```

- [ ] **Step 2: Type-check + commit**

```bash
npx tsc --noEmit
git add src/components/dashboard/TodayNutritionCard.tsx
git commit -m "feat(m3): TodayNutritionCard dashboard widget"
```

---

### Task 33: WeekMeasurementCard

**Files:**
- Create: `src/components/dashboard/WeekMeasurementCard.tsx`

- [ ] **Step 1: Implement**

```tsx
// src/components/dashboard/WeekMeasurementCard.tsx
import Link from 'next/link'
import { Sparkline } from '@/components/ui/Sparkline'
import { calcDelta, deltaDirection, type Goal } from '@/lib/measurement-delta'

type Props = {
  thisWeek: {
    weightKg: number | null
    waistCm: number | null
    chestCm: number | null
    thighCm: number | null
    bicepsCm: number | null
  } | null
  prevWeek: {
    weightKg: number | null
    waistCm: number | null
    chestCm: number | null
    thighCm: number | null
    bicepsCm: number | null
  } | null
  weightSeries: (number | null)[]
}

const COLOR = { good: '#10b981', bad: '#ef4444', neutral: '#6b7280' }

export function WeekMeasurementCard({ thisWeek, prevWeek, weightSeries }: Props) {
  if (!thisWeek && !prevWeek) {
    return (
      <Card>
        <Header cta="Zadat měření →" />
        <p className="text-sm text-[#6b7280]">Žádná měření tento týden.</p>
      </Card>
    )
  }
  const weightDelta = calcDelta(thisWeek?.weightKg ?? null, prevWeek?.weightKg ?? null)
  const weightDir = deltaDirection(weightDelta, 'lower-is-good')
  return (
    <Card>
      <Header cta="Měřit →" />
      <div className="flex items-end gap-3">
        <div className="flex-1">
          <div className="text-[11px] text-[#6b7280]">Váha</div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-bold text-[#e5e7eb]">
              {thisWeek?.weightKg?.toFixed(1) ?? '—'}
            </span>
            <span className="text-sm font-semibold" style={{ color: COLOR[weightDir] }}>
              {weightDelta == null ? '' : weightDelta > 0 ? `↑ ${weightDelta.toFixed(1)}` : `↓ ${Math.abs(weightDelta).toFixed(1)}`}
            </span>
          </div>
          <div className="mt-0.5 text-[11px] text-[#6b7280]">kg</div>
        </div>
        <div className="flex-1">
          <Sparkline values={weightSeries} width={140} height={48} color={COLOR[weightDir]} className="block" />
          <div className="text-right text-[10px] text-[#6b7280]">8 týdnů</div>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-4 gap-3 border-t border-[#1f2733] pt-3">
        <Mini label="Pas" actual={thisWeek?.waistCm ?? null} prev={prevWeek?.waistCm ?? null} goal="lower-is-good" />
        <Mini label="Hrudník" actual={thisWeek?.chestCm ?? null} prev={prevWeek?.chestCm ?? null} goal="higher-is-good" />
        <Mini label="Stehno" actual={thisWeek?.thighCm ?? null} prev={prevWeek?.thighCm ?? null} goal="higher-is-good" />
        <Mini label="Biceps" actual={thisWeek?.bicepsCm ?? null} prev={prevWeek?.bicepsCm ?? null} goal="higher-is-good" />
      </div>
    </Card>
  )
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-1 rounded-xl border border-[#1f2733] bg-[#141a22] p-3.5">{children}</div>
  )
}

function Header({ cta }: { cta: string }) {
  return (
    <div className="mb-2 flex items-center justify-between">
      <span className="text-sm font-semibold text-[#e5e7eb]">Tento týden</span>
      <Link href="/progress/body" className="text-xs text-[#10b981]">
        {cta}
      </Link>
    </div>
  )
}

function Mini({
  label,
  actual,
  prev,
  goal,
}: {
  label: string
  actual: number | null
  prev: number | null
  goal: Goal
}) {
  const d = calcDelta(actual, prev)
  const dir = deltaDirection(d, goal)
  return (
    <div className="text-center">
      <div className="text-[11px] text-[#6b7280]">{label}</div>
      <div className="text-base font-semibold text-[#e5e7eb]">{actual?.toFixed(1) ?? '—'}</div>
      <div className="text-[11px]" style={{ color: COLOR[dir] }}>
        {d == null ? '—' : d > 0 ? `↑ ${d.toFixed(1)}` : `↓ ${Math.abs(d).toFixed(1)}`}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Type-check + commit**

```bash
npx tsc --noEmit
git add src/components/dashboard/WeekMeasurementCard.tsx
git commit -m "feat(m3): WeekMeasurementCard dashboard widget"
```

---

### Task 34: NutritionStreakCard (dashboard wrapper)

**Files:**
- Create: `src/components/dashboard/NutritionStreakCard.tsx`

- [ ] **Step 1: Implement**

```tsx
// src/components/dashboard/NutritionStreakCard.tsx
import { NutritionStreak } from '@/components/nutrition/NutritionStreak'
import type { DayClass } from '@/lib/nutrition-classify'

type Props = {
  streak: number
  thisWeekDays: { date: string; klass: DayClass }[] // 7 ordered Po..Ne
}

const LABELS = ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne']

export function NutritionStreakCard({ streak, thisWeekDays }: Props) {
  const week = thisWeekDays.map((d, i) => ({ dayLabel: LABELS[i]!, klass: d.klass }))
  return <NutritionStreak streak={streak} thisWeek={week} />
}
```

- [ ] **Step 2: Type-check + commit**

```bash
npx tsc --noEmit
git add src/components/dashboard/NutritionStreakCard.tsx
git commit -m "feat(m3): NutritionStreakCard dashboard wrapper"
```

---

### Task 35: Wire dashboard widgets into /dashboard

**Files:**
- Modify: `src/app/(app)/dashboard/page.tsx`

- [ ] **Step 1: Read existing dashboard**

```bash
cat 'src/app/(app)/dashboard/page.tsx'
```

- [ ] **Step 2: Append widget data fetching and rendering**

After the existing dashboard JSX (level/streak/CTA section), add widget data fetching at the top of the component (before the existing fetches finish), and render the new cards below the existing ones. Concretely, in the same default-exported async server component:

```tsx
// Add these imports at the top
import { TodayNutritionCard } from '@/components/dashboard/TodayNutritionCard'
import { WeekMeasurementCard } from '@/components/dashboard/WeekMeasurementCard'
import { NutritionStreakCard } from '@/components/dashboard/NutritionStreakCard'
import { fetchRange as fetchNutrition } from '@/lib/queries/nutrition'
import { fetchRange as fetchMeasurements } from '@/lib/queries/measurements'
import { getMacros } from '@/lib/queries/user-prefs'
import { calcStreak } from '@/lib/nutrition-streak'
import { classifyDay } from '@/lib/nutrition-classify'
import { toWeekStart, weekRange } from '@/lib/week'
```

Inside the component (after `session` is verified), fetch:

```tsx
const today = new Date()
const todayDate = today.toISOString().slice(0, 10)
const thisWeekStart = toWeekStart(today)
const last8Weeks = weekRange(today, 8)
const weekStartArr = last8Weeks
const measurements = await fetchMeasurements(db, session.user.id, weekStartArr[0]!, weekStartArr[weekStartArr.length - 1]!)
const macros = await getMacros(db, session.user.id)
// 30 days back for streak + this-week dots
const fromDate = new Date(today)
fromDate.setUTCDate(fromDate.getUTCDate() - 30)
const fromDateStr = fromDate.toISOString().slice(0, 10)
const recentNutrition = await fetchNutrition(db, session.user.id, fromDateStr, todayDate)

const byWeek = new Map(measurements.map((m) => [m.weekStart, m]))
const thisWeekRow = byWeek.get(thisWeekStart) ?? null
const prevWeekStart = last8Weeks[last8Weeks.length - 2] ?? null
const prevWeekRow = prevWeekStart ? byWeek.get(prevWeekStart) ?? null : null
const todayRow = recentNutrition.find((d) => d.date === todayDate) ?? null

const dayClasses = recentNutrition.map((d) => {
  const t = byWeek.get(toWeekStart(new Date(d.date + 'T00:00:00Z')))
  return { date: d.date, class: classifyDay({ kcalActual: d.kcalActual, targetKcal: t?.targetKcal ?? null }) }
})
const streak = calcStreak({ today, days: dayClasses })

// Build this week's 7 days for streak card
const weekDots: { date: string; klass: 'hit' | 'miss' | 'empty' }[] = []
for (let i = 0; i < 7; i++) {
  const d = new Date(thisWeekStart + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + i)
  const date = d.toISOString().slice(0, 10)
  const found = dayClasses.find((c) => c.date === date)
  weekDots.push({ date, klass: (found?.class ?? 'empty') as 'hit' | 'miss' | 'empty' })
}

const weightSeries = last8Weeks.map((w) => {
  const v = byWeek.get(w)?.weightKg
  return v == null ? null : Number(v)
})

const measurementToTargets = (r: typeof measurements[number] | null) =>
  r
    ? {
        targetKcal: r.targetKcal ?? null,
        targetProteinG: r.targetProteinG ?? null,
        targetCarbsG: r.targetCarbsG ?? null,
        targetFatG: r.targetFatG ?? null,
        targetSugarG: r.targetSugarG ?? null,
      }
    : null

const measurementToValues = (r: typeof measurements[number] | null) =>
  r
    ? {
        weightKg: r.weightKg ? Number(r.weightKg) : null,
        waistCm: r.waistCm ? Number(r.waistCm) : null,
        chestCm: r.chestCm ? Number(r.chestCm) : null,
        thighCm: r.thighCm ? Number(r.thighCm) : null,
        bicepsCm: r.bicepsCm ? Number(r.bicepsCm) : null,
      }
    : null
```

Then in the JSX, after the existing level/streak/CTA cards, append:

```tsx
<TodayNutritionCard
  today={
    todayRow
      ? {
          kcalActual: todayRow.kcalActual ?? null,
          proteinG: todayRow.proteinG ?? null,
          carbsG: todayRow.carbsG ?? null,
          fatG: todayRow.fatG ?? null,
          sugarG: todayRow.sugarG ?? null,
        }
      : null
  }
  targets={measurementToTargets(thisWeekRow)}
  trackedMacros={macros}
/>
<WeekMeasurementCard
  thisWeek={measurementToValues(thisWeekRow)}
  prevWeek={measurementToValues(prevWeekRow)}
  weightSeries={weightSeries}
/>
<NutritionStreakCard streak={streak} thisWeekDays={weekDots} />
```

- [ ] **Step 3: Type-check + commit**

```bash
npx tsc --noEmit
git add 'src/app/(app)/dashboard/page.tsx'
git commit -m "feat(m3): wire M3 widgets into dashboard"
```

---

### Task 36: Add "Progres" tab to main nav

**Files:**
- Modify: `src/app/(app)/layout.tsx`

- [ ] **Step 1: Read existing layout to find the tab list**

```bash
cat 'src/app/(app)/layout.tsx'
```

- [ ] **Step 2: Insert TabLink for Progres between Trénink and Nastavení**

In the JSX where you see `<TabLink href="/workout" label="Trénink" />` followed by `<TabLink href="/settings/plates" label="Nastavení" />`, insert between them:

```tsx
<TabLink href="/progress/body" label="Progres" />
```

- [ ] **Step 3: Type-check + commit**

```bash
npx tsc --noEmit
git add 'src/app/(app)/layout.tsx'
git commit -m "feat(m3): add Progres tab to main nav"
```

---

## Phase 8 — E2E Tests

### Task 37: Measurements E2E

**Files:**
- Create: `tests/e2e/measurements.spec.ts`

- [ ] **Step 1: Implement**

```typescript
// tests/e2e/measurements.spec.ts
import { test, expect } from '@playwright/test'

// Assumes a test user is bootstrapped via npm run db:bootstrap
const EMAIL = process.env.E2E_EMAIL ?? 'test@hexis.local'
const PASSWORD = process.env.E2E_PASSWORD ?? 'test1234'

test.beforeEach(async ({ page }) => {
  await page.goto('/login')
  await page.fill('input[name="email"]', EMAIL)
  await page.fill('input[name="password"]', PASSWORD)
  await page.click('button[type="submit"]')
  await page.waitForURL('**/dashboard')
})

test('user can navigate to body progress and edit a measurement', async ({ page }) => {
  await page.goto('/progress/body')
  await expect(page.getByRole('tab', { name: 'Tělo' })).toHaveAttribute('aria-selected', 'true')
  // Click the first weight cell (current week, top row)
  const weightCell = page.locator('table tbody tr').first().locator('td').nth(1).locator('button')
  await weightCell.click()
  const input = page.locator('table tbody tr').first().locator('td').nth(1).locator('input')
  await input.fill('72.5')
  await input.press('Enter')
  // Reload and assert
  await page.reload()
  await expect(page.locator('table tbody tr').first().locator('td').nth(1)).toContainText('72.5')
})
```

- [ ] **Step 2: Run E2E (after `npm run db:bootstrap` + `npm run dev` in another terminal)**

```bash
npm run test:e2e -- tests/e2e/measurements.spec.ts
```

Expected: PASS — 1 test.

- [ ] **Step 3: Commit**

```bash
git add tests/e2e/measurements.spec.ts
git commit -m "test(m3): E2E for measurement inline edit"
```

---

### Task 38: Nutrition E2E

**Files:**
- Create: `tests/e2e/nutrition.spec.ts`

- [ ] **Step 1: Implement**

```typescript
// tests/e2e/nutrition.spec.ts
import { test, expect } from '@playwright/test'

const EMAIL = process.env.E2E_EMAIL ?? 'test@hexis.local'
const PASSWORD = process.env.E2E_PASSWORD ?? 'test1234'

test.beforeEach(async ({ page }) => {
  await page.goto('/login')
  await page.fill('input[name="email"]', EMAIL)
  await page.fill('input[name="password"]', PASSWORD)
  await page.click('button[type="submit"]')
  await page.waitForURL('**/dashboard')
})

test('user can open today and log nutrition', async ({ page }) => {
  await page.goto('/progress/nutrition')
  // Find today's cell — outline + bold
  const today = new Date()
  const dayNum = today.getUTCDate().toString()
  await page.locator(`button[aria-label="Den ${dayNum}"]`).click()
  // Bottom sheet appears — fill kcal
  const kcalInput = page.locator('input[type="number"]').first()
  await kcalInput.fill('1800')
  const proteinInput = page.locator('input[type="number"]').nth(1)
  await proteinInput.fill('140')
  await page.getByRole('button', { name: 'Uložit' }).click()
  // Background should now be hit (#065f46) — assert via class or computed style
  await expect(page.locator(`button[aria-label="Den ${dayNum}"]`)).toHaveCSS('background-color', 'rgb(6, 95, 70)')
})
```

- [ ] **Step 2: Run E2E**

```bash
npm run test:e2e -- tests/e2e/nutrition.spec.ts
```

Expected: PASS — 1 test.

- [ ] **Step 3: Commit**

```bash
git add tests/e2e/nutrition.spec.ts
git commit -m "test(m3): E2E for nutrition daily modal + heatmap update"
```

---

### Task 39: Dashboard widgets E2E

**Files:**
- Create: `tests/e2e/dashboard-m3.spec.ts`

- [ ] **Step 1: Implement**

```typescript
// tests/e2e/dashboard-m3.spec.ts
import { test, expect } from '@playwright/test'

const EMAIL = process.env.E2E_EMAIL ?? 'test@hexis.local'
const PASSWORD = process.env.E2E_PASSWORD ?? 'test1234'

test.beforeEach(async ({ page }) => {
  await page.goto('/login')
  await page.fill('input[name="email"]', EMAIL)
  await page.fill('input[name="password"]', PASSWORD)
  await page.click('button[type="submit"]')
  await page.waitForURL('**/dashboard')
})

test('dashboard shows M3 widgets', async ({ page }) => {
  await expect(page.getByText('Dnešní výživa')).toBeVisible()
  await expect(page.getByText('Tento týden')).toBeVisible()
  await expect(page.getByText('Výživa streak')).toBeVisible()
})

test('Progres tab is reachable from main nav', async ({ page }) => {
  await page.getByRole('link', { name: 'Progres' }).click()
  await page.waitForURL('**/progress/body')
})
```

- [ ] **Step 2: Run E2E**

```bash
npm run test:e2e -- tests/e2e/dashboard-m3.spec.ts
```

Expected: PASS — 2 tests.

- [ ] **Step 3: Commit**

```bash
git add tests/e2e/dashboard-m3.spec.ts
git commit -m "test(m3): E2E for dashboard widgets + Progres tab nav"
```

---

## Final verification

### Task 40: Full type-check + unit suite + roadmap update

**Files:**
- Modify: `docs/superpowers/roadmap/hexis-roadmap.md` (mark M3 done)

- [ ] **Step 1: Type-check entire project**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 2: Run all unit + integration tests**

```bash
DATABASE_URL=mysql://root:root@127.0.0.1:3308/hexis npx vitest run
```

Expected: all green.

- [ ] **Step 3: Mark M3 done in roadmap**

Open `docs/superpowers/roadmap/hexis-roadmap.md`, find the "Progres tracking" section, and replace the M3 lines:

Before:
```
- [ ] Weekly measurements grid (inline edit, save on blur)
- [ ] Nutrition kalendář s heat map + daily modal
```

After:
```
- [x] Weekly measurements grid (inline edit, save on blur)
- [x] Nutrition kalendář s heat map + daily modal
```

- [ ] **Step 4: Commit**

```bash
git add docs/superpowers/roadmap/hexis-roadmap.md
git commit -m "docs(m3): mark measurements + nutrition milestone complete"
```

---

## Notes for the implementer

- **Branch:** Work on `m3-measurements-nutrition` branched off `m2-workout-logging` (M2 not yet merged). Coordinate rebase onto main once M1 + M2 land.
- **Test DB:** Port 3308 (not 3307 — that conflicts with another local project). Run `docker compose up -d mysql-test` first.
- **Bootstrap user:** Run `npm run db:bootstrap` to seed a test user before E2E.
- **Next.js 16 quirks:** Route handler `params` are `Promise<{...}>` — already reflected in tasks. `useSearchParams` requires Suspense (none used here).
- **No new dependencies:** Everything uses existing libs.
- **Czech UI strings** match the existing app voice. Keep them as-is unless you intentionally translate.
