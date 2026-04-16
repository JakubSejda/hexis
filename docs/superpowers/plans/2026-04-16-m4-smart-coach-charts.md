# M4 — Smart Coach & Charts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add stagnation detection, 1RM + volume charts, and CSV/ZIP export to Hexis.

**Architecture:** Three new query modules feed three new API routes. Recharts renders client-side charts on a new `/progress/strength` page. JSZip generates client-side exports on `/settings/export`. Stagnation warnings appear in dashboard and active workout.

**Tech Stack:** Recharts 2.15, JSZip 3.10, file-saver 2.0, existing Drizzle/MySQL/Next.js 16 stack.

**Test runner:** `npx vitest run --no-file-parallelism` (parallel has DB contamination — known issue from M2)

**Branch:** `m4-smart-coach-charts` (from `main`)

---

### Task 1: Create branch + install deps

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Create branch**

```bash
git checkout main
git checkout -b m4-smart-coach-charts
```

- [ ] **Step 2: Install dependencies**

```bash
npm install recharts jszip file-saver
npm install -D @types/file-saver
```

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore(m4): install recharts, jszip, file-saver"
```

---

### Task 2: Stagnation detection — lib + tests

**Files:**
- Create: `src/lib/stagnation.ts`
- Create: `src/tests/lib/stagnation.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// src/tests/lib/stagnation.test.ts
import { describe, it, expect } from 'vitest'
import { detectStagnation } from '@/lib/stagnation'

