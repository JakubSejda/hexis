# SP2 — Information Architecture & Navigation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/superpowers/specs/2026-04-24-sp2-ia-navigation-design.md`

**Goal:** Flatten the `/progress` umbrella into top-level Life Areas, introduce a responsive shell (bottom tabs on mobile, sidebar on desktop), move routes, and wire redirects — all without touching page content beyond the minimum needed for the route moves.

**Architecture:** New shell components in `src/components/shell/` (new folder — these are app-level, not design-system primitives): `AppShell` (server, async, orchestrator), `AppHeader` (client, uses `usePathname`), `Sidebar` (client), `BottomNav` (client). Active nav state is derived from `usePathname()` via a shared `useActiveArea()` hook — no `area` prop threaded through pages. `AppShell` fetches the workout streak (extracted from the current dashboard inline code into `src/lib/workout-streak.ts` + `src/lib/queries/workout-streak.ts`) and passes it to `AppHeader`.

**Tech Stack:** Next.js 16 (App Router), React 19, Tailwind 4 (tokens already include `--color-accent: #f59e0b`), Radix Menu (via existing `Menu` compound), `lucide-react`, Vitest 4 + `@testing-library/react` for unit/integration, Playwright for E2E. Redirects go in `next.config.ts` via `redirects()` (not middleware — auth already lives there).

**Codebase conventions (from SP1):**
- Per-file `// @vitest-environment jsdom` pragma for tests that render DOM
- `afterEach(cleanup)` is already in `src/tests/setup.ts` — tests don't need to repeat it
- Barrel exports: top-level `src/components/ui/index.ts` re-exports everything; consumers must import from the top barrel, never from `@/components/ui/primitive/*` or `@/components/ui/compound/*` (enforced by SP1 §11.2 grep guard — `grep -r "@/components/ui/primitive/" src/ tests/` must return 0 matches)
- Shell components live in a new `src/components/shell/` folder with its own `index.ts` barrel; consumers import from `@/components/shell`
- Tailwind 4 lookup-table pattern: variants as `const VARIANT: Record<Variant, string> = { ... }`
- Design tokens used via Tailwind utilities: `text-accent`, `bg-accent`, `border-accent`, `text-muted`, `bg-surface`, `bg-surface-raised`, etc.

---

## File Structure

**Created:**

- `src/components/shell/AppShell.tsx` — server async orchestrator
- `src/components/shell/AppHeader.tsx` — client, letter-spaced label + streak peek + avatar dropdown
- `src/components/shell/Sidebar.tsx` — client, desktop sidebar with SP5 placeholders
- `src/components/shell/BottomNav.tsx` — client, mobile bottom tabs
- `src/components/shell/use-active-area.ts` — client hook deriving `Area` from `usePathname()`
- `src/components/shell/area-meta.ts` — single source of truth: `Area` type + `AREA_META` map (label, route, icon)
- `src/components/shell/index.ts` — barrel export
- `src/lib/workout-streak.ts` — pure `computeWorkoutStreak(dates: Date[]): number`
- `src/lib/queries/workout-streak.ts` — `fetchWorkoutStreak(db, userId): Promise<number>`
- `src/tests/shell/BottomNav.test.tsx`
- `src/tests/shell/Sidebar.test.tsx`
- `src/tests/shell/AppHeader.test.tsx`
- `src/tests/shell/use-active-area.test.tsx`
- `src/tests/lib/workout-streak.test.ts`
- `tests/e2e/nav.spec.ts`
- `src/app/(app)/training/page.tsx` (moved from `workout/page.tsx`)
- `src/app/(app)/training/[sessionId]/page.tsx` (moved from `workout/[sessionId]/page.tsx`)
- `src/app/(app)/stats/page.tsx` (moved from `avatar/page.tsx`)
- `src/app/(app)/stats/strength/page.tsx` (moved from `progress/strength/page.tsx`)
- `src/app/(app)/nutrition/page.tsx` (moved from `progress/nutrition/page.tsx`)
- `src/app/(app)/settings/page.tsx` (new — settings index)

**Modified:**

- `src/app/(app)/layout.tsx` — replace inline TabLink nav with `<AppShell>`; delete `TabLink` function
- `src/app/(app)/progress/page.tsx` — replace the redirect-to-`/progress/body` with the real measurements content (moved from `progress/body/page.tsx`)
- `src/app/(app)/progress/layout.tsx` — delete `ProgressSegmentControl`, simplify to plain container or delete the file entirely
- `src/app/(app)/dashboard/page.tsx` — inline `computeStreak` deleted, import `fetchWorkoutStreak` from new module; update `/workout` href → `/training`
- `src/components/dashboard/AvatarHero.tsx` — `/avatar` → `/stats`
- `src/components/dashboard/StagnationWarning.tsx` — `/progress/strength` → `/stats/strength`
- `src/components/dashboard/TodayNutritionCard.tsx` — `/progress/nutrition` → `/nutrition`
- `src/components/dashboard/WeekMeasurementCard.tsx` — `/progress/body` → `/progress`
- `src/sw.ts` — `/workout` → `/training`
- `src/components/ui/primitive/SegmentControl.tsx` — delete the `ProgressSegmentControl` export; `SegmentControl` becomes unused, delete as well (YAGNI — zero remaining consumers)
- `src/components/ui/primitive/index.ts` — remove `SegmentControl` + `ProgressSegmentControl` exports
- `next.config.ts` — add `redirects()` block
- `src/app/globals.css` — no change (accent token already exists)

**Deleted:**

- `src/app/(app)/workout/page.tsx` (moved)
- `src/app/(app)/workout/[sessionId]/page.tsx` (moved)
- `src/app/(app)/avatar/page.tsx` (moved)
- `src/app/(app)/progress/body/page.tsx` (content moved to `progress/page.tsx`)
- `src/app/(app)/progress/nutrition/page.tsx` (moved)
- `src/app/(app)/progress/strength/page.tsx` (moved)
- `src/components/ui/primitive/SegmentControl.tsx` (dead code after route flatten)

---

## Area metadata (single source of truth)

All shell components consume the same `AREA_META` map. Defining it first so every later task uses identical keys.

```ts
// src/components/shell/area-meta.ts
import { Home, Dumbbell, TrendingUp, Apple, User, Settings, Gift, ListChecks, UserCircle2, CalendarDays } from 'lucide-react'
import type { ComponentType, SVGProps } from 'react'

export type Area = 'dashboard' | 'training' | 'progress' | 'nutrition' | 'stats' | 'settings'
export type PlaceholderArea = 'rewards' | 'habits' | 'bio' | 'calendar'

type Meta = {
  label: string
  href: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
  /** routes whose pathname should mark this area active (primary + sub-routes) */
  matches: (pathname: string) => boolean
}

export const AREA_META: Record<Area, Meta> = {
  dashboard: {
    label: 'Dashboard',
    href: '/dashboard',
    icon: Home,
    matches: (p) => p === '/dashboard' || p.startsWith('/dashboard/'),
  },
  training: {
    label: 'Training',
    href: '/training',
    icon: Dumbbell,
    matches: (p) => p === '/training' || p.startsWith('/training/'),
  },
  progress: {
    label: 'Progress',
    href: '/progress',
    icon: TrendingUp,
    matches: (p) => p === '/progress' || p.startsWith('/progress/'),
  },
  nutrition: {
    label: 'Nutrition',
    href: '/nutrition',
    icon: Apple,
    matches: (p) => p === '/nutrition' || p.startsWith('/nutrition/'),
  },
  stats: {
    label: 'Stats',
    href: '/stats',
    icon: User,
    matches: (p) => p === '/stats' || p.startsWith('/stats/'),
  },
  settings: {
    label: 'Settings',
    href: '/settings',
    icon: Settings,
    matches: (p) => p === '/settings' || p.startsWith('/settings/'),
  },
}

export const MOBILE_TABS: readonly Area[] = ['dashboard', 'training', 'progress', 'stats'] as const
export const SIDEBAR_AREAS: readonly Area[] = ['dashboard', 'training', 'nutrition', 'progress', 'stats'] as const

export const PLACEHOLDER_META: Record<PlaceholderArea, { label: string; icon: ComponentType<SVGProps<SVGSVGElement>> }> = {
  rewards:  { label: 'Rewards',        icon: Gift },
  habits:   { label: 'Habits',         icon: ListChecks },
  bio:      { label: 'Player Bio',     icon: UserCircle2 },
  calendar: { label: 'Quest Calendar', icon: CalendarDays },
}

export const PLACEHOLDER_ORDER: readonly PlaceholderArea[] = ['rewards', 'habits', 'bio', 'calendar'] as const
```

