# SP3 — Dashboard Reimagined — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/superpowers/specs/2026-04-24-sp3-dashboard-reimagined-design.md`

**Goal:** Rebuild `/dashboard` as a Life-Areas-centric composition — StatusWindow, TodayQuest, Life Area 2×2 grid, MuscleWidget (kept), WeekPeek, conditional StagnationWarning — without changing domain model or any existing query behavior.

**Architecture:** Four new presentation components (`StatusWindow`, `TodayQuest`, `LifeAreaCard`, `WeekPeek`) plus one helper (`RegionHeader`) land in `src/components/dashboard/`. All business logic (state resolution for quest, per-card value formatting, week-peek day classification) lives in pure helpers in `src/lib/` so the components stay dumb and trivially testable. The dashboard page orchestrates queries (keeping existing ones, adding two new ones for exerciseCounts and active-session progress) and routes results into resolvers + components.

**Tech Stack:** Next.js 16 (App Router, RSC), React 19, Tailwind 4, Drizzle + MySQL, `lucide-react`, Vitest 4 with per-file `// @vitest-environment jsdom` pragma, `@testing-library/react`.

**Codebase conventions (inherited from SP1/SP2):**
- Per-file jsdom pragma on DOM-rendering tests; pure-fn tests omit it
- `afterEach(cleanup)` lives in `src/tests/setup.ts` — tests don't repeat it
- Barrel-only imports: `@/components/ui` (never `@/components/ui/primitive/*` — SP1 §11.2 grep guard)
- Shell imports: `@/components/shell` (SP2)
- Vitest 4 mock hoisting: `vi.mock(...)` before post-mock imports
- No `--no-verify` on commits
- Tailwind 4 tokens: `text-accent`, `bg-surface`, `text-muted`, `border-border` etc
- Tier metadata via `levelToTierMeta(level): { tier, name, color, accent, levelMin, levelMax }`

---

## File Structure

**Created:**

- `src/components/dashboard/StatusWindow.tsx` — server component, props-only
- `src/components/dashboard/TodayQuest.tsx` — server component, discriminated union prop
- `src/components/dashboard/LifeAreaCard.tsx` — server component, generic
- `src/components/dashboard/WeekPeek.tsx` — server component, pre-resolved days prop
- `src/components/dashboard/RegionHeader.tsx` — tiny letter-spaced heading helper
- `src/lib/today-quest.ts` — pure `resolveTodayQuest` + `Quest` type
- `src/lib/dashboard-life-areas.ts` — pure `resolveTrainingCard`, `resolveNutritionCard`, `resolveProgressCard`, `resolveStatsCard` + `LifeAreaInput` type
- `src/lib/week-peek.ts` — pure `resolveWeekPeek` + `Day` type
- `src/lib/queries/dashboard-sessions.ts` — `fetchSessionsLast8Weeks`, `fetchActiveSessionProgress`, `fetchExerciseCountsByPlan`
- `src/tests/dashboard/` folder with component tests
- `src/tests/lib/today-quest.test.ts`
- `src/tests/lib/dashboard-life-areas.test.ts`
- `src/tests/lib/week-peek.test.ts`
- `tests/e2e/dashboard-sp3.spec.ts` (or extend existing `dashboard-m3.spec.ts`)

**Modified:**

- `src/app/(app)/dashboard/page.tsx` — full rewrite using new components + resolvers

**Deleted:**

- `src/components/dashboard/AvatarHero.tsx`
- `src/components/dashboard/TodayNutritionCard.tsx`
- `src/components/dashboard/WeekMeasurementCard.tsx`
- `src/components/dashboard/NutritionStreakCard.tsx`
- `src/tests/dashboard/AvatarHero*.test.*` (if any)
- Any related legacy tests

**Unchanged (kept):**

- `src/components/dashboard/StagnationWarning.tsx` — conditional render at bottom
- `src/components/dashboard/MuscleWidget.tsx` — wrapped in `<RegionHeader>Muscle Volume</RegionHeader>` section
- All existing queries: `fetchWorkoutStreak`, `fetchRange` (measurements/nutrition), `fetchStagnatingExercises`, `fetchMuscleVolumes`, `getTotalXp`, `calcStreak`, `classifyDay`, `toWeekStart`, `weekRange`

---

## Shared types (single source of truth)

Used across tasks — define once, import everywhere. Lives in the resolvers' files.

```ts
// src/lib/today-quest.ts
export type Quest =
  | { kind: 'active'; sessionId: number; planName: string; completed: number; total: number }
  | { kind: 'rest'; nextPlanName: string | null }
  | { kind: 'scheduled'; planName: string; exerciseCount: number }
  | { kind: 'no-plan' }

// src/lib/dashboard-life-areas.ts
import type { ReactNode } from 'react'
export type LifeAreaInput = {
  value: string
  secondary: string
  visual: ReactNode
  empty: boolean
}

// src/lib/week-peek.ts
export type WeekPeekDay = {
  weekdayLabel: string           // 'Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'
  status: 'workout' | 'rest' | 'empty'
}
```

---

## Task 1: `RegionHeader` helper

Small letter-spaced heading used in 4 places. TDD.

**Files:**
- Create: `src/components/dashboard/RegionHeader.tsx`
- Create: `src/tests/dashboard/RegionHeader.test.tsx`

- [ ] **Step 1.1: Write the failing test**

Create `src/tests/dashboard/RegionHeader.test.tsx`:

```tsx
// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { RegionHeader } from '@/components/dashboard/RegionHeader'

describe('RegionHeader', () => {
  it('renders children as uppercase letter-spaced text', () => {
    render(<RegionHeader>Life Areas</RegionHeader>)
    const el = screen.getByText('Life Areas')
    expect(el).toBeInTheDocument()
    expect(el.className).toContain('uppercase')
    expect(el.className).toContain('tracking-[0.2em]')
    expect(el.className).toContain('text-muted')
  })
})
```

- [ ] **Step 1.2: Run test to verify it fails**

Run: `npx vitest run src/tests/dashboard/RegionHeader.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 1.3: Implement**

```tsx
// src/components/dashboard/RegionHeader.tsx
type Props = { children: string; className?: string }

export function RegionHeader({ children, className }: Props) {
  return (
    <div
      className={
        'text-muted px-1 pb-2 text-[10px] font-medium tracking-[0.2em] uppercase ' +
        (className ?? '')
      }
    >
      {children}
    </div>
  )
}
```

- [ ] **Step 1.4: Run test**

Run: `npx vitest run src/tests/dashboard/RegionHeader.test.tsx`
Expected: PASS (1 test).

- [ ] **Step 1.5: Commit**

```bash
git add src/components/dashboard/RegionHeader.tsx src/tests/dashboard/RegionHeader.test.tsx
git commit -m "feat(dashboard): RegionHeader letter-spaced section label"
```

---

## Task 2: `resolveTodayQuest` + `Quest` type

Pure helper, no DOM, no DB. The spec §4.2 gives the resolution-order contract.

**Files:**
- Create: `src/lib/today-quest.ts`
- Create: `src/tests/lib/today-quest.test.ts`

- [ ] **Step 2.1: Write the failing test**

```ts
// src/tests/lib/today-quest.test.ts
import { describe, it, expect } from 'vitest'
import { resolveTodayQuest } from '@/lib/today-quest'

const mkDate = (iso: string) => new Date(iso + 'T12:00:00Z')

const samplePlans = [
  { id: 1, name: 'Upper A', order: 0 },
  { id: 2, name: 'Lower A', order: 1 },
  { id: 3, name: 'Upper B', order: 2 },
  { id: 4, name: 'Lower B', order: 3 },
]

