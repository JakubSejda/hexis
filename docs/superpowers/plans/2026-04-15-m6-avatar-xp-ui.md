# M6 Avatar + XP UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Build M6 milestone — tier system lib, avatar component + placeholder SVGs, dashboard hero, `/avatar` profile page, levelup/tierup feedback with toast+modal+audio+confetti, extend XP API responses.

**Architecture:** Pure lib functions for tier logic. Server components for pages (dashboard hero, /avatar). Client components for interactive animations (XpFeedbackProvider, LevelUpToast, TierUpModal). SVG assets in `public/avatars/`. No new npm deps — Web Audio API for sound, CSS particles for confetti.

**Tech Stack:** Next.js 16.2, React 19.2, TypeScript strict, Drizzle 0.45, Tailwind 4, Vitest 4.1, Playwright 1.59.

**Spec:** `docs/superpowers/specs/2026-04-15-m6-avatar-xp-ui-design.md`

---

## Bundle plan (subagent-driven)

| Bundle | Tasks | Review |
|--------|-------|--------|
| 1 | Tasks 1-3 — tier lib + xp.ts extension + tests | spec only |
| 2 | Tasks 4-5 — xp-history queries + GET /api/me/xp-history | spec only |
| 3 | Tasks 6-8 — extend 5 existing API routes with tier info | full |
| 4 | Tasks 9-10 — placeholder SVGs + Avatar/AvatarWithLevel/TierBadge | spec only |
| 5 | Tasks 11-12 — AvatarHero + wire into dashboard | spec only |
| 6 | Tasks 13-17 — /avatar page (TierLadder, NextTierPreview, XpHistoryChart, XpBreakdown) | full |
| 7 | Tasks 18-20 — xp-audio.ts + XpFeedbackProvider + LevelUpToast + TierUpModal | full |
| 8 | Tasks 21-22 — wire FeedbackProvider + client notify calls in mutation flows | full |
| 9 | Task 23 — E2E avatar-flow.spec.ts | spec only |
| 10 | Task 24 — final verify + roadmap update | manual |

---

## Phase 1 — Tier lib + xp extension (Bundle 1)

### Task 1: `src/lib/tiers.ts`

**Create:** `src/lib/tiers.ts`, `src/tests/lib/tiers.test.ts`

```typescript
// src/lib/tiers.ts
export type Tier = 1 | 2 | 3 | 4 | 5

export type TierMeta = {
  tier: Tier
  name: string
  levelMin: number
  levelMax: number
  color: string
  accent: string
}

export const TIERS: readonly TierMeta[] = [
  { tier: 1, name: 'Rookie',     levelMin: 1,  levelMax: 5,   color: '#b45309', accent: '#92400e' },
  { tier: 2, name: 'Apprentice', levelMin: 6,  levelMax: 15,  color: '#64748b', accent: '#475569' },
  { tier: 3, name: 'Warrior',    levelMin: 16, levelMax: 30,  color: '#ca8a04', accent: '#a16207' },
  { tier: 4, name: 'Beast',      levelMin: 31, levelMax: 50,  color: '#10b981', accent: '#065f46' },
  { tier: 5, name: 'Titan',      levelMin: 51, levelMax: 999, color: '#0ea5e9', accent: '#0c4a6e' },
] as const

export function levelToTier(level: number): Tier {
  if (level <= 5) return 1
  if (level <= 15) return 2
  if (level <= 30) return 3
  if (level <= 50) return 4
  return 5
}

export function levelToTierMeta(level: number): TierMeta {
  return TIERS[levelToTier(level) - 1]!
}

export function nextTierMeta(level: number): TierMeta | null {
  const current = levelToTier(level)
  if (current === 5) return null
  return TIERS[current]!
}

export function xpToProgress(
  totalXp: number,
  currentLevel: number
): { current: number; max: number; percent: number } {
  // XP threshold for level n = (n-1)^2 * 100 … this is xpForNextLevel(n-1)
  // Current level threshold = (level-1)^2 * 100
  // Next level threshold = level^2 * 100
  const floor = Math.pow(currentLevel - 1, 2) * 100
  const ceil = Math.pow(currentLevel, 2) * 100
  const current = Math.max(0, totalXp - floor)
  const max = ceil - floor
  const percent = max > 0 ? Math.min((current / max) * 100, 100) : 0
  return { current, max, percent }
}
```

Test:
```typescript
import { describe, it, expect } from 'vitest'
import { levelToTier, levelToTierMeta, nextTierMeta, xpToProgress, TIERS } from '@/lib/tiers'

describe('levelToTier', () => {
  it.each([
    [1, 1], [5, 1], [6, 2], [15, 2], [16, 3], [30, 3], [31, 4], [50, 4], [51, 5], [100, 5],
  ])('L%i → tier %i', (level, expected) => {
    expect(levelToTier(level)).toBe(expected)
  })
})

describe('nextTierMeta', () => {
  it('returns tier 2 for L5', () => { expect(nextTierMeta(5)?.tier).toBe(2) })
  it('returns tier 3 for L6', () => { expect(nextTierMeta(6)?.tier).toBe(3) })
  it('returns null for L51+', () => { expect(nextTierMeta(51)).toBeNull() })
})

describe('xpToProgress', () => {
  it('returns 0/100 at level 1 start', () => {
    expect(xpToProgress(0, 1)).toEqual({ current: 0, max: 100, percent: 0 })
  })
  it('returns 50/100 at half of level 1', () => {
    const p = xpToProgress(50, 1)
    expect(p.current).toBe(50)
    expect(p.max).toBe(100)
    expect(p.percent).toBe(50)
  })
  it('returns 0 at start of level 2 (100 XP total)', () => {
    expect(xpToProgress(100, 2)).toEqual({ current: 0, max: 300, percent: 0 })
  })
  it('caps percent at 100', () => {
    expect(xpToProgress(1000, 1).percent).toBeLessThanOrEqual(100)
  })
})
```