---

## Task 1: Area metadata + `useActiveArea` hook

**Files:**
- Create: `src/components/shell/area-meta.ts`
- Create: `src/components/shell/use-active-area.ts`
- Create: `src/components/shell/index.ts`
- Create: `src/tests/shell/use-active-area.test.tsx`

- [ ] **Step 1.1: Write the failing test**

Create `src/tests/shell/use-active-area.test.tsx`:

```tsx
// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useActiveArea } from '@/components/shell'

vi.mock('next/navigation', () => ({
  usePathname: vi.fn(),
}))

import { usePathname } from 'next/navigation'

describe('useActiveArea', () => {
  it('returns "dashboard" for /dashboard', () => {
    vi.mocked(usePathname).mockReturnValue('/dashboard')
    const { result } = renderHook(() => useActiveArea())
    expect(result.current).toBe('dashboard')
  })

  it('returns "training" for /training and /training/:id', () => {
    vi.mocked(usePathname).mockReturnValue('/training/abc-123')
    const { result } = renderHook(() => useActiveArea())
    expect(result.current).toBe('training')
  })

  it('returns "progress" for /progress and /progress/photos', () => {
    vi.mocked(usePathname).mockReturnValue('/progress/photos')
    const { result } = renderHook(() => useActiveArea())
    expect(result.current).toBe('progress')
  })

  it('returns "stats" for /stats/strength', () => {
    vi.mocked(usePathname).mockReturnValue('/stats/strength')
    const { result } = renderHook(() => useActiveArea())
    expect(result.current).toBe('stats')
  })

  it('returns null for unmatched paths', () => {
    vi.mocked(usePathname).mockReturnValue('/login')
    const { result } = renderHook(() => useActiveArea())
    expect(result.current).toBeNull()
  })
})
```

- [ ] **Step 1.2: Run test to verify it fails**

Run: `npx vitest run src/tests/shell/use-active-area.test.tsx`
Expected: FAIL with `Cannot find module '@/components/shell'`.

- [ ] **Step 1.3: Create `area-meta.ts`**

Write the exact content from the "Area metadata" section above into `src/components/shell/area-meta.ts`. Do not change key names or routes — later tasks depend on them.

- [ ] **Step 1.4: Create `use-active-area.ts`**

```ts
// src/components/shell/use-active-area.ts
'use client'
import { usePathname } from 'next/navigation'
import { AREA_META, type Area } from './area-meta'

export function useActiveArea(): Area | null {
  const pathname = usePathname() ?? ''
  for (const [key, meta] of Object.entries(AREA_META)) {
    if (meta.matches(pathname)) return key as Area
  }
  return null
}
```

- [ ] **Step 1.5: Create barrel**

```ts
// src/components/shell/index.ts
export { AREA_META, MOBILE_TABS, SIDEBAR_AREAS, PLACEHOLDER_META, PLACEHOLDER_ORDER } from './area-meta'
export type { Area, PlaceholderArea } from './area-meta'
export { useActiveArea } from './use-active-area'
```

- [ ] **Step 1.6: Run test to verify it passes**

Run: `npx vitest run src/tests/shell/use-active-area.test.tsx`
Expected: PASS (5 tests).

- [ ] **Step 1.7: Commit**

```bash
git add src/components/shell/area-meta.ts src/components/shell/use-active-area.ts src/components/shell/index.ts src/tests/shell/use-active-area.test.tsx
git commit -m "feat(shell): area metadata + useActiveArea hook"
```

---

## Task 2: Workout streak utilities

Extract the inline `computeStreak` from `dashboard/page.tsx` into a reusable module, and add a query helper that `AppShell` will call.

**Files:**
- Create: `src/lib/workout-streak.ts`
- Create: `src/lib/queries/workout-streak.ts`
- Create: `src/tests/lib/workout-streak.test.ts`
- Modify: `src/app/(app)/dashboard/page.tsx`

- [ ] **Step 2.1: Write the failing test**

Create `src/tests/lib/workout-streak.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { computeWorkoutStreak } from '@/lib/workout-streak'

describe('computeWorkoutStreak', () => {
  const mkDate = (iso: string) => new Date(iso + 'T12:00:00Z')

  it('returns 0 when no sessions', () => {
    expect(computeWorkoutStreak([], mkDate('2026-04-24'))).toBe(0)
  })

  it('returns 1 when session today', () => {
    expect(computeWorkoutStreak([mkDate('2026-04-24')], mkDate('2026-04-24'))).toBe(1)
  })

  it('returns 3 for three consecutive days ending today', () => {
    const dates = [mkDate('2026-04-24'), mkDate('2026-04-23'), mkDate('2026-04-22')]
    expect(computeWorkoutStreak(dates, mkDate('2026-04-24'))).toBe(3)
  })

  it('allows yesterday as start if no session today yet', () => {
    const dates = [mkDate('2026-04-23'), mkDate('2026-04-22')]
    expect(computeWorkoutStreak(dates, mkDate('2026-04-24'))).toBe(2)
  })

  it('returns 0 if gap of 2+ days from today', () => {
    const dates = [mkDate('2026-04-21'), mkDate('2026-04-20')]
    expect(computeWorkoutStreak(dates, mkDate('2026-04-24'))).toBe(0)
  })

  it('ignores duplicate sessions within a single day', () => {
    const dates = [mkDate('2026-04-24'), mkDate('2026-04-24'), mkDate('2026-04-23')]
    expect(computeWorkoutStreak(dates, mkDate('2026-04-24'))).toBe(2)
  })
})
```

- [ ] **Step 2.2: Run test to verify it fails**

Run: `npx vitest run src/tests/lib/workout-streak.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 2.3: Create `workout-streak.ts`**

```ts
// src/lib/workout-streak.ts
/**
 * Counts consecutive days ending today (or yesterday, if no session today yet)
 * on which at least one workout session started. Returns 0 if the chain is broken.
 */
export function computeWorkoutStreak(startedAts: Date[], now: Date = new Date()): number {
  if (startedAts.length === 0) return 0
  const days = new Set(startedAts.map((d) => d.toISOString().slice(0, 10)))
  const cursor = new Date(now)
  cursor.setUTCHours(0, 0, 0, 0)
  const todayKey = cursor.toISOString().slice(0, 10)
  if (!days.has(todayKey)) {
    cursor.setUTCDate(cursor.getUTCDate() - 1)
    if (!days.has(cursor.toISOString().slice(0, 10))) return 0
  }
  let streak = 0
  while (days.has(cursor.toISOString().slice(0, 10))) {
    streak += 1
    cursor.setUTCDate(cursor.getUTCDate() - 1)
  }
  return streak
}
```

- [ ] **Step 2.4: Run test to verify it passes**

Run: `npx vitest run src/tests/lib/workout-streak.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 2.5: Create query helper**

