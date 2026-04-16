# M7 — Muscle Heatmap Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** SVG body silhouette with heat-colored muscle zones on dashboard (7-day volume) and active workout (planned/done/rest).

**Architecture:** Custom SVG paths per muscle zone, color computed from volume data (heat scale) or workout state (3-color categorical). Query reuses volume aggregation pattern from M4 but without category grouping.

**Tech Stack:** Pure SVG + React, existing Drizzle/MySQL stack. No new dependencies.

**Test runner:** `npx vitest run --no-file-parallelism`

**Branch:** `m7-muscle-heatmap` (from `main`)

---

### Task 1: Create branch

- [ ] **Step 1: Create branch**

```bash
git checkout main
git checkout -b m7-muscle-heatmap
```

---

### Task 2: Heatmap colors + zone mapping lib + tests

**Files:**
- Create: `src/lib/heatmap-colors.ts`
- Create: `src/tests/lib/heatmap-colors.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// src/tests/lib/heatmap-colors.test.ts
import { describe, it, expect } from 'vitest'
import { volumeToColor, slugToZones, SLUG_TO_ZONE } from '@/lib/heatmap-colors'

describe('volumeToColor', () => {
  it('returns inactive color for 0 volume', () => {
    expect(volumeToColor(0, 1000)).toBe('#1f2733')
  })

  it('returns dark green for low volume (1-25%)', () => {
    expect(volumeToColor(200, 1000)).toBe('#065f46')
  })

  it('returns emerald for medium volume (26-50%)', () => {
    expect(volumeToColor(400, 1000)).toBe('#10b981')
  })

  it('returns amber for high volume (51-75%)', () => {
    expect(volumeToColor(600, 1000)).toBe('#f59e0b')
  })

  it('returns red for max volume (76-100%)', () => {
    expect(volumeToColor(900, 1000)).toBe('#ef4444')
  })

  it('returns inactive when maxVolume is 0', () => {
    expect(volumeToColor(0, 0)).toBe('#1f2733')
  })
})

describe('slugToZones', () => {
  it('maps chest to front zone', () => {
    const zones = slugToZones('chest')
    expect(zones).toEqual([{ zone: 'chest', view: 'front' }])
  })

  it('maps shoulders to both views', () => {
    const zones = slugToZones('shoulders')
    expect(zones).toEqual([
      { zone: 'shoulders', view: 'front' },
      { zone: 'shoulders', view: 'back' },
    ])
  })

  it('maps all 3 back slugs to same zone', () => {
    expect(slugToZones('back-lats')).toEqual([{ zone: 'back-upper', view: 'back' }])
    expect(slugToZones('back-mid')).toEqual([{ zone: 'back-upper', view: 'back' }])
    expect(slugToZones('back-rear-delt')).toEqual([{ zone: 'back-upper', view: 'back' }])
  })

  it('all 15 slugs are mapped', () => {
    const allSlugs = [
      'chest', 'back-lats', 'back-mid', 'back-rear-delt', 'shoulders',
      'biceps', 'triceps', 'forearms', 'abs', 'obliques',
      'quads', 'hamstrings', 'glutes', 'calves', 'adductors',
    ]
    for (const slug of allSlugs) {
      expect(SLUG_TO_ZONE[slug]).toBeDefined()
    }
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/tests/lib/heatmap-colors.test.ts
```

- [ ] **Step 3: Implement heatmap colors**