- [ ] Step 1: Write test
- [ ] Step 2: Run — FAIL
- [ ] Step 3: Implement
- [ ] Step 4: Run — PASS (expect ~14)
- [ ] Step 5: Commit `feat(m6): tier system lib (levelToTier, nextTierMeta, xpToProgress)`

### Task 2: Extend `src/lib/xp.ts` return type

**Modify:** `src/lib/xp.ts`, `src/tests/workout/xp.test.ts`

Change `appendXpEvent` return:
```typescript
import { levelToTier, type Tier } from './tiers'

type XpResult = {
  xpDelta: number
  newTotalXp: number
  levelBefore: number
  levelAfter: number
  levelUp: boolean
  tierBefore: Tier
  tierAfter: Tier
  tierUp: boolean
}

// In appendXpEvent, replace the return statement:
const tierBefore = levelToTier(levelBefore)
const tierAfter = levelToTier(levelAfter)
return {
  xpDelta: args.xpDelta,
  newTotalXp: totalAfter,
  levelBefore,
  levelAfter,
  levelUp: levelAfter > levelBefore,
  tierBefore,
  tierAfter,
  tierUp: tierAfter > tierBefore,
}
```

Add test in `src/tests/workout/xp.test.ts`:
```typescript
it('flags tierUp when crossing tier boundary (L5 → L6)', async () => {
  // Setup user at 2400 XP (L5, 100 XP into L5)
  await db.insert(xpEvents).values({ userId, eventType: 'session_complete', xpDelta: 2500 })
  // Award 100 more: goes to 2600 = L6 (sqrt(2600/100)+1 = 6.09…, floor = 6)
  const result = await awardXp({ event: 'session_complete', db, userId })
  expect(result.levelUp).toBe(true)
  expect(result.tierUp).toBe(true)
  expect(result.tierBefore).toBe(1)
  expect(result.tierAfter).toBe(2)
})

it('does not flag tierUp when level stays within tier', async () => {
  await db.insert(xpEvents).values({ userId, eventType: 'session_complete', xpDelta: 100 })
  // 100 → 200 = L2, within Tier 1
  const result = await awardXp({ event: 'session_complete', db, userId })
  expect(result.levelUp).toBe(true)
  expect(result.tierUp).toBe(false)
})
```

Verify exact XP math: `xpToLevel(totalXp) = floor(sqrt(totalXp/100)) + 1`. So:
- L5 → L6 boundary at 2500 XP (sqrt(2500/100)=5, +1=6) → wait, that says L6 at 2500. Test values need to match. Let me recompute:
  - Total 2499 → sqrt(24.99) ≈ 4.999 → floor 4 +1 = 5. So L5 at 2499.
  - Total 2500 → sqrt(25) = 5, +1 = 6. So L6 at 2500.
  - Tier 1 is L1-5; Tier 2 is L6+. So crossing 2500 XP → tier up.

Adjust test: seed 2499 XP, award 5 XP (standard set) → should hit 2504 → L6 → tierUp=true.

Actually easier: award exactly 2500 starting from 0. 0 is L1 T1. 2500 → L6 T2. So levelBefore=1, levelAfter=6, tierBefore=1, tierAfter=2.

- [ ] Step 1-5: TDD cycle + commit `feat(m6): extend xp return with tier info (tierUp flag)`

### Task 3: Update existing xp test expectations

**Modify:** `src/tests/workout/xp.test.ts` — where tests unpack result, add `levelBefore`/`tierBefore`/`tierAfter` ignore or adapt if they strictly check shape.

- [ ] Step 1: Read existing test file
- [ ] Step 2: Update any destructuring that would break
- [ ] Step 3: Run all xp tests — PASS
- [ ] Step 4: Commit `test(m6): update xp tests for new return shape`

---

## Phase 2 — XP history (Bundle 2)

### Task 4: `src/lib/queries/xp-history.ts`

**Create:** `src/lib/queries/xp-history.ts`

```typescript
import { and, eq, gte, sql } from 'drizzle-orm'
import type { MySql2Database } from 'drizzle-orm/mysql2'
import * as schema from '@/db/schema'
import { xpEvents } from '@/db/schema'
import type { XpEventType } from '@/lib/xp-events'

type DB = MySql2Database<typeof schema>

export type DailyXp = {
  date: string // YYYY-MM-DD
  totalXp: number
  byEvent: Partial<Record<XpEventType, number>>
}

export type XpHistory = {
  daily: DailyXp[]
  total: number
  byEventTotal: Partial<Record<XpEventType, { xp: number; count: number }>>
}

export async function fetchXpHistory(
  db: DB,
  userId: string,
  days: number
): Promise<XpHistory> {
  const since = new Date()
  since.setUTCDate(since.getUTCDate() - days + 1)
  since.setUTCHours(0, 0, 0, 0)

  const rows = (await db.execute(sql`
    SELECT DATE(created_at) AS date,
           event_type,
           SUM(xp_delta) AS sum,
           COUNT(*) AS cnt
    FROM xp_events
    WHERE user_id = ${userId} AND created_at >= ${since}
    GROUP BY DATE(created_at), event_type
    ORDER BY date ASC
  `)) as unknown as Array<{ date: string; event_type: XpEventType; sum: number; cnt: number }>

  const dailyMap = new Map<string, DailyXp>()
  const byEventTotal: Partial<Record<XpEventType, { xp: number; count: number }>> = {}
  let total = 0

  for (const r of rows) {
    const d = dailyMap.get(r.date) ?? { date: r.date, totalXp: 0, byEvent: {} }
    const xp = Number(r.sum)
    d.totalXp += xp
    d.byEvent[r.event_type] = (d.byEvent[r.event_type] ?? 0) + xp
    dailyMap.set(r.date, d)
    const ev = byEventTotal[r.event_type] ?? { xp: 0, count: 0 }
    ev.xp += xp
    ev.count += Number(r.cnt)
    byEventTotal[r.event_type] = ev
    total += xp
  }

  return { daily: Array.from(dailyMap.values()), total, byEventTotal }
}
```