```ts
// src/lib/queries/workout-streak.ts
import { desc, eq } from 'drizzle-orm'
import { sessions } from '@/db/schema'
import type { db as DbClient } from '@/db/client'
import { computeWorkoutStreak } from '@/lib/workout-streak'

export async function fetchWorkoutStreak(db: typeof DbClient, userId: string): Promise<number> {
  const rows = await db
    .select({ startedAt: sessions.startedAt })
    .from(sessions)
    .where(eq(sessions.userId, userId))
    .orderBy(desc(sessions.startedAt))
    .limit(60)
  return computeWorkoutStreak(rows.map((r) => r.startedAt))
}
```

- [ ] **Step 2.6: Refactor dashboard to use the new helper**

In `src/app/(app)/dashboard/page.tsx`:

1. Delete the `function computeStreak(...)` definition at the bottom of the file (lines ~199–215).
2. Replace the inline streak query block (lines ~43–49) with a single call:

```ts
import { fetchWorkoutStreak } from '@/lib/queries/workout-streak'
// ...
const streak = await fetchWorkoutStreak(db, user.id)
```

Remove the now-unused `last7` variable and its select query. The rest of the page (plans, measurements, etc.) stays unchanged.

- [ ] **Step 2.7: Run full suite to verify no regression**

Run: `npm run test -- --run`
Expected: all tests pass (no regressions; new workout-streak tests added; dashboard rendering unaffected).

- [ ] **Step 2.8: Commit**

```bash
git add src/lib/workout-streak.ts src/lib/queries/workout-streak.ts src/tests/lib/workout-streak.test.ts src/app/\(app\)/dashboard/page.tsx
git commit -m "refactor(streak): extract workout streak into reusable module"
```

---

## Task 3: BottomNav component (TDD)

**Files:**
- Create: `src/components/shell/BottomNav.tsx`
- Create: `src/tests/shell/BottomNav.test.tsx`
- Modify: `src/components/shell/index.ts`

- [ ] **Step 3.1: Write the failing test**

Create `src/tests/shell/BottomNav.test.tsx`:

```tsx
// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BottomNav } from '@/components/shell'

vi.mock('next/navigation', () => ({
  usePathname: vi.fn(),
}))

import { usePathname } from 'next/navigation'

describe('BottomNav', () => {
  it('renders four tabs: Dashboard, Training, Progress, Stats', () => {
    vi.mocked(usePathname).mockReturnValue('/dashboard')
    render(<BottomNav />)
    expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /training/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /progress/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /stats/i })).toBeInTheDocument()
  })

  it('marks the Progress tab active when pathname is /progress/photos', () => {
    vi.mocked(usePathname).mockReturnValue('/progress/photos')
    render(<BottomNav />)
    const progress = screen.getByRole('link', { name: /progress/i })
    expect(progress).toHaveAttribute('aria-current', 'page')
  })

  it('does not mark any tab active when pathname is /nutrition', () => {
    vi.mocked(usePathname).mockReturnValue('/nutrition')
    render(<BottomNav />)
    expect(screen.queryByRole('link', { current: 'page' })).toBeNull()
  })
})
```

- [ ] **Step 3.2: Run test to verify it fails**

Run: `npx vitest run src/tests/shell/BottomNav.test.tsx`
Expected: FAIL (`BottomNav` not exported).

- [ ] **Step 3.3: Implement BottomNav**

```tsx
// src/components/shell/BottomNav.tsx
'use client'
import Link from 'next/link'
import { AREA_META, MOBILE_TABS } from './area-meta'
import { useActiveArea } from './use-active-area'
import { cn } from '@/components/ui'

export function BottomNav() {
  const active = useActiveArea()
  return (
    <nav
      aria-label="Primary"
      className="border-border bg-surface fixed right-0 bottom-0 left-0 z-40 flex h-16 border-t pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      {MOBILE_TABS.map((area) => {
        const meta = AREA_META[area]
        const Icon = meta.icon
        const isActive = active === area
        return (
          <Link
            key={area}
            href={meta.href}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              'flex flex-1 flex-col items-center justify-center gap-1 text-[10px] transition-colors',
              isActive ? 'text-accent' : 'text-muted hover:text-foreground'
            )}
          >
            <Icon className="h-5 w-5" aria-hidden />
            <span>{meta.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
```

- [ ] **Step 3.4: Add to barrel**

In `src/components/shell/index.ts` append:

```ts
export { BottomNav } from './BottomNav'
```

- [ ] **Step 3.5: Verify `cn` is exported from top UI barrel**

Run: `grep "cn" src/components/ui/index.ts`
Expected: shows a `cn` re-export. If missing, add `export { cn } from './utils/cn'` — but SP1 PR 2.2 already added this. If `grep` returns nothing, check `src/components/ui/utils/cn.ts` exists and add the re-export line.

- [ ] **Step 3.6: Run BottomNav test**

Run: `npx vitest run src/tests/shell/BottomNav.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 3.7: Commit**

```bash
git add src/components/shell/BottomNav.tsx src/components/shell/index.ts src/tests/shell/BottomNav.test.tsx
git commit -m "feat(shell): BottomNav with 4 mobile tabs"
```

---

## Task 4: Sidebar component (TDD)

**Files:**
- Create: `src/components/shell/Sidebar.tsx`
- Create: `src/tests/shell/Sidebar.test.tsx`
- Modify: `src/components/shell/index.ts`

- [ ] **Step 4.1: Write the failing test**

Create `src/tests/shell/Sidebar.test.tsx`:

```tsx
// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Sidebar } from '@/components/shell'

vi.mock('next/navigation', () => ({
  usePathname: vi.fn(),
}))

import { usePathname } from 'next/navigation'

describe('Sidebar', () => {
  it('renders the HEXIS brand and all five Life Areas', () => {
    vi.mocked(usePathname).mockReturnValue('/dashboard')
    render(<Sidebar />)
    expect(screen.getByText(/hexis/i)).toBeInTheDocument()
    ;['Dashboard', 'Training', 'Nutrition', 'Progress', 'Stats'].forEach((label) => {
      expect(screen.getByRole('link', { name: new RegExp(`^${label}$`) })).toBeInTheDocument()
    })
  })

  it('renders the Settings footer link', () => {
    vi.mocked(usePathname).mockReturnValue('/dashboard')
    render(<Sidebar />)
    expect(screen.getByRole('link', { name: /^settings$/i })).toBeInTheDocument()
  })

  it('renders 4 disabled SP5 placeholder items with aria-disabled', () => {
    vi.mocked(usePathname).mockReturnValue('/dashboard')
    render(<Sidebar />)
    ;['Rewards', 'Habits', 'Player Bio', 'Quest Calendar'].forEach((label) => {
      const item = screen.getByText(label).closest('[aria-disabled="true"]')
      expect(item).toBeInTheDocument()
    })
  })

  it('marks the active Life Area with aria-current on /progress', () => {
    vi.mocked(usePathname).mockReturnValue('/progress')
    render(<Sidebar />)
    const progress = screen.getByRole('link', { name: /^progress$/i })
    expect(progress).toHaveAttribute('aria-current', 'page')
  })

  it('marks Settings active on /settings/macros', () => {
    vi.mocked(usePathname).mockReturnValue('/settings/macros')
    render(<Sidebar />)
    const settings = screen.getByRole('link', { name: /^settings$/i })
    expect(settings).toHaveAttribute('aria-current', 'page')
  })
})
```

- [ ] **Step 4.2: Run test to verify it fails**

Run: `npx vitest run src/tests/shell/Sidebar.test.tsx`
Expected: FAIL (`Sidebar` not exported).

- [ ] **Step 4.3: Implement Sidebar**

```tsx
// src/components/shell/Sidebar.tsx
'use client'
import Link from 'next/link'
import {
  AREA_META,
  SIDEBAR_AREAS,
  PLACEHOLDER_META,
  PLACEHOLDER_ORDER,
} from './area-meta'
import { useActiveArea } from './use-active-area'
import { cn } from '@/components/ui'