describe('resolveTodayQuest', () => {
  const today = mkDate('2026-04-24')

  it('returns "active" when there is an unfinished session', () => {
    const q = resolveTodayQuest({
      activeSession: { id: 77, planName: 'Upper A', completed: 3, total: 5 },
      lastFinished: null,
      plans: samplePlans,
      exerciseCounts: new Map([[1, 5], [2, 6], [3, 5], [4, 6]]),
      today,
    })
    expect(q).toEqual({
      kind: 'active',
      sessionId: 77,
      planName: 'Upper A',
      completed: 3,
      total: 5,
    })
  })

  it('returns "no-plan" when plans array is empty (no active session)', () => {
    const q = resolveTodayQuest({
      activeSession: null,
      lastFinished: null,
      plans: [],
      exerciseCounts: new Map(),
      today,
    })
    expect(q).toEqual({ kind: 'no-plan' })
  })

  it('returns "rest" when last finished session is today', () => {
    const q = resolveTodayQuest({
      activeSession: null,
      lastFinished: { planId: 1, finishedAt: mkDate('2026-04-24') },
      plans: samplePlans,
      exerciseCounts: new Map([[1, 5], [2, 6]]),
      today,
    })
    expect(q).toEqual({ kind: 'rest', nextPlanName: 'Lower A' })
  })

  it('returns "rest" with null nextPlanName if only one plan exists', () => {
    const q = resolveTodayQuest({
      activeSession: null,
      lastFinished: { planId: 9, finishedAt: mkDate('2026-04-24') },
      plans: [{ id: 9, name: 'Only', order: 0 }],
      exerciseCounts: new Map([[9, 5]]),
      today,
    })
    expect(q).toEqual({ kind: 'rest', nextPlanName: 'Only' })
  })

  it('returns "scheduled" with the next plan after last finished', () => {
    const q = resolveTodayQuest({
      activeSession: null,
      lastFinished: { planId: 1, finishedAt: mkDate('2026-04-22') },
      plans: samplePlans,
      exerciseCounts: new Map([[1, 5], [2, 6], [3, 5], [4, 6]]),
      today,
    })
    expect(q).toEqual({ kind: 'scheduled', planName: 'Lower A', exerciseCount: 6 })
  })

  it('returns "scheduled" with first plan when lastFinished is null and plans exist', () => {
    const q = resolveTodayQuest({
      activeSession: null,
      lastFinished: null,
      plans: samplePlans,
      exerciseCounts: new Map([[1, 5]]),
      today,
    })
    expect(q).toEqual({ kind: 'scheduled', planName: 'Upper A', exerciseCount: 5 })
  })

  it('wraps around to first plan when last finished was the last in rotation', () => {
    const q = resolveTodayQuest({
      activeSession: null,
      lastFinished: { planId: 4, finishedAt: mkDate('2026-04-22') },
      plans: samplePlans,
      exerciseCounts: new Map([[1, 5], [4, 6]]),
      today,
    })
    expect(q).toEqual({ kind: 'scheduled', planName: 'Upper A', exerciseCount: 5 })
  })

  it('exerciseCount falls back to 0 when map has no entry for plan', () => {
    const q = resolveTodayQuest({
      activeSession: null,
      lastFinished: null,
      plans: samplePlans,
      exerciseCounts: new Map(),
      today,
    })
    expect(q).toEqual({ kind: 'scheduled', planName: 'Upper A', exerciseCount: 0 })
  })

  it('active state wins over all others (even with empty plans)', () => {
    const q = resolveTodayQuest({
      activeSession: { id: 1, planName: 'X', completed: 0, total: 0 },
      lastFinished: null,
      plans: [],
      exerciseCounts: new Map(),
      today,
    })
    expect(q.kind).toBe('active')
  })
})
```

- [ ] **Step 2.2: Run test to verify it fails**

Run: `npx vitest run src/tests/lib/today-quest.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 2.3: Implement**

```ts
// src/lib/today-quest.ts
export type Quest =
  | { kind: 'active'; sessionId: number; planName: string; completed: number; total: number }
  | { kind: 'rest'; nextPlanName: string | null }
  | { kind: 'scheduled'; planName: string; exerciseCount: number }
  | { kind: 'no-plan' }

type Plan = { id: number; name: string; order: number }

type Input = {
  activeSession: { id: number; planName: string; completed: number; total: number } | null
  lastFinished: { planId: number | null; finishedAt: Date } | null
  plans: Plan[]
  exerciseCounts: Map<number, number>
  today: Date
}

function isSameUtcDay(a: Date, b: Date): boolean {
  return a.toISOString().slice(0, 10) === b.toISOString().slice(0, 10)
}

function nextPlanAfter(
  lastFinishedPlanId: number | null,
  sortedPlans: Plan[]
): Plan | null {
  if (sortedPlans.length === 0) return null
  if (lastFinishedPlanId == null) return sortedPlans[0] ?? null
  const idx = sortedPlans.findIndex((p) => p.id === lastFinishedPlanId)
  if (idx === -1) return sortedPlans[0] ?? null
  return sortedPlans[(idx + 1) % sortedPlans.length] ?? null
}

export function resolveTodayQuest(input: Input): Quest {
  const { activeSession, lastFinished, plans, exerciseCounts, today } = input

  if (activeSession) {
    return {
      kind: 'active',
      sessionId: activeSession.id,
      planName: activeSession.planName,
      completed: activeSession.completed,
      total: activeSession.total,
    }
  }

  if (plans.length === 0) return { kind: 'no-plan' }

  const sorted = [...plans].sort((a, b) => a.order - b.order)

  if (lastFinished && isSameUtcDay(lastFinished.finishedAt, today)) {
    const next = nextPlanAfter(lastFinished.planId, sorted)
    return { kind: 'rest', nextPlanName: next ? next.name : null }
  }

  const next = nextPlanAfter(lastFinished?.planId ?? null, sorted)
  if (!next) return { kind: 'no-plan' }
  return {
    kind: 'scheduled',
    planName: next.name,
    exerciseCount: exerciseCounts.get(next.id) ?? 0,
  }
}
```

- [ ] **Step 2.4: Run test to verify it passes**

Run: `npx vitest run src/tests/lib/today-quest.test.ts`
Expected: PASS (9 tests).

- [ ] **Step 2.5: Commit**

```bash
git add src/lib/today-quest.ts src/tests/lib/today-quest.test.ts
git commit -m "feat(dashboard): resolveTodayQuest pure helper + Quest type"
```

---

## Task 3: Life Area card resolvers

Four pure resolvers producing `LifeAreaInput` for each card. Each returns pre-formatted strings + a React visual node.

**Files:**
- Create: `src/lib/dashboard-life-areas.ts`
- Create: `src/lib/dashboard-life-areas.tsx` (if JSX needed in visuals — see Step 3.3 for the file decision)
- Create: `src/tests/lib/dashboard-life-areas.test.ts`

NOTE: The 3 sparkline/bar/chevron visuals need JSX. So the resolvers return `ReactNode`, which means the module file should be `.tsx`. Create as `src/lib/dashboard-life-areas.tsx` (not `.ts`). Tests stay `.test.ts` but import from the `.tsx` module; jsdom pragma not needed for assertions on strings, but IS needed when asserting rendered visuals. We'll split: test the pure string/format parts directly; don't assert on the ReactNode shape.

- [ ] **Step 3.1: Write the failing test**

```ts
// src/tests/lib/dashboard-life-areas.test.ts
import { describe, it, expect } from 'vitest'
import {
  resolveTrainingCard,
  resolveNutritionCard,
  resolveProgressCard,
  resolveStatsCard,
} from '@/lib/dashboard-life-areas'

const mkDate = (iso: string) => new Date(iso + 'T12:00:00Z')

describe('resolveTrainingCard', () => {
  it('counts sessions in the last 7 days and labels "this week"', () => {
    const sessions = [
      mkDate('2026-04-24'),
      mkDate('2026-04-23'),
      mkDate('2026-04-22'),
      mkDate('2026-04-15'), // outside 7-day window
    ]
    const r = resolveTrainingCard(sessions, mkDate('2026-04-24'))
    expect(r.value).toBe('3 sessions')
    expect(r.secondary).toBe('this week')
    expect(r.empty).toBe(false)
  })

  it('is empty when no sessions in last 30 days', () => {
    const r = resolveTrainingCard([mkDate('2026-03-01')], mkDate('2026-04-24'))
    expect(r.empty).toBe(true)
    expect(r.value).toBe('Žádné tréninky')
    expect(r.secondary).toBe('Začni')
  })

  it('shows 0 sessions this week but not empty if recent activity in 30 days', () => {
    const r = resolveTrainingCard([mkDate('2026-04-10')], mkDate('2026-04-24'))
    expect(r.empty).toBe(false)
    expect(r.value).toBe('0 sessions')
    expect(r.secondary).toBe('this week')
  })
})

describe('resolveNutritionCard', () => {
  it('shows today kcal and target when both present', () => {
    const r = resolveNutritionCard(
      { kcalActual: 1840, targetKcal: 2400 },
      { targetKcal: 2400 }
    )
    expect(r.value).toBe('1 840 kcal')
    expect(r.secondary).toBe('of 2 400')
    expect(r.empty).toBe(false)
  })

  it('shows dash when no today row but target exists', () => {
    const r = resolveNutritionCard(null, { targetKcal: 2400 })
    expect(r.value).toBe('—')
    expect(r.secondary).toBe('of 2 400')
    expect(r.empty).toBe(false)
  })

  it('is empty when no today row and no target', () => {
    const r = resolveNutritionCard(null, null)
    expect(r.empty).toBe(true)
    expect(r.value).toBe('Nelogováno')
    expect(r.secondary).toBe('Přidej')
  })

  it('shows "no target" when today row has kcal but no target', () => {
    const r = resolveNutritionCard({ kcalActual: 1500, targetKcal: null }, null)
    expect(r.value).toBe('1 500 kcal')
    expect(r.secondary).toBe('no target')
    expect(r.empty).toBe(false)
  })
})

describe('resolveProgressCard', () => {
  it('computes weekly delta from last two non-null values', () => {
    const r = resolveProgressCard([80.2, 80.0, null, 79.8, 79.4])
    expect(r.value).toBe('−0.4 kg')
    expect(r.secondary).toBe('last week')
    expect(r.empty).toBe(false)
  })

  it('shows positive sign for weight gain', () => {
    const r = resolveProgressCard([80.0, 80.2])
    expect(r.value).toBe('+0.2 kg')
  })

  it('shows em-dash when only one measurement', () => {
    const r = resolveProgressCard([80.0])
    expect(r.value).toBe('—')
    expect(r.secondary).toBe('last week')
    expect(r.empty).toBe(false)
  })

  it('is empty when entire series is null', () => {
    const r = resolveProgressCard([null, null, null, null])
    expect(r.empty).toBe(true)
    expect(r.value).toBe('Bez měření')
    expect(r.secondary).toBe('Zvaž se')
  })
})

describe('resolveStatsCard', () => {
  it('shows level and tier name when level > 1 or xp >= 50', () => {
    const r = resolveStatsCard(7, 2340)
    expect(r.value).toBe('Level 7')
    expect(r.secondary).toBe('Warrior')
    expect(r.empty).toBe(false)
  })

  it('is empty for brand-new characters (level 1 & xp < 50)', () => {
    const r = resolveStatsCard(1, 30)
    expect(r.empty).toBe(true)
    expect(r.value).toBe('Nová postava')
    expect(r.secondary).toBe('L1')
  })

  it('is not empty at level 1 if xp >= 50', () => {
    const r = resolveStatsCard(1, 60)
    expect(r.empty).toBe(false)
    expect(r.value).toBe('Level 1')
  })
})
```