- [ ] Step 1: Implement
- [ ] Step 2: tsc clean
- [ ] Step 3: Commit `feat(m6): xp history query helper (daily + per-event aggregation)`

### Task 5: `GET /api/me/xp-history`

**Create:** `src/app/api/me/xp-history/route.ts`, `src/tests/api/xp-history.test.ts`

```typescript
// src/app/api/me/xp-history/route.ts
import { db } from '@/db/client'
import { getSessionUser } from '@/lib/auth-helpers'
import { fetchXpHistory } from '@/lib/queries/xp-history'

export async function GET(req: Request) {
  const user = await getSessionUser()
  if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  const url = new URL(req.url)
  const rawDays = Number(url.searchParams.get('days') ?? 30)
  const days = Math.min(Number.isFinite(rawDays) && rawDays > 0 ? Math.floor(rawDays) : 30, 365)
  const history = await fetchXpHistory(db, user.id, days)
  return Response.json(history)
}
```

Integration test (seed events, assert aggregation). Follow the M3 test pattern with `vi.mock('@/lib/auth-helpers')`.

```typescript
// src/tests/api/xp-history.test.ts
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { eq } from 'drizzle-orm'
import { db } from '@/db/client'
import { users, xpEvents } from '@/db/schema'
import { newUlid } from '@/lib/ulid'

const TEST_USER_ID = newUlid()

vi.mock('@/lib/auth-helpers', () => ({
  getSessionUser: vi.fn().mockResolvedValue({ id: TEST_USER_ID, email: 'h@x.test' }),
  requireSessionUser: vi.fn(),
  requireOwnership: vi.fn(),
}))

async function seedUser() {
  await db.delete(users).where(eq(users.id, TEST_USER_ID))
  await db.insert(users).values({
    id: TEST_USER_ID,
    email: `h-${TEST_USER_ID}@x.test`,
    level: 1,
    trackedMacros: ['kcal', 'protein'],
  })
}
async function clean() {
  await db.delete(xpEvents).where(eq(xpEvents.userId, TEST_USER_ID))
  await db.delete(users).where(eq(users.id, TEST_USER_ID))
}
beforeEach(async () => { await clean(); await seedUser() })
afterAll(async () => { await clean() })

import { GET } from '@/app/api/me/xp-history/route'

describe('GET /api/me/xp-history', () => {
  it('returns empty aggregation for new user', async () => {
    const res = await GET(new Request('http://localhost/api/me/xp-history?days=30'))
    const body = await res.json()
    expect(body.daily).toEqual([])
    expect(body.total).toBe(0)
    expect(body.byEventTotal).toEqual({})
  })

  it('aggregates events by day and event_type', async () => {
    await db.insert(xpEvents).values([
      { userId: TEST_USER_ID, eventType: 'session_complete', xpDelta: 100 },
      { userId: TEST_USER_ID, eventType: 'set_logged', xpDelta: 5 },
      { userId: TEST_USER_ID, eventType: 'set_logged', xpDelta: 5 },
    ])
    const res = await GET(new Request('http://localhost/api/me/xp-history?days=30'))
    const body = await res.json()
    expect(body.total).toBe(110)
    expect(body.byEventTotal.session_complete).toEqual({ xp: 100, count: 1 })
    expect(body.byEventTotal.set_logged).toEqual({ xp: 10, count: 2 })
    expect(body.daily).toHaveLength(1)
  })
})
```

- [ ] TDD cycle. Commit `feat(m6): GET /api/me/xp-history`

---

## Phase 3 — Extend existing API routes (Bundle 3)

### Task 6: Extend measurements, nutrition, user-macros PUT responses

**Modify:** `src/app/api/measurements/route.ts`, `src/app/api/nutrition/route.ts`, and the `[id]` DELETE routes.

In PUT handlers where `awardXp` returns, replace the existing `xpDelta` spread:
```typescript
const xp = await awardXp({ event: 'measurement_added', db, userId: user.id, meta: { ... } })
return Response.json({
  id,
  xpDelta: xp.xpDelta,
  levelUp: xp.levelUp,
  tierUp: xp.tierUp,
  levelAfter: xp.levelAfter,
  tierAfter: xp.tierAfter,
}, { status: 201 })
```

For update path (no award), return zeros:
```typescript
return Response.json({
  id,
  xpDelta: 0,
  levelUp: false,
  tierUp: false,
  levelAfter: /* fetch current level? or null */ null,
  tierAfter: null,
}, { status: 200 })
```

Simpler: on no-award path, just return `{ id, xpDelta: 0 }` — client treats missing levelUp/tierUp as false. Keep existing update-path response unchanged.

For DELETE with reversal:
```typescript
const rev = await reverseXp({ event: 'measurement_added', db, userId: user.id, sessionId: null, meta: {...} })
// DELETE returns 204 no body per spec — don't change shape. Just discard reversal result.
```

Actually DELETE is 204 no-body; no change needed there for response shape. The reversal's levelUp still triggers client-side since client knows what was deleted, but more simply the XP demotion on delete won't fire animations (no body to parse).