describe('detectStagnation', () => {
  const today = new Date('2026-04-16')

  it('returns not stagnant when PR was recent', () => {
    const result = detectStagnation({
      exerciseId: 1,
      exerciseName: 'Bench Press',
      sets: [
        { weightKg: 80, reps: 5, completedAt: '2026-04-14' },
        { weightKg: 82.5, reps: 5, completedAt: '2026-04-16' },
      ],
      now: today,
    })
    expect(result.isStagnant).toBe(false)
    expect(result.weeksSincePr).toBe(0)
  })

  it('returns stagnant after 2 weeks without PR', () => {
    const result = detectStagnation({
      exerciseId: 1,
      exerciseName: 'Bench Press',
      sets: [
        { weightKg: 80, reps: 8, completedAt: '2026-03-25' },
        { weightKg: 80, reps: 6, completedAt: '2026-04-01' },
        { weightKg: 80, reps: 7, completedAt: '2026-04-08' },
        { weightKg: 80, reps: 7, completedAt: '2026-04-15' },
      ],
      now: today,
    })
    expect(result.isStagnant).toBe(true)
    expect(result.weeksSincePr).toBeGreaterThanOrEqual(2)
    expect(result.suggestion).toBe('deload')
  })

  it('suggests variation after 4+ weeks', () => {
    const result = detectStagnation({
      exerciseId: 1,
      exerciseName: 'Bench Press',
      sets: [
        { weightKg: 80, reps: 5, completedAt: '2026-03-01' },
        { weightKg: 80, reps: 5, completedAt: '2026-03-15' },
        { weightKg: 80, reps: 5, completedAt: '2026-04-01' },
        { weightKg: 80, reps: 5, completedAt: '2026-04-15' },
      ],
      now: today,
    })
    expect(result.isStagnant).toBe(true)
    expect(result.suggestion).toBe('variation')
  })

  it('handles empty sets array', () => {
    const result = detectStagnation({
      exerciseId: 1,
      exerciseName: 'Bench Press',
      sets: [],
      now: today,
    })
    expect(result.isStagnant).toBe(false)
    expect(result.weeksSincePr).toBe(0)
  })

  it('handles single set', () => {
    const result = detectStagnation({
      exerciseId: 1,
      exerciseName: 'Bench Press',
      sets: [{ weightKg: 60, reps: 10, completedAt: '2026-04-14' }],
      now: today,
    })
    expect(result.isStagnant).toBe(false)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/tests/lib/stagnation.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement stagnation detection**

```typescript
// src/lib/stagnation.ts
import { estimate1RM } from '@/lib/1rm'

type SetData = {
  weightKg: number
  reps: number
  completedAt: string // YYYY-MM-DD or ISO
}

type DetectArgs = {
  exerciseId: number
  exerciseName: string
  sets: SetData[]
  now: Date
}

export type StagnationResult = {
  exerciseId: number
  exerciseName: string
  lastPrDate: string
  weeksSincePr: number
  isStagnant: boolean
  suggestion: 'deload' | 'variation'
}

export function detectStagnation(args: DetectArgs): StagnationResult {
  const { exerciseId, exerciseName, sets, now } = args
  const empty: StagnationResult = {
    exerciseId,
    exerciseName,
    lastPrDate: '',
    weeksSincePr: 0,
    isStagnant: false,
    suggestion: 'deload',
  }
  if (sets.length === 0) return empty

  let maxE1rm = 0
  let prDate = ''

  // Walk sets chronologically, tracking running max 1RM
  const sorted = [...sets].sort(
    (a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime()
  )
  for (const s of sorted) {
    const e1rm = estimate1RM(s.weightKg, s.reps)
    if (e1rm >= maxE1rm) {
      maxE1rm = e1rm
      prDate = s.completedAt.slice(0, 10)
    }
  }

  if (!prDate) return empty

  const msPerWeek = 7 * 24 * 60 * 60 * 1000
  const diff = now.getTime() - new Date(prDate + 'T00:00:00Z').getTime()
  const weeksSincePr = Math.floor(diff / msPerWeek)

  return {
    exerciseId,
    exerciseName,
    lastPrDate: prDate,
    weeksSincePr,
    isStagnant: weeksSincePr >= 2,
    suggestion: weeksSincePr >= 4 ? 'variation' : 'deload',
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/tests/lib/stagnation.test.ts
```

Expected: 5/5 PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/stagnation.ts src/tests/lib/stagnation.test.ts
git commit -m "feat(m4): stagnation detection lib + tests"
```

---

### Task 3: Strength progress query + tests

**Files:**
- Create: `src/lib/queries/strength-progress.ts`
- Create: `src/tests/api/strength-progress.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/tests/api/strength-progress.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { db, closeDb } from '@/db/client'
import { users, exercises, sessions, sessionSets } from '@/db/schema'
import { fetchStrengthProgress } from '@/lib/queries/strength-progress'
import { eq } from 'drizzle-orm'

const TEST_USER_ID = 'stren_test_000000000001'

describe('fetchStrengthProgress', () => {
  beforeAll(async () => {
    await db.insert(users).values({
      id: TEST_USER_ID,
      email: 'strength-test@hexis.local',
      name: 'Strength Test',
      passwordHash: 'x',
    })
    const [ex] = await db.insert(exercises).values({
      name: 'Test Bench',
      type: 'barbell',
    })
    const exerciseId = ex.insertId

    // Session 1: 2026-04-01
    const [s1] = await db.insert(sessions).values({
      userId: TEST_USER_ID,
      startedAt: new Date('2026-04-01T10:00:00Z'),
      finishedAt: new Date('2026-04-01T11:00:00Z'),
    })
    await db.insert(sessionSets).values({
      sessionId: s1.insertId,
      exerciseId,
      setIndex: 0,
      weightKg: '80.00',
      reps: 5,
      completedAt: new Date('2026-04-01T10:10:00Z'),
    })

    // Session 2: 2026-04-08
    const [s2] = await db.insert(sessions).values({
      userId: TEST_USER_ID,
      startedAt: new Date('2026-04-08T10:00:00Z'),
      finishedAt: new Date('2026-04-08T11:00:00Z'),
    })
    await db.insert(sessionSets).values({
      sessionId: s2.insertId,
      exerciseId,
      setIndex: 0,
      weightKg: '82.50',
      reps: 5,
      completedAt: new Date('2026-04-08T10:10:00Z'),
    })
  })

  afterAll(async () => {
    await db.delete(sessionSets)
    await db.delete(sessions).where(eq(sessions.userId, TEST_USER_ID))
    await db.delete(exercises).where(eq(exercises.name, 'Test Bench'))
    await db.delete(users).where(eq(users.id, TEST_USER_ID))
    await closeDb()
  })

  it('returns daily best 1RM for an exercise', async () => {
    // Find the exercise we inserted
    const ex = await db.query.exercises.findFirst({ where: eq(exercises.name, 'Test Bench') })
    const result = await fetchStrengthProgress(db, TEST_USER_ID, ex!.id, 30)
    expect(result.length).toBeGreaterThanOrEqual(2)
    expect(result[0]!.best1rm).toBeGreaterThan(0)
    // Second session should have higher 1RM (heavier weight)
    expect(result[1]!.best1rm).toBeGreaterThan(result[0]!.best1rm)
  })

  it('returns empty array for unknown exercise', async () => {
    const result = await fetchStrengthProgress(db, TEST_USER_ID, 99999, 30)
    expect(result).toEqual([])
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/tests/api/strength-progress.test.ts --no-file-parallelism
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement strength progress query**

```typescript
// src/lib/queries/strength-progress.ts
import { and, eq, gte, sql } from 'drizzle-orm'
import type { MySql2Database } from 'drizzle-orm/mysql2'
import * as schema from '@/db/schema'
import { sessions, sessionSets } from '@/db/schema'
import { estimate1RM } from '@/lib/1rm'

type DB = MySql2Database<typeof schema>

export type StrengthDataPoint = {
  date: string
  best1rm: number
}

type RawRow = {
  completed_date: string
  weight_kg: string | null
  reps: number | null
}

/**
 * Returns daily best estimated 1RM for a given exercise,
 * ordered by date ascending.
 */
export async function fetchStrengthProgress(
  db: DB,
  userId: string,
  exerciseId: number,
  days: number
): Promise<StrengthDataPoint[]> {
  const since = new Date()
  since.setDate(since.getDate() - days)
  const sinceStr = since.toISOString().slice(0, 10)

  const [rows] = await db.execute(sql`
    SELECT
      DATE(ss.completed_at) AS completed_date,
      ss.weight_kg,
      ss.reps
    FROM session_sets ss
    JOIN sessions s ON s.id = ss.session_id
    WHERE s.user_id = ${userId}
      AND ss.exercise_id = ${exerciseId}
      AND ss.completed_at >= ${sinceStr}
      AND ss.weight_kg IS NOT NULL
      AND ss.reps IS NOT NULL
    ORDER BY ss.completed_at ASC
  `)

  // Aggregate best 1RM per day in application layer
  const dayMap = new Map<string, number>()
  for (const row of rows as unknown as RawRow[]) {
    const date = String(row.completed_date)
    const w = Number(row.weight_kg)
    const r = Number(row.reps)
    const e1rm = estimate1RM(w, r)
    const current = dayMap.get(date) ?? 0
    if (e1rm > current) dayMap.set(date, e1rm)
  }

  return Array.from(dayMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, best1rm]) => ({ date, best1rm }))
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/tests/api/strength-progress.test.ts --no-file-parallelism
```

Expected: 2/2 PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/queries/strength-progress.ts src/tests/api/strength-progress.test.ts
git commit -m "feat(m4): strength progress query (daily best 1RM) + tests"
```

---

### Task 4: Volume progress query + tests

**Files:**
- Create: `src/lib/queries/volume-progress.ts`
- Create: `src/tests/api/volume-progress.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/tests/api/volume-progress.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { db, closeDb } from '@/db/client'
import { users, exercises, exerciseMuscleGroups, muscleGroups, sessions, sessionSets } from '@/db/schema'
import { fetchVolumeProgress, type VolumeCategory } from '@/lib/queries/volume-progress'
import { eq } from 'drizzle-orm'

const TEST_USER_ID = 'volum_test_000000000001'

describe('fetchVolumeProgress', () => {
  let chestExId: number

  beforeAll(async () => {
    await db.insert(users).values({
      id: TEST_USER_ID,
      email: 'volume-test@hexis.local',
      name: 'Volume Test',
      passwordHash: 'x',
    })
    // Find existing chest muscle group from seed
    const chestMg = await db.query.muscleGroups.findFirst({
      where: eq(muscleGroups.slug, 'chest'),
    })

    const [ex] = await db.insert(exercises).values({
      name: 'Vol Test Bench',
      type: 'barbell',
    })
    chestExId = ex.insertId
    await db.insert(exerciseMuscleGroups).values({
      exerciseId: chestExId,
      muscleGroupId: chestMg!.id,
      isPrimary: true,
    })

    // Session on 2026-04-14 (Mon week)
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
    await db.delete(exercises).where(eq(exercises.name, 'Vol Test Bench'))
    await db.delete(users).where(eq(users.id, TEST_USER_ID))
    await closeDb()
  })

  it('returns weekly volume grouped by muscle category', async () => {
    const result = await fetchVolumeProgress(db, TEST_USER_ID, 30)
    expect(result.length).toBeGreaterThanOrEqual(1)
    const week = result.find((w) => w.weekStart === '2026-04-14')
    expect(week).toBeDefined()
    // 80 * 8 * 2 = 1280
    expect(week!.chest).toBe(1280)
  })

  it('returns empty for user with no data', async () => {
    const result = await fetchVolumeProgress(db, 'nonexistent_user_00001', 30)
    expect(result).toEqual([])
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/tests/api/volume-progress.test.ts --no-file-parallelism
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement volume progress query**

```typescript
// src/lib/queries/volume-progress.ts
import { sql } from 'drizzle-orm'
import type { MySql2Database } from 'drizzle-orm/mysql2'
import * as schema from '@/db/schema'

type DB = MySql2Database<typeof schema>

export type VolumeCategory = 'chest' | 'back' | 'shoulders' | 'arms' | 'legs'

export type WeeklyVolume = {
  weekStart: string
} & Record<VolumeCategory, number>

/**
 * Maps muscle_groups.slug → display category.
 * abs/obliques excluded (low volume, chart clutter).
 */
const SLUG_TO_CATEGORY: Record<string, VolumeCategory> = {
  chest: 'chest',
  'back-lats': 'back',
  'back-mid': 'back',
  'back-rear-delt': 'back',
  shoulders: 'shoulders',
  biceps: 'arms',
  triceps: 'arms',
  forearms: 'arms',
  quads: 'legs',
  hamstrings: 'legs',
  glutes: 'legs',
  calves: 'legs',
  adductors: 'legs',
}

type RawRow = {
  week_start: string
  slug: string
  volume: string | number
}

export async function fetchVolumeProgress(
  db: DB,
  userId: string,
  days: number
): Promise<WeeklyVolume[]> {
  const since = new Date()
  since.setDate(since.getDate() - days)
  const sinceStr = since.toISOString().slice(0, 10)

  const [rows] = await db.execute(sql`
    SELECT
      DATE(DATE_SUB(ss.completed_at, INTERVAL (WEEKDAY(ss.completed_at)) DAY)) AS week_start,
      mg.slug,
      SUM(CAST(ss.weight_kg AS DECIMAL(10,2)) * ss.reps) AS volume
    FROM session_sets ss
    JOIN sessions s ON s.id = ss.session_id
    JOIN exercise_muscle_groups emg ON emg.exercise_id = ss.exercise_id AND emg.is_primary = 1
    JOIN muscle_groups mg ON mg.id = emg.muscle_group_id
    WHERE s.user_id = ${userId}
      AND ss.completed_at >= ${sinceStr}
      AND ss.weight_kg IS NOT NULL
      AND ss.reps IS NOT NULL
    GROUP BY week_start, mg.slug
    ORDER BY week_start ASC
  `)

  const weekMap = new Map<string, WeeklyVolume>()

  for (const row of rows as unknown as RawRow[]) {
    const weekStart = String(row.week_start)
    const category = SLUG_TO_CATEGORY[row.slug]
    if (!category) continue

    let week = weekMap.get(weekStart)
    if (!week) {
      week = { weekStart, chest: 0, back: 0, shoulders: 0, arms: 0, legs: 0 }
      weekMap.set(weekStart, week)
    }
    week[category] += Number(row.volume)
  }

  return Array.from(weekMap.values()).sort((a, b) => a.weekStart.localeCompare(b.weekStart))
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/tests/api/volume-progress.test.ts --no-file-parallelism
```

Expected: 2/2 PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/queries/volume-progress.ts src/tests/api/volume-progress.test.ts
git commit -m "feat(m4): volume progress query (weekly volume per muscle group) + tests"
```

---

### Task 5: Stagnation query + API route

**Files:**
- Create: `src/lib/queries/stagnation.ts`
- Create: `src/app/api/progress/stagnation/route.ts`
- Create: `src/tests/api/stagnation.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/tests/api/stagnation.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { db, closeDb } from '@/db/client'
import { users, exercises, sessions, sessionSets } from '@/db/schema'
import { fetchStagnatingExercises } from '@/lib/queries/stagnation'
import { eq } from 'drizzle-orm'

const TEST_USER_ID = 'stagn_test_000000000001'

describe('fetchStagnatingExercises', () => {
  let benchId: number

  beforeAll(async () => {
    await db.insert(users).values({
      id: TEST_USER_ID,
      email: 'stagnation-test@hexis.local',
      name: 'Stagnation Test',
      passwordHash: 'x',
    })
    const [ex] = await db.insert(exercises).values({
      name: 'Stag Test Bench',
      type: 'barbell',
    })
    benchId = ex.insertId

    // Create sessions over 4 weeks with no 1RM improvement
    for (let weekOffset = 0; weekOffset < 4; weekOffset++) {
      const date = new Date('2026-03-25')
      date.setDate(date.getDate() + weekOffset * 7)
      const [s] = await db.insert(sessions).values({
        userId: TEST_USER_ID,
        startedAt: date,
        finishedAt: new Date(date.getTime() + 3600000),
      })
      await db.insert(sessionSets).values({
        sessionId: s.insertId,
        exerciseId: benchId,
        setIndex: 0,
        weightKg: '80.00',
        reps: 5,
        completedAt: new Date(date.getTime() + 600000),
      })
    }
  })

  afterAll(async () => {
    await db.delete(sessionSets)
    await db.delete(sessions).where(eq(sessions.userId, TEST_USER_ID))
    await db.delete(exercises).where(eq(exercises.name, 'Stag Test Bench'))
    await db.delete(users).where(eq(users.id, TEST_USER_ID))
    await closeDb()
  })

  it('detects stagnating exercises', async () => {
    const result = await fetchStagnatingExercises(db, TEST_USER_ID, new Date('2026-04-16'))
    const bench = result.find((r) => r.exerciseId === benchId)
    expect(bench).toBeDefined()
    expect(bench!.isStagnant).toBe(true)
  })

  it('returns empty for user with no data', async () => {
    const result = await fetchStagnatingExercises(db, 'nonexistent_user_00001', new Date())
    expect(result).toEqual([])
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/tests/api/stagnation.test.ts --no-file-parallelism
```

- [ ] **Step 3: Implement stagnation query**

```typescript
// src/lib/queries/stagnation.ts
import { sql } from 'drizzle-orm'
import type { MySql2Database } from 'drizzle-orm/mysql2'
import * as schema from '@/db/schema'
import { detectStagnation, type StagnationResult } from '@/lib/stagnation'

type DB = MySql2Database<typeof schema>

type RawRow = {
  exercise_id: number
  exercise_name: string
  weight_kg: string
  reps: number
  completed_at: string
}

/**
 * Fetches all exercises the user has trained in the last 60 days,
 * runs stagnation detection, returns only stagnating ones.
 */
export async function fetchStagnatingExercises(
  db: DB,
  userId: string,
  now: Date
): Promise<StagnationResult[]> {
  const since = new Date(now)
  since.setDate(since.getDate() - 60)
  const sinceStr = since.toISOString().slice(0, 10)

  const [rows] = await db.execute(sql`
    SELECT
      ss.exercise_id,
      e.name AS exercise_name,
      ss.weight_kg,
      ss.reps,
      ss.completed_at
    FROM session_sets ss
    JOIN sessions s ON s.id = ss.session_id
    JOIN exercises e ON e.id = ss.exercise_id
    WHERE s.user_id = ${userId}
      AND ss.completed_at >= ${sinceStr}
      AND ss.weight_kg IS NOT NULL
      AND ss.reps IS NOT NULL
    ORDER BY ss.completed_at ASC
  `)

  // Group by exercise
  const byExercise = new Map<number, { name: string; sets: { weightKg: number; reps: number; completedAt: string }[] }>()
  for (const row of rows as unknown as RawRow[]) {
    const eid = Number(row.exercise_id)
    let entry = byExercise.get(eid)
    if (!entry) {
      entry = { name: String(row.exercise_name), sets: [] }
      byExercise.set(eid, entry)
    }
    entry.sets.push({
      weightKg: Number(row.weight_kg),
      reps: Number(row.reps),
      completedAt: String(row.completed_at),
    })
  }

  const results: StagnationResult[] = []
  for (const [exerciseId, { name, sets }] of byExercise) {
    const result = detectStagnation({ exerciseId, exerciseName: name, sets, now })
    if (result.isStagnant) results.push(result)
  }

  return results
}
```

- [ ] **Step 4: Implement API route**

```typescript
// src/app/api/progress/stagnation/route.ts
import { db } from '@/db/client'
import { requireSessionUser } from '@/lib/auth-helpers'
import { fetchStagnatingExercises } from '@/lib/queries/stagnation'

export async function GET() {
  const user = await requireSessionUser()
  if (user instanceof Response) return user
  const exercises = await fetchStagnatingExercises(db, user.id, new Date())
  return Response.json({ exercises })
}
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
npx vitest run src/tests/api/stagnation.test.ts --no-file-parallelism
```

Expected: 2/2 PASS

- [ ] **Step 6: Commit**

```bash
git add src/lib/queries/stagnation.ts src/app/api/progress/stagnation/route.ts src/tests/api/stagnation.test.ts
git commit -m "feat(m4): stagnation query + API route + tests"
```

---

### Task 6: Strength progress API route

**Files:**
- Create: `src/app/api/progress/strength/route.ts`

- [ ] **Step 1: Implement route**

```typescript
// src/app/api/progress/strength/route.ts
import { db } from '@/db/client'
import { requireSessionUser } from '@/lib/auth-helpers'
import { fetchStrengthProgress } from '@/lib/queries/strength-progress'
import { exercises } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(req: Request) {
  const user = await requireSessionUser()
  if (user instanceof Response) return user

  const url = new URL(req.url)
  const exerciseId = Number(url.searchParams.get('exerciseId'))
  if (!exerciseId || !Number.isFinite(exerciseId)) {
    return new Response(JSON.stringify({ error: 'exerciseId required' }), { status: 400 })
  }
  const days = Math.min(Number(url.searchParams.get('days') ?? 90), 365)

  const exercise = await db.query.exercises.findFirst({
    where: eq(exercises.id, exerciseId),
    columns: { id: true, name: true },
  })
  const dataPoints = await fetchStrengthProgress(db, user.id, exerciseId, days)

  return Response.json({
    exerciseId,
    exerciseName: exercise?.name ?? 'Unknown',
    dataPoints,
  })
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/progress/strength/route.ts
git commit -m "feat(m4): GET /api/progress/strength route"
```

---

### Task 7: Volume progress API route

**Files:**
- Create: `src/app/api/progress/volume/route.ts`

- [ ] **Step 1: Implement route**

```typescript
// src/app/api/progress/volume/route.ts
import { db } from '@/db/client'
import { requireSessionUser } from '@/lib/auth-helpers'
import { fetchVolumeProgress } from '@/lib/queries/volume-progress'

export async function GET(req: Request) {
  const user = await requireSessionUser()
  if (user instanceof Response) return user

  const url = new URL(req.url)
  const days = Math.min(Number(url.searchParams.get('days') ?? 90), 365)
  const weeks = await fetchVolumeProgress(db, user.id, days)

  return Response.json({ weeks })
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/progress/volume/route.ts
git commit -m "feat(m4): GET /api/progress/volume route"
```

---

### Task 8: CSV helper + tests

**Files:**
- Create: `src/lib/csv.ts`
- Create: `src/tests/lib/csv.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// src/tests/lib/csv.test.ts
import { describe, it, expect } from 'vitest'
import { toCsv } from '@/lib/csv'

describe('toCsv', () => {
  it('converts array of objects to CSV string', () => {
    const data = [
      { name: 'Bench', weight: 80 },
      { name: 'Squat', weight: 100 },
    ]
    const result = toCsv(data, ['name', 'weight'])
    expect(result).toBe('name,weight\nBench,80\nSquat,100')
  })

  it('escapes commas and quotes', () => {
    const data = [{ note: 'good, very good' }, { note: 'he said "wow"' }]
    const result = toCsv(data, ['note'])
    expect(result).toBe('note\n"good, very good"\n"he said ""wow"""')
  })

  it('handles null and undefined values', () => {
    const data = [{ a: null, b: undefined }, { a: 1, b: 2 }]
    const result = toCsv(data, ['a', 'b'])
    expect(result).toBe('a,b\n,\n1,2')
  })

  it('returns only header for empty data', () => {
    const result = toCsv([], ['a', 'b'])
    expect(result).toBe('a,b')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/tests/lib/csv.test.ts
```

- [ ] **Step 3: Implement CSV helper**

```typescript
// src/lib/csv.ts

function escapeField(value: unknown): string {
  if (value == null) return ''
  const str = String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return '"' + str.replace(/"/g, '""') + '"'
  }
  return str
}

export function toCsv<T extends Record<string, unknown>>(
  data: T[],
  columns: (keyof T & string)[]
): string {
  const header = columns.join(',')
  if (data.length === 0) return header
  const rows = data.map((row) => columns.map((col) => escapeField(row[col])).join(','))
  return header + '\n' + rows.join('\n')
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/tests/lib/csv.test.ts
```

Expected: 4/4 PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/csv.ts src/tests/lib/csv.test.ts
git commit -m "feat(m4): CSV helper + tests"
```

---

### Task 9: Export sets API route

**Files:**
- Create: `src/app/api/export/sets/route.ts`

- [ ] **Step 1: Implement route**

```typescript
// src/app/api/export/sets/route.ts
import { sql } from 'drizzle-orm'
import { db } from '@/db/client'
import { requireSessionUser } from '@/lib/auth-helpers'

type RawRow = {
  id: number
  session_id: number
  exercise_name: string
  set_index: number
  weight_kg: string | null
  reps: number | null
  rpe: number | null
  completed_at: string | null
}

export async function GET() {
  const user = await requireSessionUser()
  if (user instanceof Response) return user

  const [rows] = await db.execute(sql`
    SELECT
      ss.id,
      ss.session_id,
      e.name AS exercise_name,
      ss.set_index,
      ss.weight_kg,
      ss.reps,
      ss.rpe,
      ss.completed_at
    FROM session_sets ss
    JOIN sessions s ON s.id = ss.session_id
    JOIN exercises e ON e.id = ss.exercise_id
    WHERE s.user_id = ${user.id}
    ORDER BY ss.completed_at ASC
  `)

  return Response.json({ sets: rows as unknown as RawRow[] })
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/export/sets/route.ts
git commit -m "feat(m4): GET /api/export/sets route"
```

---

### Task 10: Extend measurements + nutrition API for `?all=true`

**Files:**
- Modify: `src/app/api/measurements/route.ts`
- Modify: `src/app/api/nutrition/route.ts`
- Create: `src/lib/queries/export-helpers.ts`

- [ ] **Step 1: Create export helpers**

```typescript
// src/lib/queries/export-helpers.ts
import { eq, asc } from 'drizzle-orm'
import type { MySql2Database } from 'drizzle-orm/mysql2'
import * as schema from '@/db/schema'
import { measurements, nutritionDays } from '@/db/schema'

type DB = MySql2Database<typeof schema>

export async function fetchAllMeasurements(db: DB, userId: string) {
  return db
    .select()
    .from(measurements)
    .where(eq(measurements.userId, userId))
    .orderBy(asc(measurements.weekStart))
}

export async function fetchAllNutrition(db: DB, userId: string) {
  return db
    .select()
    .from(nutritionDays)
    .where(eq(nutritionDays.userId, userId))
    .orderBy(asc(nutritionDays.date))
}
```

- [ ] **Step 2: Modify measurements GET to support `?all=true`**

In `src/app/api/measurements/route.ts`, add early return at the top of the GET handler, after the user check:

```typescript
  const all = url.searchParams.get('all') === 'true'
  if (all) {
    const { fetchAllMeasurements } = await import('@/lib/queries/export-helpers')
    const items = await fetchAllMeasurements(db, user.id)
    return Response.json({ items })
  }
```

Insert this block after `if (!user) return unauth()` and `const url = new URL(req.url)`, before the `beforeWeek` parsing.

- [ ] **Step 3: Modify nutrition GET to support `?all=true`**

In `src/app/api/nutrition/route.ts`, add early return after the user check:

```typescript
  const all = url.searchParams.get('all') === 'true'
  if (all) {
    const { fetchAllNutrition } = await import('@/lib/queries/export-helpers')
    const items = await fetchAllNutrition(db, user.id)
    return Response.json({ items })
  }
```

Insert this block after `if (!user) return unauth()` and `const url = new URL(req.url)`, before the month validation.

- [ ] **Step 4: Commit**

```bash
git add src/lib/queries/export-helpers.ts src/app/api/measurements/route.ts src/app/api/nutrition/route.ts
git commit -m "feat(m4): add ?all=true support to measurements + nutrition API for export"
```

---

### Task 11: Exercise list API for chart picker

**Files:**
- Modify: `src/app/api/exercises/route.ts`

The existing `/api/exercises` supports `?q=` search. We need to also support `?trained=true` to get exercises the user has actually trained, sorted by session count. Check the existing route first — if it already covers this, skip.

- [ ] **Step 1: Read existing route and modify**

Add a `trained=true` branch. In `src/app/api/exercises/route.ts`:

```typescript
// Add this before the existing query logic, after user check:
const trained = url.searchParams.get('trained') === 'true'
if (trained) {
  const [rows] = await db.execute(sql`
    SELECT e.id, e.name, e.type, COUNT(DISTINCT ss.id) AS set_count
    FROM exercises e
    JOIN session_sets ss ON ss.exercise_id = e.id
    JOIN sessions s ON s.id = ss.session_id
    WHERE s.user_id = ${user.id}
    GROUP BY e.id, e.name, e.type
    HAVING set_count >= 2
    ORDER BY set_count DESC
  `)
  return Response.json({ exercises: rows })
}
```

Add `import { sql } from 'drizzle-orm'` at the top if not already present.

- [ ] **Step 2: Commit**

```bash
git add src/app/api/exercises/route.ts
git commit -m "feat(m4): add ?trained=true to exercises API for chart picker"
```

---

### Task 12: ProgressSegmentControl — add Strength tab

**Files:**
- Modify: `src/components/ui/SegmentControl.tsx`

- [ ] **Step 1: Update ProgressSegmentControl**

Change the `ProgressSegmentControl` function to include the strength segment:

```typescript
export function ProgressSegmentControl() {
  const pathname = usePathname()
  const active = pathname?.startsWith('/progress/nutrition')
    ? '/progress/nutrition'
    : pathname?.startsWith('/progress/strength')
      ? '/progress/strength'
      : '/progress/body'
  return (
    <SegmentControl
      segments={[
        { href: '/progress/body', label: 'Tělo' },
        { href: '/progress/nutrition', label: 'Výživa' },
        { href: '/progress/strength', label: 'Síla' },
      ]}
      active={active}
    />
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ui/SegmentControl.tsx
git commit -m "feat(m4): add Strength tab to progress segment control"
```

---

### Task 13: TimeRangePicker + ExercisePicker components

**Files:**
- Create: `src/components/progress/TimeRangePicker.tsx`
- Create: `src/components/progress/ExercisePicker.tsx`

- [ ] **Step 1: Create TimeRangePicker**

```typescript
// src/components/progress/TimeRangePicker.tsx
'use client'

const OPTIONS = [
  { label: '30d', value: 30 },
  { label: '90d', value: 90 },
  { label: '6m', value: 180 },
  { label: '1y', value: 365 },
] as const

type Props = {
  value: number
  onChange: (days: number) => void
}

export function TimeRangePicker({ value, onChange }: Props) {
  return (
    <div role="tablist" className="flex gap-1 rounded-lg bg-[#141a22] p-1">
      {OPTIONS.map((o) => (
        <button
          key={o.value}
          role="tab"
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
          className={
            'flex-1 rounded-md px-3 py-1.5 text-center text-sm transition-colors ' +
            (value === o.value
              ? 'bg-[#10b981] font-semibold text-[#0a0e14]'
              : 'text-[#6b7280] hover:text-[#e5e7eb]')
          }
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Create ExercisePicker**

```typescript
// src/components/progress/ExercisePicker.tsx
'use client'

type Exercise = {
  id: number
  name: string
}

type Props = {
  exercises: Exercise[]
  value: number | null
  onChange: (id: number) => void
}

export function ExercisePicker({ exercises, value, onChange }: Props) {
  if (exercises.length === 0) {
    return <p className="text-sm text-[#6b7280]">Žádné cviky s daty</p>
  }
  return (
    <select
      value={value ?? ''}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full rounded-lg border border-[#1f2733] bg-[#141a22] px-3 py-2 text-sm text-[#e5e7eb] outline-none focus:border-[#10b981]"
    >
      {exercises.map((ex) => (
        <option key={ex.id} value={ex.id}>
          {ex.name}
        </option>
      ))}
    </select>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/progress/TimeRangePicker.tsx src/components/progress/ExercisePicker.tsx
git commit -m "feat(m4): TimeRangePicker + ExercisePicker components"
```

---

### Task 14: OneRmChart component

**Files:**
- Create: `src/components/progress/OneRmChart.tsx`

- [ ] **Step 1: Implement chart**

```typescript
// src/components/progress/OneRmChart.tsx
'use client'

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'

type DataPoint = {
  date: string
  best1rm: number
}

type Props = {
  data: DataPoint[]
}

function formatDate(dateStr: string) {
  const [, m, d] = dateStr.split('-')
  return `${Number(d)}.${Number(m)}.`
}

export function OneRmChart({ data }: Props) {
  if (data.length === 0) {
    return <p className="py-8 text-center text-sm text-[#6b7280]">Žádná data</p>
  }

  const maxVal = Math.max(...data.map((d) => d.best1rm))
  const globalMax = maxVal

  return (
    <div className="h-[240px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2733" />
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            tick={{ fill: '#6b7280', fontSize: 11 }}
            stroke="#1f2733"
          />
          <YAxis
            tick={{ fill: '#6b7280', fontSize: 11 }}
            stroke="#1f2733"
            domain={['auto', 'auto']}
            unit=" kg"
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#141a22',
              border: '1px solid #1f2733',
              borderRadius: '8px',
              fontSize: '13px',
            }}
            labelFormatter={formatDate}
            formatter={(value: number) => {
              const isPr = value === globalMax
              return [`${value} kg${isPr ? ' PR!' : ''}`, 'Est. 1RM']
            }}
          />
          <Line
            type="monotone"
            dataKey="best1rm"
            stroke="#10b981"
            strokeWidth={2}
            dot={(props: { cx: number; cy: number; payload: DataPoint }) => {
              const isPr = props.payload.best1rm === globalMax
              return (
                <circle
                  key={`dot-${props.payload.date}`}
                  cx={props.cx}
                  cy={props.cy}
                  r={isPr ? 5 : 3}
                  fill={isPr ? '#f59e0b' : '#10b981'}
                  stroke="none"
                />
              )
            }}
            activeDot={{ r: 5, fill: '#10b981' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/progress/OneRmChart.tsx
git commit -m "feat(m4): OneRmChart component (Recharts)"
```

---

### Task 15: VolumeChart component

**Files:**
- Create: `src/components/progress/VolumeChart.tsx`

- [ ] **Step 1: Implement chart**

```typescript
// src/components/progress/VolumeChart.tsx
'use client'

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts'

type WeeklyVolume = {
  weekStart: string
  chest: number
  back: number
  shoulders: number
  arms: number
  legs: number
}

type Props = {
  data: WeeklyVolume[]
}

const CATEGORIES = [
  { key: 'chest', label: 'Chest', color: '#ef4444' },
  { key: 'back', label: 'Back', color: '#3b82f6' },
  { key: 'shoulders', label: 'Shoulders', color: '#f59e0b' },
  { key: 'arms', label: 'Arms', color: '#8b5cf6' },
  { key: 'legs', label: 'Legs', color: '#10b981' },
] as const

function formatWeek(dateStr: string) {
  const [, m, d] = dateStr.split('-')
  return `${Number(d)}.${Number(m)}.`
}

export function VolumeChart({ data }: Props) {
  if (data.length === 0) {
    return <p className="py-8 text-center text-sm text-[#6b7280]">Žádná data</p>
  }

  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2733" />
          <XAxis
            dataKey="weekStart"
            tickFormatter={formatWeek}
            tick={{ fill: '#6b7280', fontSize: 11 }}
            stroke="#1f2733"
          />
          <YAxis
            tick={{ fill: '#6b7280', fontSize: 11 }}
            stroke="#1f2733"
            unit=" kg"
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#141a22',
              border: '1px solid #1f2733',
              borderRadius: '8px',
              fontSize: '13px',
            }}
            labelFormatter={formatWeek}
            formatter={(value: number, name: string) => [
              `${Math.round(value)} kg`,
              name,
            ]}
          />
          <Legend
            wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }}
          />
          {CATEGORIES.map((cat) => (
            <Bar
              key={cat.key}
              dataKey={cat.key}
              name={cat.label}
              stackId="volume"
              fill={cat.color}
              radius={cat.key === 'legs' ? [3, 3, 0, 0] : undefined}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/progress/VolumeChart.tsx
git commit -m "feat(m4): VolumeChart stacked bar component (Recharts)"
```

---

### Task 16: StagnationList component

**Files:**
- Create: `src/components/progress/StagnationList.tsx`

- [ ] **Step 1: Implement component**

```typescript
// src/components/progress/StagnationList.tsx
'use client'

import type { StagnationResult } from '@/lib/stagnation'

type Props = {
  items: StagnationResult[]
}

export function StagnationList({ items }: Props) {
  if (items.length === 0) return null

  return (
    <div className="rounded-lg border border-[#f59e0b]/30 bg-[#f59e0b]/5 p-3">
      <h3 className="mb-2 text-sm font-semibold text-[#f59e0b]">Stagnace</h3>
      <ul className="flex flex-col gap-1.5">
        {items.map((item) => (
          <li key={item.exerciseId} className="text-sm text-[#e5e7eb]">
            <span className="font-medium">{item.exerciseName}</span>
            <span className="text-[#6b7280]">
              {' '}
              — {item.weeksSincePr} t. bez PR
              {item.suggestion === 'deload' ? ' · zkus deload' : ' · zkus jinou variantu'}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/progress/StagnationList.tsx
git commit -m "feat(m4): StagnationList component"
```

---

### Task 17: Strength progress page

**Files:**
- Create: `src/app/(app)/progress/strength/page.tsx`

- [ ] **Step 1: Implement page**

```typescript
// src/app/(app)/progress/strength/page.tsx
import { requireSessionUser } from '@/lib/auth-helpers'
import { redirect } from 'next/navigation'
import { StrengthPageClient } from '@/components/progress/StrengthPageClient'

export default async function StrengthPage() {
  const user = await requireSessionUser()
  if (user instanceof Response) redirect('/login')
  return <StrengthPageClient />
}
```

- [ ] **Step 2: Create the client component that wires everything together**

```typescript
// src/components/progress/StrengthPageClient.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { TimeRangePicker } from './TimeRangePicker'
import { ExercisePicker } from './ExercisePicker'
import { OneRmChart } from './OneRmChart'
import { VolumeChart } from './VolumeChart'
import { StagnationList } from './StagnationList'
import type { StagnationResult } from '@/lib/stagnation'

type TrainedExercise = { id: number; name: string }
type StrengthPoint = { date: string; best1rm: number }
type WeeklyVolume = {
  weekStart: string
  chest: number
  back: number
  shoulders: number
  arms: number
  legs: number
}

export function StrengthPageClient() {
  const [days, setDays] = useState(90)
  const [exercises, setExercises] = useState<TrainedExercise[]>([])
  const [selectedExId, setSelectedExId] = useState<number | null>(null)
  const [strengthData, setStrengthData] = useState<StrengthPoint[]>([])
  const [volumeData, setVolumeData] = useState<WeeklyVolume[]>([])
  const [stagnation, setStagnation] = useState<StagnationResult[]>([])
  const [loading, setLoading] = useState(true)

  // Load exercise list once
  useEffect(() => {
    fetch('/api/exercises?trained=true')
      .then((r) => r.json())
      .then((data) => {
        const list = (data.exercises ?? []) as TrainedExercise[]
        setExercises(list)
        if (list.length > 0 && !selectedExId) setSelectedExId(list[0]!.id)
      })
  }, [])

  // Load stagnation once
  useEffect(() => {
    fetch('/api/progress/stagnation')
      .then((r) => r.json())
      .then((data) => setStagnation(data.exercises ?? []))
  }, [])

  // Load charts when exercise or range changes
  const loadCharts = useCallback(async () => {
    setLoading(true)
    const [strengthRes, volumeRes] = await Promise.all([
      selectedExId
        ? fetch(`/api/progress/strength?exerciseId=${selectedExId}&days=${days}`).then((r) =>
            r.json()
          )
        : Promise.resolve({ dataPoints: [] }),
      fetch(`/api/progress/volume?days=${days}`).then((r) => r.json()),
    ])
    setStrengthData(strengthRes.dataPoints ?? [])
    setVolumeData(volumeRes.weeks ?? [])
    setLoading(false)
  }, [selectedExId, days])

  useEffect(() => {
    loadCharts()
  }, [loadCharts])

  return (
    <div className="flex flex-col gap-4">
      <TimeRangePicker value={days} onChange={setDays} />
      <StagnationList items={stagnation} />

      <section>
        <h2 className="mb-2 text-base font-semibold text-[#e5e7eb]">Estimated 1RM</h2>
        <ExercisePicker
          exercises={exercises}
          value={selectedExId}
          onChange={setSelectedExId}
        />
        <div className="mt-2">
          {loading ? (
            <p className="py-8 text-center text-sm text-[#6b7280]">Načítám...</p>
          ) : (
            <OneRmChart data={strengthData} />
          )}
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-base font-semibold text-[#e5e7eb]">Objem per svalovou skupinu</h2>
        {loading ? (
          <p className="py-8 text-center text-sm text-[#6b7280]">Načítám...</p>
        ) : (
          <VolumeChart data={volumeData} />
        )}
      </section>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/\(app\)/progress/strength/page.tsx src/components/progress/StrengthPageClient.tsx
git commit -m "feat(m4): /progress/strength page with charts + stagnation"
```

---

### Task 18: StagnationBadge in workout ExerciseCard

**Files:**
- Create: `src/components/workout/StagnationBadge.tsx`
- Modify: `src/components/workout/ExerciseCard.tsx`

- [ ] **Step 1: Create StagnationBadge**

```typescript
// src/components/workout/StagnationBadge.tsx
type Props = {
  weeksSincePr: number
  suggestion: 'deload' | 'variation'
}

export function StagnationBadge({ weeksSincePr, suggestion }: Props) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-md bg-[#f59e0b]/10 px-2 py-0.5 text-xs text-[#f59e0b]"
      title={
        suggestion === 'deload'
          ? `${weeksSincePr} t. bez PR — zkus deload`
          : `${weeksSincePr} t. bez PR — zkus variantu`
      }
    >
      ⚠ {weeksSincePr}t. bez PR
    </span>
  )
}
```

- [ ] **Step 2: Wire into ExerciseCard**

Add a new optional prop `stagnation` to ExerciseCard's Props type and render the badge in the header:

In `src/components/workout/ExerciseCard.tsx`, add to the Props type:

```typescript
stagnation?: { weeksSincePr: number; suggestion: 'deload' | 'variation' } | null
```

Add import at top:

```typescript
import { StagnationBadge } from './StagnationBadge'
```

In the header section, after the `<h3>` tag with exercise name, add:

```typescript
{stagnation ? (
  <StagnationBadge weeksSincePr={stagnation.weeksSincePr} suggestion={stagnation.suggestion} />
) : null}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/workout/StagnationBadge.tsx src/components/workout/ExerciseCard.tsx
git commit -m "feat(m4): StagnationBadge in workout ExerciseCard"
```

---

### Task 19: StagnationWarning dashboard widget

**Files:**
- Create: `src/components/dashboard/StagnationWarning.tsx`
- Modify: `src/app/(app)/dashboard/page.tsx`

- [ ] **Step 1: Create StagnationWarning**

```typescript
// src/components/dashboard/StagnationWarning.tsx
import type { StagnationResult } from '@/lib/stagnation'
import Link from 'next/link'

type Props = {
  items: StagnationResult[]
}

export function StagnationWarning({ items }: Props) {
  if (items.length === 0) return null
  return (
    <Link
      href="/progress/strength"
      className="block rounded-lg border border-[#f59e0b]/30 bg-[#f59e0b]/5 p-3"
    >
      <p className="text-sm font-semibold text-[#f59e0b]">
        {items.length === 1
          ? `${items[0]!.exerciseName}: ${items[0]!.weeksSincePr} t. bez PR`
          : `${items.length} cviky stagnují`}
      </p>
      <p className="mt-0.5 text-xs text-[#6b7280]">Tap pro detail</p>
    </Link>
  )
}
```

- [ ] **Step 2: Wire into dashboard**

In `src/app/(app)/dashboard/page.tsx`:

Add import:

```typescript
import { StagnationWarning } from '@/components/dashboard/StagnationWarning'
import { fetchStagnatingExercises } from '@/lib/queries/stagnation'
```

Add to the `Promise.all` block (or after it):

```typescript
const stagnation = await fetchStagnatingExercises(db, user.id, new Date())
```

Add `<StagnationWarning items={stagnation} />` in the JSX, after the streak div and before the CTA link.

- [ ] **Step 3: Commit**

```bash
git add src/components/dashboard/StagnationWarning.tsx src/app/\(app\)/dashboard/page.tsx
git commit -m "feat(m4): StagnationWarning dashboard widget"
```

---

### Task 20: Export page

**Files:**
- Create: `src/app/(app)/settings/export/page.tsx`

- [ ] **Step 1: Implement export page**

```typescript
// src/app/(app)/settings/export/page.tsx
import { requireSessionUser } from '@/lib/auth-helpers'
import { redirect } from 'next/navigation'
import { ExportClient } from '@/components/settings/ExportClient'

export default async function ExportPage() {
  const user = await requireSessionUser()
  if (user instanceof Response) redirect('/login')
  return <ExportClient />
}
```

- [ ] **Step 2: Create ExportClient**

```typescript
// src/components/settings/ExportClient.tsx
'use client'

import { useState } from 'react'
import { toCsv } from '@/lib/csv'

type Status = 'idle' | 'fetching' | 'zipping' | 'done' | 'error'

export function ExportClient() {
  const [status, setStatus] = useState<Status>('idle')

  const handleExport = async () => {
    try {
      setStatus('fetching')

      const [sessionsRes, setsRes, measurementsRes, nutritionRes] = await Promise.all([
        fetch('/api/sessions?limit=9999').then((r) => r.json()),
        fetch('/api/export/sets').then((r) => r.json()),
        fetch('/api/measurements?all=true').then((r) => r.json()),
        fetch('/api/nutrition?all=true').then((r) => r.json()),
      ])

      setStatus('zipping')

      const { default: JSZip } = await import('jszip')
      const { saveAs } = await import('file-saver')

      const zip = new JSZip()

      zip.file(
        'sessions.csv',
        toCsv(
          (sessionsRes.items ?? []).map((s: Record<string, unknown>) => ({
            id: s.id,
            plan_name: s.planName ?? '',
            started_at: s.startedAt,
            finished_at: s.finishedAt ?? '',
            note: s.note ?? '',
            set_count: s.setCount ?? 0,
            volume_kg: s.volumeKg ?? 0,
          })),
          ['id', 'plan_name', 'started_at', 'finished_at', 'note', 'set_count', 'volume_kg']
        )
      )

      zip.file(
        'sets.csv',
        toCsv(
          (setsRes.sets ?? []).map((s: Record<string, unknown>) => ({
            id: s.id,
            session_id: s.session_id,
            exercise_name: s.exercise_name,
            set_index: s.set_index,
            weight_kg: s.weight_kg ?? '',
            reps: s.reps ?? '',
            rpe: s.rpe ?? '',
            completed_at: s.completed_at ?? '',
          })),
          ['id', 'session_id', 'exercise_name', 'set_index', 'weight_kg', 'reps', 'rpe', 'completed_at']
        )
      )

      zip.file(
        'measurements.csv',
        toCsv(
          (measurementsRes.items ?? []).map((m: Record<string, unknown>) => ({
            week_start: m.weekStart,
            weight_kg: m.weightKg ?? '',
            waist_cm: m.waistCm ?? '',
            chest_cm: m.chestCm ?? '',
            thigh_cm: m.thighCm ?? '',
            biceps_cm: m.bicepsCm ?? '',
          })),
          ['week_start', 'weight_kg', 'waist_cm', 'chest_cm', 'thigh_cm', 'biceps_cm']
        )
      )

      zip.file(
        'nutrition.csv',
        toCsv(
          (nutritionRes.items ?? []).map((n: Record<string, unknown>) => ({
            date: n.date,
            kcal_actual: n.kcalActual ?? '',
            protein_g: n.proteinG ?? '',
            note: n.note ?? '',
          })),
          ['date', 'kcal_actual', 'protein_g', 'note']
        )
      )

      const blob = await zip.generateAsync({ type: 'blob' })
      const date = new Date().toISOString().slice(0, 10)
      saveAs(blob, `hexis-export-${date}.zip`)

      setStatus('done')
    } catch {
      setStatus('error')
    }
  }

  const label: Record<Status, string> = {
    idle: 'Stáhnout export',
    fetching: 'Načítám data…',
    zipping: 'Generuji ZIP…',
    done: 'Hotovo!',
    error: 'Chyba, zkus znovu',
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <h1 className="text-xl font-semibold">Export dat</h1>
      <p className="text-sm text-[#6b7280]">
        Stáhne ZIP archiv se všemi tvými daty ve formátu CSV (sessions, sets, measurements,
        nutrition).
      </p>
      <button
        onClick={handleExport}
        disabled={status === 'fetching' || status === 'zipping'}
        className="flex h-12 items-center justify-center rounded-lg bg-[#10b981] font-semibold text-[#0a0e14] disabled:opacity-50"
      >
        {label[status]}
      </button>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/\(app\)/settings/export/page.tsx src/components/settings/ExportClient.tsx
git commit -m "feat(m4): /settings/export page with client-side ZIP download"
```

---

### Task 21: Typecheck + test suite

**Files:** none (verification only)

- [ ] **Step 1: Run typecheck**

```bash
npx tsc --noEmit
```

Expected: clean (0 errors). Fix any issues found.

- [ ] **Step 2: Run full test suite**

```bash
npx vitest run --no-file-parallelism
```

Expected: all tests pass (136 existing + ~13 new ≈ 149).

- [ ] **Step 3: Fix any failures, then commit fixes if needed**

---

### Task 22: E2E spec for strength page

**Files:**
- Create: `tests/e2e/strength-progress.spec.ts`

- [ ] **Step 1: Write E2E spec**

```typescript
// tests/e2e/strength-progress.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Strength progress page', () => {
  test.beforeEach(async ({ page }) => {
    // Login as demo user
    await page.goto('/login')
    await page.fill('input[name="email"]', 'demo@hexis.local')
    await page.fill('input[name="password"]', 'Demo1234')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard')
  })

  test('navigates to strength tab and renders charts', async ({ page }) => {
    await page.goto('/progress/strength')
    await expect(page.getByRole('tab', { name: 'Síla' })).toHaveAttribute(
      'aria-selected',
      'true'
    )
    await expect(page.getByText('Estimated 1RM')).toBeVisible()
    await expect(page.getByText('Objem per svalovou skupinu')).toBeVisible()
  })

  test('time range picker switches range', async ({ page }) => {
    await page.goto('/progress/strength')
    await page.getByRole('tab', { name: '30d' }).click()
    // Chart should still render (or show "no data" for small range)
    await expect(page.getByText('Estimated 1RM')).toBeVisible()
  })
})
```

- [ ] **Step 2: Commit**

```bash
git add tests/e2e/strength-progress.spec.ts
git commit -m "test(m4): E2E spec for strength progress page"
```

---

### Task 23: Update roadmap + docs

**Files:**
- Modify: `docs/superpowers/roadmap/hexis-roadmap.md`

- [ ] **Step 1: Mark M4 items as done in roadmap**

Update the Smart coach section to check off completed items:

```markdown
### Smart coach
- [x] `src/lib/1rm.ts` — Epley + Brzycki s testy
- [x] `src/lib/progression.ts` — double progression logika + per-set re-eval
- [x] `src/lib/stagnation.ts` — 2+ týdny detekce
- [x] `src/lib/plates.ts` — plate calculator
- [x] Grafy per cvik (1RM v čase, Recharts)
- [x] Grafy per svalová skupina (týdenní objem stacked bar)
- [x] Export dat do ZIP (CSV)
```

- [ ] **Step 2: Commit**

```bash
git add docs/superpowers/roadmap/hexis-roadmap.md
git commit -m "docs(m4): mark smart coach & charts milestone complete"
```

---

## Summary

| Task | Description | Tests |
|------|-------------|-------|
| 1 | Branch + deps | — |
| 2 | stagnation.ts lib | 5 unit |
| 3 | strength-progress query | 2 integration |
| 4 | volume-progress query | 2 integration |
| 5 | stagnation query + API | 2 integration |
| 6 | strength API route | — |
| 7 | volume API route | — |
| 8 | csv.ts helper | 4 unit |
| 9 | export sets API | — |
| 10 | measurements+nutrition ?all=true | — |
| 11 | exercises ?trained=true | — |
| 12 | SegmentControl strength tab | — |
| 13 | TimeRangePicker + ExercisePicker | — |
| 14 | OneRmChart | — |
| 15 | VolumeChart | — |
| 16 | StagnationList | — |
| 17 | Strength page + wiring | — |
| 18 | StagnationBadge in ExerciseCard | — |
| 19 | StagnationWarning dashboard | — |
| 20 | Export page | — |
| 21 | Typecheck + full test suite | verification |
| 22 | E2E spec | 2 E2E |
| 23 | Roadmap update | — |

**Total new tests:** ~15 (9 unit + 6 integration + 2 E2E)