- [ ] **Step 3.2: Run test to verify it fails**

Run: `npx vitest run src/tests/lib/dashboard-life-areas.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3.3: Implement**

Create `src/lib/dashboard-life-areas.tsx`:

```tsx
import type { ReactNode } from 'react'
import { Sparkline, ProgressBar } from '@/components/ui'
import { levelToTierMeta } from '@/lib/tiers'
import { ChevronUp } from 'lucide-react'

export type LifeAreaInput = {
  value: string
  secondary: string
  visual: ReactNode
  empty: boolean
}

function formatKcal(n: number): string {
  return new Intl.NumberFormat('cs-CZ').format(Math.round(n))
}

function formatDelta(kg: number): string {
  const sign = kg > 0 ? '+' : kg < 0 ? '−' : ''
  return `${sign}${Math.abs(kg).toFixed(1)} kg`
}

export function resolveTrainingCard(
  sessionDates: Date[],
  now: Date = new Date()
): LifeAreaInput {
  const sevenDaysAgo = new Date(now)
  sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - 7)
  const thirtyDaysAgo = new Date(now)
  thirtyDaysAgo.setUTCDate(thirtyDaysAgo.getUTCDate() - 30)
  const thisWeek = sessionDates.filter((d) => d >= sevenDaysAgo).length
  const inThirty = sessionDates.some((d) => d >= thirtyDaysAgo)

  if (!inThirty) {
    return {
      value: 'Žádné tréninky',
      secondary: 'Začni',
      visual: null,
      empty: true,
    }
  }

  // 8-week count series for sparkline
  const weeks: number[] = []
  for (let w = 7; w >= 0; w--) {
    const end = new Date(now)
    end.setUTCDate(end.getUTCDate() - w * 7)
    const start = new Date(end)
    start.setUTCDate(start.getUTCDate() - 7)
    weeks.push(sessionDates.filter((d) => d > start && d <= end).length)
  }

  return {
    value: `${thisWeek} sessions`,
    secondary: 'this week',
    visual: <Sparkline values={weeks} tone="primary" width={120} height={32} />,
    empty: false,
  }
}

export function resolveNutritionCard(
  today: { kcalActual: number | null; targetKcal: number | null } | null,
  thisWeek: { targetKcal: number | null } | null
): LifeAreaInput {
  const kcal = today?.kcalActual ?? null
  const target = today?.targetKcal ?? thisWeek?.targetKcal ?? null

  if (kcal == null && target == null) {
    return {
      value: 'Nelogováno',
      secondary: 'Přidej',
      visual: null,
      empty: true,
    }
  }

  const value = kcal != null ? `${formatKcal(kcal)} kcal` : '—'
  const secondary = target != null ? `of ${formatKcal(target)}` : 'no target'
  return {
    value,
    secondary,
    visual: <ProgressBar value={kcal} max={target} tone="primary" height={6} />,
    empty: false,
  }
}

export function resolveProgressCard(weightSeries: (number | null)[]): LifeAreaInput {
  const nonNull = weightSeries.filter((v): v is number => v != null)
  if (nonNull.length === 0) {
    return {
      value: 'Bez měření',
      secondary: 'Zvaž se',
      visual: null,
      empty: true,
    }
  }
  if (nonNull.length === 1) {
    return {
      value: '—',
      secondary: 'last week',
      visual: <Sparkline values={weightSeries} tone="muted" width={120} height={32} />,
      empty: false,
    }
  }
  const last = nonNull[nonNull.length - 1]!
  const prev = nonNull[nonNull.length - 2]!
  const delta = last - prev
  return {
    value: formatDelta(delta),
    secondary: 'last week',
    visual: (
      <Sparkline
        values={weightSeries}
        tone={delta < 0 ? 'success' : delta > 0 ? 'warn' : 'muted'}
        width={120}
        height={32}
      />
    ),
    empty: false,
  }
}

export function resolveStatsCard(level: number, totalXp: number): LifeAreaInput {
  if (level === 1 && totalXp < 50) {
    return {
      value: 'Nová postava',
      secondary: 'L1',
      visual: null,
      empty: true,
    }
  }
  const meta = levelToTierMeta(level)
  const tierIndex = meta.tier
  return {
    value: `Level ${level}`,
    secondary: meta.name,
    visual: (
      <div className="flex gap-1" aria-hidden>
        {[1, 2, 3, 4, 5].map((i) => (
          <ChevronUp
            key={i}
            size={14}
            style={{ color: i <= tierIndex ? meta.color : 'var(--color-border)' }}
          />
        ))}
      </div>
    ),
    empty: false,
  }
}
```

Delete any existing `src/lib/dashboard-life-areas.ts` if created by mistake — this module must be `.tsx` because it returns JSX.

- [ ] **Step 3.4: Run test to verify it passes**

Run: `npx vitest run src/tests/lib/dashboard-life-areas.test.ts`
Expected: PASS (13 tests).

Note on Intl: `Intl.NumberFormat('cs-CZ')` uses narrow non-breaking space ` ` between thousands — tests compare by visible whitespace. If the test `expect(r.value).toBe('1 840 kcal')` fails because of non-breaking space, relax the assertion to `.toMatch(/1\s840 kcal/)` — fix inline.

- [ ] **Step 3.5: Commit**

```bash
git add src/lib/dashboard-life-areas.tsx src/tests/lib/dashboard-life-areas.test.ts
git commit -m "feat(dashboard): Life Area card resolvers (training/nutrition/progress/stats)"
```

---

## Task 4: `resolveWeekPeek`

Pure helper. Classifies each day of the current ISO week as `workout` / `rest` / `empty`.

**Files:**
- Create: `src/lib/week-peek.ts`
- Create: `src/tests/lib/week-peek.test.ts`

- [ ] **Step 4.1: Write the failing test**

```ts
// src/tests/lib/week-peek.test.ts
import { describe, it, expect } from 'vitest'
import { resolveWeekPeek } from '@/lib/week-peek'

const mkDate = (iso: string) => new Date(iso + 'T12:00:00Z')

describe('resolveWeekPeek', () => {
  // ISO week of 2026-04-24 (Friday) is Mon 2026-04-20 to Sun 2026-04-26
  const today = mkDate('2026-04-24') // Friday

  it('returns 7 days, Po through Ne', () => {
    const days = resolveWeekPeek([], today)
    expect(days).toHaveLength(7)
    expect(days.map((d) => d.weekdayLabel)).toEqual(['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'])
  })

  it('marks workout on days with a session', () => {
    const sessions = [mkDate('2026-04-20'), mkDate('2026-04-22'), mkDate('2026-04-24')]
    const days = resolveWeekPeek(sessions, today)
    expect(days[0]!.status).toBe('workout') // Po
    expect(days[1]!.status).toBe('rest')    // Út — session yesterday, none today
    expect(days[2]!.status).toBe('workout') // St
    expect(days[3]!.status).toBe('rest')    // Čt — session yesterday, none today
    expect(days[4]!.status).toBe('workout') // Pá (today)
    expect(days[5]!.status).toBe('empty')   // So (future)
    expect(days[6]!.status).toBe('empty')   // Ne (future)
  })

  it('marks all past days as empty if no sessions', () => {
    const days = resolveWeekPeek([], today)
    for (const d of days) expect(d.status).toBe('empty')
  })

  it('marks days with multiple sessions as workout (not double-counted)', () => {
    const sessions = [mkDate('2026-04-22'), mkDate('2026-04-22')]
    const days = resolveWeekPeek(sessions, today)
    expect(days[2]!.status).toBe('workout')
  })

  it('past day without session and without session the day before is empty', () => {
    const days = resolveWeekPeek([mkDate('2026-04-20')], today)
    expect(days[0]!.status).toBe('workout') // Po
    expect(days[1]!.status).toBe('rest')    // Út — session yesterday
    expect(days[2]!.status).toBe('empty')   // St — no session, no rest pattern
  })
})
```

- [ ] **Step 4.2: Run test to verify it fails**

Run: `npx vitest run src/tests/lib/week-peek.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 4.3: Implement**