- [ ] Step 1: Update `src/app/api/measurements/route.ts` PUT
- [ ] Step 2: Update `src/app/api/nutrition/route.ts` PUT
- [ ] Step 3: Update measurements test to check new fields
- [ ] Step 4: Update nutrition test to check new fields
- [ ] Step 5: Run tests — PASS
- [ ] Step 6: Commit `feat(m6): extend measurement+nutrition PUT responses with tier info`

### Task 7: Extend session-related API routes

**Modify:** `src/app/api/sessions/[id]/sets/route.ts`, `src/app/api/sessions/[id]/route.ts`

Same pattern. Read existing tests to see response assertions and extend accordingly.

- [ ] Step 1: Identify all places in these routes calling `awardXp`
- [ ] Step 2: Update response JSON to include `levelUp`, `tierUp`, `levelAfter`, `tierAfter`
- [ ] Step 3: Update tests
- [ ] Step 4: Run existing session tests — PASS
- [ ] Step 5: Commit `feat(m6): extend session API responses with tier info`

### Task 8: Verify all tests pass

- [ ] Run `DATABASE_URL="mysql://root:test@localhost:3308/hexis_test" npx vitest run --no-file-parallelism` — expect all green
- [ ] Commit (if any adjustments) `test(m6): verify extended API responses across suite`

---

## Phase 4 — Avatar assets + components (Bundle 4)

### Task 9: Placeholder SVGs

**Create:** `public/avatars/tier-1.svg` through `tier-5.svg`

Each SVG (viewBox 56×56):

```xml
<!-- public/avatars/tier-1.svg -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 56 56" width="56" height="56">
  <circle cx="28" cy="28" r="24" fill="#b45309" stroke="#92400e" stroke-width="2"/>
  <circle cx="28" cy="28" r="16" fill="#92400e"/>
  <text x="28" y="34" text-anchor="middle" font-family="ui-sans-serif, system-ui, sans-serif" font-size="14" font-weight="700" fill="#fef3c7">I</text>
</svg>
```

Analogously for tier-2 through tier-5, using TIERS colors/accent. Numeral: II, III, IV, V.

- [ ] Step 1: Create all 5 files
- [ ] Step 2: Commit `feat(m6): placeholder tier SVG assets`

### Task 10: Avatar + AvatarWithLevel + TierBadge

**Create:** `src/components/avatar/Avatar.tsx`, `AvatarWithLevel.tsx`, `TierBadge.tsx`

```typescript
// src/components/avatar/Avatar.tsx
import type { Tier } from '@/lib/tiers'

type Props = {
  tier: Tier
  size?: number
  className?: string
  ringPulse?: boolean
}

export function Avatar({ tier, size = 56, className, ringPulse }: Props) {
  return (
    <img
      src={`/avatars/tier-${tier}.svg`}
      width={size}
      height={size}
      alt={`Tier ${tier}`}
      className={
        'inline-block select-none ' +
        (ringPulse ? 'animate-tier-glow ' : '') +
        (className ?? '')
      }
      style={{ width: size, height: size }}
      draggable={false}
    />
  )
}
```

```typescript
// src/components/avatar/AvatarWithLevel.tsx
import { Avatar } from './Avatar'
import type { Tier } from '@/lib/tiers'

type Props = { tier: Tier; level: number; size?: number; className?: string }

export function AvatarWithLevel({ tier, level, size = 80, className }: Props) {
  return (
    <div className={'relative inline-block ' + (className ?? '')} style={{ width: size, height: size }}>
      <Avatar tier={tier} size={size} />
      <span
        className="absolute bottom-0 right-0 rounded-full border border-[#0a0e14] bg-[#0a0e14] px-1.5 py-0.5 text-[10px] font-bold text-[#10b981]"
        style={{ transform: 'translate(25%, 25%)' }}
      >
        L{level}
      </span>
    </div>
  )
}
```

```typescript
// src/components/avatar/TierBadge.tsx
import { Avatar } from './Avatar'
import { TIERS, type Tier } from '@/lib/tiers'

type Props = { tier: Tier; size?: number; dim?: boolean; label?: boolean }

export function TierBadge({ tier, size = 48, dim, label }: Props) {
  const meta = TIERS[tier - 1]!
  return (
    <div className={'inline-flex flex-col items-center gap-1 ' + (dim ? 'opacity-40' : '')}>
      <Avatar tier={tier} size={size} />
      {label && (
        <>
          <span className="text-[10px] font-semibold text-[#e5e7eb]">{meta.name}</span>
          <span className="text-[10px] text-[#6b7280]">L{meta.levelMin}+</span>
        </>
      )}
    </div>
  )
}
```

Add to `src/app/globals.css`:
```css
@keyframes tier-glow {
  0%, 100% { filter: drop-shadow(0 0 0 rgba(245, 158, 11, 0)); }
  50% { filter: drop-shadow(0 0 12px rgba(245, 158, 11, 0.8)); }
}
.animate-tier-glow { animation: tier-glow 1.5s ease-in-out infinite; }
```

- [ ] Step 1: Create 3 component files
- [ ] Step 2: Add keyframe to globals.css
- [ ] Step 3: tsc clean
- [ ] Step 4: Commit `feat(m6): Avatar, AvatarWithLevel, TierBadge components + tier-glow keyframe`

---

## Phase 5 — Dashboard hero (Bundle 5)

### Task 11: AvatarHero component

**Create:** `src/components/dashboard/AvatarHero.tsx`