export function Sidebar() {
  const active = useActiveArea()
  return (
    <aside
      aria-label="Primary"
      className="bg-surface-sunken border-border fixed top-0 left-0 z-40 hidden h-screen w-[220px] flex-col border-r py-4 md:flex"
    >
      <div className="border-border text-accent mb-3 border-b px-4 pb-4 text-base font-bold tracking-[0.2em] uppercase">
        Hexis
      </div>

      <SectionLabel>Life Areas</SectionLabel>
      {SIDEBAR_AREAS.map((area) => {
        const meta = AREA_META[area]
        const Icon = meta.icon
        const isActive = active === area
        return (
          <Link
            key={area}
            href={meta.href}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              'flex items-center gap-2.5 px-4 py-2 text-sm transition-colors',
              isActive
                ? 'text-accent border-accent bg-surface border-l-2 pl-[14px]'
                : 'text-muted hover:bg-surface hover:text-foreground'
            )}
          >
            <Icon className="h-4 w-4" aria-hidden />
            <span>{meta.label}</span>
          </Link>
        )
      })}

      <SectionLabel className="mt-4">Coming soon</SectionLabel>
      {PLACEHOLDER_ORDER.map((key) => {
        const meta = PLACEHOLDER_META[key]
        const Icon = meta.icon
        return (
          <div
            key={key}
            aria-disabled="true"
            title="Coming in SP5"
            className="flex items-center gap-2.5 px-4 py-2 text-sm italic text-muted opacity-50"
          >
            <Icon className="h-4 w-4" aria-hidden />
            <span>{meta.label}</span>
            <span className="bg-surface ml-auto rounded px-1.5 py-0.5 text-[9px] tracking-[0.15em] text-muted">SP5</span>
          </div>
        )
      })}

      <div className="flex-1" />

      <div className="border-border border-t pt-2">
        <Link
          href={AREA_META.settings.href}
          aria-current={active === 'settings' ? 'page' : undefined}
          className={cn(
            'flex items-center gap-2.5 px-4 py-2 text-sm transition-colors',
            active === 'settings'
              ? 'text-accent border-accent bg-surface border-l-2 pl-[14px]'
              : 'text-muted hover:bg-surface hover:text-foreground'
          )}
        >
          <AREA_META.settings.icon className="h-4 w-4" aria-hidden />
          <span>{AREA_META.settings.label}</span>
        </Link>
      </div>
    </aside>
  )
}

function SectionLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('text-muted px-4 pt-2 pb-1 text-[10px] tracking-[0.15em] uppercase', className)}>
      {children}
    </div>
  )
}
```

- [ ] **Step 4.4: Add to barrel**

Append to `src/components/shell/index.ts`:

```ts
export { Sidebar } from './Sidebar'
```

- [ ] **Step 4.5: Run Sidebar test**

Run: `npx vitest run src/tests/shell/Sidebar.test.tsx`
Expected: PASS (5 tests).

- [ ] **Step 4.6: Commit**

```bash
git add src/components/shell/Sidebar.tsx src/components/shell/index.ts src/tests/shell/Sidebar.test.tsx
git commit -m "feat(shell): Sidebar with Life Areas + SP5 placeholders"
```

---

## Task 5: AppHeader component (TDD)

AppHeader receives `streak`, `userName`, and `userEmail` as props from the server `AppShell`. It derives the active area from pathname and opens an avatar dropdown (using the existing `Menu` compound).

**Files:**
- Create: `src/components/shell/AppHeader.tsx`
- Create: `src/tests/shell/AppHeader.test.tsx`
- Modify: `src/components/shell/index.ts`

- [ ] **Step 5.1: Write the failing test**

Create `src/tests/shell/AppHeader.test.tsx`:

```tsx
// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AppHeader } from '@/components/shell'

vi.mock('next/navigation', () => ({
  usePathname: vi.fn(),
}))

vi.mock('next-auth/react', () => ({
  signOut: vi.fn(),
}))

import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'

describe('AppHeader', () => {
  it('renders the Life Area label for current pathname', () => {
    vi.mocked(usePathname).mockReturnValue('/progress')
    render(<AppHeader streak={5} userName="Jakub" userEmail="j@ex.com" />)
    expect(screen.getByText(/progress/i)).toBeInTheDocument()
  })

  it('renders streak peek when streak > 0', () => {
    vi.mocked(usePathname).mockReturnValue('/dashboard')
    render(<AppHeader streak={7} userName="Jakub" userEmail="j@ex.com" />)
    expect(screen.getByText('7')).toBeInTheDocument()
    expect(screen.getByText(/day streak/i)).toBeInTheDocument()
  })

  it('hides streak peek when streak === 0', () => {
    vi.mocked(usePathname).mockReturnValue('/dashboard')
    render(<AppHeader streak={0} userName="Jakub" userEmail="j@ex.com" />)
    expect(screen.queryByText(/day streak/i)).toBeNull()
  })

  it('opens dropdown with Nutrition, Settings, Sign out on avatar click', async () => {
    vi.mocked(usePathname).mockReturnValue('/dashboard')
    render(<AppHeader streak={3} userName="Jakub" userEmail="j@ex.com" />)
    await userEvent.click(screen.getByRole('button', { name: /open menu/i }))
    expect(await screen.findByRole('menuitem', { name: /nutrition/i })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: /settings/i })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: /sign out/i })).toBeInTheDocument()
  })

  it('calls signOut when Sign out is clicked', async () => {
    vi.mocked(usePathname).mockReturnValue('/dashboard')
    render(<AppHeader streak={3} userName="Jakub" userEmail="j@ex.com" />)
    await userEvent.click(screen.getByRole('button', { name: /open menu/i }))
    await userEvent.click(await screen.findByRole('menuitem', { name: /sign out/i }))
    expect(signOut).toHaveBeenCalled()
  })

  it('uses first letter of userName as avatar fallback', () => {
    vi.mocked(usePathname).mockReturnValue('/dashboard')
    render(<AppHeader streak={3} userName="Jakub Sejda" userEmail="j@ex.com" />)
    expect(screen.getByRole('button', { name: /open menu/i })).toHaveTextContent('J')
  })

  it('falls back to first letter of email when userName is null', () => {
    vi.mocked(usePathname).mockReturnValue('/dashboard')
    render(<AppHeader streak={3} userName={null} userEmail="kuba@ex.com" />)
    expect(screen.getByRole('button', { name: /open menu/i })).toHaveTextContent('K')
  })
})
```

- [ ] **Step 5.2: Run test to verify it fails**

Run: `npx vitest run src/tests/shell/AppHeader.test.tsx`
Expected: FAIL (`AppHeader` not exported).

- [ ] **Step 5.3: Implement AppHeader**

```tsx
// src/components/shell/AppHeader.tsx
'use client'
import { signOut } from 'next-auth/react'
import { AREA_META } from './area-meta'
import { useActiveArea } from './use-active-area'
import { Menu } from '@/components/ui'

type Props = {
  streak: number
  userName: string | null
  userEmail: string
}