```ts
// src/lib/week-peek.ts
export type WeekPeekDay = {
  weekdayLabel: string
  status: 'workout' | 'rest' | 'empty'
}

const LABELS = ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'] as const

function isoKey(d: Date): string {
  return d.toISOString().slice(0, 10)
}

/** Monday of the ISO week containing `d`, at 00:00 UTC. */
function mondayOf(d: Date): Date {
  const out = new Date(d)
  out.setUTCHours(0, 0, 0, 0)
  // getUTCDay: 0=Sun, 1=Mon, ..., 6=Sat → shift so Monday=0
  const shift = (out.getUTCDay() + 6) % 7
  out.setUTCDate(out.getUTCDate() - shift)
  return out
}

export function resolveWeekPeek(sessionDates: Date[], today: Date): WeekPeekDay[] {
  const mon = mondayOf(today)
  const todayKey = isoKey(today)
  const sessionDayKeys = new Set(sessionDates.map(isoKey))

  const result: WeekPeekDay[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(mon)
    d.setUTCDate(mon.getUTCDate() + i)
    const key = isoKey(d)
    const prevKey = (() => {
      const p = new Date(d)
      p.setUTCDate(p.getUTCDate() - 1)
      return isoKey(p)
    })()

    const hasSession = sessionDayKeys.has(key)
    const hadYesterday = sessionDayKeys.has(prevKey)
    const isFuture = key > todayKey

    let status: WeekPeekDay['status']
    if (isFuture) status = 'empty'
    else if (hasSession) status = 'workout'
    else if (hadYesterday) status = 'rest'
    else status = 'empty'

    result.push({ weekdayLabel: LABELS[i]!, status })
  }
  return result
}
```

- [ ] **Step 4.4: Run test to verify it passes**

Run: `npx vitest run src/tests/lib/week-peek.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 4.5: Commit**

```bash
git add src/lib/week-peek.ts src/tests/lib/week-peek.test.ts
git commit -m "feat(dashboard): resolveWeekPeek pure helper"
```

---

## Task 5: New query helpers

Three new query helpers for SP3 dashboard: sessions in last 8 weeks, plan exercise counts, active session progress.

**Files:**
- Create: `src/lib/queries/dashboard-sessions.ts`

No tests in this task — queries run against real DB only, covered by integration tests in existing patterns. Pure resolvers (Tasks 2, 3, 4) provide unit coverage for the data consumers.

- [ ] **Step 5.1: Implement**

```ts
// src/lib/queries/dashboard-sessions.ts
import { and, desc, eq, gte, inArray, sql } from 'drizzle-orm'
import type { MySql2Database } from 'drizzle-orm/mysql2'
import * as schema from '@/db/schema'
import { sessions, planExercises, sessionSets } from '@/db/schema'

type DB = MySql2Database<typeof schema>

/** Started-at timestamps of the user's sessions in the last 8 weeks. */
export async function fetchSessionsLast8Weeks(db: DB, userId: string, now: Date = new Date()): Promise<Date[]> {
  const cutoff = new Date(now)
  cutoff.setUTCDate(cutoff.getUTCDate() - 56)
  const rows = await db
    .select({ startedAt: sessions.startedAt })
    .from(sessions)
    .where(and(eq(sessions.userId, userId), gte(sessions.startedAt, cutoff)))
    .orderBy(desc(sessions.startedAt))
  return rows.map((r) => r.startedAt)
}

/** Count of planned exercises per plan id, for the given plan ids. */
export async function fetchExerciseCountsByPlan(
  db: DB,
  planIds: number[]
): Promise<Map<number, number>> {
  if (planIds.length === 0) return new Map()
  const rows = await db
    .select({
      planId: planExercises.planId,
      count: sql<number>`count(*)`.as('count'),
    })
    .from(planExercises)
    .where(inArray(planExercises.planId, planIds))
    .groupBy(planExercises.planId)
  const map = new Map<number, number>()
  for (const r of rows) map.set(r.planId, Number(r.count))
  return map
}

/**
 * Progress for an active session: total exercises (plan exercises + any ad-hoc
 * exercises already logged) and completed count (distinct exercise_ids with
 * at least one set row).
 */
export async function fetchActiveSessionProgress(
  db: DB,
  sessionId: number,
  planId: number | null
): Promise<{ completed: number; total: number }> {
  const completedRows = await db
    .select({ exerciseId: sessionSets.exerciseId })
    .from(sessionSets)
    .where(eq(sessionSets.sessionId, sessionId))
    .groupBy(sessionSets.exerciseId)
  const completedIds = new Set(completedRows.map((r) => r.exerciseId))
  const completed = completedIds.size

  let plannedIds = new Set<number>()
  if (planId != null) {
    const planRows = await db
      .select({ exerciseId: planExercises.exerciseId })
      .from(planExercises)
      .where(eq(planExercises.planId, planId))
    plannedIds = new Set(planRows.map((r) => r.exerciseId))
  }

  // total = union of planned and completed (covers ad-hoc)
  const totalIds = new Set<number>([...plannedIds, ...completedIds])
  const total = totalIds.size || completed || 0

  return { completed, total }
}
```

- [ ] **Step 5.2: Typecheck**

Run: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 5.3: Run existing vitest suite (no new tests, just verify no break)**

Run: `npx vitest run`
Expected: all prior tests still green.

- [ ] **Step 5.4: Commit**

```bash
git add src/lib/queries/dashboard-sessions.ts
git commit -m "feat(dashboard): new query helpers (sessions 8w, exerciseCounts, activeProgress)"
```

---

## Task 6: `LifeAreaCard` component

Generic card. Dumb — takes pre-resolved input, renders.

**Files:**
- Create: `src/components/dashboard/LifeAreaCard.tsx`
- Create: `src/tests/dashboard/LifeAreaCard.test.tsx`

- [ ] **Step 6.1: Write the failing test**

```tsx
// src/tests/dashboard/LifeAreaCard.test.tsx
// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LifeAreaCard } from '@/components/dashboard/LifeAreaCard'

describe('LifeAreaCard', () => {
  const base = {
    label: 'TRAINING',
    value: '3 sessions',
    secondary: 'this week',
    href: '/training',
    visual: <div data-testid="viz" />,
  }

  it('renders label, value, secondary, and visual', () => {
    render(<LifeAreaCard {...base} empty={false} />)
    expect(screen.getByText('TRAINING')).toBeInTheDocument()
    expect(screen.getByText('3 sessions')).toBeInTheDocument()
    expect(screen.getByText('this week')).toBeInTheDocument()
    expect(screen.getByTestId('viz')).toBeInTheDocument()
  })

  it('wraps contents in an anchor to href', () => {
    render(<LifeAreaCard {...base} empty={false} />)
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/training')
  })

  it('applies muted styling when empty', () => {
    render(<LifeAreaCard {...base} empty={true} />)
    const link = screen.getByRole('link')
    expect(link.className).toContain('opacity-60')
  })

  it('omits visual when null', () => {
    render(<LifeAreaCard {...base} visual={null} empty={false} />)
    expect(screen.queryByTestId('viz')).toBeNull()
  })
})
```

- [ ] **Step 6.2: Run test to verify it fails**

Run: `npx vitest run src/tests/dashboard/LifeAreaCard.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 6.3: Implement**

```tsx
// src/components/dashboard/LifeAreaCard.tsx
import Link from 'next/link'
import type { ReactNode } from 'react'
import { cn } from '@/components/ui'

type Props = {
  label: string
  value: string
  secondary: string
  visual: ReactNode
  href: string
  empty: boolean
}

export function LifeAreaCard({ label, value, secondary, visual, href, empty }: Props) {
  return (
    <Link
      href={href}
      className={cn(
        'border-border bg-surface hover:border-accent block rounded-xl border p-4 transition-colors',
        empty && 'opacity-60'
      )}
    >
      <div className="text-muted text-[10px] font-medium tracking-[0.2em] uppercase">{label}</div>
      <div className="text-foreground mt-1 text-2xl font-bold">{value}</div>
      <div className="text-muted mt-0.5 text-xs">{secondary}</div>
      {visual && <div className="mt-3">{visual}</div>}
    </Link>
  )
}
```