```typescript
import Link from 'next/link'
import { Avatar } from '@/components/avatar/Avatar'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { levelToTierMeta, xpToProgress } from '@/lib/tiers'

type Props = {
  level: number
  totalXp: number
  userName: string | null
  userEmail: string
}

export function AvatarHero({ level, totalXp, userName, userEmail }: Props) {
  const tierMeta = levelToTierMeta(level)
  const progress = xpToProgress(totalXp, level)
  const toNext = progress.max - progress.current
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-[#1F2733] bg-[#141A22] p-4">
      <p className="text-xs text-[#6b7280]">
        {new Date().toLocaleDateString('cs-CZ', { weekday: 'long', day: 'numeric', month: 'long' })}
      </p>
      <h1 className="text-base text-[#e5e7eb]">Ahoj, {userName ?? userEmail}</h1>
      <Link href="/avatar" className="mt-1">
        <Avatar tier={tierMeta.tier} size={80} />
      </Link>
      <div className="flex items-baseline gap-2">
        <span className="text-xl font-bold" style={{ color: tierMeta.color }}>Level {level}</span>
        <span className="text-sm text-[#6b7280]">· {tierMeta.name}</span>
      </div>
      <div className="w-full max-w-xs">
        <ProgressBar value={progress.current} max={progress.max} tone="primary" height={8} />
        <div className="mt-1 flex justify-between text-xs text-[#6b7280]">
          <span>{progress.current} XP</span>
          <span>{toNext} do L{level + 1}</span>
        </div>
      </div>
    </div>
  )
}
```

- [ ] Step 1: Create component
- [ ] Step 2: tsc
- [ ] Step 3: Commit `feat(m6): AvatarHero dashboard component`

### Task 12: Wire AvatarHero into dashboard

**Modify:** `src/app/(app)/dashboard/page.tsx`

Replace the existing top-right header block (the `<div>...Ahoj {name}...L{level}...XP</div>` part) with `<AvatarHero level={level} totalXp={totalXp} userName={user.name} userEmail={user.email} />` as the first element.

- [ ] Step 1: Read file
- [ ] Step 2: Replace header block
- [ ] Step 3: tsc
- [ ] Step 4: Commit `feat(m6): wire AvatarHero into /dashboard`

---

## Phase 6 — /avatar page (Bundle 6)

### Task 13: TierLadder component

**Create:** `src/components/avatar/TierLadder.tsx`

```typescript
'use client'

import { useState } from 'react'
import { TierBadge } from './TierBadge'
import { TIERS, type Tier } from '@/lib/tiers'

type Props = { currentTier: Tier }

export function TierLadder({ currentTier }: Props) {
  const [open, setOpen] = useState<Tier | null>(null)
  return (
    <div className="space-y-2">
      <h2 className="text-sm font-semibold text-[#e5e7eb]">Tier ladder</h2>
      <div className="flex justify-around">
        {TIERS.map((t) => (
          <button
            key={t.tier}
            type="button"
            onClick={() => setOpen(open === t.tier ? null : t.tier)}
            className="flex flex-col items-center"
          >
            <div className={t.tier === currentTier ? 'ring-2 ring-[#10b981] rounded-full p-0.5' : ''}>
              <TierBadge tier={t.tier} size={48} dim={t.tier !== currentTier && t.tier > currentTier} label />
            </div>
          </button>
        ))}
      </div>
      {open != null && (
        <div className="rounded-lg border border-[#1F2733] bg-[#0a0e14] p-3 text-sm text-[#e5e7eb]">
          <div className="font-semibold">{TIERS[open - 1]!.name}</div>
          <div className="text-xs text-[#6b7280]">
            Level {TIERS[open - 1]!.levelMin}–{TIERS[open - 1]!.levelMax === 999 ? '∞' : TIERS[open - 1]!.levelMax}
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] Step 1: Create
- [ ] Step 2: Commit `feat(m6): TierLadder component with tap-to-info`

### Task 14: NextTierPreview component

**Create:** `src/components/avatar/NextTierPreview.tsx`

```typescript
import { Avatar } from './Avatar'
import { nextTierMeta } from '@/lib/tiers'

type Props = { currentLevel: number; totalXp: number }