export function AppHeader({ streak, userName, userEmail }: Props) {
  const active = useActiveArea()
  const label = active ? AREA_META[active].label : ''
  const initial = (userName ?? userEmail).trim().charAt(0).toUpperCase() || '?'

  return (
    <header className="border-border bg-surface-sunken flex h-14 items-center justify-between border-b px-4 md:h-14 md:px-6">
      <div className="flex items-center gap-3">
        <span className="text-muted hidden text-xs tracking-[0.25em] uppercase md:inline">Life</span>
        <span className="text-muted hidden text-xs md:inline">·</span>
        <span className="text-accent text-xs font-medium tracking-[0.25em] uppercase">{label}</span>
      </div>
      <div className="flex items-center gap-3">
        {streak > 0 && (
          <span className="text-muted hidden text-xs md:inline">
            <span className="text-accent font-semibold">{streak}</span> day streak
          </span>
        )}
        <Menu.Root>
          <Menu.Trigger
            aria-label="Open menu"
            className="bg-accent text-background flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold"
          >
            {initial}
          </Menu.Trigger>
          <Menu.Content align="end">
            <div className="text-muted px-2 py-1.5 text-xs">
              {userName ?? userEmail}
            </div>
            <Menu.Separator />
            <Menu.Item asChild onSelect={() => {}}>
              <a href="/nutrition">Nutrition</a>
            </Menu.Item>
            <Menu.Item asChild onSelect={() => {}}>
              <a href="/settings">Settings</a>
            </Menu.Item>
            <Menu.Separator />
            <Menu.Item variant="danger" onSelect={() => signOut()}>
              Sign out
            </Menu.Item>
          </Menu.Content>
        </Menu.Root>
      </div>
    </header>
  )
}
```

- [ ] **Step 5.4: Verify `Menu.Item` supports `asChild`**

The existing `Menu.Item` in `src/components/ui/compound/Menu.tsx` is a re-export of `MenuPrimitive.Item` (Radix). Radix items accept `asChild`, but our wrapper spreads `...rest` which passes it through. Confirm by checking: open `src/components/ui/compound/Menu.tsx` and verify the `Item` function spreads `...rest` (it does — line 58: `<MenuPrimitive.Item className={cn(ITEM_BASE, ITEM_VARIANT[variant], className)} {...rest} />`).

If `asChild` threading breaks styling (Radix `asChild` replaces the element), the fallback is to use plain anchors with `onClick` instead of `asChild`:

```tsx
<Menu.Item onSelect={() => { window.location.href = '/nutrition' }}>Nutrition</Menu.Item>
```

Stick with `asChild + <a>` first (preserves middle-click, right-click open in new tab). Only fall back if tests fail on it.

- [ ] **Step 5.5: Add to barrel**

Append to `src/components/shell/index.ts`:

```ts
export { AppHeader } from './AppHeader'
```

- [ ] **Step 5.6: Run AppHeader test**

Run: `npx vitest run src/tests/shell/AppHeader.test.tsx`
Expected: PASS (7 tests). If any of the Menu-related tests fail due to portal rendering (Radix portals items outside the render root), check that `@testing-library/react`'s `screen` covers document.body — it does by default. If it still fails, wrap the component in `<Menu.Root>` inside the test — but the implementation already does that.

- [ ] **Step 5.7: Commit**

```bash
git add src/components/shell/AppHeader.tsx src/components/shell/index.ts src/tests/shell/AppHeader.test.tsx
git commit -m "feat(shell): AppHeader with letter-spaced label + streak + avatar menu"
```

---

## Task 6: AppShell orchestrator

Server async component. Replaces the chrome currently in `(app)/layout.tsx`. Fetches the workout streak from the session DB and passes everything shell-level to children components.

**Files:**
- Create: `src/components/shell/AppShell.tsx`
- Modify: `src/components/shell/index.ts`

No test file for `AppShell` — it's a thin wiring component that depends on DB access and auth. The children (BottomNav, Sidebar, AppHeader) are already tested in isolation. E2E coverage (Task 14) will verify the composition.

- [ ] **Step 6.1: Implement AppShell**

```tsx
// src/components/shell/AppShell.tsx
import { db } from '@/db/client'
import { fetchWorkoutStreak } from '@/lib/queries/workout-streak'
import { AppHeader } from './AppHeader'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'

type Props = {
  userId: string
  userName: string | null
  userEmail: string
  children: React.ReactNode
}

export async function AppShell({ userId, userName, userEmail, children }: Props) {
  const streak = await fetchWorkoutStreak(db, userId)
  return (
    <div className="bg-background text-foreground min-h-screen">
      <Sidebar />
      <div className="flex min-h-screen flex-col md:pl-[220px]">
        <AppHeader streak={streak} userName={userName} userEmail={userEmail} />
        <main className="flex-1 pb-16 md:pb-0">{children}</main>
      </div>
      <BottomNav />
    </div>
  )
}
```

- [ ] **Step 6.2: Add to barrel**

Append to `src/components/shell/index.ts`:

```ts
export { AppShell } from './AppShell'
```

- [ ] **Step 6.3: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 6.4: Commit**

```bash
git add src/components/shell/AppShell.tsx src/components/shell/index.ts
git commit -m "feat(shell): AppShell orchestrator (async server component)"
```

---

## Task 7: Route move — `/workout` → `/training`

**Files:**
- Create: `src/app/(app)/training/page.tsx` (move)
- Create: `src/app/(app)/training/[sessionId]/page.tsx` (move)
- Delete: `src/app/(app)/workout/page.tsx`
- Delete: `src/app/(app)/workout/[sessionId]/page.tsx`

File content is NOT rewritten in this task — only moved. Route adoption / redirects happen in later tasks.

- [ ] **Step 7.1: Move the workout directory**

```bash
git mv src/app/\(app\)/workout src/app/\(app\)/training
```

- [ ] **Step 7.2: Update any `import`s inside the moved files that use relative paths**

Run: `grep -rn "from '\./\|from '\./\./" src/app/\(app\)/training/`
Expected: no matches. If any matches appear, retarget them — most likely the page uses `@/...` aliases throughout (confirm with `grep -n "^import" src/app/\(app\)/training/page.tsx` — should all be `@/` alias imports).

- [ ] **Step 7.3: Run test suite**

Run: `npm run test -- --run`
Expected: tests pass. E2E will break temporarily because Playwright specs reference `/workout` — that's expected and handled in Task 14. Skip E2E for this step: `npm run test:unit` if available, or accept the E2E break until Task 14 lands.

> **Note:** Check `package.json` for a unit-only script. If absent, run `npx vitest run` to run only Vitest.

- [ ] **Step 7.4: Commit**

```bash
git commit -m "refactor(routes): move /workout → /training"
```

---

## Task 8: Route move — `/avatar` → `/stats`

- [ ] **Step 8.1: Move avatar directory to stats**

```bash
git mv src/app/\(app\)/avatar src/app/\(app\)/stats
```

- [ ] **Step 8.2: Verify no relative-path imports inside**

Run: `grep -n "^import" src/app/\(app\)/stats/page.tsx`
Expected: all imports are `@/...` alias. If any relative imports exist, retarget.

- [ ] **Step 8.3: Run Vitest**

Run: `npx vitest run`
Expected: pass.

- [ ] **Step 8.4: Commit**

```bash
git commit -m "refactor(routes): move /avatar → /stats"
```

---

## Task 9: Route move — `/progress/nutrition` → `/nutrition`

- [ ] **Step 9.1: Move the folder**

```bash
git mv src/app/\(app\)/progress/nutrition src/app/\(app\)/nutrition
```

- [ ] **Step 9.2: Check imports**

Run: `grep -n "^import" src/app/\(app\)/nutrition/page.tsx`
Expected: all `@/...` aliases. No relative imports.

- [ ] **Step 9.3: Run Vitest**

Run: `npx vitest run`
Expected: pass.

- [ ] **Step 9.4: Commit**

```bash
git commit -m "refactor(routes): move /progress/nutrition → /nutrition"
```

---

## Task 10: Route move — `/progress/strength` → `/stats/strength`

- [ ] **Step 10.1: Move the folder**

```bash
git mv src/app/\(app\)/progress/strength src/app/\(app\)/stats/strength
```

- [ ] **Step 10.2: Check imports**

Run: `grep -n "^import" src/app/\(app\)/stats/strength/page.tsx`
Expected: all aliased.

- [ ] **Step 10.3: Run Vitest**

Run: `npx vitest run`
Expected: pass.

- [ ] **Step 10.4: Commit**

```bash
git commit -m "refactor(routes): move /progress/strength → /stats/strength"
```

---

## Task 11: Reshape `/progress` (flatten body, delete segment control, handle photos)

After tasks 9 and 10, `/progress/` contains only `body/` and `photos/`. This task:

1. Moves `progress/body/page.tsx` content into `progress/page.tsx` (replacing the current redirect).
2. Deletes `progress/body/` directory.
3. Deletes `progress/layout.tsx` (was `ProgressSegmentControl` wrapper — now obsolete with only 2 sibling routes left).
4. Deletes `ProgressSegmentControl` and `SegmentControl` primitive entirely (zero remaining consumers).

`/progress/photos` stays where it is.

**Files:**
- Modify: `src/app/(app)/progress/page.tsx`
- Delete: `src/app/(app)/progress/body/` (directory)
- Delete: `src/app/(app)/progress/layout.tsx`
- Delete: `src/components/ui/primitive/SegmentControl.tsx`
- Modify: `src/components/ui/primitive/index.ts`

- [ ] **Step 11.1: Replace `progress/page.tsx` with the body page content**

Read the current `src/app/(app)/progress/body/page.tsx` content and copy it into `src/app/(app)/progress/page.tsx`, overwriting the current redirect line. Then delete `progress/body/page.tsx`.

Concrete commands:

```bash
cp src/app/\(app\)/progress/body/page.tsx src/app/\(app\)/progress/page.tsx
git rm -r src/app/\(app\)/progress/body
```

- [ ] **Step 11.2: Delete the progress layout**

```bash
git rm src/app/\(app\)/progress/layout.tsx
```

- [ ] **Step 11.3: Delete SegmentControl primitive**

```bash
git rm src/components/ui/primitive/SegmentControl.tsx
```

Remove the export line from `src/components/ui/primitive/index.ts`. Open that file and delete the line:

```ts
export { SegmentControl, ProgressSegmentControl } from './SegmentControl'
```

- [ ] **Step 11.4: Check for lingering imports**

Run: `grep -rn "SegmentControl\|ProgressSegmentControl" src/ tests/`
Expected: zero matches. If any remain, resolve them (either update the consumer or remove the import).

- [ ] **Step 11.5: Check for lingering imports of progress/body**

Run: `grep -rn "progress/body" src/`
Expected: zero matches in non-test code. (Hardcoded dashboard links are fixed in Task 13.)

- [ ] **Step 11.6: Typecheck + Vitest**

Run: `npx tsc --noEmit && npx vitest run`
Expected: pass.

- [ ] **Step 11.7: Commit**

```bash
git add -A
git commit -m "refactor(routes): flatten /progress (body → index), drop SegmentControl"
```

---

## Task 12: New `/settings` index page

**Files:**
- Create: `src/app/(app)/settings/page.tsx`

Simple server page with three cards that link to the existing settings sub-pages. No new tests — the existing sub-pages already have their own coverage.

- [ ] **Step 12.1: Create the index page**

```tsx
// src/app/(app)/settings/page.tsx
import Link from 'next/link'
import { Container, Stack, Card, Heading } from '@/components/ui'
import { Scale, Utensils, Download } from 'lucide-react'