- [ ] **Step 6.4: Run test to verify it passes**

Run: `npx vitest run src/tests/dashboard/LifeAreaCard.test.tsx`
Expected: PASS (4 tests).

- [ ] **Step 6.5: Commit**

```bash
git add src/components/dashboard/LifeAreaCard.tsx src/tests/dashboard/LifeAreaCard.test.tsx
git commit -m "feat(dashboard): LifeAreaCard generic component"
```

---

## Task 7: `TodayQuest` component

Renders one of 4 states from a `Quest` discriminated union.

**Files:**
- Create: `src/components/dashboard/TodayQuest.tsx`
- Create: `src/tests/dashboard/TodayQuest.test.tsx`

- [ ] **Step 7.1: Write the failing test**

```tsx
// src/tests/dashboard/TodayQuest.test.tsx
// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TodayQuest } from '@/components/dashboard/TodayQuest'

describe('TodayQuest', () => {
  it('active: renders plan name and progress, links to /training/{id}', () => {
    render(
      <TodayQuest
        quest={{ kind: 'active', sessionId: 77, planName: 'Upper A', completed: 3, total: 5 }}
      />
    )
    expect(screen.getByText(/Pokračuj v Upper A/i)).toBeInTheDocument()
    expect(screen.getByText(/3 ze 5 cviků hotovo/i)).toBeInTheDocument()
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/training/77')
  })

  it('rest: shows "Rest day" and next plan preview, non-clickable', () => {
    render(<TodayQuest quest={{ kind: 'rest', nextPlanName: 'Lower A' }} />)
    expect(screen.getByText('Rest day')).toBeInTheDocument()
    expect(screen.getByText(/Dnes regeneruj\. Zítra: Lower A/)).toBeInTheDocument()
    expect(screen.queryByRole('link')).toBeNull()
  })

  it('rest with null nextPlanName shows only "Dnes regeneruj."', () => {
    render(<TodayQuest quest={{ kind: 'rest', nextPlanName: null }} />)
    expect(screen.getByText('Dnes regeneruj.')).toBeInTheDocument()
  })

  it('scheduled: shows plan name, exercise count, links to /training', () => {
    render(<TodayQuest quest={{ kind: 'scheduled', planName: 'Upper A', exerciseCount: 8 }} />)
    expect(screen.getByText(/Upper A/)).toBeInTheDocument()
    expect(screen.getByText(/8 cviků/)).toBeInTheDocument()
    expect(screen.getByRole('link')).toHaveAttribute('href', '/training')
  })

  it('no-plan: shows motivational copy, links to /training', () => {
    render(<TodayQuest quest={{ kind: 'no-plan' }} />)
    expect(screen.getByText(/Začni svojí cestu/)).toBeInTheDocument()
    expect(screen.getByText(/Nastav si svůj první plán/)).toBeInTheDocument()
    expect(screen.getByRole('link')).toHaveAttribute('href', '/training')
  })

  it('all clickable states render the TODAY\'S QUEST label', () => {
    const states = [
      { kind: 'active', sessionId: 1, planName: 'X', completed: 0, total: 0 } as const,
      { kind: 'scheduled', planName: 'Y', exerciseCount: 5 } as const,
      { kind: 'no-plan' } as const,
    ]
    for (const quest of states) {
      const { unmount } = render(<TodayQuest quest={quest} />)
      expect(screen.getByText(/TODAY'S QUEST/i)).toBeInTheDocument()
      unmount()
    }
  })
})
```

- [ ] **Step 7.2: Run test to verify it fails**

Run: `npx vitest run src/tests/dashboard/TodayQuest.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 7.3: Implement**

```tsx
// src/components/dashboard/TodayQuest.tsx
import Link from 'next/link'
import type { Quest } from '@/lib/today-quest'
import { ProgressBar } from '@/components/ui'

function Label() {
  return (
    <div className="text-muted text-[10px] font-medium tracking-[0.2em] uppercase">
      Today&apos;s Quest
    </div>
  )
}

export function TodayQuest({ quest }: { quest: Quest }) {
  if (quest.kind === 'active') {
    return (
      <Link
        href={`/training/${quest.sessionId}`}
        className="bg-accent/10 hover:bg-accent/15 border-accent/40 block rounded-xl border p-4 transition-colors"
      >
        <Label />
        <div className="text-foreground mt-1 text-xl font-bold">
          ▶ Pokračuj v {quest.planName}
        </div>
        <div className="mt-2 flex items-center gap-3 text-xs">
          <span className="text-muted">
            {quest.completed} ze {quest.total} cviků hotovo
          </span>
          <ProgressBar
            value={quest.completed}
            max={Math.max(quest.total, 1)}
            tone="primary"
            height={4}
            className="w-24"
          />
        </div>
      </Link>
    )
  }

  if (quest.kind === 'rest') {
    return (
      <div className="bg-surface-raised border-border rounded-xl border p-4">
        <Label />
        <div className="text-muted mt-1 text-xl font-bold">Rest day</div>
        <div className="text-muted mt-1 text-xs">
          {quest.nextPlanName ? `Dnes regeneruj. Zítra: ${quest.nextPlanName}` : 'Dnes regeneruj.'}
        </div>
      </div>
    )
  }

  if (quest.kind === 'scheduled') {
    return (
      <Link
        href="/training"
        className="bg-accent/10 hover:bg-accent/15 border-accent/40 block rounded-xl border p-4 transition-colors"
      >
        <Label />
        <div className="text-foreground mt-1 text-xl font-bold">▶ {quest.planName}</div>
        <div className="text-muted mt-1 text-xs">{quest.exerciseCount} cviků</div>
      </Link>
    )
  }

  // no-plan
  return (
    <Link
      href="/training"
      className="bg-accent/10 hover:bg-accent/15 border-accent/40 block rounded-xl border p-4 transition-colors"
    >
      <Label />
      <div className="text-foreground mt-1 text-xl font-bold">Začni svojí cestu</div>
      <div className="text-muted mt-1 text-xs">Nastav si svůj první plán →</div>
    </Link>
  )
}
```

- [ ] **Step 7.4: Run test to verify it passes**

Run: `npx vitest run src/tests/dashboard/TodayQuest.test.tsx`
Expected: PASS (6 tests).

- [ ] **Step 7.5: Commit**

```bash
git add src/components/dashboard/TodayQuest.tsx src/tests/dashboard/TodayQuest.test.tsx
git commit -m "feat(dashboard): TodayQuest component with 4 states"
```

---

## Task 8: `StatusWindow` component

**Files:**
- Create: `src/components/dashboard/StatusWindow.tsx`
- Create: `src/tests/dashboard/StatusWindow.test.tsx`

- [ ] **Step 8.1: Write the failing test**

```tsx
// src/tests/dashboard/StatusWindow.test.tsx
// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StatusWindow } from '@/components/dashboard/StatusWindow'

describe('StatusWindow', () => {
  const base = {
    level: 7,
    currentXp: 340,
    xpToLevel: 500,
    xpForNext: 160,
    tier: 3 as const,
    tierName: 'Warrior',
    tierColor: '#ca8a04',
  }

  it('renders Level and tier name', () => {
    render(<StatusWindow {...base} streak={5} />)
    expect(screen.getByText('Level 7')).toBeInTheDocument()
    expect(screen.getByText(/Warrior/i)).toBeInTheDocument()
  })

  it('shows streak peek when streak > 0', () => {
    render(<StatusWindow {...base} streak={12} />)
    expect(screen.getByText(/day streak/i)).toBeInTheDocument()
    expect(screen.getByText('12')).toBeInTheDocument()
  })

  it('hides streak peek when streak === 0', () => {
    render(<StatusWindow {...base} streak={0} />)
    expect(screen.queryByText(/day streak/i)).toBeNull()
  })

  it('wraps in a link to /stats', () => {
    render(<StatusWindow {...base} streak={5} />)
    expect(screen.getByRole('link')).toHaveAttribute('href', '/stats')
  })

  it('applies animate-tier-glow via Avatar ringPulse when tier >= 3', () => {
    const { container } = render(<StatusWindow {...base} tier={3} streak={5} />)
    const glowEl = container.querySelector('.animate-tier-glow')
    expect(glowEl).not.toBeNull()
  })

  it('does NOT apply ringPulse when tier < 3', () => {
    const { container } = render(<StatusWindow {...base} tier={2} streak={5} />)
    const glowEl = container.querySelector('.animate-tier-glow')
    expect(glowEl).toBeNull()
  })

  it('shows XP remaining label', () => {
    render(<StatusWindow {...base} streak={5} />)
    expect(screen.getByText(/160 do L8/)).toBeInTheDocument()
  })
})
```

- [ ] **Step 8.2: Run test to verify it fails**

Run: `npx vitest run src/tests/dashboard/StatusWindow.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 8.3: Implement**

