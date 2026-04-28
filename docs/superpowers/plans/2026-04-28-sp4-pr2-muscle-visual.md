# SP4 PR-2 — Muscle Visual Surface Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace polygon `BodySvg` with anatomical `AnatomicalBody` (22 per-slug paths), add a `MuscleRank` radar to `/stats` driven by trailing-8-week training volume, and migrate dashboard heatmaps onto the new component — without changing the existing volume→color logic.

**Architecture:**
1. New `src/lib/anatomy-zones.ts` owns the slug→view mapping + an `applyHighlights` helper that splits a single `slug→color` map into front/back maps.
2. New `src/lib/muscle-rank.ts` owns rank thresholds (per-slug, kg-reps over trailing 8 weeks), `volumeToRank`, and rank color tokens.
3. `fetchMuscleVolumes` query gains a `daysWindow` parameter (default 7 — same as today's only call site value); `fetchMuscleVolumesLast8Weeks` is a thin wrapper passing 56 days.
4. `AnatomicalBody` renders one view (front | back) using the fallback geometry described in spec §10 (slug-per-path slices of existing `BodySvg` zones). `AnatomicalBodyDual` composes front + back with responsive layout (side-by-side ≥sm, tabs <sm).
5. `MuscleRank` is a pure 22-axis radar; `MuscleRankSection` is an async server wrapper that fetches volumes, computes ranks, decides empty state, and renders legend + top-3-weakest list.
6. `/stats/page.tsx` gains three `RegionHeader` regions; the inline avatar hero block extracts to `AvatarHeroCard`.
7. `BodySvg` is deleted last, after both `MuscleHeatmap` and `WorkoutHeatmap` import the new component.

**Tech Stack:** Next.js 16 (App Router) · TypeScript · Tailwind 4 · Vitest 4 + RTL · Playwright · Drizzle ORM · MySQL

**Spec:** `docs/superpowers/specs/2026-04-27-sp4-muscle-visual-language-design.md`

**Branch:** `sp4-muscle-visual` (off `main`, per `feedback_branching_strategy.md`)

**Depends on:** SP4 PR-1 merged (#16) — `MUSCLE_GROUPS` is already 22 slugs, exercise remap done.

---

## Task 0: Create worktree

**Files:** none

- [ ] **Step 1: Confirm `main` is clean and up to date**

Run:
```bash
git status
git fetch origin
git log --oneline main..origin/main
```

Expected: `working tree clean` and no upstream commits ahead.

- [ ] **Step 2: Create worktree off `main`**

Run:
```bash
git worktree add .worktrees/sp4-muscle-visual -b sp4-muscle-visual main
```

Expected: `Preparing worktree (new branch 'sp4-muscle-visual')`.

- [ ] **Step 3: Copy `.env.local` into the worktree**

Run:
```bash
cp .env.local .worktrees/sp4-muscle-visual/.env.local
```

Expected: no stdout.

- [ ] **Step 4: Install deps in the worktree**

Run:
```bash
cd .worktrees/sp4-muscle-visual && npm install
```

Expected: `up to date` or a clean install.

> All subsequent tasks run inside `.worktrees/sp4-muscle-visual`.

---

## Task 1: `anatomy-zones.ts` — slug→view map + applyHighlights

**Files:**
- Create: `src/lib/anatomy-zones.ts`
- Test: `src/lib/__tests__/anatomy-zones.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/__tests__/anatomy-zones.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { SLUG_ZONES, applyHighlights } from '@/lib/anatomy-zones'
import { MUSCLE_GROUPS } from '@/db/seed/muscle-groups'

describe('SLUG_ZONES', () => {
  it('has an entry for every seeded muscle slug', () => {
    for (const mg of MUSCLE_GROUPS) {
      expect(SLUG_ZONES[mg.slug], `missing zone for ${mg.slug}`).toBeDefined()
    }
  })

  it('only uses front | back | both views', () => {
    for (const [slug, info] of Object.entries(SLUG_ZONES)) {
      expect(['front', 'back', 'both'], slug).toContain(info.view)
    }
  })
})

describe('applyHighlights', () => {
  it('routes a front-only slug to the front map', () => {
    const out = applyHighlights({ 'chest-mid': '#ff0000' })
    expect(out.front['chest-mid']).toBe('#ff0000')
    expect(out.back['chest-mid']).toBeUndefined()
  })

  it('routes a back-only slug to the back map', () => {
    const out = applyHighlights({ lats: '#00ff00' })
    expect(out.back.lats).toBe('#00ff00')
    expect(out.front.lats).toBeUndefined()
  })

  it('duplicates a both-view slug into both maps', () => {
    const out = applyHighlights({ 'delts-side': '#0000ff' })
    expect(out.front['delts-side']).toBe('#0000ff')
    expect(out.back['delts-side']).toBe('#0000ff')
  })

  it('ignores unknown slugs', () => {
    const out = applyHighlights({ 'mystery-muscle': '#fff' })
    expect(out.front).toEqual({})
    expect(out.back).toEqual({})
  })
})
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `npx vitest run src/lib/__tests__/anatomy-zones.test.ts`
Expected: `Cannot find module '@/lib/anatomy-zones'`.

- [ ] **Step 3: Implement `anatomy-zones.ts`**

Create `src/lib/anatomy-zones.ts`:

```ts
export type ZoneView = 'front' | 'back' | 'both'
export type ZoneInfo = { view: ZoneView }

export const SLUG_ZONES: Record<string, ZoneInfo> = {
  'chest-upper': { view: 'front' },
  'chest-mid': { view: 'front' },
  'chest-lower': { view: 'front' },
  'delts-front': { view: 'front' },
  'delts-side': { view: 'both' },
  'delts-rear': { view: 'back' },
  lats: { view: 'back' },
  'traps-upper': { view: 'back' },
  'traps-mid': { view: 'back' },
  rhomboids: { view: 'back' },
  biceps: { view: 'front' },
  triceps: { view: 'back' },
  forearms: { view: 'both' },
  'abs-upper': { view: 'front' },
  'abs-lower': { view: 'front' },
  obliques: { view: 'front' },
  quads: { view: 'front' },
  hamstrings: { view: 'back' },
  glutes: { view: 'back' },
  'calves-gastroc': { view: 'both' },
  'calves-soleus': { view: 'both' },
  adductors: { view: 'front' },
}

export function applyHighlights(slugColors: Record<string, string>): {
  front: Record<string, string>
  back: Record<string, string>
} {
  const front: Record<string, string> = {}
  const back: Record<string, string> = {}
  for (const [slug, color] of Object.entries(slugColors)) {
    const info = SLUG_ZONES[slug]
    if (!info) continue
    if (info.view === 'front' || info.view === 'both') front[slug] = color
    if (info.view === 'back' || info.view === 'both') back[slug] = color
  }
  return { front, back }
}
```

- [ ] **Step 4: Run the test and verify it passes**

Run: `npx vitest run src/lib/__tests__/anatomy-zones.test.ts`
Expected: `4 passed` (the `SLUG_ZONES` block has 2 specs, `applyHighlights` 4 — total 6 passed).

- [ ] **Step 5: Commit**

```bash
git add src/lib/anatomy-zones.ts src/lib/__tests__/anatomy-zones.test.ts
git commit -m "feat(anatomy): add SLUG_ZONES + applyHighlights helper"
```

---

## Task 2: `muscle-rank.ts` — thresholds, colors, volumeToRank

**Files:**
- Create: `src/lib/muscle-rank.ts`
- Test: `src/lib/__tests__/muscle-rank.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/__tests__/muscle-rank.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { volumeToRank, RANK_THRESHOLDS, RANK_COLORS } from '@/lib/muscle-rank'
import { MUSCLE_GROUPS } from '@/db/seed/muscle-groups'

describe('RANK_THRESHOLDS', () => {
  it('has thresholds for every seeded muscle slug', () => {
    for (const mg of MUSCLE_GROUPS) {
      expect(RANK_THRESHOLDS[mg.slug], `missing thresholds for ${mg.slug}`).toBeDefined()
    }
  })

  it('thresholds are strictly ascending per slug', () => {
    for (const [slug, t] of Object.entries(RANK_THRESHOLDS)) {
      expect(t.length, slug).toBe(4)
      expect(t[0] < t[1] && t[1] < t[2] && t[2] < t[3], slug).toBe(true)
    }
  })
})

describe('RANK_COLORS', () => {
  it('defines a color for D, C, B, A, S', () => {
    for (const r of ['D', 'C', 'B', 'A', 'S'] as const) {
      expect(RANK_COLORS[r]).toMatch(/^#[0-9a-f]{6}$/i)
    }
  })
})

describe('volumeToRank', () => {
  it('returns D for an unknown slug regardless of volume', () => {
    expect(volumeToRank(999_999, 'mystery-muscle')).toBe('D')
  })

  it('returns D when volume is below the C threshold', () => {
    const [c] = RANK_THRESHOLDS['chest-mid']
    expect(volumeToRank(0, 'chest-mid')).toBe('D')
    expect(volumeToRank(c - 1, 'chest-mid')).toBe('D')
  })

  it('crosses to C exactly at the C threshold', () => {
    const [c] = RANK_THRESHOLDS['chest-mid']
    expect(volumeToRank(c, 'chest-mid')).toBe('C')
  })

  it('crosses to B exactly at the B threshold', () => {
    const [, b] = RANK_THRESHOLDS['chest-mid']
    expect(volumeToRank(b, 'chest-mid')).toBe('B')
  })

  it('crosses to A exactly at the A threshold', () => {
    const [, , a] = RANK_THRESHOLDS['chest-mid']
    expect(volumeToRank(a, 'chest-mid')).toBe('A')
  })

  it('crosses to S exactly at the S threshold', () => {
    const [, , , s] = RANK_THRESHOLDS['chest-mid']
    expect(volumeToRank(s, 'chest-mid')).toBe('S')
    expect(volumeToRank(s * 10, 'chest-mid')).toBe('S')
  })
})
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `npx vitest run src/lib/__tests__/muscle-rank.test.ts`
Expected: `Cannot find module '@/lib/muscle-rank'`.

- [ ] **Step 3: Implement `muscle-rank.ts`**

Create `src/lib/muscle-rank.ts`:

```ts
export type Rank = 'D' | 'C' | 'B' | 'A' | 'S'

// [D→C, C→B, B→A, A→S] thresholds in kg-reps over trailing 8 weeks.
// Initial values — calibrate from real dev session data after PR-2 merge.
export const RANK_THRESHOLDS: Record<string, [number, number, number, number]> = {
  'chest-upper': [2500, 8000, 20000, 40000],
  'chest-mid': [4000, 12000, 30000, 60000],
  'chest-lower': [2000, 6000, 15000, 30000],
  'delts-front': [2000, 6000, 15000, 30000],
  'delts-side': [1500, 5000, 12000, 25000],
  'delts-rear': [1000, 3000, 8000, 16000],
  lats: [3500, 10000, 25000, 50000],
  'traps-upper': [1500, 5000, 12000, 25000],
  'traps-mid': [3000, 9000, 22000, 45000],
  rhomboids: [1500, 5000, 12000, 25000],
  biceps: [2000, 6000, 15000, 30000],
  triceps: [2500, 7500, 18000, 36000],
  forearms: [800, 2500, 6000, 12000],
  'abs-upper': [1000, 3000, 8000, 16000],
  'abs-lower': [800, 2500, 6000, 12000],
  obliques: [800, 2500, 6000, 12000],
  quads: [6000, 18000, 45000, 90000],
  hamstrings: [3500, 10000, 25000, 50000],
  glutes: [4000, 12000, 30000, 60000],
  'calves-gastroc': [1500, 5000, 12000, 25000],
  'calves-soleus': [1000, 3000, 8000, 16000],
  adductors: [1000, 3000, 8000, 16000],
}

export function volumeToRank(volume: number, slug: string): Rank {
  const t = RANK_THRESHOLDS[slug]
  if (!t) return 'D'
  if (volume >= t[3]) return 'S'
  if (volume >= t[2]) return 'A'
  if (volume >= t[1]) return 'B'
  if (volume >= t[0]) return 'C'
  return 'D'
}

export const RANK_COLORS: Record<Rank, string> = {
  S: '#fbbf24',
  A: '#a78bfa',
  B: '#60a5fa',
  C: '#34d399',
  D: '#94a3b8',
}
```

- [ ] **Step 4: Run the test and verify it passes**

Run: `npx vitest run src/lib/__tests__/muscle-rank.test.ts`
Expected: all specs pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/muscle-rank.ts src/lib/__tests__/muscle-rank.test.ts
git commit -m "feat(muscle-rank): add per-slug thresholds, colors, volumeToRank"
```

---

## Task 3: `fetchMuscleVolumes` gains `daysWindow` + new `fetchMuscleVolumesLast8Weeks`

**Files:**
- Modify: `src/lib/queries/heatmap.ts:14-44`
- Create: `src/lib/queries/muscle-rank.ts`
- Modify: `src/tests/api/heatmap.test.ts` (add a window-cutoff spec)
- Create: `src/tests/api/muscle-rank.test.ts`

> The current public API is `fetchMuscleVolumes(db, userId, days)`; only call sites are `src/app/api/progress/heatmap/route.ts:10`, `src/app/(app)/dashboard/page.tsx:113`, and the test file. We rename the param `days` → `daysWindow` (signature stays positional, callers compile unchanged) and re-export a thin `fetchMuscleVolumesLast8Weeks(db, userId)` that calls with `56`.

- [ ] **Step 1: Add a failing window-cutoff spec**

Edit `src/tests/api/heatmap.test.ts`. Add (at the bottom of the existing `describe('fetchMuscleVolumes')` block, before the closing brace):

```ts
  it('respects the daysWindow parameter (excludes sets older than the window)', async () => {
    // seed one set 70 days ago and one today, then ask for a 56-day window
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const seventyDaysAgo = new Date()
    seventyDaysAgo.setDate(seventyDaysAgo.getDate() - 70)

    const [s] = await db.insert(sessions).values({
      userId: TEST_USER_ID,
      startedAt: sevenDaysAgo,
      completedAt: sevenDaysAgo,
    })
    const recentSessionId = s.insertId
    const [s2] = await db.insert(sessions).values({
      userId: TEST_USER_ID,
      startedAt: seventyDaysAgo,
      completedAt: seventyDaysAgo,
    })
    const oldSessionId = s2.insertId

    await db.insert(sessionSets).values([
      {
        sessionId: recentSessionId,
        exerciseId: chestExId,
        setIndex: 1,
        reps: 10,
        weightKg: '50.00',
        completedAt: sevenDaysAgo,
      },
      {
        sessionId: oldSessionId,
        exerciseId: chestExId,
        setIndex: 1,
        reps: 10,
        weightKg: '50.00',
        completedAt: seventyDaysAgo,
      },
    ])

    const result = await fetchMuscleVolumes(db, TEST_USER_ID, 56)
    expect(result.muscles['chest-mid']).toBe(500)
  })
```

- [ ] **Step 2: Confirm the suite compiles but the new spec only runs after the rename**

Run: `npx vitest run src/tests/api/heatmap.test.ts`
Expected: existing specs pass; the new spec passes too because `days` is already a window cutoff. Verify the new spec runs and reports `1 added`. (No code change needed to make it green — this spec locks behavior we're about to refactor.)

- [ ] **Step 3: Refactor `fetchMuscleVolumes` to rename `days` → `daysWindow`**

Edit `src/lib/queries/heatmap.ts`. Replace the function signature and its body so the param is named `daysWindow` (default `7`):

```ts
export async function fetchMuscleVolumes(
  db: DB,
  userId: string,
  daysWindow: number = 7
): Promise<MuscleVolumes> {
  const since = new Date()
  since.setDate(since.getDate() - daysWindow)
  const sinceStr = since.toISOString().slice(0, 10)
  // …rest unchanged
```

Leave the SQL body identical.

- [ ] **Step 4: Verify the heatmap suite still passes**

Run: `npx vitest run src/tests/api/heatmap.test.ts`
Expected: all specs pass (the rename is signature-compatible because callers pass positionally).

- [ ] **Step 5: Add `fetchMuscleVolumesLast8Weeks` (failing spec first)**

Create `src/tests/api/muscle-rank.test.ts`:

```ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { db } from '@/db/client'
import {
  users,
  exercises,
  exerciseMuscleGroups,
  muscleGroups,
  sessions,
  sessionSets,
} from '@/db/schema'
import { fetchMuscleVolumesLast8Weeks } from '@/lib/queries/muscle-rank'
import { eq } from 'drizzle-orm'

const TEST_USER_ID = 'mrank_test_000000000001'

describe('fetchMuscleVolumesLast8Weeks', () => {
  let chestExId: number

  beforeAll(async () => {
    await db.insert(users).values({
      id: TEST_USER_ID,
      email: 'mrank-test@hexis.local',
      name: 'Muscle Rank Test',
      passwordHash: 'x',
    })
    const chestMg = await db.query.muscleGroups.findFirst({
      where: eq(muscleGroups.slug, 'chest-mid'),
    })
    const [ex] = await db.insert(exercises).values({
      name: 'Muscle Rank Test Bench',
      type: 'barbell',
    })
    chestExId = ex.insertId
    await db.insert(exerciseMuscleGroups).values({
      exerciseId: chestExId,
      muscleGroupId: chestMg!.id,
      role: 'primary',
    })
  })

  afterAll(async () => {
    await db.delete(sessionSets).where(eq(sessionSets.exerciseId, chestExId))
    await db.delete(sessions).where(eq(sessions.userId, TEST_USER_ID))
    await db.delete(exerciseMuscleGroups).where(eq(exerciseMuscleGroups.exerciseId, chestExId))
    await db.delete(exercises).where(eq(exercises.id, chestExId))
    await db.delete(users).where(eq(users.id, TEST_USER_ID))
  })

  it('returns volumes only inside the 56-day window', async () => {
    const insideWindow = new Date()
    insideWindow.setDate(insideWindow.getDate() - 30)
    const outsideWindow = new Date()
    outsideWindow.setDate(outsideWindow.getDate() - 90)

    const [sIn] = await db.insert(sessions).values({
      userId: TEST_USER_ID,
      startedAt: insideWindow,
      completedAt: insideWindow,
    })
    const [sOut] = await db.insert(sessions).values({
      userId: TEST_USER_ID,
      startedAt: outsideWindow,
      completedAt: outsideWindow,
    })

    await db.insert(sessionSets).values([
      {
        sessionId: sIn.insertId,
        exerciseId: chestExId,
        setIndex: 1,
        reps: 10,
        weightKg: '50.00',
        completedAt: insideWindow,
      },
      {
        sessionId: sOut.insertId,
        exerciseId: chestExId,
        setIndex: 1,
        reps: 10,
        weightKg: '50.00',
        completedAt: outsideWindow,
      },
    ])

    const result = await fetchMuscleVolumesLast8Weeks(db, TEST_USER_ID)
    expect(result['chest-mid']).toBe(500)
  })

  it('returns an empty object when the user has no sessions in window', async () => {
    const result = await fetchMuscleVolumesLast8Weeks(db, 'nonexistent_user_99999')
    expect(result).toEqual({})
  })
})
```

- [ ] **Step 6: Run the new test and verify it fails**

Run: `npx vitest run src/tests/api/muscle-rank.test.ts`
Expected: `Cannot find module '@/lib/queries/muscle-rank'`.

- [ ] **Step 7: Implement `fetchMuscleVolumesLast8Weeks`**

Create `src/lib/queries/muscle-rank.ts`:

```ts
import type { MySql2Database } from 'drizzle-orm/mysql2'
import * as schema from '@/db/schema'
import { fetchMuscleVolumes } from './heatmap'

type DB = MySql2Database<typeof schema>

export async function fetchMuscleVolumesLast8Weeks(
  db: DB,
  userId: string
): Promise<Record<string, number>> {
  const { muscles } = await fetchMuscleVolumes(db, userId, 56)
  return muscles
}
```

- [ ] **Step 8: Verify the new test passes**

Run: `npx vitest run src/tests/api/muscle-rank.test.ts`
Expected: both specs pass.

- [ ] **Step 9: Commit**

```bash
git add src/lib/queries/heatmap.ts src/lib/queries/muscle-rank.ts \
        src/tests/api/heatmap.test.ts src/tests/api/muscle-rank.test.ts
git commit -m "feat(queries): add fetchMuscleVolumesLast8Weeks + daysWindow rename"
```

---

## Task 4: `AnatomicalBody` component (single view)

**Context:** Per spec §10 risk mitigation, PR-2 ships using a *fallback geometry* — each of 22 slugs gets its own `<path data-muscle="...">`, derived from the existing `BodySvg` zone shapes by simple subdivision. Finer anatomical illustration lands in follow-up commits without touching this component's API.

**Files:**
- Create: `src/components/anatomy/AnatomicalBody.tsx`
- Test: `src/components/anatomy/__tests__/AnatomicalBody.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/components/anatomy/__tests__/AnatomicalBody.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { AnatomicalBody, FRONT_SLUGS, BACK_SLUGS } from '../AnatomicalBody'

describe('AnatomicalBody', () => {
  it('renders one path per front slug with data-muscle attr', () => {
    const { container } = render(<AnatomicalBody view="front" highlights={{}} />)
    for (const slug of FRONT_SLUGS) {
      const node = container.querySelector(`[data-muscle="${slug}"]`)
      expect(node, `missing path for ${slug}`).not.toBeNull()
    }
  })

  it('renders one path per back slug with data-muscle attr', () => {
    const { container } = render(<AnatomicalBody view="back" highlights={{}} />)
    for (const slug of BACK_SLUGS) {
      const node = container.querySelector(`[data-muscle="${slug}"]`)
      expect(node, `missing path for ${slug}`).not.toBeNull()
    }
  })

  it('applies highlights map to matching slugs', () => {
    const { container } = render(
      <AnatomicalBody view="front" highlights={{ 'chest-mid': '#ff0000' }} />
    )
    const path = container.querySelector('[data-muscle="chest-mid"]')
    expect(path?.getAttribute('fill')).toBe('#ff0000')
  })

  it('uses inactive fill for slugs not in highlights map', () => {
    const { container } = render(<AnatomicalBody view="front" highlights={{}} />)
    const path = container.querySelector('[data-muscle="quads"]')
    expect(path?.getAttribute('fill')).toBe('#1f2733')
  })

  it('always renders the outline path with stroke and no fill', () => {
    const { container } = render(<AnatomicalBody view="front" highlights={{}} />)
    const outline = container.querySelector('[data-outline="true"]')
    expect(outline).not.toBeNull()
    expect(outline?.getAttribute('fill')).toBe('none')
  })

  it('exposes role=img with aria-label override', () => {
    const { container } = render(
      <AnatomicalBody view="back" highlights={{}} ariaLabel="Custom label" />
    )
    const svg = container.querySelector('svg')
    expect(svg?.getAttribute('role')).toBe('img')
    expect(svg?.getAttribute('aria-label')).toBe('Custom label')
  })
})
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `npx vitest run src/components/anatomy/__tests__/AnatomicalBody.test.tsx`
Expected: `Cannot find module '../AnatomicalBody'`.

- [ ] **Step 3: Implement `AnatomicalBody`**

Create `src/components/anatomy/AnatomicalBody.tsx`:

```tsx
const INACTIVE = '#1f2733'

type Props = {
  view: 'front' | 'back'
  highlights: Record<string, string>
  className?: string
  ariaLabel?: string
}

type SlugPath = { slug: string; d: string }

// Front-view geometry — derived from the legacy BodySvg zones, sliced into 22 slugs.
// Coordinate system: viewBox 0 0 200 370.
export const FRONT_PATHS: SlugPath[] = [
  // Chest split (top→mid→bottom slices of legacy chest path)
  { slug: 'chest-upper', d: 'M70,95 Q80,88 100,86 Q120,88 130,95 L129,103 Q100,99 71,103 Z' },
  { slug: 'chest-mid', d: 'M71,103 Q100,99 129,103 L128,111 Q100,115 72,111 Z' },
  { slug: 'chest-lower', d: 'M72,111 Q100,115 128,111 L128,115 Q100,120 72,115 Z' },
  // Deltoids visible from front: front head + side head (lateral strip)
  { slug: 'delts-front', d: 'M58,82 L70,78 L72,95 L60,98 Z M130,78 L142,82 L140,98 L128,95 Z' },
  { slug: 'delts-side', d: 'M56,98 L60,98 L58,108 L54,106 Z M140,98 L144,98 L146,106 L142,108 Z' },
  // Arms
  { slug: 'biceps', d: 'M54,108 L58,103 L60,130 L54,135 Z M142,103 L146,108 L146,135 L140,130 Z' },
  { slug: 'forearms', d: 'M52,138 L56,135 L54,170 L48,172 Z M144,135 L148,138 L152,172 L146,170 Z' },
  // Core (split abs vertically + obliques as side strips)
  { slug: 'abs-upper', d: 'M82,118 L118,118 L117,142 L83,142 Z' },
  { slug: 'abs-lower', d: 'M83,142 L117,142 L116,168 L84,168 Z' },
  { slug: 'obliques', d: 'M78,118 L82,118 L84,168 L80,168 Z M118,118 L122,118 L120,168 L116,168 Z' },
  // Legs front
  { slug: 'quads', d: 'M74,172 L96,170 L92,240 L70,242 Z M104,170 L126,172 L130,242 L108,240 Z' },
  { slug: 'adductors', d: 'M92,180 L108,180 L106,220 L94,220 Z' },
  // Calves front (gastroc upper, soleus lower)
  { slug: 'calves-gastroc', d: 'M72,260 L90,255 L89,290 L72,292 Z M110,255 L128,260 L128,292 L111,290 Z' },
  { slug: 'calves-soleus', d: 'M72,292 L89,290 L88,320 L72,322 Z M111,290 L128,292 L128,322 L112,320 Z' },
]

export const BACK_PATHS: SlugPath[] = [
  // Upper back split: traps-upper (neck/top), traps-mid (between blades), rhomboids (lower-mid), lats (under)
  { slug: 'traps-upper', d: 'M84,90 L116,90 L114,102 L86,102 Z' },
  { slug: 'traps-mid', d: 'M82,102 L118,102 L116,118 L84,118 Z' },
  { slug: 'rhomboids', d: 'M86,118 L114,118 L112,128 L88,128 Z' },
  { slug: 'lats', d: 'M72,108 L86,118 L88,135 L70,135 Z M128,118 L128,108 L130,135 L112,135 Z' },
  // Deltoids back: rear head (back) + side head (lateral strip back)
  { slug: 'delts-rear', d: 'M58,82 L72,78 L72,95 L60,98 Z M128,78 L142,82 L140,98 L128,95 Z' },
  { slug: 'delts-side', d: 'M56,98 L60,98 L58,108 L54,106 Z M140,98 L144,98 L146,106 L142,108 Z' },
  // Arms back
  { slug: 'triceps', d: 'M54,105 L58,100 L60,135 L54,138 Z M142,100 L146,105 L146,138 L140,135 Z' },
  { slug: 'forearms', d: 'M52,138 L56,135 L54,170 L48,172 Z M144,135 L148,138 L152,172 L146,170 Z' },
  // Glutes
  { slug: 'glutes', d: 'M76,155 L124,155 L126,185 L74,185 Z' },
  // Hamstrings
  { slug: 'hamstrings', d: 'M72,190 L96,188 L92,255 L70,258 Z M104,188 L128,190 L130,258 L108,255 Z' },
  // Calves back (gastroc upper, soleus lower)
  { slug: 'calves-gastroc', d: 'M72,265 L90,260 L89,295 L72,297 Z M110,260 L128,265 L128,297 L111,295 Z' },
  { slug: 'calves-soleus', d: 'M72,297 L89,295 L88,328 L72,328 Z M111,295 L128,297 L128,328 L112,328 Z' },
]

export const FRONT_SLUGS = FRONT_PATHS.map((p) => p.slug)
export const BACK_SLUGS = BACK_PATHS.map((p) => p.slug)

const OUTLINE =
  'M100,10 Q85,10 82,25 Q78,35 80,45 Q76,50 74,55 Q68,65 60,75 L56,80 Q48,90 50,105 L52,140 Q50,160 48,175 Q46,178 44,180 Q80,170 100,168 Q120,170 156,180 Q154,178 152,175 Q150,160 148,140 L150,105 Q152,90 144,80 L140,75 Q132,65 126,55 Q124,50 122,45 Q120,35 118,25 Q115,10 100,10 Z M80,175 L76,250 Q74,260 70,268 L68,330 Q66,345 72,350 Q80,355 88,350 Q92,345 92,340 L96,260 Q98,250 100,248 Q102,250 104,260 L108,340 Q108,345 112,350 Q120,355 128,350 Q134,345 132,330 L130,268 Q126,260 124,250 L120,175'

export function AnatomicalBody({ view, highlights, className, ariaLabel }: Props) {
  const paths = view === 'front' ? FRONT_PATHS : BACK_PATHS
  const label = ariaLabel ?? `Anatomical body ${view} view`
  return (
    <svg viewBox="0 0 200 370" className={className} role="img" aria-label={label}>
      <path d={OUTLINE} fill="none" stroke="#1f2733" strokeWidth="1.5" data-outline="true" />
      {paths.map((p) => (
        <path
          key={`${view}-${p.slug}`}
          data-muscle={p.slug}
          d={p.d}
          fill={highlights[p.slug] ?? INACTIVE}
          opacity={0.85}
          stroke="none"
        />
      ))}
    </svg>
  )
}
```

- [ ] **Step 4: Run the test and verify it passes**

Run: `npx vitest run src/components/anatomy/__tests__/AnatomicalBody.test.tsx`
Expected: all specs pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/anatomy/AnatomicalBody.tsx \
        src/components/anatomy/__tests__/AnatomicalBody.test.tsx
git commit -m "feat(anatomy): add AnatomicalBody with 22 per-slug paths"
```

---

## Task 5: `AnatomicalBodyDual` — responsive front+back layout

**Files:**
- Create: `src/components/anatomy/AnatomicalBodyDual.tsx`
- Test: `src/components/anatomy/__tests__/AnatomicalBodyDual.test.tsx`

> Layout strategy: render both views always; CSS hides the inactive tab on `<sm` and shows both side-by-side on `≥sm`. Tabs use plain buttons + a `useState` toggle. No JS-side breakpoint detection — Tailwind controls visibility.

- [ ] **Step 1: Write the failing test**

Create `src/components/anatomy/__tests__/AnatomicalBodyDual.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { AnatomicalBodyDual } from '../AnatomicalBodyDual'

describe('AnatomicalBodyDual', () => {
  it('renders both front and back svgs', () => {
    const { container } = render(<AnatomicalBodyDual highlights={{}} />)
    expect(container.querySelectorAll('svg[role="img"]').length).toBe(2)
  })

  it('passes split highlights to each view', () => {
    const { container } = render(
      <AnatomicalBodyDual highlights={{ 'chest-mid': '#f00', lats: '#0f0' }} />
    )
    const frontChest = container.querySelector(
      'svg[aria-label*="front"] [data-muscle="chest-mid"]'
    )
    const backLats = container.querySelector('svg[aria-label*="back"] [data-muscle="lats"]')
    expect(frontChest?.getAttribute('fill')).toBe('#f00')
    expect(backLats?.getAttribute('fill')).toBe('#0f0')
  })

  it('renders tab controls labeled Zepředu / Zezadu', () => {
    render(<AnatomicalBodyDual highlights={{}} />)
    expect(screen.getByRole('tab', { name: 'Zepředu' })).toBeDefined()
    expect(screen.getByRole('tab', { name: 'Zezadu' })).toBeDefined()
  })

  it('toggles aria-selected when a tab is clicked', () => {
    render(<AnatomicalBodyDual highlights={{}} />)
    const back = screen.getByRole('tab', { name: 'Zezadu' })
    fireEvent.click(back)
    expect(back.getAttribute('aria-selected')).toBe('true')
    expect(screen.getByRole('tab', { name: 'Zepředu' }).getAttribute('aria-selected')).toBe('false')
  })
})
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `npx vitest run src/components/anatomy/__tests__/AnatomicalBodyDual.test.tsx`
Expected: `Cannot find module '../AnatomicalBodyDual'`.

- [ ] **Step 3: Implement `AnatomicalBodyDual`**

Create `src/components/anatomy/AnatomicalBodyDual.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { AnatomicalBody } from './AnatomicalBody'
import { applyHighlights } from '@/lib/anatomy-zones'

type Props = {
  highlights: Record<string, string>
  className?: string
  bodyClassName?: string
}

export function AnatomicalBodyDual({ highlights, className, bodyClassName }: Props) {
  const { front, back } = applyHighlights(highlights)
  const [active, setActive] = useState<'front' | 'back'>('front')

  return (
    <div className={'flex flex-col items-center gap-2 ' + (className ?? '')}>
      <div role="tablist" className="flex gap-1 sm:hidden">
        <button
          type="button"
          role="tab"
          aria-selected={active === 'front'}
          onClick={() => setActive('front')}
          className={
            'rounded-md px-3 py-1 text-xs font-medium ' +
            (active === 'front' ? 'bg-surface text-foreground' : 'text-muted')
          }
        >
          Zepředu
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={active === 'back'}
          onClick={() => setActive('back')}
          className={
            'rounded-md px-3 py-1 text-xs font-medium ' +
            (active === 'back' ? 'bg-surface text-foreground' : 'text-muted')
          }
        >
          Zezadu
        </button>
      </div>
      <div className="flex items-center justify-center gap-2">
        <div className={active === 'front' ? 'block sm:block' : 'hidden sm:block'}>
          <AnatomicalBody
            view="front"
            highlights={front}
            className={bodyClassName}
            ariaLabel="Anatomical body front view"
          />
          <div className="text-muted mt-1 text-center text-[10px]">Zepředu</div>
        </div>
        <div className={active === 'back' ? 'block sm:block' : 'hidden sm:block'}>
          <AnatomicalBody
            view="back"
            highlights={back}
            className={bodyClassName}
            ariaLabel="Anatomical body back view"
          />
          <div className="text-muted mt-1 text-center text-[10px]">Zezadu</div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run the test and verify it passes**

Run: `npx vitest run src/components/anatomy/__tests__/AnatomicalBodyDual.test.tsx`
Expected: all specs pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/anatomy/AnatomicalBodyDual.tsx \
        src/components/anatomy/__tests__/AnatomicalBodyDual.test.tsx
git commit -m "feat(anatomy): add AnatomicalBodyDual with responsive tab layout"
```

---

## Task 6: Migrate `MuscleHeatmap` and `WorkoutHeatmap` to `AnatomicalBodyDual`

**Files:**
- Modify: `src/components/heatmap/MuscleHeatmap.tsx`
- Modify: `src/components/heatmap/WorkoutHeatmap.tsx`

- [ ] **Step 1: Rewrite `MuscleHeatmap`**

Replace `src/components/heatmap/MuscleHeatmap.tsx` with:

```tsx
'use client'

import { AnatomicalBodyDual } from '@/components/anatomy/AnatomicalBodyDual'
import { volumeToColor } from '@/lib/heatmap-colors'

type Props = {
  data: Record<string, number>
  maxVolume: number
}

export function MuscleHeatmap({ data, maxVolume }: Props) {
  const highlights: Record<string, string> = {}
  for (const [slug, volume] of Object.entries(data)) {
    highlights[slug] = volumeToColor(volume, maxVolume)
  }
  return <AnatomicalBodyDual highlights={highlights} bodyClassName="h-48 w-auto" />
}
```

- [ ] **Step 2: Rewrite `WorkoutHeatmap`**

Replace `src/components/heatmap/WorkoutHeatmap.tsx` with:

```tsx
'use client'

import { AnatomicalBodyDual } from '@/components/anatomy/AnatomicalBodyDual'
import { WORKOUT_COLORS } from '@/lib/heatmap-colors'

type Props = {
  plannedMuscles: string[]
  doneMuscles: string[]
}

export function WorkoutHeatmap({ plannedMuscles, doneMuscles }: Props) {
  const doneSet = new Set(doneMuscles)
  const highlights: Record<string, string> = {}
  for (const slug of new Set([...plannedMuscles, ...doneMuscles])) {
    highlights[slug] = doneSet.has(slug) ? WORKOUT_COLORS.done : WORKOUT_COLORS.planned
  }
  return <AnatomicalBodyDual highlights={highlights} bodyClassName="h-36 w-auto" />
}
```

- [ ] **Step 3: Run the full unit + integration suite**

Run: `npx vitest run`
Expected: all specs green. Any heatmap-related test (e.g., `MuscleHeatmap.test.tsx` or `WorkoutHeatmap.test.tsx` if present) must still pass.

> If a heatmap RTL test asserted on the legacy `data-muscle="chest"` zone names, update those assertions to use the new slugs (e.g., `data-muscle="chest-mid"`). Do not delete tests — adapt them.

- [ ] **Step 4: Run typecheck**

Run: `npm run typecheck`
Expected: clean.

- [ ] **Step 5: Commit**

```bash
git add src/components/heatmap/MuscleHeatmap.tsx src/components/heatmap/WorkoutHeatmap.tsx
git commit -m "refactor(heatmap): swap BodySvg for AnatomicalBodyDual"
```

---

## Task 7: Delete `BodySvg.tsx` and prune `SLUG_TO_ZONE` / `slugToZones`

**Files:**
- Delete: `src/components/heatmap/BodySvg.tsx`
- Modify: `src/lib/heatmap-colors.ts` (remove `SLUG_TO_ZONE`, `slugToZones`, `ZoneMapping`)

- [ ] **Step 1: Verify no callers reference the dead code**

Run:
```bash
grep -rn "BodySvg\|SLUG_TO_ZONE\|slugToZones" src/ tests/
```

Expected: only matches inside `src/components/heatmap/BodySvg.tsx` and `src/lib/heatmap-colors.ts` (and any test for them). If a call site outside these files appears, fix it before deleting.

- [ ] **Step 2: Delete `BodySvg.tsx`**

Run:
```bash
rm src/components/heatmap/BodySvg.tsx
```

- [ ] **Step 3: Slim down `heatmap-colors.ts`**

Replace `src/lib/heatmap-colors.ts` with:

```ts
const INACTIVE = '#1f2733'
const THRESHOLDS: [number, string][] = [
  [0.76, '#ef4444'],
  [0.51, '#f59e0b'],
  [0.26, '#10b981'],
  [0.01, '#065f46'],
]

export function volumeToColor(volume: number, maxVolume: number): string {
  if (maxVolume <= 0 || volume <= 0) return INACTIVE
  const ratio = volume / maxVolume
  for (const [threshold, color] of THRESHOLDS) {
    if (ratio >= threshold) return color
  }
  return INACTIVE
}

export const WORKOUT_COLORS = {
  rest: INACTIVE,
  planned: '#f59e0b',
  done: '#10b981',
} as const
```

- [ ] **Step 4: If `heatmap-colors.test.ts` covered `slugToZones` / `SLUG_TO_ZONE`, drop those describe blocks**

Run: `npx vitest run src/lib/__tests__/heatmap-colors.test.ts`

If the suite fails because it references the removed exports, edit it to keep only `volumeToColor` and `WORKOUT_COLORS` specs. Re-run; expect green.

- [ ] **Step 5: Final guard — typecheck + lint + nested-import grep**

Run:
```bash
npm run typecheck
npm run lint
grep -rn "from '@/components/heatmap/BodySvg'" src/ tests/
```

Expected: typecheck clean, lint clean, grep prints zero matches.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore(heatmap): delete BodySvg + dead SLUG_TO_ZONE mapping"
```

---

## Task 8: `MuscleRank` radar component

**Files:**
- Create: `src/components/anatomy/MuscleRank.tsx`
- Test: `src/components/anatomy/__tests__/MuscleRank.test.tsx`

> The component is a pure render: receives `ranks: Record<string, Rank>`, plots a 22-axis polygon. Axis order matches spec §6.3 (clockwise from top).

- [ ] **Step 1: Write the failing test**

Create `src/components/anatomy/__tests__/MuscleRank.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { MuscleRank, RADAR_AXES } from '../MuscleRank'

describe('MuscleRank', () => {
  it('exposes 22 axes in the documented clockwise order', () => {
    expect(RADAR_AXES.length).toBe(22)
    expect(RADAR_AXES[0]).toBe('chest-upper')
    expect(RADAR_AXES[RADAR_AXES.length - 1]).toBe('calves-soleus')
  })

  it('renders an SVG with role=img and the rank radar aria-label', () => {
    const { container } = render(<MuscleRank ranks={{}} />)
    const svg = container.querySelector('svg')
    expect(svg?.getAttribute('role')).toBe('img')
    expect(svg?.getAttribute('aria-label')).toBe('Muscle rank radar')
  })

  it('renders one axis line per slug', () => {
    const { container } = render(<MuscleRank ranks={{}} />)
    expect(container.querySelectorAll('[data-axis]').length).toBe(22)
  })

  it('renders one axis dot per slug colored by rank', () => {
    const ranks = { 'chest-mid': 'S' as const, lats: 'D' as const }
    const { container } = render(<MuscleRank ranks={ranks} />)
    const chestDot = container.querySelector('[data-dot="chest-mid"]')
    const latsDot = container.querySelector('[data-dot="lats"]')
    expect(chestDot?.getAttribute('fill')).toBe('#fbbf24')
    expect(latsDot?.getAttribute('fill')).toBe('#94a3b8')
  })

  it('renders the polygon path connecting all rank radii', () => {
    const { container } = render(<MuscleRank ranks={{}} />)
    expect(container.querySelector('[data-polygon="true"]')).not.toBeNull()
  })

  it('renders 4 grid rings for D/C/B/A (S is the outer edge)', () => {
    const { container } = render(<MuscleRank ranks={{}} />)
    expect(container.querySelectorAll('[data-grid-ring]').length).toBe(4)
  })
})
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `npx vitest run src/components/anatomy/__tests__/MuscleRank.test.tsx`
Expected: `Cannot find module '../MuscleRank'`.

- [ ] **Step 3: Implement `MuscleRank`**

Create `src/components/anatomy/MuscleRank.tsx`:

```tsx
import { type Rank, RANK_COLORS } from '@/lib/muscle-rank'

type Props = {
  ranks: Record<string, Rank>
  className?: string
}

export const RADAR_AXES = [
  'chest-upper',
  'chest-mid',
  'chest-lower',
  'delts-front',
  'delts-side',
  'delts-rear',
  'lats',
  'traps-upper',
  'traps-mid',
  'rhomboids',
  'biceps',
  'triceps',
  'forearms',
  'abs-upper',
  'abs-lower',
  'obliques',
  'adductors',
  'quads',
  'hamstrings',
  'glutes',
  'calves-gastroc',
  'calves-soleus',
] as const

const AXIS_LABELS: Record<string, string> = {
  'chest-upper': 'Hrudn↑',
  'chest-mid': 'Hrudn=',
  'chest-lower': 'Hrudn↓',
  'delts-front': 'Delt p',
  'delts-side': 'Delt b',
  'delts-rear': 'Delt z',
  lats: 'Lats',
  'traps-upper': 'Trap↑',
  'traps-mid': 'Trap=',
  rhomboids: 'Rhomb',
  biceps: 'Biceps',
  triceps: 'Tric',
  forearms: 'Předl',
  'abs-upper': 'Břich↑',
  'abs-lower': 'Břich↓',
  obliques: 'Šikmé',
  adductors: 'Přitah',
  quads: 'Quads',
  hamstrings: 'Hams',
  glutes: 'Hýždě',
  'calves-gastroc': 'Lýtka↑',
  'calves-soleus': 'Lýtka↓',
}

const RANK_RADIUS: Record<Rank, number> = { D: 0.2, C: 0.4, B: 0.6, A: 0.8, S: 1.0 }

const VIEW_SIZE = 320
const CENTER = VIEW_SIZE / 2
const RADIUS = 120
const LABEL_RADIUS = 145

function polar(idx: number, count: number, r: number): { x: number; y: number } {
  const angle = (idx / count) * Math.PI * 2 - Math.PI / 2
  return { x: CENTER + Math.cos(angle) * r, y: CENTER + Math.sin(angle) * r }
}

export function MuscleRank({ ranks, className }: Props) {
  const count = RADAR_AXES.length
  const polygonPoints = RADAR_AXES.map((slug, i) => {
    const rank = ranks[slug] ?? 'D'
    const rNorm = RANK_RADIUS[rank]
    const { x, y } = polar(i, count, RADIUS * rNorm)
    return `${x.toFixed(2)},${y.toFixed(2)}`
  }).join(' ')

  return (
    <svg
      viewBox={`0 0 ${VIEW_SIZE} ${VIEW_SIZE}`}
      className={className}
      role="img"
      aria-label="Muscle rank radar"
    >
      {/* Grid rings for D, C, B, A (S = outer edge of axes) */}
      {[0.2, 0.4, 0.6, 0.8].map((band) => (
        <circle
          key={band}
          data-grid-ring={band}
          cx={CENTER}
          cy={CENTER}
          r={RADIUS * band}
          fill="none"
          stroke="#1f2733"
          strokeWidth={0.75}
        />
      ))}

      {/* Axes + labels */}
      {RADAR_AXES.map((slug, i) => {
        const tip = polar(i, count, RADIUS)
        const label = polar(i, count, LABEL_RADIUS)
        return (
          <g key={slug}>
            <line
              data-axis={slug}
              x1={CENTER}
              y1={CENTER}
              x2={tip.x}
              y2={tip.y}
              stroke="#1f2733"
              strokeWidth={0.5}
            />
            <text
              x={label.x}
              y={label.y}
              fontSize={9}
              fill="#94a3b8"
              textAnchor="middle"
              dominantBaseline="middle"
            >
              {AXIS_LABELS[slug] ?? slug}
            </text>
          </g>
        )
      })}

      {/* Rank polygon */}
      <polygon
        data-polygon="true"
        points={polygonPoints}
        fill="#a78bfa"
        fillOpacity={0.25}
        stroke="#a78bfa"
        strokeWidth={1}
      />

      {/* Rank dots */}
      {RADAR_AXES.map((slug, i) => {
        const rank = ranks[slug] ?? 'D'
        const { x, y } = polar(i, count, RADIUS * RANK_RADIUS[rank])
        return (
          <circle key={slug} data-dot={slug} cx={x} cy={y} r={3} fill={RANK_COLORS[rank]} />
        )
      })}
    </svg>
  )
}
```

- [ ] **Step 4: Run the test and verify it passes**

Run: `npx vitest run src/components/anatomy/__tests__/MuscleRank.test.tsx`
Expected: all specs pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/anatomy/MuscleRank.tsx \
        src/components/anatomy/__tests__/MuscleRank.test.tsx
git commit -m "feat(anatomy): add MuscleRank radar component"
```

---

## Task 9: `MuscleRankSection` server wrapper (radar + legend + top-3-weakest + empty state)

**Files:**
- Create: `src/components/anatomy/MuscleRankSection.tsx`
- Test: `src/components/anatomy/__tests__/MuscleRankSection.test.tsx`

> The wrapper is async-server, but the part we test is pure: a helper `computeRankSummary(volumes, sessionCount)` that returns either `{ kind: 'empty' }` or `{ kind: 'ranked', ranks, counts, weakest3 }`. The component delegates rendering to `MuscleRank` + small JSX. Threshold for empty state: `< 3` sessions in the 8-week window.

- [ ] **Step 1: Write the failing test**

Create `src/components/anatomy/__tests__/MuscleRankSection.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { computeRankSummary } from '../MuscleRankSection'

describe('computeRankSummary', () => {
  it('returns empty when sessionCount < 3', () => {
    expect(computeRankSummary({ 'chest-mid': 999_999 }, 0).kind).toBe('empty')
    expect(computeRankSummary({ 'chest-mid': 999_999 }, 2).kind).toBe('empty')
  })

  it('returns ranked when sessionCount >= 3', () => {
    const out = computeRankSummary({ 'chest-mid': 60000 }, 3)
    expect(out.kind).toBe('ranked')
  })

  it('fills missing slugs with rank D', () => {
    const out = computeRankSummary({ 'chest-mid': 60000 }, 5)
    if (out.kind !== 'ranked') throw new Error('expected ranked')
    expect(out.ranks['chest-mid']).toBe('S')
    expect(out.ranks.lats).toBe('D')
    expect(Object.keys(out.ranks).length).toBe(22)
  })

  it('counts ranks across all 22 slugs', () => {
    const out = computeRankSummary({ 'chest-mid': 60000 }, 5)
    if (out.kind !== 'ranked') throw new Error('expected ranked')
    const total = out.counts.S + out.counts.A + out.counts.B + out.counts.C + out.counts.D
    expect(total).toBe(22)
    expect(out.counts.S).toBe(1)
    expect(out.counts.D).toBe(21)
  })

  it('weakest3 picks the lowest-ranked slugs (tiebreak: smaller volume first)', () => {
    const volumes = {
      'chest-mid': 60000, // S
      lats: 50000, // S
      biceps: 30000, // S
      forearms: 0, // D
      'abs-lower': 0, // D
      obliques: 0, // D
      'delts-rear': 0, // D
    }
    const out = computeRankSummary(volumes, 5)
    if (out.kind !== 'ranked') throw new Error('expected ranked')
    expect(out.weakest3.length).toBe(3)
    for (const w of out.weakest3) {
      expect(w.rank).toBe('D')
    }
  })
})
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `npx vitest run src/components/anatomy/__tests__/MuscleRankSection.test.tsx`
Expected: `Cannot find module '../MuscleRankSection'`.

- [ ] **Step 3: Implement `MuscleRankSection`**

Create `src/components/anatomy/MuscleRankSection.tsx`:

```tsx
import { db } from '@/db/client'
import { sessions } from '@/db/schema'
import { sql, eq, and, gte } from 'drizzle-orm'
import { fetchMuscleVolumesLast8Weeks } from '@/lib/queries/muscle-rank'
import { MUSCLE_GROUPS } from '@/db/seed/muscle-groups'
import { volumeToRank, type Rank, RANK_COLORS } from '@/lib/muscle-rank'
import { MuscleRank } from './MuscleRank'
import Link from 'next/link'

type RankSummary =
  | { kind: 'empty' }
  | {
      kind: 'ranked'
      ranks: Record<string, Rank>
      counts: Record<Rank, number>
      weakest3: Array<{ slug: string; name: string; rank: Rank; volume: number }>
    }

const RANK_ORDER: Record<Rank, number> = { D: 0, C: 1, B: 2, A: 3, S: 4 }

export function computeRankSummary(
  volumes: Record<string, number>,
  sessionCount: number
): RankSummary {
  if (sessionCount < 3) return { kind: 'empty' }

  const ranks: Record<string, Rank> = {}
  const counts: Record<Rank, number> = { S: 0, A: 0, B: 0, C: 0, D: 0 }
  const rows: Array<{ slug: string; name: string; rank: Rank; volume: number }> = []

  for (const mg of MUSCLE_GROUPS) {
    const volume = volumes[mg.slug] ?? 0
    const rank = volumeToRank(volume, mg.slug)
    ranks[mg.slug] = rank
    counts[rank] += 1
    rows.push({ slug: mg.slug, name: mg.name, rank, volume })
  }

  rows.sort((a, b) => {
    if (RANK_ORDER[a.rank] !== RANK_ORDER[b.rank]) return RANK_ORDER[a.rank] - RANK_ORDER[b.rank]
    return a.volume - b.volume
  })

  return { kind: 'ranked', ranks, counts, weakest3: rows.slice(0, 3) }
}

async function fetchSessionCountLast8Weeks(userId: string): Promise<number> {
  const since = new Date()
  since.setDate(since.getDate() - 56)
  const sinceStr = since.toISOString().slice(0, 10)
  const [rows] = await db.execute(
    sql`SELECT COUNT(*) AS n FROM ${sessions} WHERE ${sessions.userId} = ${userId} AND ${sessions.completedAt} IS NOT NULL AND ${sessions.completedAt} >= ${sinceStr}`
  )
  const first = (rows as Array<{ n: number | string }>)[0]
  return Number(first?.n ?? 0)
}

type Props = { userId: string }

export async function MuscleRankSection({ userId }: Props) {
  const [volumes, sessionCount] = await Promise.all([
    fetchMuscleVolumesLast8Weeks(db, userId),
    fetchSessionCountLast8Weeks(userId),
  ])
  const summary = computeRankSummary(volumes, sessionCount)

  if (summary.kind === 'empty') {
    return (
      <div className="border-border bg-surface flex flex-col items-center gap-3 rounded-xl border p-6 text-center">
        <p className="text-foreground text-sm">
          Začni trénovat, rank se ti vykreslí po prvních pár tréninzích.
        </p>
        <Link
          href="/training"
          className="bg-accent rounded-md px-3 py-1 text-xs font-medium text-white"
        >
          Spustit trénink
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-center">
        <MuscleRank ranks={summary.ranks} className="h-72 w-72" />
      </div>
      <div className="text-muted text-center text-xs">
        {(['S', 'A', 'B', 'C', 'D'] as const)
          .map((r) => `${summary.counts[r]}× ${r}`)
          .join(' · ')}
      </div>
      <div className="border-border bg-surface rounded-xl border p-4">
        <h4 className="text-foreground mb-2 text-xs font-medium tracking-wider uppercase">Doplň</h4>
        <ul className="space-y-1">
          {summary.weakest3.map(({ slug, name, rank }) => (
            <li key={slug} className="flex items-center justify-between text-sm">
              <span className="text-foreground">{name}</span>
              <span className="font-medium" style={{ color: RANK_COLORS[rank] }}>
                {rank}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run the test and verify it passes**

Run: `npx vitest run src/components/anatomy/__tests__/MuscleRankSection.test.tsx`
Expected: all specs pass.

- [ ] **Step 5: Run typecheck**

Run: `npm run typecheck`
Expected: clean.

- [ ] **Step 6: Commit**

```bash
git add src/components/anatomy/MuscleRankSection.tsx \
        src/components/anatomy/__tests__/MuscleRankSection.test.tsx
git commit -m "feat(stats): add MuscleRankSection wrapper with empty + top-3-weakest"
```

---

## Task 10: Extract `AvatarHeroCard` from `/stats/page.tsx`

**Files:**
- Create: `src/components/avatar/AvatarHeroCard.tsx`
- Test: `src/components/avatar/__tests__/AvatarHeroCard.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/components/avatar/__tests__/AvatarHeroCard.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AvatarHeroCard } from '../AvatarHeroCard'

describe('AvatarHeroCard', () => {
  it('renders the level, tier name, and tier range', () => {
    render(
      <AvatarHeroCard
        level={12}
        tierMeta={{ tier: 2, name: 'Apprentice', color: '#0af', levelMin: 10, levelMax: 24 }}
        totalXp={1234}
        progress={{ current: 200, max: 500 }}
      />
    )
    expect(screen.getByText(/Level 12/)).toBeDefined()
    expect(screen.getByText(/Apprentice/)).toBeDefined()
    expect(screen.getByText(/Tier 2 \(L10–24\)/)).toBeDefined()
    expect(screen.getByText(/1[ , ]234 XP/)).toBeDefined()
    expect(screen.getByText(/300.*do L13/)).toBeDefined()
  })

  it('renders ∞ for the top-tier upper bound', () => {
    render(
      <AvatarHeroCard
        level={99}
        tierMeta={{ tier: 5, name: 'Mythic', color: '#fc0', levelMin: 80, levelMax: 999 }}
        totalXp={500_000}
        progress={{ current: 0, max: 1 }}
      />
    )
    expect(screen.getByText(/Tier 5 \(L80–∞\)/)).toBeDefined()
  })
})
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `npx vitest run src/components/avatar/__tests__/AvatarHeroCard.test.tsx`
Expected: `Cannot find module '../AvatarHeroCard'`.

- [ ] **Step 3: Implement `AvatarHeroCard`**

Create `src/components/avatar/AvatarHeroCard.tsx`:

```tsx
import { Avatar } from '@/components/avatar/Avatar'
import { ProgressBar } from '@/components/ui'

type TierMeta = {
  tier: number
  name: string
  color: string
  levelMin: number
  levelMax: number
}

type Props = {
  level: number
  tierMeta: TierMeta
  totalXp: number
  progress: { current: number; max: number }
}

export function AvatarHeroCard({ level, tierMeta, totalXp, progress }: Props) {
  return (
    <div className="border-border bg-surface flex flex-col items-center gap-2 rounded-xl border p-6">
      <h1 className="text-foreground mb-2 text-lg font-semibold">Tvůj avatar</h1>
      <Avatar tier={tierMeta.tier} size={160} />
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl font-bold" style={{ color: tierMeta.color }}>
          Level {level}
        </span>
        <span className="text-muted text-base">· {tierMeta.name}</span>
      </div>
      <div className="text-muted text-xs">
        Tier {tierMeta.tier} (L{tierMeta.levelMin}–
        {tierMeta.levelMax === 999 ? '∞' : tierMeta.levelMax})
      </div>
      <div className="mt-2 w-full max-w-md">
        <ProgressBar value={progress.current} max={progress.max} variant="xp" height={10} />
        <div className="text-muted mt-1 flex justify-between text-xs">
          <span>{totalXp.toLocaleString('cs-CZ')} XP</span>
          <span>
            {(progress.max - progress.current).toLocaleString('cs-CZ')} do L{level + 1}
          </span>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run the test and verify it passes**

Run: `npx vitest run src/components/avatar/__tests__/AvatarHeroCard.test.tsx`
Expected: all specs pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/avatar/AvatarHeroCard.tsx \
        src/components/avatar/__tests__/AvatarHeroCard.test.tsx
git commit -m "refactor(stats): extract AvatarHeroCard from /stats page"
```

---

## Task 11: `/stats/page.tsx` — three RegionHeader regions + MuscleRank section

**Files:**
- Modify: `src/app/(app)/stats/page.tsx`

- [ ] **Step 1: Replace the page**

Replace `src/app/(app)/stats/page.tsx` with:

```tsx
import { requireSessionUser } from '@/lib/auth-helpers'
import { redirect } from 'next/navigation'
import { db } from '@/db/client'
import { getTotalXp } from '@/lib/xp'
import { xpToLevel } from '@/lib/xp-events'
import { levelToTier, levelToTierMeta, xpToProgress } from '@/lib/tiers'
import { fetchXpHistory } from '@/lib/queries/xp-history'
import { AvatarHeroCard } from '@/components/avatar/AvatarHeroCard'
import { TierLadder } from '@/components/avatar/TierLadder'
import { NextTierPreview } from '@/components/avatar/NextTierPreview'
import { XpHistoryChart } from '@/components/avatar/XpHistoryChart'
import { XpBreakdown } from '@/components/avatar/XpBreakdown'
import { MuscleRankSection } from '@/components/anatomy/MuscleRankSection'
import { RegionHeader } from '@/components/dashboard/RegionHeader'

export default async function AvatarPage() {
  const user = await requireSessionUser()
  if (user instanceof Response) redirect('/login')

  const totalXp = await getTotalXp(db, user.id)
  const level = xpToLevel(totalXp)
  const tierMeta = levelToTierMeta(level)
  const progress = xpToProgress(totalXp, level)
  const history = await fetchXpHistory(db, user.id, 30)

  return (
    <div className="space-y-6 p-4">
      <AvatarHeroCard
        level={level}
        tierMeta={tierMeta}
        totalXp={totalXp}
        progress={progress}
      />

      <section>
        <RegionHeader>Avatar Progress</RegionHeader>
        <TierLadder currentTier={levelToTier(level)} />
        <NextTierPreview currentLevel={level} totalXp={totalXp} />
      </section>

      <section>
        <RegionHeader>Muscle Rank</RegionHeader>
        <MuscleRankSection userId={user.id} />
      </section>

      <section>
        <RegionHeader>XP History</RegionHeader>
        <XpHistoryChart daily={history.daily} days={30} />
        <XpBreakdown byEventTotal={history.byEventTotal} total={history.total} />
      </section>
    </div>
  )
}
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: clean.

- [ ] **Step 3: Run the full unit/integration suite**

Run: `npx vitest run`
Expected: all specs pass.

- [ ] **Step 4: Manual smoke**

Run: `npm run dev`
Visit `http://localhost:3000/stats`. Confirm:
- Avatar hero card renders unchanged.
- Three uppercase region headers visible: `AVATAR PROGRESS`, `MUSCLE RANK`, `XP HISTORY`.
- Radar SVG renders (if you have ≥3 sessions in last 8 weeks) **or** the empty-state CTA renders.
- `/dashboard` still renders heatmap.
- `/training/[id]` still renders workout heatmap.

Stop the dev server.

- [ ] **Step 5: Commit**

```bash
git add src/app/\(app\)/stats/page.tsx
git commit -m "feat(stats): three regions with RegionHeader + MuscleRank section"
```

---

## Task 12: E2E test `tests/e2e/muscle-rank.spec.ts`

**Files:**
- Create: `tests/e2e/muscle-rank.spec.ts`

- [ ] **Step 1: Inspect an existing e2e spec for the login helper pattern**

Run: `head -30 tests/e2e/avatar-flow.spec.ts`

Note the helper used to log in (likely `loginAsDemoUser` or an inline `page.goto('/login')` flow). Reuse the same pattern.

- [ ] **Step 2: Write the spec**

Create `tests/e2e/muscle-rank.spec.ts` modeled on `tests/e2e/avatar-flow.spec.ts`:

```ts
import { test, expect } from '@playwright/test'

// Reuse the same login flow used by avatar-flow.spec.ts. Adjust if the existing
// suite uses a shared helper module.
async function login(page: import('@playwright/test').Page) {
  await page.goto('/login')
  await page.getByLabel('Email').fill('demo@hexis.local')
  await page.getByLabel('Heslo').fill('demo1234')
  await page.getByRole('button', { name: /přihlásit/i }).click()
  await page.waitForURL('**/dashboard')
}

test.describe('/stats — muscle rank surface', () => {
  test('renders the three regions and the radar (or its empty state)', async ({ page }) => {
    await login(page)
    await page.goto('/stats')

    await expect(page.getByText('AVATAR PROGRESS')).toBeVisible()
    await expect(page.getByText('MUSCLE RANK')).toBeVisible()
    await expect(page.getByText('XP HISTORY')).toBeVisible()

    const radar = page.locator('svg[role="img"][aria-label="Muscle rank radar"]')
    const emptyCta = page.getByRole('link', { name: 'Spustit trénink' })

    if (await radar.count()) {
      await expect(radar).toBeVisible()
      await expect(page.getByText(/× S/)).toBeVisible()
      await expect(page.getByText(/× D/)).toBeVisible()
      await expect(page.getByText('Doplň')).toBeVisible()
    } else {
      await expect(emptyCta).toBeVisible()
    }
  })
})
```

- [ ] **Step 3: Run the spec**

Run: `npx playwright test tests/e2e/muscle-rank.spec.ts`
Expected: green. If the login helper pattern differs, adjust the helper function and re-run.

- [ ] **Step 4: Commit**

```bash
git add tests/e2e/muscle-rank.spec.ts
git commit -m "test(e2e): add muscle-rank stats surface spec"
```

---

## Task 13: Update `tests/e2e/muscle-heatmap.spec.ts` for the new component

**Files:**
- Modify: `tests/e2e/muscle-heatmap.spec.ts`

- [ ] **Step 1: Read the existing spec and identify selectors that depended on `BodySvg` (e.g., `aria-label="Body front view"`)**

Run: `cat tests/e2e/muscle-heatmap.spec.ts`

- [ ] **Step 2: Update selectors**

Wherever the spec referenced the legacy aria-label `Body front view` / `Body back view`, replace with `Anatomical body front view` / `Anatomical body back view`. Wherever it referenced `data-muscle="chest"` or any of the legacy 15-slug zones, replace with the closest new slug (e.g., `chest-mid`, `traps-mid`, `abs-upper`).

- [ ] **Step 3: Run the spec**

Run: `npx playwright test tests/e2e/muscle-heatmap.spec.ts`
Expected: green.

- [ ] **Step 4: Run the full e2e suite as a regression check**

Run: `npx playwright test`
Expected: all green. If `tests/e2e/dashboard-sp3.spec.ts` or others touch the heatmap, fix selectors there too.

- [ ] **Step 5: Commit**

```bash
git add tests/e2e/
git commit -m "test(e2e): update heatmap selectors for AnatomicalBody"
```

---

## Task 14: Final verification + PR

**Files:** none

- [ ] **Step 1: Typecheck**

Run: `npm run typecheck`
Expected: clean.

- [ ] **Step 2: Lint**

Run: `npm run lint`
Expected: clean.

- [ ] **Step 3: Full unit + integration suite**

Run: `npm run test:run`
Expected: all green.

- [ ] **Step 4: Full e2e suite**

Run: `npx playwright test`
Expected: all green.

- [ ] **Step 5: §11.2 nested-import grep guard**

Run:
```bash
grep -rEn "from '@/components/[^/]+/[^/']+/[^/']+'" src/ tests/ || echo "clean"
```
Expected: `clean` (or only matches that match the documented allowlist in `docs/design-system/`).

- [ ] **Step 6: BodySvg residue check**

Run:
```bash
grep -rn "BodySvg\|SLUG_TO_ZONE\|slugToZones" src/ tests/ || echo "clean"
```
Expected: `clean`.

- [ ] **Step 7: Manual dev-server smoke (browser)**

Run: `npm run dev`
Visit and verify:
- `http://localhost:3000/dashboard` — heatmap renders, both views shown side-by-side ≥sm.
- `http://localhost:3000/stats` — three regions, radar (or empty CTA), top-3-weakest list.
- `http://localhost:3000/training` — start a workout; the in-workout heatmap renders.
- Resize to <640px — heatmap shows tab toggle (Zepředu / Zezadu); radar still renders.
Stop the dev server.

- [ ] **Step 8: Push the branch**

```bash
git push -u origin sp4-muscle-visual
```

- [ ] **Step 9: Open the PR**

Run:
```bash
gh pr create --title "SP4 PR-2 — muscle visual surface (AnatomicalBody + MuscleRank)" --body "$(cat <<'EOF'
## Summary
- New `AnatomicalBody` (22 per-slug paths) + `AnatomicalBodyDual` (responsive front/back). `BodySvg` deleted.
- New `MuscleRank` 22-axis radar on `/stats` with per-slug rank thresholds (kg-reps, trailing 8 weeks).
- `/stats` reorganized into three `RegionHeader` regions: AVATAR PROGRESS, MUSCLE RANK, XP HISTORY. Avatar hero block extracted to `AvatarHeroCard`.
- `fetchMuscleVolumes` gains `daysWindow` (default 7); new `fetchMuscleVolumesLast8Weeks` wraps it with 56.

Spec: `docs/superpowers/specs/2026-04-27-sp4-muscle-visual-language-design.md`
Plan: `docs/superpowers/plans/2026-04-28-sp4-pr2-muscle-visual.md`
Depends on: SP4 PR-1 (#16) — already merged.

Acknowledged transitional behavior: `AnatomicalBody` ships with the fallback geometry described in spec §10 (per-slug slices of legacy zones). Finer anatomical illustration lands in follow-up commits without breaking this component's API.

## Test plan
- [ ] `npm run typecheck` clean
- [ ] `npm run lint` clean
- [ ] `npm run test:run` all green
- [ ] `npx playwright test` all green
- [ ] §11.2 nested-import grep clean
- [ ] No `BodySvg` / `SLUG_TO_ZONE` / `slugToZones` residue
- [ ] Manual smoke: `/dashboard`, `/stats`, `/training/[id]` render; <sm tab toggle works

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

Expected: PR URL printed. Confirm with the user before merging.

---

## Self-Review Checklist (writer's pass)

- [x] **Spec coverage:**
  - §5.1–§5.3 (`AnatomicalBody` props + `SLUG_ZONES`/`applyHighlights`) → Tasks 1, 4
  - §5.4 (`AnatomicalBodyDual` responsive layout) → Task 5
  - §5.5 file list (`AnatomicalBody`, `Dual`, `anatomy-zones`, `MuscleHeatmap`/`WorkoutHeatmap` updates, `BodySvg` deletion) → Tasks 1, 4, 5, 6, 7
  - §6.1 (`muscle-rank.ts` thresholds/colors/`volumeToRank`) → Task 2
  - §6.2 (`fetchMuscleVolumesLast8Weeks` + `fetchMuscleVolumes(daysWindow)` refactor) → Task 3
  - §6.3 (`MuscleRank` radar) → Task 8
  - §6.4 (empty state `< 3` sessions threshold + CTA) → Task 9
  - §7 (`/stats` 3 regions + `AvatarHeroCard` extraction) → Tasks 10, 11
  - §7.3 (top-3-weakest list under radar) → Task 9
  - §8 (Dashboard `MuscleWidget` + `WorkoutHeatmap` swap) → Task 6
  - §9.1–§9.3 (unit + integration + e2e) → Tasks 1–10, 12, 13
  - §9.4 verification (typecheck/lint/§11.2/manual smoke) → Task 14
  - §10 fallback risk mitigation → Task 4 explicitly uses fallback geometry
- [x] **Placeholder scan:** no "TBD", "implement later", or "add appropriate handling" — every code step has full code.
- [x] **Type consistency:** `Rank` exported from `muscle-rank.ts` (Task 2), imported by `MuscleRank.tsx` (Task 8) and `MuscleRankSection.tsx` (Task 9). `applyHighlights` (Task 1) consumed by `AnatomicalBodyDual` (Task 5). `MUSCLE_GROUPS` slugs from PR-1 seed referenced in Tasks 1 + 2 + 9 with identical names. `fetchMuscleVolumesLast8Weeks` signature `(db, userId)` consistent across Tasks 3 + 9.
- [x] **TDD ordering:** every component / lib task is red→green→commit. Refactor tasks (6, 7, 11) gated by full suite re-run.
- [x] **Commit cadence:** one commit per task except Task 0 (worktree setup). 13 commits + final PR.