const ITEMS = [
  { href: '/settings/plates', label: 'Plates', hint: 'Plate inventory for the calculator', icon: Scale },
  { href: '/settings/macros', label: 'Macros', hint: 'Which macros to track', icon: Utensils },
  { href: '/settings/export', label: 'Export', hint: 'Download your data as ZIP', icon: Download },
] as const

export default function SettingsIndexPage() {
  return (
    <Container>
      <Stack gap={4} className="py-6">
        <Heading level={1}>Settings</Heading>
        <Stack gap={3}>
          {ITEMS.map(({ href, label, hint, icon: Icon }) => (
            <Link key={href} href={href} className="block">
              <Card padding="md" className="hover:border-accent transition-colors">
                <div className="flex items-center gap-4">
                  <Icon className="text-accent h-6 w-6" aria-hidden />
                  <div className="flex-1">
                    <div className="font-semibold">{label}</div>
                    <div className="text-muted text-sm">{hint}</div>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </Stack>
      </Stack>
    </Container>
  )
}
```

- [ ] **Step 12.2: Typecheck**

Run: `npx tsc --noEmit`
Expected: pass. If `Heading` is not exported from `@/components/ui`, check the top barrel — SP1 PR 2.3 added `Heading`. If it's missing, adjust the import.

- [ ] **Step 12.3: Commit**

```bash
git add src/app/\(app\)/settings/page.tsx
git commit -m "feat(settings): new /settings index page with 3 cards"
```

---

## Task 13: Fix hardcoded route references

All 6 known hardcoded references are updated in a single sweep. Tests verify nothing regressed.

**Files modified:**

| File | Line | Old | New |
|------|------|-----|-----|
| `src/app/(app)/dashboard/page.tsx` | ~149 | `/workout/${active.id}` | `/training/${active.id}` |
| `src/app/(app)/dashboard/page.tsx` | ~157 | `/workout` | `/training` |
| `src/app/(app)/dashboard/page.tsx` | ~165 | `/workout` | `/training` |
| `src/components/dashboard/AvatarHero.tsx` | 18 | `/avatar` | `/stats` |
| `src/components/dashboard/StagnationWarning.tsx` | 12 | `/progress/strength` | `/stats/strength` |
| `src/components/dashboard/TodayNutritionCard.tsx` | 101 | `/progress/nutrition` | `/nutrition` |
| `src/components/dashboard/WeekMeasurementCard.tsx` | 124 | `/progress/body` | `/progress` |
| `src/sw.ts` | 54, 58 | `/workout` | `/training` |

- [ ] **Step 13.1: Grep for old references (pre-fix sanity)**

Run: `grep -rn "'/workout\|\"/workout\|'/avatar\|\"/avatar\|'/progress/body\|\"/progress/body\|'/progress/nutrition\|\"/progress/nutrition\|'/progress/strength\|\"/progress/strength" src/ | grep -v "test\|spec"`
Expected: the 8 matches listed above.

- [ ] **Step 13.2: Update each file**

Use Find/Replace or sed per file. For each occurrence use simple string replacement — do not use `replace_all` in a way that could also catch comments or string-mentions in tests.

Concrete edits:

`src/app/(app)/dashboard/page.tsx`:

```diff
-            href={`/workout/${active.id}`}
+            href={`/training/${active.id}`}
```

```diff
-            href="/workout"
+            href="/training"
```

(applied twice — for both the "Pokracuj" link and the "Zacit" link / empty state)

`src/components/dashboard/AvatarHero.tsx`:

```diff
-      <Link href="/avatar" className="mt-1">
+      <Link href="/stats" className="mt-1">
```

`src/components/dashboard/StagnationWarning.tsx`:

```diff
-      href="/progress/strength"
+      href="/stats/strength"
```

`src/components/dashboard/TodayNutritionCard.tsx`:

```diff
-      <Link href="/progress/nutrition" className="text-primary text-xs">
+      <Link href="/nutrition" className="text-primary text-xs">
```

`src/components/dashboard/WeekMeasurementCard.tsx`:

```diff
-      <Link href="/progress/body" className="text-primary text-xs">
+      <Link href="/progress" className="text-primary text-xs">
```

`src/sw.ts`:

```diff
-      const existing = clients.find((c) => c.url.includes('/workout'))
+      const existing = clients.find((c) => c.url.includes('/training'))
```

```diff
-      return self.clients.openWindow('/workout')
+      return self.clients.openWindow('/training')
```

- [ ] **Step 13.3: Re-grep to verify zero hardcoded old routes remain**

Run: `grep -rn "'/workout\|\"/workout\|'/avatar\|\"/avatar\|'/progress/body\|\"/progress/body\|'/progress/nutrition\|\"/progress/nutrition\|'/progress/strength\|\"/progress/strength" src/ | grep -v "test\|spec"`
Expected: zero matches in non-test source.

> **Allowed exceptions:** E2E specs in `tests/e2e/` may still reference old routes — they'll be updated in Task 17 or rely on redirects.

- [ ] **Step 13.4: Run unit + integration tests**

Run: `npx vitest run`
Expected: pass.

- [ ] **Step 13.5: Commit**

```bash
git add -A
git commit -m "refactor(routes): update hardcoded route references"
```

---

## Task 14: Redirects in `next.config.ts`

Register 301 redirects so bookmarks and the PWA's cached service-worker URLs still land correctly.

**Files:**
- Modify: `next.config.ts`

- [ ] **Step 14.1: Update `next.config.ts`**

Replace the current file content with:

```ts
import type { NextConfig } from 'next'
import withSerwistInit from '@serwist/next'

const withSerwist = withSerwistInit({
  swSrc: 'src/sw.ts',
  swDest: 'public/sw.js',
  disable: process.env.NODE_ENV === 'development',
})

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: '/workout',            destination: '/training',           permanent: true },
      { source: '/workout/:path*',     destination: '/training/:path*',    permanent: true },
      { source: '/avatar',             destination: '/stats',              permanent: true },
      { source: '/progress/body',      destination: '/progress',           permanent: true },
      { source: '/progress/nutrition', destination: '/nutrition',          permanent: true },
      { source: '/progress/strength',  destination: '/stats/strength',     permanent: true },
    ]
  },
}