```tsx
// src/components/dashboard/StatusWindow.tsx
import Link from 'next/link'
import { Avatar } from '@/components/avatar/Avatar'
import { ProgressBar } from '@/components/ui'
import type { Tier } from '@/lib/tiers'

type Props = {
  level: number
  currentXp: number
  xpToLevel: number
  xpForNext: number
  tier: Tier
  tierName: string
  tierColor: string
  streak: number
}

export function StatusWindow({
  level,
  currentXp,
  xpToLevel,
  xpForNext,
  tier,
  tierName,
  tierColor,
  streak,
}: Props) {
  const today = new Date().toLocaleDateString('cs-CZ', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
  return (
    <Link
      href="/stats"
      className="border-border bg-surface hover:border-accent/60 block rounded-2xl border p-4 transition-colors"
    >
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted">{today}</span>
        {streak > 0 && (
          <span className="text-muted">
            🔥 <span className="text-accent font-semibold">{streak}</span> day streak
          </span>
        )}
      </div>
      <div className="mt-2 flex flex-col items-center gap-2">
        <Avatar tier={tier} size={140} ringPulse={tier >= 3} />
        <div className="text-3xl font-bold" style={{ color: tierColor }}>
          Level {level}
        </div>
        <div className="text-muted text-xs tracking-[0.3em] uppercase">— {tierName} —</div>
        <div className="mt-2 w-full">
          <ProgressBar value={currentXp} max={xpToLevel} variant="xp" height={8} />
          <div className="text-muted mt-1 flex justify-between text-xs">
            <span>{currentXp} XP</span>
            <span>
              {xpForNext} do L{level + 1}
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
```

- [ ] **Step 8.4: Run test to verify it passes**

Run: `npx vitest run src/tests/dashboard/StatusWindow.test.tsx`
Expected: PASS (7 tests).

- [ ] **Step 8.5: Commit**

```bash
git add src/components/dashboard/StatusWindow.tsx src/tests/dashboard/StatusWindow.test.tsx
git commit -m "feat(dashboard): StatusWindow hero card"
```

---

## Task 9: `WeekPeek` component

**Files:**
- Create: `src/components/dashboard/WeekPeek.tsx`
- Create: `src/tests/dashboard/WeekPeek.test.tsx`

- [ ] **Step 9.1: Write the failing test**

```tsx
// src/tests/dashboard/WeekPeek.test.tsx
// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { WeekPeek } from '@/components/dashboard/WeekPeek'
import type { WeekPeekDay } from '@/lib/week-peek'

const days: WeekPeekDay[] = [
  { weekdayLabel: 'Po', status: 'workout' },
  { weekdayLabel: 'Út', status: 'rest' },
  { weekdayLabel: 'St', status: 'workout' },
  { weekdayLabel: 'Čt', status: 'empty' },
  { weekdayLabel: 'Pá', status: 'empty' },
  { weekdayLabel: 'So', status: 'empty' },
  { weekdayLabel: 'Ne', status: 'empty' },
]

describe('WeekPeek', () => {
  it('renders all 7 weekday labels', () => {
    render(<WeekPeek days={days} />)
    for (const label of ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne']) {
      expect(screen.getByText(label)).toBeInTheDocument()
    }
  })

  it('renders legend line with all three glyphs', () => {
    render(<WeekPeek days={days} />)
    expect(screen.getByText(/workout/i)).toBeInTheDocument()
    expect(screen.getByText(/rest/i)).toBeInTheDocument()
    expect(screen.getByText(/future/i)).toBeInTheDocument()
  })

  it('wraps in a link to /training', () => {
    render(<WeekPeek days={days} />)
    expect(screen.getByRole('link')).toHaveAttribute('href', '/training')
  })

  it('applies status-specific data attributes on each day cell', () => {
    const { container } = render(<WeekPeek days={days} />)
    const cells = container.querySelectorAll('[data-day-status]')
    expect(cells).toHaveLength(7)
    expect(cells[0]!.getAttribute('data-day-status')).toBe('workout')
    expect(cells[1]!.getAttribute('data-day-status')).toBe('rest')
    expect(cells[3]!.getAttribute('data-day-status')).toBe('empty')
  })
})
```

- [ ] **Step 9.2: Run test to verify it fails**

Run: `npx vitest run src/tests/dashboard/WeekPeek.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 9.3: Implement**

```tsx
// src/components/dashboard/WeekPeek.tsx
import Link from 'next/link'
import type { WeekPeekDay } from '@/lib/week-peek'

const GLYPH: Record<WeekPeekDay['status'], string> = {
  workout: '●',
  rest: '○',
  empty: '·',
}

const COLOR: Record<WeekPeekDay['status'], string> = {
  workout: 'text-accent',
  rest: 'text-muted',
  empty: 'text-border',
}

export function WeekPeek({ days }: { days: WeekPeekDay[] }) {
  return (
    <Link
      href="/training"
      className="border-border bg-surface hover:border-accent/60 block rounded-xl border p-4 transition-colors"
    >
      <div className="grid grid-cols-7 gap-2 text-center">
        {days.map((d, i) => (
          <div key={i} data-day-status={d.status} className="flex flex-col items-center gap-1">
            <span className="text-muted text-[10px]">{d.weekdayLabel}</span>
            <span className={`text-lg leading-none ${COLOR[d.status]}`}>{GLYPH[d.status]}</span>
          </div>
        ))}
      </div>
      <div className="text-muted mt-3 text-center text-[10px]">
        <span className="text-accent">●</span> workout ·{' '}
        <span className="text-muted">○</span> rest · <span className="text-border">·</span> future
      </div>
    </Link>
  )
}
```

- [ ] **Step 9.4: Run test to verify it passes**

Run: `npx vitest run src/tests/dashboard/WeekPeek.test.tsx`
Expected: PASS (4 tests).

- [ ] **Step 9.5: Commit**

```bash
git add src/components/dashboard/WeekPeek.tsx src/tests/dashboard/WeekPeek.test.tsx
git commit -m "feat(dashboard): WeekPeek 7-day dot strip"
```

---

## Task 10: Dashboard page rewrite + delete obsolete components

**Files:**
- Rewrite: `src/app/(app)/dashboard/page.tsx`
- Delete: `src/components/dashboard/AvatarHero.tsx`
- Delete: `src/components/dashboard/TodayNutritionCard.tsx`
- Delete: `src/components/dashboard/WeekMeasurementCard.tsx`
- Delete: `src/components/dashboard/NutritionStreakCard.tsx`
- Delete: any tests referencing the deleted components (check first with grep)

- [ ] **Step 10.1: Check for tests referencing deleted components**

Run: `grep -rln "AvatarHero\|TodayNutritionCard\|WeekMeasurementCard\|NutritionStreakCard" src/tests/ tests/ 2>/dev/null`

For each test file found, delete only if it's a unit test for the deleted component. If it's an integration test with broader coverage, we'll update it after the page rewrite — note which files and revisit in Step 10.7.

- [ ] **Step 10.2: Verify types from `@/lib/tiers`**

Confirm the module exports `levelToTierMeta(level: number): { tier: Tier; name: string; color: string; ... }` and `xpToProgress(totalXp: number, currentLevel: number): { current: number; max: number }`. The dashboard page already uses these — no change needed.

- [ ] **Step 10.3: Rewrite `src/app/(app)/dashboard/page.tsx`**

```tsx
import { and, desc, eq, isNull } from 'drizzle-orm'
import { db } from '@/db/client'
import { sessions, plans } from '@/db/schema'
import { requireSessionUser } from '@/lib/auth-helpers'
import { redirect } from 'next/navigation'
import { getTotalXp } from '@/lib/xp'
import { xpToLevel } from '@/lib/xp-events'
import { checkAndFinishStaleSessions } from '@/lib/session-auto-finish'
import { Container, Stack } from '@/components/ui'
import { StatusWindow } from '@/components/dashboard/StatusWindow'
import { TodayQuest } from '@/components/dashboard/TodayQuest'
import { LifeAreaCard } from '@/components/dashboard/LifeAreaCard'
import { WeekPeek } from '@/components/dashboard/WeekPeek'
import { RegionHeader } from '@/components/dashboard/RegionHeader'
import { StagnationWarning } from '@/components/dashboard/StagnationWarning'
import { MuscleWidget } from '@/components/dashboard/MuscleWidget'
import { fetchWorkoutStreak } from '@/lib/queries/workout-streak'
import {
  fetchSessionsLast8Weeks,
  fetchExerciseCountsByPlan,
  fetchActiveSessionProgress,
} from '@/lib/queries/dashboard-sessions'
import { fetchRange as fetchMeasurements } from '@/lib/queries/measurements'
import { fetchRange as fetchNutrition } from '@/lib/queries/nutrition'
import { getMacros } from '@/lib/queries/user-prefs'
import { fetchStagnatingExercises } from '@/lib/queries/stagnation'
import { fetchMuscleVolumes } from '@/lib/queries/heatmap'
import { toWeekStart, weekRange } from '@/lib/week'
import { levelToTierMeta, xpToProgress } from '@/lib/tiers'
import { resolveTodayQuest } from '@/lib/today-quest'
import {
  resolveTrainingCard,
  resolveNutritionCard,
  resolveProgressCard,
  resolveStatsCard,
} from '@/lib/dashboard-life-areas'
import { resolveWeekPeek } from '@/lib/week-peek'