```typescript
// src/lib/heatmap-colors.ts

const INACTIVE = '#1f2733'
const THRESHOLDS: [number, string][] = [
  [0.76, '#ef4444'],   // red
  [0.51, '#f59e0b'],   // amber
  [0.26, '#10b981'],   // emerald
  [0.01, '#065f46'],   // dark green
]

export function volumeToColor(volume: number, maxVolume: number): string {
  if (maxVolume <= 0 || volume <= 0) return INACTIVE
  const ratio = volume / maxVolume
  for (const [threshold, color] of THRESHOLDS) {
    if (ratio >= threshold) return color
  }
  return INACTIVE
}

type ZoneMapping = { zone: string; view: 'front' | 'back' }

export const SLUG_TO_ZONE: Record<string, { zone: string; view: 'front' | 'back' | 'both' }> = {
  chest:             { zone: 'chest', view: 'front' },
  shoulders:         { zone: 'shoulders', view: 'both' },
  biceps:            { zone: 'biceps', view: 'front' },
  triceps:           { zone: 'triceps', view: 'back' },
  forearms:          { zone: 'forearms', view: 'front' },
  abs:               { zone: 'abs', view: 'front' },
  obliques:          { zone: 'abs', view: 'front' },
  'back-lats':       { zone: 'back-upper', view: 'back' },
  'back-mid':        { zone: 'back-upper', view: 'back' },
  'back-rear-delt':  { zone: 'back-upper', view: 'back' },
  quads:             { zone: 'quads', view: 'front' },
  hamstrings:        { zone: 'hamstrings', view: 'back' },
  glutes:            { zone: 'glutes', view: 'back' },
  calves:            { zone: 'calves', view: 'both' },
  adductors:         { zone: 'adductors', view: 'front' },
}

/** Returns zone(s) for a muscle group slug. 'both' expands to front + back entries. */
export function slugToZones(slug: string): ZoneMapping[] {
  const mapping = SLUG_TO_ZONE[slug]
  if (!mapping) return []
  if (mapping.view === 'both') {
    return [
      { zone: mapping.zone, view: 'front' },
      { zone: mapping.zone, view: 'back' },
    ]
  }
  return [{ zone: mapping.zone, view: mapping.view }]
}

export const WORKOUT_COLORS = {
  rest: INACTIVE,
  planned: '#f59e0b',
  done: '#10b981',
} as const
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/tests/lib/heatmap-colors.test.ts
```

Expected: 9/9 PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/heatmap-colors.ts src/tests/lib/heatmap-colors.test.ts
git commit -m "feat(m7): heatmap color scale + slug-to-zone mapping + tests"
```

---

### Task 3: Heatmap query + API route + tests

**Files:**
- Create: `src/lib/queries/heatmap.ts`
- Create: `src/app/api/progress/heatmap/route.ts`
- Create: `src/tests/api/heatmap.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/tests/api/heatmap.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { db } from '@/db/client'
import { users, exercises, exerciseMuscleGroups, muscleGroups, sessions, sessionSets } from '@/db/schema'
import { fetchMuscleVolumes } from '@/lib/queries/heatmap'
import { eq } from 'drizzle-orm'

const TEST_USER_ID = 'heatm_test_000000000001'