export default withSerwist(nextConfig)
```

- [ ] **Step 14.2: Typecheck**

Run: `npx tsc --noEmit`
Expected: pass.

- [ ] **Step 14.3: Smoke test redirects in dev**

Start dev server: `npm run dev` (background or separate terminal). Then:

```bash
curl -sI http://localhost:3000/workout | head -3
curl -sI http://localhost:3000/avatar | head -3
curl -sI http://localhost:3000/progress/body | head -3
curl -sI http://localhost:3000/progress/nutrition | head -3
curl -sI http://localhost:3000/progress/strength | head -3
```

Expected: each returns `308 Permanent Redirect` (Next 15+ uses 308 for `permanent: true`; 301 acceptable as well). `Location:` header should point to the new path.

Stop dev server.

> **Note on 308 vs 301:** Next.js converts `permanent: true` to 308 (which preserves HTTP method). That's functionally equivalent to 301 for GET-only navigation and is what Next recommends. The E2E test in Task 17 asserts status `308 || 301`.

- [ ] **Step 14.4: Commit**

```bash
git add next.config.ts
git commit -m "feat(routes): add permanent redirects for moved routes"
```

---

## Task 15: Adopt `AppShell` in `(app)/layout.tsx`

Rip out the inline `TabLink` + `<nav>` and replace with `<AppShell>`. This is where the new shell goes live across the app.

**Files:**
- Modify: `src/app/(app)/layout.tsx`

- [ ] **Step 15.1: Rewrite the layout**

Replace the entire file with:

```tsx
// src/app/(app)/layout.tsx
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { Providers } from './providers'
import { XpFeedbackProvider } from '@/components/xp/XpFeedbackProvider'
import { InstallPrompt } from '@/components/pwa/InstallPrompt'
import { AppShell } from '@/components/shell'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user) {
    redirect('/login')
  }

  return (
    <Providers>
      <XpFeedbackProvider>
        <AppShell
          userId={session.user.id as string}
          userName={session.user.name ?? null}
          userEmail={session.user.email ?? ''}
        >
          {children}
        </AppShell>
        <InstallPrompt />
      </XpFeedbackProvider>
    </Providers>
  )
}
```

- [ ] **Step 15.2: Verify `session.user.id` is populated by NextAuth config**

Run: `grep -rn "session.user.id\|user.id" src/lib/auth.ts | head -5`
Expected: NextAuth callback already augments session with `id` (existing code depends on it — see `requireSessionUser` usage).

If `session.user.id` is not typed, add a non-null cast via `(session.user as { id: string }).id` — but the existing code uses it directly so the types are already wired.

- [ ] **Step 15.3: Typecheck**

Run: `npx tsc --noEmit`
Expected: pass.

- [ ] **Step 15.4: Run full unit suite**

Run: `npx vitest run`
Expected: pass. Existing integration tests that render pages under `(app)` should still work — they don't test the layout directly.

- [ ] **Step 15.5: Commit**

```bash
git add src/app/\(app\)/layout.tsx
git commit -m "feat(shell): adopt AppShell in (app) layout"
```

---

## Task 16: Live-browser smoke before E2E

Manual verification against the real app. This catches layout regressions that pure unit tests miss.

- [ ] **Step 16.1: Start dev server**

Run: `npm run dev`
Open: `http://localhost:3000/dashboard` after signing in.

- [ ] **Step 16.2: Walk the smoke checklist**

Verify each in the browser (DevTools responsive mode for mobile):

- [ ] On 360 px viewport: bottom nav shows 4 tabs, each clickable and navigates correctly; active tab amber; Dashboard page renders; no horizontal scrollbar
- [ ] On 768 px+ viewport: sidebar visible, HEXIS brand shows, 5 Life Areas + 4 SP5 placeholders + Settings footer; bottom nav hidden; sidebar active state tracks pathname
- [ ] Letter-spaced "PROGRESS" label renders correctly in header when on `/progress`
- [ ] Desktop header shows `12 day streak` (or equivalent number) when workouts logged; hidden if zero
- [ ] Avatar button opens dropdown; Nutrition + Settings links navigate; Sign out logs out
- [ ] SP5 placeholder items are visually muted + have "SP5" badge; hovering shows "Coming in SP5" title; clicking does nothing
- [ ] Visit `http://localhost:3000/workout` → redirects to `/training`
- [ ] Visit `http://localhost:3000/avatar` → redirects to `/stats`
- [ ] Visit `http://localhost:3000/progress/body` → redirects to `/progress`
- [ ] Visit `http://localhost:3000/progress/nutrition` → redirects to `/nutrition`
- [ ] Visit `http://localhost:3000/progress/strength` → redirects to `/stats/strength`
- [ ] `/settings` shows index page with 3 cards; each card navigates correctly
- [ ] `/progress` shows measurements grid (was at `/progress/body`); `/progress/photos` shows photos page with its existing internal tabs

Stop dev server.

- [ ] **Step 16.3: Note any regressions**

If any checkbox fails, fix and commit a follow-up before proceeding. Do NOT advance to Task 17 with a broken smoke.

---

## Task 17: Playwright E2E nav spec

New E2E spec covering bottom nav, sidebar visibility, and all redirects. Also updates any existing specs that reference old routes.

**Files:**
- Create: `tests/e2e/nav.spec.ts`
- Modify: any existing `tests/e2e/*.spec.ts` files that reference `/workout`, `/avatar`, `/progress/body`, `/progress/nutrition`, or `/progress/strength`

- [ ] **Step 17.1: Create the nav spec**