export default async function DashboardPage() {
  const user = await requireSessionUser()
  if (user instanceof Response) redirect('/login')

  await checkAndFinishStaleSessions(user.id, db)

  const today = new Date()
  const todayDate = today.toISOString().slice(0, 10)
  const thisWeekStart = toWeekStart(today)
  const last8Weeks = weekRange(today, 8)

  const totalXp = await getTotalXp(db, user.id)
  const level = xpToLevel(totalXp)
  const tierMeta = levelToTierMeta(level)
  const progress = xpToProgress(totalXp, level)

  const [active] = await db
    .select({ id: sessions.id, planId: sessions.planId, planName: plans.name })
    .from(sessions)
    .leftJoin(plans, eq(plans.id, sessions.planId))
    .where(and(eq(sessions.userId, user.id), isNull(sessions.finishedAt)))
    .limit(1)

  const streak = await fetchWorkoutStreak(db, user.id)
  const sessionsLast8Weeks = await fetchSessionsLast8Weeks(db, user.id, today)

  const userPlans = await db.select().from(plans).where(eq(plans.userId, user.id))
  const sortedPlans = [...userPlans].sort((a, b) => a.order - b.order)

  const lastFinishedRow = await db
    .select({ planId: sessions.planId, finishedAt: sessions.finishedAt })
    .from(sessions)
    .where(and(eq(sessions.userId, user.id)))
    .orderBy(desc(sessions.startedAt))
    .limit(1)
  const lastFinished = lastFinishedRow[0]?.finishedAt
    ? { planId: lastFinishedRow[0].planId, finishedAt: lastFinishedRow[0].finishedAt }
    : null

  const exerciseCounts = await fetchExerciseCountsByPlan(
    db,
    sortedPlans.map((p) => p.id)
  )

  const activeProgress = active
    ? await fetchActiveSessionProgress(db, active.id, active.planId ?? null)
    : null

  const quest = resolveTodayQuest({
    activeSession: active && activeProgress
      ? {
          id: active.id,
          planName: active.planName ?? 'trénink',
          completed: activeProgress.completed,
          total: activeProgress.total,
        }
      : null,
    lastFinished,
    plans: sortedPlans,
    exerciseCounts,
    today,
  })

  const [measurementsRows, macros, recentNutrition] = await Promise.all([
    fetchMeasurements(db, user.id, last8Weeks[0]!, last8Weeks[last8Weeks.length - 1]!),
    getMacros(db, user.id),
    (async () => {
      const fromDate = new Date(today)
      fromDate.setUTCDate(fromDate.getUTCDate() - 30)
      const fromDateStr = fromDate.toISOString().slice(0, 10)
      return fetchNutrition(db, user.id, fromDateStr, todayDate)
    })(),
  ])

  const stagnation = await fetchStagnatingExercises(db, user.id, today)
  const heatmapData = await fetchMuscleVolumes(db, user.id, 7)

  const byWeek = new Map(measurementsRows.map((m) => [m.weekStart, m]))
  const thisWeekRow = byWeek.get(thisWeekStart) ?? null
  const todayRow = recentNutrition.find((d) => d.date === todayDate) ?? null

  const weightSeries = last8Weeks.map((w) => {
    const v = byWeek.get(w)?.weightKg
    return v == null ? null : Number(v)
  })

  const trainingCard = resolveTrainingCard(sessionsLast8Weeks, today)
  const nutritionCard = resolveNutritionCard(
    todayRow
      ? {
          kcalActual: todayRow.kcalActual ?? null,
          targetKcal: thisWeekRow?.targetKcal ?? null,
        }
      : null,
    thisWeekRow ? { targetKcal: thisWeekRow.targetKcal ?? null } : null
  )
  const progressCard = resolveProgressCard(weightSeries)
  const statsCard = resolveStatsCard(level, totalXp)
  const weekPeekDays = resolveWeekPeek(sessionsLast8Weeks, today)

  // Note: `macros` is kept for future use in nutrition visual tone; unused
  // placeholder will be wired in a follow-up if meaningful
  void macros

  return (
    <Container size="full">
      <Stack gap={5} className="py-4">
        <StatusWindow
          level={level}
          currentXp={progress.current}
          xpToLevel={progress.max}
          xpForNext={progress.max - progress.current}
          tier={tierMeta.tier}
          tierName={tierMeta.name}
          tierColor={tierMeta.color}
          streak={streak}
        />
        <TodayQuest quest={quest} />
        <section>
          <RegionHeader>Life Areas</RegionHeader>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <LifeAreaCard
              label="TRAINING"
              value={trainingCard.value}
              secondary={trainingCard.secondary}
              visual={trainingCard.visual}
              empty={trainingCard.empty}
              href="/training"
            />
            <LifeAreaCard
              label="NUTRITION"
              value={nutritionCard.value}
              secondary={nutritionCard.secondary}
              visual={nutritionCard.visual}
              empty={nutritionCard.empty}
              href="/nutrition"
            />
            <LifeAreaCard
              label="PROGRESS"
              value={progressCard.value}
              secondary={progressCard.secondary}
              visual={progressCard.visual}
              empty={progressCard.empty}
              href="/progress"
            />
            <LifeAreaCard
              label="STATS"
              value={statsCard.value}
              secondary={statsCard.secondary}
              visual={statsCard.visual}
              empty={statsCard.empty}
              href="/stats"
            />
          </div>
        </section>
        <section>
          <RegionHeader>Muscle Volume</RegionHeader>
          <MuscleWidget data={heatmapData.muscles} maxVolume={heatmapData.maxVolume} />
        </section>
        <section>
          <RegionHeader>This Week</RegionHeader>
          <WeekPeek days={weekPeekDays} />
        </section>
        {stagnation.length > 0 && <StagnationWarning items={stagnation} />}
      </Stack>
    </Container>
  )
}
```

- [ ] **Step 10.4: Remove the `macros` query if no longer consumed**

Review the rewritten page — `macros` query is unused. Delete the `getMacros` call and the `void macros` workaround. The final Promise.all becomes:

```ts
const [measurementsRows, recentNutrition] = await Promise.all([
  fetchMeasurements(db, user.id, last8Weeks[0]!, last8Weeks[last8Weeks.length - 1]!),
  (async () => { /* ... */ })(),
])
```

And remove `import { getMacros } from '@/lib/queries/user-prefs'`.

(If `macros` IS needed later — e.g., to set nutrition bar tone based on tracked macros — re-add as a separate task.)

- [ ] **Step 10.5: Delete obsolete components**

```bash
git rm src/components/dashboard/AvatarHero.tsx
git rm src/components/dashboard/TodayNutritionCard.tsx
git rm src/components/dashboard/WeekMeasurementCard.tsx
git rm src/components/dashboard/NutritionStreakCard.tsx
```

- [ ] **Step 10.6: Delete tests for deleted components**

For each test file from Step 10.1 that was a unit test of a deleted component, `git rm` it. Skip integration/e2e tests that test the page as a whole.

Run: `grep -rln "AvatarHero\|TodayNutritionCard\|WeekMeasurementCard\|NutritionStreakCard" src/`
Expected: zero matches.

- [ ] **Step 10.7: Typecheck + vitest**

```bash
npx tsc --noEmit && npx vitest run
```

Expected: both clean. If any integration test references the deleted components by their JSX output or test IDs, update it to test the new composition instead (or remove if redundant with the new component unit tests).

- [ ] **Step 10.8: Commit**

```bash
git add -A
git commit -m "refactor(dashboard): rewrite /dashboard as Life Areas composition; remove 4 obsolete cards"
```

---

## Task 11: E2E smoke for the new dashboard

**Files:**
- Create: `tests/e2e/dashboard-sp3.spec.ts`
- Modify: `tests/e2e/dashboard-m3.spec.ts` if it asserts on specific card text now deleted

- [ ] **Step 11.1: Inspect the existing M3 spec**

Run: `cat tests/e2e/dashboard-m3.spec.ts`

Identify any assertions that target `AvatarHero`, `TodayNutritionCard`, `WeekMeasurementCard`, or `NutritionStreakCard` by text content or component test IDs. These will need rewording or removal once the dashboard is rewritten.

If the file primarily asserts on the card texts that no longer exist, rename it to something like `dashboard-m3-legacy.spec.ts` and mark its tests `test.skip()`, OR simply delete it if the scenarios are now covered by the new spec. Prefer deletion if >80% is obsolete — cleaner.

- [ ] **Step 11.2: Create `dashboard-sp3.spec.ts`**

```ts
// tests/e2e/dashboard-sp3.spec.ts
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