describe('fetchMuscleVolumes', () => {
  let chestExId: number

  beforeAll(async () => {
    await db.insert(users).values({
      id: TEST_USER_ID,
      email: 'heatmap-test@hexis.local',
      name: 'Heatmap Test',
      passwordHash: 'x',
    })
    const chestMg = await db.query.muscleGroups.findFirst({
      where: eq(muscleGroups.slug, 'chest'),
    })
    const [ex] = await db.insert(exercises).values({
      name: 'Heatmap Test Bench',
      type: 'barbell',
    })
    chestExId = ex.insertId
    await db.insert(exerciseMuscleGroups).values({
      exerciseId: chestExId,
      muscleGroupId: chestMg!.id,
      isPrimary: true,
    })

    const [s1] = await db.insert(sessions).values({
      userId: TEST_USER_ID,
      startedAt: new Date('2026-04-14T10:00:00Z'),
      finishedAt: new Date('2026-04-14T11:00:00Z'),
    })
    await db.insert(sessionSets).values([
      { sessionId: s1.insertId, exerciseId: chestExId, setIndex: 0, weightKg: '80.00', reps: 8, completedAt: new Date('2026-04-14T10:10:00Z') },
      { sessionId: s1.insertId, exerciseId: chestExId, setIndex: 1, weightKg: '80.00', reps: 8, completedAt: new Date('2026-04-14T10:15:00Z') },
    ])
  })

  afterAll(async () => {
    await db.delete(sessionSets)
    await db.delete(sessions).where(eq(sessions.userId, TEST_USER_ID))
    await db.delete(exerciseMuscleGroups).where(eq(exerciseMuscleGroups.exerciseId, chestExId))
    await db.delete(exercises).where(eq(exercises.name, 'Heatmap Test Bench'))
    await db.delete(users).where(eq(users.id, TEST_USER_ID))
  })

  it('returns volume per muscle slug', async () => {
    const result = await fetchMuscleVolumes(db, TEST_USER_ID, 30)
    expect(result.muscles.chest).toBe(1280) // 80*8*2
    expect(result.maxVolume).toBeGreaterThanOrEqual(1280)
  })

  it('returns empty for user with no data', async () => {
    const result = await fetchMuscleVolumes(db, 'nonexistent_user_00001', 30)
    expect(Object.keys(result.muscles)).toHaveLength(0)
    expect(result.maxVolume).toBe(0)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/tests/api/heatmap.test.ts --no-file-parallelism
```

- [ ] **Step 3: Implement heatmap query**

```typescript
// src/lib/queries/heatmap.ts
import { sql } from 'drizzle-orm'
import type { MySql2Database } from 'drizzle-orm/mysql2'
import * as schema from '@/db/schema'

type DB = MySql2Database<typeof schema>

export type MuscleVolumes = {
  muscles: Record<string, number>
  maxVolume: number
}

type RawRow = {
  slug: string
  volume: string | number
}

export async function fetchMuscleVolumes(
  db: DB,
  userId: string,
  days: number
): Promise<MuscleVolumes> {
  const since = new Date()
  since.setDate(since.getDate() - days)
  const sinceStr = since.toISOString().slice(0, 10)

  const [rows] = await db.execute(sql`
    SELECT
      mg.slug,
      SUM(CAST(ss.weight_kg AS DECIMAL(10,2)) * ss.reps) AS volume
    FROM session_sets ss
    JOIN sessions s ON s.id = ss.session_id
    JOIN exercise_muscle_groups emg ON emg.exercise_id = ss.exercise_id
    JOIN muscle_groups mg ON mg.id = emg.muscle_group_id
    WHERE s.user_id = ${userId}
      AND ss.completed_at >= ${sinceStr}
      AND ss.weight_kg IS NOT NULL
      AND ss.reps IS NOT NULL
    GROUP BY mg.slug
  `)

  const muscles: Record<string, number> = {}
  let maxVolume = 0
  for (const row of rows as unknown as RawRow[]) {
    const vol = Number(row.volume)
    muscles[row.slug] = vol
    if (vol > maxVolume) maxVolume = vol
  }

  return { muscles, maxVolume }
}
```

- [ ] **Step 4: Implement API route**

```typescript
// src/app/api/progress/heatmap/route.ts
import { db } from '@/db/client'
import { requireSessionUser } from '@/lib/auth-helpers'
import { fetchMuscleVolumes } from '@/lib/queries/heatmap'

export async function GET(req: Request) {
  const user = await requireSessionUser()
  if (user instanceof Response) return user

  const url = new URL(req.url)
  const days = Math.min(Number(url.searchParams.get('days') ?? 7), 365)
  const result = await fetchMuscleVolumes(db, user.id, days)

  return Response.json(result)
}
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
npx vitest run src/tests/api/heatmap.test.ts --no-file-parallelism
```

Expected: 2/2 PASS

- [ ] **Step 6: Commit**

```bash
git add src/lib/queries/heatmap.ts src/app/api/progress/heatmap/route.ts src/tests/api/heatmap.test.ts
git commit -m "feat(m7): heatmap query (volume per muscle slug) + API route + tests"
```

---

### Task 4: BodySvg component

**Files:**
- Create: `src/components/heatmap/BodySvg.tsx`

This is the core SVG silhouette. It's a stylized body outline with fillable muscle zone paths. The SVG uses a 200×400 viewBox. Each muscle zone is a simplified polygon path.

- [ ] **Step 1: Create BodySvg**

```typescript
// src/components/heatmap/BodySvg.tsx

const INACTIVE = '#1f2733'

type Props = {
  view: 'front' | 'back'
  fills: Record<string, string>
  className?: string
}

/** Front view muscle zone paths */
const FRONT_ZONES: { zone: string; d: string }[] = [
  { zone: 'chest', d: 'M70,95 Q80,88 100,86 Q120,88 130,95 L128,115 Q100,120 72,115 Z' },
  { zone: 'shoulders', d: 'M58,82 L70,78 L72,95 L70,105 L56,100 Z M130,78 L142,82 L144,100 L130,105 L128,95 Z' },
  { zone: 'biceps', d: 'M54,105 L58,100 L60,130 L54,135 Z M142,100 L146,105 L146,135 L140,130 Z' },
  { zone: 'forearms', d: 'M52,138 L56,135 L54,170 L48,172 Z M144,135 L148,138 L152,172 L146,170 Z' },
  { zone: 'abs', d: 'M78,118 L122,118 L120,168 L80,168 Z' },
  { zone: 'quads', d: 'M74,172 L96,170 L92,240 L70,242 Z M104,170 L126,172 L130,242 L108,240 Z' },
  { zone: 'adductors', d: 'M92,180 L108,180 L106,220 L94,220 Z' },
  { zone: 'calves', d: 'M72,260 L90,255 L88,320 L72,322 Z M110,255 L128,260 L128,322 L112,320 Z' },
]

/** Back view muscle zone paths */
const BACK_ZONES: { zone: string; d: string }[] = [
  { zone: 'back-upper', d: 'M72,90 L128,90 L130,135 L70,135 Z' },
  { zone: 'shoulders', d: 'M56,82 L72,78 L72,95 L58,100 Z M128,78 L144,82 L142,100 L128,95 Z' },
  { zone: 'triceps', d: 'M54,105 L58,100 L60,135 L54,138 Z M142,100 L146,105 L146,138 L140,135 Z' },
  { zone: 'glutes', d: 'M76,155 L124,155 L126,185 L74,185 Z' },
  { zone: 'hamstrings', d: 'M72,190 L96,188 L92,255 L70,258 Z M104,188 L128,190 L130,258 L108,255 Z' },
  { zone: 'calves', d: 'M72,265 L90,260 L88,325 L72,328 Z M110,260 L128,265 L128,328 L112,325 Z' },
]

/** Body outline (non-fillable, decorative) */
const OUTLINE = 'M100,10 Q85,10 82,25 Q78,35 80,45 Q76,50 74,55 Q68,65 60,75 L56,80 Q48,90 50,105 L52,140 Q50,160 48,175 Q46,178 44,180 Q80,170 100,168 Q120,170 156,180 Q154,178 152,175 Q150,160 148,140 L150,105 Q152,90 144,80 L140,75 Q132,65 126,55 Q124,50 122,45 Q120,35 118,25 Q115,10 100,10 Z M80,175 L76,250 Q74,260 70,268 L68,330 Q66,345 72,350 Q80,355 88,350 Q92,345 92,340 L96,260 Q98,250 100,248 Q102,250 104,260 L108,340 Q108,345 112,350 Q120,355 128,350 Q134,345 132,330 L130,268 Q126,260 124,250 L120,175'

export function BodySvg({ view, fills, className }: Props) {
  const zones = view === 'front' ? FRONT_ZONES : BACK_ZONES

  return (
    <svg viewBox="0 0 200 370" className={className} role="img" aria-label={`Body ${view} view`}>
      {/* Body outline */}
      <path d={OUTLINE} fill="none" stroke="#1f2733" strokeWidth="1.5" />
      {/* Muscle zones */}
      {zones.map((z) => (
        <path
          key={`${view}-${z.zone}`}
          data-muscle={z.zone}
          d={z.d}
          fill={fills[z.zone] ?? INACTIVE}
          opacity={0.85}
          stroke="none"
        />
      ))}
    </svg>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/heatmap/BodySvg.tsx
git commit -m "feat(m7): BodySvg silhouette component (front + back views)"
```

---

### Task 5: MuscleHeatmap + WorkoutHeatmap components

**Files:**
- Create: `src/components/heatmap/MuscleHeatmap.tsx`
- Create: `src/components/heatmap/WorkoutHeatmap.tsx`

- [ ] **Step 1: Create MuscleHeatmap (dashboard/standalone)**

```typescript
// src/components/heatmap/MuscleHeatmap.tsx
'use client'

import { BodySvg } from './BodySvg'
import { volumeToColor, slugToZones } from '@/lib/heatmap-colors'

type Props = {
  data: Record<string, number>
  maxVolume: number
}

export function MuscleHeatmap({ data, maxVolume }: Props) {
  // Build fill maps for front and back
  const frontFills: Record<string, string> = {}
  const backFills: Record<string, string> = {}

  for (const [slug, volume] of Object.entries(data)) {
    const color = volumeToColor(volume, maxVolume)
    const zones = slugToZones(slug)
    for (const { zone, view } of zones) {
      if (view === 'front') {
        // Take the max color if multiple slugs map to same zone
        if (!frontFills[zone] || volume > (data[slug] ?? 0)) frontFills[zone] = color
      } else {
        if (!backFills[zone] || volume > (data[slug] ?? 0)) backFills[zone] = color
      }
    }
  }

  return (
    <div className="flex items-center justify-center gap-2">
      <div className="flex flex-col items-center">
        <BodySvg view="front" fills={frontFills} className="h-48 w-auto" />
        <span className="mt-1 text-[10px] text-[#6b7280]">Zepředu</span>
      </div>
      <div className="flex flex-col items-center">
        <BodySvg view="back" fills={backFills} className="h-48 w-auto" />
        <span className="mt-1 text-[10px] text-[#6b7280]">Zezadu</span>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create WorkoutHeatmap**

```typescript
// src/components/heatmap/WorkoutHeatmap.tsx
'use client'

import { BodySvg } from './BodySvg'
import { slugToZones, WORKOUT_COLORS } from '@/lib/heatmap-colors'

type Props = {
  /** Muscle slugs for planned exercises */
  plannedMuscles: string[]
  /** Muscle slugs for exercises with at least 1 logged set */
  doneMuscles: string[]
}

export function WorkoutHeatmap({ plannedMuscles, doneMuscles }: Props) {
  const doneSet = new Set(doneMuscles)
  const plannedSet = new Set(plannedMuscles)

  const frontFills: Record<string, string> = {}
  const backFills: Record<string, string> = {}

  // Done takes priority over planned
  const allSlugs = new Set([...plannedMuscles, ...doneMuscles])
  for (const slug of allSlugs) {
    const color = doneSet.has(slug) ? WORKOUT_COLORS.done : WORKOUT_COLORS.planned
    const zones = slugToZones(slug)
    for (const { zone, view } of zones) {
      const target = view === 'front' ? frontFills : backFills
      // done overrides planned
      if (target[zone] === WORKOUT_COLORS.done) continue
      target[zone] = color
    }
  }

  return (
    <div className="flex items-center justify-center gap-2">
      <BodySvg view="front" fills={frontFills} className="h-36 w-auto" />
      <BodySvg view="back" fills={backFills} className="h-36 w-auto" />
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/heatmap/MuscleHeatmap.tsx src/components/heatmap/WorkoutHeatmap.tsx
git commit -m "feat(m7): MuscleHeatmap (heat scale) + WorkoutHeatmap (3-state) components"
```

---

### Task 6: Dashboard MuscleWidget

**Files:**
- Create: `src/components/dashboard/MuscleWidget.tsx`
- Modify: `src/app/(app)/dashboard/page.tsx`

- [ ] **Step 1: Create MuscleWidget**

```typescript
// src/components/dashboard/MuscleWidget.tsx
import { MuscleHeatmap } from '@/components/heatmap/MuscleHeatmap'

type Props = {
  data: Record<string, number>
  maxVolume: number
}

export function MuscleWidget({ data, maxVolume }: Props) {
  const hasData = Object.keys(data).length > 0

  return (
    <div className="rounded-lg border border-[#1F2733] p-3">
      <h3 className="mb-2 text-center text-xs text-[#6B7280]">Posledních 7 dní</h3>
      {hasData ? (
        <MuscleHeatmap data={data} maxVolume={maxVolume} />
      ) : (
        <p className="py-4 text-center text-xs text-[#6b7280]">Žádný trénink</p>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Wire into dashboard**

In `src/app/(app)/dashboard/page.tsx`:

Add imports:
```typescript
import { MuscleWidget } from '@/components/dashboard/MuscleWidget'
import { fetchMuscleVolumes } from '@/lib/queries/heatmap'
```

After the existing `Promise.all` block (or within it), add:
```typescript
const heatmapData = await fetchMuscleVolumes(db, user.id, 7)
```

In the JSX, add `<MuscleWidget data={heatmapData.muscles} maxVolume={heatmapData.maxVolume} />` after the `NutritionStreakCard` and before the closing `</div>`.

READ the dashboard file first to find exact insertion points.

- [ ] **Step 3: Commit**

```bash
git add src/components/dashboard/MuscleWidget.tsx src/app/\(app\)/dashboard/page.tsx
git commit -m "feat(m7): MuscleWidget on dashboard (7-day heatmap)"
```

---

### Task 7: WorkoutHeatmap in active workout page

**Files:**
- Modify: `src/app/(app)/workout/[sessionId]/page.tsx`

The active workout page at `src/app/(app)/workout/[sessionId]/page.tsx` already builds `allExercises` with `exerciseId` per exercise. We need to:

1. Fetch muscle group slugs for each exercise in the session
2. Determine which are "done" (have logged sets) vs "planned" (in plan but no sets yet)
3. Pass to `WorkoutHeatmap` component

- [ ] **Step 1: Read the workout page and add heatmap**

In `src/app/(app)/workout/[sessionId]/page.tsx`:

Add imports:
```typescript
import { WorkoutHeatmap } from '@/components/heatmap/WorkoutHeatmap'
import { exerciseMuscleGroups, muscleGroups } from '@/db/schema'
```

After the `allExercises` array is built (after line ~107), add muscle resolution:
```typescript
// Fetch muscle groups for all exercises in this session
const allExIds = allExercises.map((e) => e.exerciseId)
const exerciseMuscles = allExIds.length > 0
  ? await db
      .select({ exerciseId: exerciseMuscleGroups.exerciseId, slug: muscleGroups.slug })
      .from(exerciseMuscleGroups)
      .innerJoin(muscleGroups, eq(muscleGroups.id, exerciseMuscleGroups.muscleGroupId))
      .where(inArray(exerciseMuscleGroups.exerciseId, allExIds))
  : []

const exerciseToMuscles = new Map<number, string[]>()
for (const row of exerciseMuscles) {
  const arr = exerciseToMuscles.get(row.exerciseId) ?? []
  arr.push(row.slug)
  exerciseToMuscles.set(row.exerciseId, arr)
}

const doneExIds = new Set(allExercises.filter((e) => e.sets.length > 0).map((e) => e.exerciseId))
const plannedMuscles: string[] = []
const doneMuscles: string[] = []
for (const ex of allExercises) {
  const muscles = exerciseToMuscles.get(ex.exerciseId) ?? []
  if (doneExIds.has(ex.exerciseId)) {
    doneMuscles.push(...muscles)
  } else {
    plannedMuscles.push(...muscles)
  }
}
```

In the active session JSX (before `<WorkoutSessionClient>`), add a collapsible heatmap:
```tsx
<details className="rounded-lg border border-[#1F2733] p-3">
  <summary className="cursor-pointer text-sm text-[#6B7280]">Svalová mapa</summary>
  <div className="mt-2">
    <WorkoutHeatmap plannedMuscles={plannedMuscles} doneMuscles={doneMuscles} />
  </div>
</details>
```

- [ ] **Step 2: Commit**

```bash
git add src/app/\(app\)/workout/\[sessionId\]/page.tsx
git commit -m "feat(m7): WorkoutHeatmap in active workout page (collapsible)"
```

---

### Task 8: Typecheck + test suite

- [ ] **Step 1: Run typecheck**

```bash
npx tsc --noEmit
```

Expected: clean. Fix any issues.

- [ ] **Step 2: Run full test suite**

```bash
npx vitest run --no-file-parallelism
```

Expected: all tests pass (166 existing + ~11 new ≈ 177). Fix any failures.

- [ ] **Step 3: Commit fixes if needed**

---

### Task 9: E2E spec

**Files:**
- Create: `tests/e2e/muscle-heatmap.spec.ts`

- [ ] **Step 1: Write E2E spec**

```typescript
// tests/e2e/muscle-heatmap.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Muscle heatmap', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[name="email"]', 'demo@hexis.local')
    await page.fill('input[name="password"]', 'Demo1234')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard')
  })

  test('dashboard shows muscle heatmap widget', async ({ page }) => {
    await expect(page.getByText('Posledních 7 dní')).toBeVisible()
  })
})
```

- [ ] **Step 2: Commit**

```bash
git add tests/e2e/muscle-heatmap.spec.ts
git commit -m "test(m7): E2E spec for muscle heatmap"
```

---

### Task 10: Update roadmap

**Files:**
- Modify: `docs/superpowers/roadmap/hexis-roadmap.md`

- [ ] **Step 1: Mark M7 items as done**

In the Muscle heatmap section, change all `[ ]` to `[x]`:

```markdown
### Muscle heatmap
- [x] SVG silueta (front + back) s identifikovatelnými svaly
- [x] Mapování cvik → svaly (seed `exercise_muscle_groups`)
- [x] Overlay v workout UI (planned / done / rest barvy)
- [x] Weekly heatmap na dashboardu
```

Note: "Mapování cvik → svaly" was already done in M0 seed — just mark it.

- [ ] **Step 2: Commit**

```bash
git add docs/superpowers/roadmap/hexis-roadmap.md
git commit -m "docs(m7): mark muscle heatmap milestone complete"
```

---

## Summary

| Task | Description | Tests |
|------|-------------|-------|
| 1 | Branch | — |
| 2 | heatmap-colors.ts + zone mapping | 9 unit |
| 3 | Heatmap query + API route | 2 integration |
| 4 | BodySvg (SVG silhouette) | — |
| 5 | MuscleHeatmap + WorkoutHeatmap | — |
| 6 | Dashboard MuscleWidget | — |
| 7 | Workout page heatmap | — |
| 8 | Typecheck + full test suite | verification |
| 9 | E2E spec | 1 E2E |
| 10 | Roadmap update | — |

**Total new tests:** ~12 (9 unit + 2 integration + 1 E2E)