```ts
// tests/e2e/nav.spec.ts
import { test, expect, type Page } from '@playwright/test'

async function signIn(page: Page) {
  await page.goto('/login')
  await page.getByLabel(/email/i).fill(process.env.E2E_USER_EMAIL ?? 'test@example.com')
  await page.getByLabel(/password/i).fill(process.env.E2E_USER_PASSWORD ?? 'password')
  await page.getByRole('button', { name: /sign in|přihlásit/i }).click()
  await page.waitForURL(/\/dashboard/)
}

test.describe('SP2 navigation', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page)
  })

  test('all 4 bottom tabs navigate on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 700 })

    await page.getByRole('link', { name: /training/i }).click()
    await expect(page).toHaveURL(/\/training/)

    await page.getByRole('link', { name: /progress/i }).click()
    await expect(page).toHaveURL(/\/progress/)

    await page.getByRole('link', { name: /stats/i }).click()
    await expect(page).toHaveURL(/\/stats/)

    await page.getByRole('link', { name: /dashboard/i }).click()
    await expect(page).toHaveURL(/\/dashboard/)
  })

  test('sidebar is visible on desktop viewport and nav links work', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await expect(page.getByRole('complementary', { name: /primary/i })).toBeVisible()

    await page.getByRole('link', { name: /^nutrition$/i }).click()
    await expect(page).toHaveURL(/\/nutrition/)
  })

  test('SP5 placeholder items exist and are disabled', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    for (const label of ['Rewards', 'Habits', 'Player Bio', 'Quest Calendar']) {
      const placeholder = page.getByText(label)
      await expect(placeholder).toBeVisible()
      const host = placeholder.locator('xpath=ancestor::*[@aria-disabled="true"][1]')
      await expect(host).toHaveCount(1)
    }
  })

  test('old URLs redirect to new paths', async ({ page }) => {
    const cases: Array<[string, RegExp]> = [
      ['/workout', /\/training$/],
      ['/avatar', /\/stats$/],
      ['/progress/body', /\/progress$/],
      ['/progress/nutrition', /\/nutrition$/],
      ['/progress/strength', /\/stats\/strength$/],
    ]
    for (const [oldPath, newUrl] of cases) {
      const response = await page.goto(oldPath)
      expect(response?.status()).toBe(200) // final after redirect
      await expect(page).toHaveURL(newUrl)
    }
  })
})
```

> **Auth helper caveat:** the `signIn` helper above assumes E2E test user credentials are available via env vars (with a fallback). If the existing E2E specs use a different pattern (e.g., cookie injection, mock auth), mirror that pattern instead. Check `tests/e2e/workout-flow.spec.ts` for the existing sign-in pattern and adopt it.

- [ ] **Step 17.2: Update existing E2E specs that reference old routes**

Run: `grep -rln "'/workout'\|\"/workout\|'/avatar'\|\"/avatar\|'/progress/body'\|\"/progress/body\|'/progress/nutrition'\|\"/progress/nutrition\|'/progress/strength'\|\"/progress/strength" tests/e2e/`
Expected: a list of files to update.

For each file listed, update hardcoded paths to the new routes. The redirect fallback means they'd still pass, but keeping specs on canonical URLs matches user-facing reality.

If no matches, this step is a no-op — redirects carry the legacy specs.

- [ ] **Step 17.3: Run the new spec**

Ensure MySQL dev DB is up (`docker compose up -d`). Run:

```bash
npx playwright test tests/e2e/nav.spec.ts
```

Expected: all tests pass. If auth fails, adjust the `signIn` helper to match existing spec patterns.

- [ ] **Step 17.4: Run the full E2E suite**

```bash
npx playwright test
```

Expected: all specs pass.

- [ ] **Step 17.5: Run the full unit suite + typecheck + lint**

```bash
npx vitest run && npx tsc --noEmit && npm run lint
```

Expected: all green.

- [ ] **Step 17.6: Final guard check — nested-import §11.2**

Run: `grep -r "@/components/ui/primitive/" src/ tests/ | grep -v "index.ts"`
Expected: zero matches (SP1 §11.2 guard still passing).

- [ ] **Step 17.7: Commit**

```bash
git add -A
git commit -m "test(e2e): nav spec covering tabs, sidebar, SP5 placeholders, redirects"
```

---

## Task 18: Pull request

- [ ] **Step 18.1: Push branch**

```bash
git push -u origin sp2-ia-navigation
```

- [ ] **Step 18.2: Open PR via `gh pr create`**

Title: `SP2 — IA & navigation (Life Areas flatten + responsive shell)`

Body template:

```markdown
## Summary
- Flattens `/progress` umbrella into top-level Life Areas (Dashboard / Training / Progress / Nutrition / Stats / Settings)
- New responsive nav shell: bottom tabs on `<md`, sidebar on `≥md`, letter-spaced labels, avatar dropdown
- 6 permanent redirects for moved routes (/workout → /training, /avatar → /stats, /progress/{body,nutrition,strength} → canonical paths)
- SP5 placeholder slots in sidebar (disabled, no routes)
- Extracts inline `computeStreak` from dashboard into reusable `src/lib/workout-streak.ts`
- Deletes `SegmentControl` primitive (zero consumers after flatten)

Spec: `docs/superpowers/specs/2026-04-24-sp2-ia-navigation-design.md`
Plan: `docs/superpowers/plans/2026-04-24-sp2-ia-navigation-plan.md`

## Test plan
- [ ] Unit tests green (streak, shell components, useActiveArea)
- [ ] `/workout`, `/avatar`, `/progress/{body,nutrition,strength}` all redirect correctly (E2E)
- [ ] Bottom nav on 360 px viewport has 4 tabs, all navigate
- [ ] Sidebar on ≥768 px has 5 Life Areas + 4 SP5 placeholders + Settings
- [ ] Avatar dropdown opens Nutrition / Settings / Sign out
- [ ] Streak peek shows on desktop header when streak > 0
- [ ] §11.2 guard grep returns 0 matches
```

---

## Self-Review checklist (already run against spec)

**Spec coverage:** Each spec section → plan task:

- §3.1 Life Areas table → Tasks 7–12 (route moves)
- §3.3 SP5 placeholders → Task 4 (Sidebar)
- §3.4 Redirects → Task 14
- §4.1 AppShell → Task 6
- §4.2 AppHeader → Task 5
- §4.3 Sidebar → Task 4
- §4.4 BottomNav → Task 3
- §4.5 Avatar dropdown → Task 5 (integrated into AppHeader)
- §5.1 Amber accent → N/A (token already exists — plan §File-Structure notes this)
- §6 Migration order → Tasks 1–17 (re-sliced for TDD flow)
- §7 Testing → Tasks 1, 3, 4, 5 (unit), 17 (E2E), 16 (smoke)
- §8 Acceptance → Task 17.5–17.7

**Placeholder scan:** No "TBD", "figure out", "implement later" in this plan. Each code block is complete and runnable.

**Type consistency:** `Area` type defined once in `area-meta.ts`, consumed unchanged in `useActiveArea`, `BottomNav`, `Sidebar`, `AppHeader`, `AppShell`. `AREA_META` keys match exactly across all consumers.

**Deviations from spec:**
- Spec §4.1 described `title`/`lede` AppShell props — plan drops them, pages own their own H1 instead (less invasive, avoids title duplication on pages like Dashboard which renders `<AvatarHero>` as its primary title surface). Letter-spaced area label in the header is derived from `AREA_META[active].label`, not page-provided.
- Spec §4 said shell components go in `src/components/ui/compound/` — plan moves them to `src/components/shell/` because they are app-level, not design-system primitives. This keeps the `compound/` barrel reserved for general-purpose DS (Tabs, Menu, Breadcrumb, etc.).
- Spec §2 said `area` prop threaded from pages — plan uses `useActiveArea()` hook instead (idiomatic Next 15, avoids mutating every page.tsx).

---

## Execution Handoff

**Plan complete and saved to `docs/superpowers/plans/2026-04-24-sp2-ia-navigation-plan.md`. Two execution options:**

**1. Subagent-Driven (recommended)** — fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** — execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