test.describe('SP3 dashboard composition', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('StatusWindow, TodayQuest, and 4 Life Area cards render', async ({ page }) => {
    await expect(page.getByText(/Level \d+/)).toBeVisible()
    await expect(page.getByText(/TODAY'S QUEST/i)).toBeVisible()
    // 4 life area labels
    for (const label of ['TRAINING', 'NUTRITION', 'PROGRESS', 'STATS']) {
      await expect(page.getByText(label).first()).toBeVisible()
    }
  })

  test('region headers visible', async ({ page }) => {
    await expect(page.getByText(/Life Areas/i).first()).toBeVisible()
    await expect(page.getByText(/Muscle Volume/i).first()).toBeVisible()
    await expect(page.getByText(/This Week/i).first()).toBeVisible()
  })

  test('clicking TRAINING life area navigates to /training', async ({ page }) => {
    await page.getByRole('link').filter({ hasText: 'TRAINING' }).first().click()
    await expect(page).toHaveURL(/\/training/)
  })

  test('clicking STATS life area navigates to /stats', async ({ page }) => {
    await page.goto('/dashboard')
    await page.getByRole('link').filter({ hasText: 'STATS' }).first().click()
    await expect(page).toHaveURL(/\/stats/)
  })

  test('week peek strip links to /training', async ({ page }) => {
    await page.goto('/dashboard')
    // WeekPeek is the link wrapping the 7-day grid. Use legend text to locate.
    const weekPeek = page
      .locator('a', { hasText: /workout.*rest.*future/i })
      .first()
    await weekPeek.click()
    await expect(page).toHaveURL(/\/training/)
  })
})
```

- [ ] **Step 11.3: Verify the suite compiles**

Run: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 11.4: Attempt run (best-effort)**

If the demo user is seeded (`demo@hexis.local` — different email from E2E default), either update the env vars before running or accept that Playwright will fail at login and verify specs only structurally.

If you can run:

```bash
E2E_EMAIL=demo@hexis.local E2E_PASSWORD=Demo1234 npx playwright test tests/e2e/dashboard-sp3.spec.ts
```

Report which tests pass/fail. Non-auth failures (e.g., text assertion mismatches on the demo user's empty state) should be fixed in the spec (relax to check for either populated or empty text).

- [ ] **Step 11.5: Commit**

```bash
git add tests/e2e/dashboard-sp3.spec.ts
git rm tests/e2e/dashboard-m3.spec.ts  # only if obsoleted per Step 11.1
git commit -m "test(e2e): dashboard-sp3 spec (StatusWindow + TodayQuest + Life Areas)"
```

---

## Task 12: Full-suite verification + guard checks

- [ ] **Step 12.1: Full vitest**

```bash
npx vitest run
```
Expected: all green. Note the final test count — should be previous count (411) plus ~40 new (1 RegionHeader + 9 today-quest + 13 life-areas + 5 week-peek + 4 LifeAreaCard + 6 TodayQuest + 7 StatusWindow + 4 WeekPeek = ~49 new) minus any tests removed for deleted components.

- [ ] **Step 12.2: Typecheck**

```bash
npx tsc --noEmit
```
Expected: clean.

- [ ] **Step 12.3: Lint**

```bash
npm run lint
```
Expected: clean.

- [ ] **Step 12.4: Nested-import guard (SP1 §11.2)**

```bash
grep -r "@/components/ui/primitive/" src/ tests/ | grep -v "index.ts"
```
Expected: zero matches outside barrel.

- [ ] **Step 12.5: Live browser smoke**

```bash
npm run dev
```

Login as `demo@hexis.local / Demo1234`. Verify:

- StatusWindow renders with avatar, Level, tier name, XP bar
- Streak peek appears (demo user likely has some session history; if 0, streak peek is hidden — correct behavior)
- TodayQuest shows appropriate state for demo user's history
- Life Area grid: 2×2 on mobile (360 px), 4×1 on desktop
- Each Life Area card has label + value + secondary + visual, empty states where applicable
- MuscleWidget renders beneath "M U S C L E  V O L U M E" header
- WeekPeek shows 7 day cells with correct glyphs for today's position in the week
- Hover states: cards get `border-accent`
- Stagnation warning only shows when data present

If any visual issue: fix and commit a small follow-up in this task.

---

## Task 13: Pull request

- [ ] **Step 13.1: Push branch**

```bash
git push -u origin sp3-dashboard-reimagined
```

- [ ] **Step 13.2: Open PR**

Title: `SP3 — Dashboard reimagined (Status Window + Today's Quest + Life Areas)`

Body template:

```markdown
## Summary
- Replaces MVP dashboard's 8-card vertical stack with Life-Areas composition: StatusWindow, TodayQuest, 2×2 Life Area grid, MuscleWidget (kept), WeekPeek, conditional Stagnation alert
- First user-facing adoption of quest vocabulary (TodayQuest label, "Pokračuj v X", "Začni svojí cestu")
- Placeholder hero SVG tier avatar rendered full-width in StatusWindow (artwork upgrade deferred per roadmap)
- Pure resolvers for each card (`resolveTrainingCard`, `resolveNutritionCard`, `resolveProgressCard`, `resolveStatsCard`), quest state (`resolveTodayQuest`), and week peek (`resolveWeekPeek`) — dashboard page becomes orchestration; components stay presentational
- Two new query helpers: `fetchSessionsLast8Weeks`, `fetchExerciseCountsByPlan`, `fetchActiveSessionProgress`
- Deletes 4 obsolete card components: AvatarHero, TodayNutritionCard, WeekMeasurementCard, NutritionStreakCard

Spec: `docs/superpowers/specs/2026-04-24-sp3-dashboard-reimagined-design.md`
Plan: `docs/superpowers/plans/2026-04-24-sp3-dashboard-reimagined-plan.md`

## Test plan
- [ ] Unit tests: ~49 new across 8 test files (resolvers + components)
- [ ] Full suite green (expected ~460+)
- [ ] Typecheck + lint clean
- [ ] §11.2 guard: 0 matches
- [ ] Live browser smoke on demo user at 360 px and 1280 px
- [ ] Dashboard E2E spec passes (demo user credentials or seeded E2E user)
- [ ] All 4 Life Area cards navigate to correct detail pages
- [ ] Empty states render for demo scenarios (no measurements / no nutrition target)
```

- [ ] **Step 13.3: Return PR URL**

Report the URL when `gh pr create` succeeds.

---

## Self-Review checklist

**Spec coverage:**

- §3 composition → Task 10 page rewrite (6 sections in order)
- §4.1 StatusWindow → Task 8
- §4.2 TodayQuest (4 states, Quest union) → Tasks 2 + 7
- §4.3 LifeAreaCard + 4 resolvers → Tasks 3 + 6
- §4.4 WeekPeek + resolveWeekPeek → Tasks 4 + 9
- §4.5 kept components (StagnationWarning, MuscleWidget) → Task 10 integrates, no change
- §4.6 deleted components → Task 10.5
- §4.7 RegionHeader → Task 1
- §5 page rewrite + new queries → Tasks 5 + 10
- §7 commit slicing → matches Tasks 1–13
- §8 testing → unit tests per component/resolver (1–9) + E2E (11) + smoke (12.5)
- §9 acceptance → Task 12 verification steps
- §10 out of scope → respected (no new detail pages, no Muscle Rank radar, no habits, no artwork upgrade, no time estimate, no missed-scheduled glyph, no domain rename)

**Placeholder scan:** No TBD / TODO / "fill in". All code blocks complete.

**Type consistency:**
- `Quest` union defined in Task 2 and used unchanged in Task 7
- `LifeAreaInput` defined in Task 3 and consumed unchanged in Task 6
- `WeekPeekDay` defined in Task 4 and consumed unchanged in Task 9
- Tier/color come from existing `@/lib/tiers` (unchanged)
- `StatusWindow` props match between Task 8's test, implementation, and the Task 10 page call site (`level`, `currentXp`, `xpToLevel`, `xpForNext`, `tier`, `tierName`, `tierColor`, `streak`)

**Deviations from spec:**
- §4.2 spec shows `exerciseCount × 5 min` time estimate as nice-to-have; plan defers it explicitly (spec already marks as deferred)
- §4.3 Nutrition `value` when no kcal but target exists — spec says `dnešní {kcal} (or dash if not logged)`; plan implements as literal em-dash `—`, matches

---

## Execution Handoff

**Plan complete and saved to `docs/superpowers/plans/2026-04-24-sp3-dashboard-reimagined-plan.md`. Two execution options:**

**1. Subagent-Driven (recommended)** — fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** — execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