export function NextTierPreview({ currentLevel, totalXp }: Props) {
  const next = nextTierMeta(currentLevel)
  if (!next) return null
  const xpNeeded = Math.pow(next.levelMin - 1, 2) * 100 - totalXp
  return (
    <div className="rounded-lg border border-[#1F2733] bg-[#141A22] p-4">
      <h2 className="mb-3 text-sm font-semibold text-[#e5e7eb]">Další tier</h2>
      <div className="flex items-center gap-3">
        <div className="opacity-40">
          <Avatar tier={next.tier} size={64} />
        </div>
        <div>
          <div className="text-lg font-bold" style={{ color: next.color }}>{next.name}</div>
          <div className="text-xs text-[#6b7280]">Odemkneš v Level {next.levelMin}</div>
          <div className="text-xs text-[#6b7280]">Zbývá {xpNeeded.toLocaleString('cs-CZ')} XP</div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] Commit `feat(m6): NextTierPreview component`

### Task 15: XpHistoryChart component

**Create:** `src/components/avatar/XpHistoryChart.tsx`

```typescript
import type { DailyXp } from '@/lib/queries/xp-history'

type Props = { daily: DailyXp[]; days: number }

const EVENT_COLOR: Record<string, string> = {
  session_complete: '#10b981',
  set_logged: '#065f46',
  measurement_added: '#0ea5e9',
  photo_uploaded: '#8b5cf6',
  nutrition_logged: '#f59e0b',
  pr_achieved: '#eab308',
  streak_day: '#ef4444',
}

export function XpHistoryChart({ daily, days }: Props) {
  // Build days array with zeros for missing dates
  const today = new Date()
  const cells: { date: string; totalXp: number; dominant: string }[] = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setUTCDate(d.getUTCDate() - i)
    const date = d.toISOString().slice(0, 10)
    const found = daily.find((x) => x.date === date)
    let dominant = 'session_complete'
    if (found) {
      const entries = Object.entries(found.byEvent) as [string, number][]
      dominant = entries.reduce((a, b) => (b[1] > a[1] ? b : a), entries[0]!)[0]
    }
    cells.push({ date, totalXp: found?.totalXp ?? 0, dominant })
  }
  const max = Math.max(...cells.map((c) => c.totalXp), 1)
  const width = 320
  const height = 80
  const barWidth = width / days - 1

  return (
    <div className="rounded-lg border border-[#1F2733] bg-[#141A22] p-4">
      <h2 className="mb-3 text-sm font-semibold text-[#e5e7eb]">XP za {days} dní</h2>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="block">
        {cells.map((c, i) => {
          const h = (c.totalXp / max) * height
          return (
            <rect
              key={c.date}
              x={i * (width / days)}
              y={height - h}
              width={barWidth}
              height={h}
              fill={EVENT_COLOR[c.dominant] ?? '#10b981'}
              rx={1}
            />
          )
        })}
      </svg>
      <div className="mt-2 text-xs text-[#6b7280]">
        Celkem: {cells.reduce((a, c) => a + c.totalXp, 0).toLocaleString('cs-CZ')} XP
      </div>
    </div>
  )
}
```

- [ ] Commit `feat(m6): XpHistoryChart SVG bar chart`

### Task 16: XpBreakdown component

**Create:** `src/components/avatar/XpBreakdown.tsx`

```typescript
import type { XpHistory } from '@/lib/queries/xp-history'

const LABELS: Record<string, string> = {
  session_complete: 'Dokončené tréninky',
  set_logged: 'Série zalogované',
  measurement_added: 'Měření',
  photo_uploaded: 'Fotky',
  nutrition_logged: 'Výživa',
  pr_achieved: 'PR překonán',
  streak_day: 'Streak',
}

type Props = { byEventTotal: XpHistory['byEventTotal']; total: number }

export function XpBreakdown({ byEventTotal, total }: Props) {
  const rows = Object.entries(byEventTotal)
    .map(([event, v]) => ({ event, xp: v!.xp, count: v!.count }))
    .sort((a, b) => b.xp - a.xp)
  return (
    <div className="rounded-lg border border-[#1F2733] bg-[#141A22] p-4">
      <h2 className="mb-3 text-sm font-semibold text-[#e5e7eb]">Rozpis podle aktivity</h2>
      {rows.length === 0 ? (
        <p className="text-sm text-[#6b7280]">Zatím žádná aktivita.</p>
      ) : (
        <table className="w-full text-sm">
          <tbody>
            {rows.map((r) => (
              <tr key={r.event} className="border-b border-[#1f2733] last:border-0">
                <td className="py-2 text-[#e5e7eb]">{LABELS[r.event] ?? r.event}</td>
                <td className="py-2 text-right text-[#6b7280]">{r.count}×</td>
                <td className="py-2 text-right font-semibold text-[#e5e7eb]">{r.xp.toLocaleString('cs-CZ')} XP</td>
                <td className="py-2 pl-3 text-right text-xs text-[#6b7280]">
                  {total > 0 ? Math.round((r.xp / total) * 100) : 0}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
```

- [ ] Commit `feat(m6): XpBreakdown per-event-type table`

### Task 17: `/avatar` page

**Create:** `src/app/(app)/avatar/page.tsx`

```typescript
import { requireSessionUser } from '@/lib/auth-helpers'
import { redirect } from 'next/navigation'
import { db } from '@/db/client'
import { getTotalXp } from '@/lib/xp'
import { xpToLevel } from '@/lib/xp-events'
import { levelToTier, levelToTierMeta, xpToProgress } from '@/lib/tiers'
import { fetchXpHistory } from '@/lib/queries/xp-history'
import { Avatar } from '@/components/avatar/Avatar'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { TierLadder } from '@/components/avatar/TierLadder'
import { NextTierPreview } from '@/components/avatar/NextTierPreview'
import { XpHistoryChart } from '@/components/avatar/XpHistoryChart'
import { XpBreakdown } from '@/components/avatar/XpBreakdown'

export default async function AvatarPage() {
  const user = await requireSessionUser()
  if (user instanceof Response) redirect('/login')

  const totalXp = await getTotalXp(db, user.id)
  const level = xpToLevel(totalXp)
  const tierMeta = levelToTierMeta(level)
  const progress = xpToProgress(totalXp, level)
  const history = await fetchXpHistory(db, user.id, 30)

  return (
    <div className="space-y-4 p-4">
      <div className="flex flex-col items-center gap-2 rounded-xl border border-[#1F2733] bg-[#141A22] p-6">
        <h1 className="mb-2 text-lg font-semibold text-[#e5e7eb]">Tvůj avatar</h1>
        <Avatar tier={tierMeta.tier} size={160} />
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-bold" style={{ color: tierMeta.color }}>Level {level}</span>
          <span className="text-base text-[#6b7280]">· {tierMeta.name}</span>
        </div>
        <div className="text-xs text-[#6b7280]">
          Tier {tierMeta.tier} (L{tierMeta.levelMin}–{tierMeta.levelMax === 999 ? '∞' : tierMeta.levelMax})
        </div>
        <div className="mt-2 w-full max-w-md">
          <ProgressBar value={progress.current} max={progress.max} tone="primary" height={10} />
          <div className="mt-1 flex justify-between text-xs text-[#6b7280]">
            <span>{totalXp.toLocaleString('cs-CZ')} XP</span>
            <span>{(progress.max - progress.current).toLocaleString('cs-CZ')} do L{level + 1}</span>
          </div>
        </div>
      </div>

      <TierLadder currentTier={levelToTier(level)} />
      <NextTierPreview currentLevel={level} totalXp={totalXp} />
      <XpHistoryChart daily={history.daily} days={30} />
      <XpBreakdown byEventTotal={history.byEventTotal} total={history.total} />
    </div>
  )
}
```

- [ ] Step 1: Create
- [ ] Step 2: tsc
- [ ] Step 3: Commit `feat(m6): /avatar profile page`

---

## Phase 7 — Feedback (Bundle 7)

### Task 18: xp-audio.ts

**Create:** `src/lib/xp-audio.ts`

```typescript
function ac(): AudioContext | null {
  if (typeof window === 'undefined') return null
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
  return Ctor ? new Ctor() : null
}

function tone(ctx: AudioContext, freq: number, start: number, duration: number, gainPeak = 0.2) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.value = freq
  gain.gain.setValueAtTime(0, ctx.currentTime + start)
  gain.gain.linearRampToValueAtTime(gainPeak, ctx.currentTime + start + 0.02)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration)
  osc.connect(gain).connect(ctx.destination)
  osc.start(ctx.currentTime + start)
  osc.stop(ctx.currentTime + start + duration)
}

export function playLevelUpDing(): void {
  const ctx = ac()
  if (!ctx) return
  tone(ctx, 880, 0, 0.3)
  setTimeout(() => ctx.close(), 400)
}

export function playTierUpFanfare(): void {
  const ctx = ac()
  if (!ctx) return
  // C5, E5, G5 ascending
  tone(ctx, 523.25, 0, 0.2)
  tone(ctx, 659.25, 0.15, 0.2)
  tone(ctx, 783.99, 0.3, 0.4, 0.25)
  setTimeout(() => ctx.close(), 900)
}
```

- [ ] Commit `feat(m6): xp-audio helpers (Web Audio ding + tier-up fanfare)`

### Task 19: XpFeedbackProvider + LevelUpToast + TierUpModal

**Create:** `src/components/xp/XpFeedbackProvider.tsx`, `LevelUpToast.tsx`, `TierUpModal.tsx`

Provider manages a queue; components render current item. See detailed code:

```typescript
// src/components/xp/XpFeedbackProvider.tsx
'use client'

import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { Tier } from '@/lib/tiers'
import { LevelUpToast } from './LevelUpToast'
import { TierUpModal } from './TierUpModal'
import { playLevelUpDing, playTierUpFanfare } from '@/lib/xp-audio'

type XpResponse = {
  xpDelta: number
  levelUp?: boolean
  tierUp?: boolean
  levelAfter?: number
  tierAfter?: Tier
}

type Queued =
  | { kind: 'level'; levelAfter: number; tier: Tier }
  | { kind: 'tier'; levelAfter: number; tier: Tier }

type Ctx = { notifyXp: (r: XpResponse) => void }
const XpCtx = createContext<Ctx | null>(null)

export function useXpFeedback(): Ctx {
  const c = useContext(XpCtx)
  if (!c) throw new Error('useXpFeedback must be used inside XpFeedbackProvider')
  return c
}

export function XpFeedbackProvider({ children }: { children: React.ReactNode }) {
  const [queue, setQueue] = useState<Queued[]>([])

  const notifyXp = useCallback((r: XpResponse) => {
    if (!r.levelUp || r.levelAfter == null || r.tierAfter == null) return
    const item: Queued = r.tierUp
      ? { kind: 'tier', levelAfter: r.levelAfter, tier: r.tierAfter }
      : { kind: 'level', levelAfter: r.levelAfter, tier: r.tierAfter }
    setQueue((prev) => [...prev, item])
    if (item.kind === 'tier') playTierUpFanfare()
    else playLevelUpDing()
  }, [])

  const current = queue[0]
  const dismiss = useCallback(() => setQueue((prev) => prev.slice(1)), [])

  const ctxValue = useMemo(() => ({ notifyXp }), [notifyXp])

  return (
    <XpCtx.Provider value={ctxValue}>
      {children}
      {current?.kind === 'level' && (
        <LevelUpToast levelAfter={current.levelAfter} tier={current.tier} onDismiss={dismiss} />
      )}
      {current?.kind === 'tier' && (
        <TierUpModal levelAfter={current.levelAfter} tier={current.tier} onDismiss={dismiss} />
      )}
    </XpCtx.Provider>
  )
}
```

```typescript
// src/components/xp/LevelUpToast.tsx
'use client'

import { useEffect } from 'react'
import { Avatar } from '@/components/avatar/Avatar'
import { TIERS, type Tier } from '@/lib/tiers'

type Props = { levelAfter: number; tier: Tier; onDismiss: () => void }

export function LevelUpToast({ levelAfter, tier, onDismiss }: Props) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 4000)
    return () => clearTimeout(t)
  }, [onDismiss])
  const meta = TIERS[tier - 1]!
  return (
    <div
      role="status"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-lg p-3 shadow-lg"
      style={{ background: meta.accent, color: '#e5e7eb' }}
    >
      <Avatar tier={tier} size={40} ringPulse />
      <div>
        <div className="text-sm font-bold">Nová úroveň!</div>
        <div className="text-xs opacity-90">L{levelAfter - 1} → L{levelAfter}</div>
      </div>
    </div>
  )
}
```

```typescript
// src/components/xp/TierUpModal.tsx
'use client'

import { useEffect } from 'react'
import { Avatar } from '@/components/avatar/Avatar'
import { TIERS, type Tier } from '@/lib/tiers'

type Props = { levelAfter: number; tier: Tier; onDismiss: () => void }

export function TierUpModal({ levelAfter, tier, onDismiss }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter') onDismiss()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onDismiss])
  const meta = TIERS[tier - 1]!
  return (
    <div
      role="dialog"
      aria-modal
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={onDismiss}
    >
      <Confetti />
      <div className="mx-4 rounded-2xl border border-[#1F2733] bg-[#141A22] p-8 text-center shadow-2xl">
        <Avatar tier={tier} size={120} ringPulse />
        <div className="mt-4 text-2xl font-bold" style={{ color: meta.color }}>
          Tier {tier}: {meta.name} odemknutý!
        </div>
        <div className="mt-1 text-sm text-[#6b7280]">Dosáhl jsi Level {levelAfter}</div>
        <button
          type="button"
          onClick={onDismiss}
          className="mt-6 rounded-lg bg-[#10b981] px-6 py-2 text-sm font-semibold text-[#0a0e14]"
        >
          Pokračovat
        </button>
      </div>
    </div>
  )
}

function Confetti() {
  const pieces = Array.from({ length: 40 })
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {pieces.map((_, i) => {
        const left = Math.random() * 100
        const delay = Math.random() * 0.5
        const duration = 1.5 + Math.random()
        const colors = ['#10b981', '#f59e0b', '#0ea5e9', '#eab308', '#ef4444']
        const bg = colors[Math.floor(Math.random() * colors.length)]
        return (
          <span
            key={i}
            style={{
              position: 'absolute',
              top: '-20px',
              left: `${left}%`,
              width: 8,
              height: 12,
              background: bg,
              transform: `rotate(${Math.random() * 360}deg)`,
              animation: `confetti-fall ${duration}s linear ${delay}s forwards`,
            }}
          />
        )
      })}
    </div>
  )
}
```

Add to `globals.css`:
```css
@keyframes confetti-fall {
  to { transform: translateY(110vh) rotate(720deg); }
}
```

- [ ] Commit `feat(m6): XpFeedbackProvider + LevelUpToast + TierUpModal + confetti`

### Task 20: Wire into layout

**Modify:** `src/app/(app)/layout.tsx`

Wrap `{children}` with `<XpFeedbackProvider>{children}</XpFeedbackProvider>` inside `<Providers>`.

- [ ] Commit `feat(m6): wire XpFeedbackProvider into app layout`

---

## Phase 8 — Client notify (Bundle 8)

### Task 21: Add notifyXp calls on mutation success

Affected client components that trigger XP:
- `src/components/measurements/MeasurementGrid.tsx` (upsert)
- `src/components/nutrition/NutritionPageClient.tsx` (DailyModal save)
- `src/components/workout/*` (set log, session finish)

Strategy: after successful `fetch` response, parse body, call `useXpFeedback().notifyXp(body)`.

For MeasurementGrid:
```typescript
const { notifyXp } = useXpFeedback()
// ... inside upsert function, after await res.json():
const body = await res.json()
notifyXp(body)
```

Similarly for nutrition and workout sites.

- [ ] Step 1: Identify all client-side mutation sites
- [ ] Step 2: Import `useXpFeedback` and wire in each
- [ ] Step 3: tsc
- [ ] Step 4: Commit `feat(m6): wire notifyXp in mutation flows (measurements, nutrition, workout)`

### Task 22: Verify full test suite

- [ ] `DATABASE_URL=... npx vitest run --no-file-parallelism` — all green
- [ ] `npx tsc --noEmit` — clean
- [ ] Commit (if adjustments needed) `test(m6): suite green across M1+M2+M3+M6`

---

## Phase 9 — E2E + final (Bundles 9-10)

### Task 23: E2E avatar-flow.spec.ts

**Create:** `tests/e2e/avatar-flow.spec.ts`

```typescript
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

test('dashboard hero shows avatar and navigates to /avatar', async ({ page }) => {
  await login(page)
  // Avatar image in hero
  await expect(page.getByAltText(/tier \d/i).first()).toBeVisible()
  await page.getByAltText(/tier \d/i).first().click()
  await expect(page).toHaveURL(/\/avatar/)
})

test('/avatar page renders tier ladder + next tier preview + xp history', async ({ page }) => {
  await login(page)
  await page.goto('/avatar')
  await expect(page.getByText('Tier ladder')).toBeVisible()
  await expect(page.getByText(/XP za 30 dní/i)).toBeVisible()
  await expect(page.getByText(/Rozpis podle aktivity/i)).toBeVisible()
  // Tier ladder should have 5 badges
  const badges = page.locator('button').filter({ hasText: /Rookie|Apprentice|Warrior|Beast|Titan/ })
  await expect(badges).toHaveCount(5)
})
```

- [ ] Commit `test(m6): E2E for avatar hero nav + /avatar page render`

### Task 24: Roadmap update + final verify

- [ ] Run `npx tsc --noEmit` — clean
- [ ] Run `DATABASE_URL=... npx vitest run --no-file-parallelism` — all green
- [ ] Edit `docs/superpowers/roadmap/hexis-roadmap.md` — mark Avatar B1 items checked:
  - `[x] Placeholder SVG pro 5 tierů (public/avatars/tier-{1-5}.svg)`
  - `[x] Avatar komponenta + XP bar v dashboard`
  - `[x] Levelup toast + mini animace`
- [ ] Commit `docs(m6): mark avatar + XP UI milestone complete`

---

## Notes

- **Branch:** `m6-avatar-xp-ui` (branched from `m3-measurements-nutrition`)
- **Czech diacritics:** preserve in UI strings
- **No new npm deps:** Web Audio API + CSS for all animations
- **Test DB:** port 3308, `hexis_test`
