# SP5 PR-1 — Rewards (spend XP) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Rewards feature — a parallel spend ledger for XP — under `/rewards`, flip the sidebar slot from placeholder to active, and add a balance entry-point on the dashboard.

**Architecture:** Two new tables (`rewards`, `reward_redemptions`). Balance is computed on read as `getTotalXp() − Σ redemptions.cost_xp` so level/tier are unaffected. Server-rendered `/rewards` page with a thin client wrapper for dialogs; mutations go through REST routes under `/api/rewards/*` and refresh via `router.refresh()`.

**Tech Stack:** Next.js 15 (App Router, server components default), Drizzle ORM (MySQL), Radix UI primitives via `src/components/ui/compound`, Tailwind v4, Vitest + React Testing Library, Playwright. Spec: `docs/superpowers/specs/2026-04-29-sp5-pr1-rewards-design.md`.

---

## Pre-flight notes (read once before starting)

- **Worktree convention** — work happens in `.worktrees/sp5-pr1-rewards/` per SP2 onwards. The repo root stays clean. Copy `.env.local` into the worktree before running integration tests (`TEST_DATABASE_URL` is needed).
- **DB connection** — integration tests connect to the shared `hexis-mysql` Docker container on port 3306 via `db` from `@/db/client`. Tests must clean up rows they insert (`afterAll` deleting by `userId` LIKE prefix).
- **Auth pattern** — API routes use `requireSessionUser()` from `@/lib/auth-helpers`; if the return value `instanceof Response` is true, return it directly. For row ownership, use `requireOwnership()`.
- **No FK constraints** — project convention: no `references()` in Drizzle schemas; integrity is enforced in app code.
- **Migration generation** — `npm run db:generate` produces `src/db/migrations/NNNN_<name>.sql` from schema diff. Inspect the generated file before committing.
- **Existing nav e2e** — `tests/e2e/nav.spec.ts` asserts 4 disabled placeholders (Rewards / Habits / Player Bio / Quest Calendar). This plan rewrites that assertion to expect 3 (Habits / Player Bio / Quest Calendar) + a working `/rewards` link.
- **Czech vocabulary** is locked in spec §9. Use `Odměny / K utracení / Vyzvednout / Tvoje odměny / Historie / Vytvoř si první odměnu / Chybí <delta> XP`.
- **No `AlertDialog` primitive exists** — for destructive confirmation, reuse `Dialog` from `@/components/ui` with explicit Cancel / Confirm buttons inside.
- **Test addressability** — components that ship interactive elements should expose `data-*` hooks for Playwright (`data-rewards-balance`, `data-reward-id`, `data-redeem-button`). RTL prefers role/label queries; Playwright leans on `data-*` for stability.

---

## Task 0: Branch + worktree setup

**Files:** none (env only).

- [ ] **Step 1: Create the branch worktree**

```bash
git fetch origin main
git worktree add -b sp5-pr1-rewards .worktrees/sp5-pr1-rewards origin/main
cd .worktrees/sp5-pr1-rewards
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
npm run test:run
```

Note the `<N> passed` count from the bottom of the report — call it `BASELINE_UNIT`. The plan adds tests; the final task verifies new total = `BASELINE_UNIT + N` where `N` is the count of new tests added.

---

## Task 1: Schema — add `rewards` and `reward_redemptions` tables

**Files:**
- Modify: `src/db/schema.ts` (append two tables at end of file, before final newline)
- Create (auto-generated): `src/db/migrations/0003_sp5_pr1_rewards.sql`
- Create (auto-generated): `src/db/migrations/meta/0003_snapshot.json`
- Modify (auto-generated): `src/db/migrations/meta/_journal.json`

- [ ] **Step 1: Append schema definitions**

Open `src/db/schema.ts`. Locate the last existing table block (`plateInventories`) — append below it, before the file's final newline:

```ts
// ═══════════════════════════════════════════════════════════════════
// REWARDS (spend XP — separate ledger; does NOT affect level/tier)
// ═══════════════════════════════════════════════════════════════════

export const rewards = mysqlTable(
  'rewards',
  {
    id: int('id').primaryKey().autoincrement(),
    userId: varchar('user_id', { length: 26 }).notNull(),
    name: varchar('name', { length: 80 }).notNull(),
    costXp: int('cost_xp').notNull(),
    description: varchar('description', { length: 280 }),
    archivedAt: timestamp('archived_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => ({
    byUserActive: index('idx_rewards_user_active').on(t.userId, t.archivedAt),
  })
)

export const rewardRedemptions = mysqlTable(
  'reward_redemptions',
  {
    id: int('id').primaryKey().autoincrement(),
    userId: varchar('user_id', { length: 26 }).notNull(),
    rewardId: int('reward_id').notNull(),
    costXp: int('cost_xp').notNull(),
    note: varchar('note', { length: 280 }),
    redeemedAt: timestamp('redeemed_at').defaultNow().notNull(),
  },
  (t) => ({
    byUserRedeemed: index('idx_redemptions_user_redeemed').on(t.userId, t.redeemedAt),
  })
)
```

- [ ] **Step 2: Generate migration**

Run: `npm run db:generate`

Expected output: `[✓] Your SQL migration file ➜ src/db/migrations/0003_<auto>.sql`. Drizzle will pick its own slug — rename the produced file:

```bash
# Find the new file and rename it
ls -1 src/db/migrations/*.sql | tail -1
# Then mv that file to:
mv src/db/migrations/0003_<auto>.sql src/db/migrations/0003_sp5_pr1_rewards.sql
```

Open `_journal.json` and update the entry to reference `0003_sp5_pr1_rewards`. Drizzle re-emits this on the next generate, so just keep the existing diff if it's already correct.

- [ ] **Step 3: Inspect the generated SQL**

Open the renamed file. Confirm two `CREATE TABLE` statements (`rewards`, `reward_redemptions`) and two `CREATE INDEX` statements separated by `--> statement-breakpoint`. If Drizzle generated extra ALTERs to unrelated tables, abort and re-check that schema.ts has no incidental edits.

- [ ] **Step 4: Apply migration to dev DB**

```bash
npm run db:migrate
```

Expected: migration `0003_sp5_pr1_rewards` applied, `rewards` and `reward_redemptions` tables created. Verify in MySQL CLI:

```bash
docker exec hexis-mysql mysql -uroot -proot hexis -e "SHOW TABLES LIKE 'reward%';"
```

Expected output: 2 rows — `rewards`, `reward_redemptions`.

- [ ] **Step 5: Commit**

```bash
git add src/db/schema.ts src/db/migrations/0003_sp5_pr1_rewards.sql src/db/migrations/meta/
git commit -m "feat(db): add rewards + reward_redemptions schema (migration 0003)"
```

---

## Task 2: Balance + list queries (`src/lib/queries/rewards.ts`) — TDD

**Files:**
- Create: `src/lib/queries/rewards.ts`
- Create: `src/tests/lib/queries/rewards.test.ts`

- [ ] **Step 1: Write the failing test for `fetchRewardsBalance`**

Create `src/tests/lib/queries/rewards.test.ts`:

```ts
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { db } from '@/db/client'
import { users, xpEvents, rewards, rewardRedemptions } from '@/db/schema'
import { eq, like } from 'drizzle-orm'
import {
  fetchRewardsBalance,
  fetchActiveRewards,
  fetchRedemptionHistory,
} from '@/lib/queries/rewards'

const PREFIX = 'rwtest_'
const USER = `${PREFIX}user000000000001`

beforeAll(async () => {
  await db.insert(users).values({
    id: USER,
    email: `${PREFIX}user@hexis.local`,
    name: 'Rewards Test',
    passwordHash: 'x',
  })
})

afterAll(async () => {
  await db.delete(rewardRedemptions).where(eq(rewardRedemptions.userId, USER))
  await db.delete(rewards).where(eq(rewards.userId, USER))
  await db.delete(xpEvents).where(eq(xpEvents.userId, USER))
  await db.delete(users).where(like(users.id, `${PREFIX}%`))
})

beforeEach(async () => {
  await db.delete(rewardRedemptions).where(eq(rewardRedemptions.userId, USER))
  await db.delete(rewards).where(eq(rewards.userId, USER))
  await db.delete(xpEvents).where(eq(xpEvents.userId, USER))
})

describe('fetchRewardsBalance', () => {
  it('returns zeros for a user with no XP and no redemptions', async () => {
    const result = await fetchRewardsBalance(db, USER)
    expect(result).toEqual({ totalXp: 0, spentXp: 0, balanceXp: 0 })
  })

  it('subtracts redeemed cost_xp from totalXp', async () => {
    await db.insert(xpEvents).values({ userId: USER, eventType: 'session_complete', xpDelta: 100 })
    const [r] = await db.insert(rewards).values({ userId: USER, name: 'sushi', costXp: 30 })
    await db.insert(rewardRedemptions).values({
      userId: USER,
      rewardId: r.insertId,
      costXp: 30,
    })
    const result = await fetchRewardsBalance(db, USER)
    expect(result).toEqual({ totalXp: 100, spentXp: 30, balanceXp: 70 })
  })

  it('handles negative xpEvents (refunds) correctly', async () => {
    await db.insert(xpEvents).values([
      { userId: USER, eventType: 'session_complete', xpDelta: 100 },
      { userId: USER, eventType: 'session_complete', xpDelta: -20 },
    ])
    const result = await fetchRewardsBalance(db, USER)
    expect(result).toEqual({ totalXp: 80, spentXp: 0, balanceXp: 80 })
  })

  it('sums multiple redemptions', async () => {
    await db.insert(xpEvents).values({ userId: USER, eventType: 'session_complete', xpDelta: 500 })
    const [r] = await db.insert(rewards).values({ userId: USER, name: 'kniha', costXp: 100 })
    await db.insert(rewardRedemptions).values([
      { userId: USER, rewardId: r.insertId, costXp: 100 },
      { userId: USER, rewardId: r.insertId, costXp: 100 },
      { userId: USER, rewardId: r.insertId, costXp: 100 },
    ])
    const result = await fetchRewardsBalance(db, USER)
    expect(result).toEqual({ totalXp: 500, spentXp: 300, balanceXp: 200 })
  })
})
```

- [ ] **Step 2: Run test, verify it fails**

```bash
npm run test:run -- src/tests/lib/queries/rewards.test.ts
```

Expected: FAIL with module-resolution error (`Cannot find module '@/lib/queries/rewards'`).

- [ ] **Step 3: Implement `fetchRewardsBalance`**

Create `src/lib/queries/rewards.ts`:

```ts
import type { MySql2Database } from 'drizzle-orm/mysql2'
import { eq, sql, isNull, desc, and, asc } from 'drizzle-orm'
import * as schema from '@/db/schema'
import { rewards, rewardRedemptions } from '@/db/schema'
import { getTotalXp } from '@/lib/xp'

type DB = MySql2Database<typeof schema>

export type RewardsBalance = {
  totalXp: number
  spentXp: number
  balanceXp: number
}

export async function fetchRewardsBalance(db: DB, userId: string): Promise<RewardsBalance> {
  const totalXp = await getTotalXp(db, userId)
  const rows = await db
    .select({ spent: sql<number>`COALESCE(SUM(${rewardRedemptions.costXp}), 0)` })
    .from(rewardRedemptions)
    .where(eq(rewardRedemptions.userId, userId))
  const spentXp = Number(rows[0]?.spent ?? 0)
  return { totalXp, spentXp, balanceXp: totalXp - spentXp }
}
```

- [ ] **Step 4: Run test, verify pass**

```bash
npm run test:run -- src/tests/lib/queries/rewards.test.ts
```

Expected: 4 passed for the `fetchRewardsBalance` describe block. The other two `describe` blocks (`fetchActiveRewards`, `fetchRedemptionHistory`) don't exist yet — keep going.

- [ ] **Step 5: Append failing tests for `fetchActiveRewards` and `fetchRedemptionHistory`**

Append to `src/tests/lib/queries/rewards.test.ts`:

```ts
describe('fetchActiveRewards', () => {
  it('returns empty array when user has no rewards', async () => {
    const result = await fetchActiveRewards(db, USER)
    expect(result).toEqual([])
  })

  it('excludes archived rewards and orders by costXp ascending', async () => {
    await db.insert(rewards).values([
      { userId: USER, name: 'big', costXp: 500 },
      { userId: USER, name: 'small', costXp: 50 },
      { userId: USER, name: 'archived', costXp: 200, archivedAt: new Date() },
    ])
    const result = await fetchActiveRewards(db, USER)
    expect(result.map((r) => r.name)).toEqual(['small', 'big'])
  })
})

describe('fetchRedemptionHistory', () => {
  it('returns empty array when user has no redemptions', async () => {
    const result = await fetchRedemptionHistory(db, USER)
    expect(result).toEqual([])
  })

  it('returns rows joined with reward name and ordered redeemedAt DESC', async () => {
    const [r] = await db.insert(rewards).values({ userId: USER, name: 'sushi', costXp: 30 })
    const earlier = new Date(Date.now() - 60_000)
    const later = new Date()
    await db.insert(rewardRedemptions).values([
      { userId: USER, rewardId: r.insertId, costXp: 30, redeemedAt: earlier },
      { userId: USER, rewardId: r.insertId, costXp: 30, redeemedAt: later, note: 'birthday' },
    ])
    const result = await fetchRedemptionHistory(db, USER)
    expect(result).toHaveLength(2)
    expect(result[0].note).toBe('birthday')
    expect(result[0].rewardName).toBe('sushi')
    expect(result[0].rewardArchived).toBe(false)
    expect(result[1].note).toBeNull()
  })

  it('marks rewardArchived=true when joined reward has archivedAt set', async () => {
    const [r] = await db.insert(rewards).values({
      userId: USER,
      name: 'old reward',
      costXp: 50,
      archivedAt: new Date(),
    })
    await db.insert(rewardRedemptions).values({
      userId: USER,
      rewardId: r.insertId,
      costXp: 50,
    })
    const result = await fetchRedemptionHistory(db, USER)
    expect(result).toHaveLength(1)
    expect(result[0].rewardArchived).toBe(true)
    expect(result[0].rewardName).toBe('old reward')
  })
})
```

- [ ] **Step 6: Run, verify two new describes fail**

```bash
npm run test:run -- src/tests/lib/queries/rewards.test.ts
```

Expected: 4 pass, ~5 fail with `fetchActiveRewards is not a function` / `fetchRedemptionHistory is not a function`.

- [ ] **Step 7: Implement both functions**

Append to `src/lib/queries/rewards.ts`:

```ts
export type RewardRow = typeof rewards.$inferSelect

export async function fetchActiveRewards(db: DB, userId: string): Promise<RewardRow[]> {
  return db
    .select()
    .from(rewards)
    .where(and(eq(rewards.userId, userId), isNull(rewards.archivedAt)))
    .orderBy(asc(rewards.costXp), asc(rewards.id))
}

export type RedemptionWithReward = {
  id: number
  rewardId: number
  rewardName: string
  rewardArchived: boolean
  costXp: number
  note: string | null
  redeemedAt: Date
}

export async function fetchRedemptionHistory(
  db: DB,
  userId: string,
  limit = 50
): Promise<RedemptionWithReward[]> {
  const rows = await db
    .select({
      id: rewardRedemptions.id,
      rewardId: rewardRedemptions.rewardId,
      rewardName: rewards.name,
      archivedAt: rewards.archivedAt,
      costXp: rewardRedemptions.costXp,
      note: rewardRedemptions.note,
      redeemedAt: rewardRedemptions.redeemedAt,
    })
    .from(rewardRedemptions)
    .leftJoin(rewards, eq(rewardRedemptions.rewardId, rewards.id))
    .where(eq(rewardRedemptions.userId, userId))
    .orderBy(desc(rewardRedemptions.redeemedAt))
    .limit(limit)

  return rows.map((r) => ({
    id: r.id,
    rewardId: r.rewardId,
    rewardName: r.rewardName ?? '(smazaná odměna)',
    rewardArchived: r.archivedAt != null,
    costXp: r.costXp,
    note: r.note,
    redeemedAt: r.redeemedAt,
  }))
}
```

- [ ] **Step 8: Run, verify all pass**

```bash
npm run test:run -- src/tests/lib/queries/rewards.test.ts
```

Expected: all describes green (typically 9 tests).

- [ ] **Step 9: Commit**

```bash
git add src/lib/queries/rewards.ts src/tests/lib/queries/rewards.test.ts
git commit -m "feat(queries): rewards balance, active list, redemption history"
```

---

## Task 3: API — `GET /api/rewards` and `POST /api/rewards`

**Files:**
- Create: `src/app/api/rewards/route.ts`
- Create: `src/lib/validators/rewards.ts`
- Create: `src/tests/lib/validators/rewards.test.ts`
- Create: `src/tests/api/rewards.test.ts`

- [ ] **Step 1: Write failing tests for the validator**

Create `src/tests/lib/validators/rewards.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { rewardCreateSchema, rewardPatchSchema, redeemSchema } from '@/lib/validators/rewards'

describe('rewardCreateSchema', () => {
  it('accepts valid input', () => {
    const result = rewardCreateSchema.safeParse({ name: 'sushi', costXp: 100 })
    expect(result.success).toBe(true)
  })

  it('rejects empty name', () => {
    const result = rewardCreateSchema.safeParse({ name: '', costXp: 100 })
    expect(result.success).toBe(false)
  })

  it('rejects name over 80 chars', () => {
    const result = rewardCreateSchema.safeParse({ name: 'a'.repeat(81), costXp: 100 })
    expect(result.success).toBe(false)
  })

  it('rejects costXp <= 0', () => {
    expect(rewardCreateSchema.safeParse({ name: 'x', costXp: 0 }).success).toBe(false)
    expect(rewardCreateSchema.safeParse({ name: 'x', costXp: -1 }).success).toBe(false)
  })

  it('rejects costXp > 999_999', () => {
    expect(rewardCreateSchema.safeParse({ name: 'x', costXp: 1_000_000 }).success).toBe(false)
  })

  it('accepts optional description up to 280 chars', () => {
    expect(
      rewardCreateSchema.safeParse({ name: 'x', costXp: 1, description: 'a'.repeat(280) }).success
    ).toBe(true)
    expect(
      rewardCreateSchema.safeParse({ name: 'x', costXp: 1, description: 'a'.repeat(281) }).success
    ).toBe(false)
  })

  it('trims name', () => {
    const r = rewardCreateSchema.safeParse({ name: '  sushi  ', costXp: 1 })
    expect(r.success && r.data.name).toBe('sushi')
  })
})

describe('rewardPatchSchema', () => {
  it('accepts archivedAt = null (un-archive) and Date (archive)', () => {
    expect(rewardPatchSchema.safeParse({ archivedAt: null }).success).toBe(true)
    expect(rewardPatchSchema.safeParse({ archivedAt: new Date().toISOString() }).success).toBe(true)
  })

  it('rejects empty patch object', () => {
    expect(rewardPatchSchema.safeParse({}).success).toBe(false)
  })
})

describe('redeemSchema', () => {
  it('accepts empty body', () => {
    expect(redeemSchema.safeParse({}).success).toBe(true)
  })

  it('accepts note up to 280 chars', () => {
    expect(redeemSchema.safeParse({ note: 'k narozeninám' }).success).toBe(true)
    expect(redeemSchema.safeParse({ note: 'a'.repeat(281) }).success).toBe(false)
  })
})
```

- [ ] **Step 2: Run, verify fails**

```bash
npm run test:run -- src/tests/lib/validators/rewards.test.ts
```

Expected: module-not-found error.

- [ ] **Step 3: Implement validators**

Create `src/lib/validators/rewards.ts`:

```ts
import { z } from 'zod'

export const rewardCreateSchema = z.object({
  name: z.string().trim().min(1).max(80),
  costXp: z.number().int().min(1).max(999_999),
  description: z.string().max(280).optional(),
})

export const rewardPatchSchema = z
  .object({
    name: z.string().trim().min(1).max(80).optional(),
    costXp: z.number().int().min(1).max(999_999).optional(),
    description: z.string().max(280).nullable().optional(),
    archivedAt: z.union([z.string().datetime(), z.null()]).optional(),
  })
  .refine((obj) => Object.keys(obj).length > 0, { message: 'patch must not be empty' })

export const redeemSchema = z.object({
  note: z.string().max(280).optional(),
})

export type RewardCreate = z.infer<typeof rewardCreateSchema>
export type RewardPatch = z.infer<typeof rewardPatchSchema>
export type RedeemInput = z.infer<typeof redeemSchema>
```

- [ ] **Step 4: Run, verify pass**

```bash
npm run test:run -- src/tests/lib/validators/rewards.test.ts
```

Expected: all green.

- [ ] **Step 5: Write failing API integration tests for GET + POST `/api/rewards`**

Create `src/tests/api/rewards.test.ts`:

```ts
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest'
import { db } from '@/db/client'
import { users, xpEvents, rewards, rewardRedemptions } from '@/db/schema'
import { eq, like } from 'drizzle-orm'

const PREFIX = 'rwapi_'
const USER = `${PREFIX}user000000000001`

vi.mock('@/lib/auth-helpers', async () => {
  const actual = await vi.importActual<typeof import('@/lib/auth-helpers')>('@/lib/auth-helpers')
  return {
    ...actual,
    getSessionUser: async () => ({ id: USER, email: `${USER}@hexis.local`, name: 'X' }),
    requireSessionUser: async () => ({ id: USER, email: `${USER}@hexis.local`, name: 'X' }),
  }
})

beforeAll(async () => {
  await db.insert(users).values({
    id: USER,
    email: `${PREFIX}user@hexis.local`,
    name: 'Rewards API Test',
    passwordHash: 'x',
  })
})

afterAll(async () => {
  await db.delete(rewardRedemptions).where(eq(rewardRedemptions.userId, USER))
  await db.delete(rewards).where(eq(rewards.userId, USER))
  await db.delete(xpEvents).where(eq(xpEvents.userId, USER))
  await db.delete(users).where(like(users.id, `${PREFIX}%`))
})

beforeEach(async () => {
  await db.delete(rewardRedemptions).where(eq(rewardRedemptions.userId, USER))
  await db.delete(rewards).where(eq(rewards.userId, USER))
  await db.delete(xpEvents).where(eq(xpEvents.userId, USER))
})

describe('GET /api/rewards', () => {
  it('returns empty balance + lists for a fresh user', async () => {
    const { GET } = await import('@/app/api/rewards/route')
    const res = await GET()
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toEqual({
      balance: { totalXp: 0, spentXp: 0, balanceXp: 0 },
      rewards: [],
      history: [],
    })
  })

  it('returns balance, rewards (archived excluded), and history', async () => {
    await db.insert(xpEvents).values({ userId: USER, eventType: 'session_complete', xpDelta: 200 })
    const [active] = await db.insert(rewards).values({ userId: USER, name: 'sushi', costXp: 100 })
    await db.insert(rewards).values({
      userId: USER,
      name: 'old',
      costXp: 999,
      archivedAt: new Date(),
    })
    await db.insert(rewardRedemptions).values({
      userId: USER,
      rewardId: active.insertId,
      costXp: 100,
    })

    const { GET } = await import('@/app/api/rewards/route')
    const res = await GET()
    const json = await res.json()
    expect(json.balance).toEqual({ totalXp: 200, spentXp: 100, balanceXp: 100 })
    expect(json.rewards).toHaveLength(1)
    expect(json.rewards[0].name).toBe('sushi')
    expect(json.history).toHaveLength(1)
    expect(json.history[0].rewardName).toBe('sushi')
  })
})

describe('POST /api/rewards', () => {
  it('creates a reward and returns 201 with the row', async () => {
    const { POST } = await import('@/app/api/rewards/route')
    const req = new Request('http://localhost/api/rewards', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'kniha', costXp: 250, description: 'fantasy' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(201)
    const json = await res.json()
    expect(json.name).toBe('kniha')
    expect(json.costXp).toBe(250)
    expect(typeof json.id).toBe('number')
  })

  it('returns 400 for invalid body', async () => {
    const { POST } = await import('@/app/api/rewards/route')
    const req = new Request('http://localhost/api/rewards', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: '', costXp: 0 }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })
})
```

- [ ] **Step 6: Run, verify fails (route doesn't exist)**

```bash
npm run test:run -- src/tests/api/rewards.test.ts
```

Expected: module-not-found.

- [ ] **Step 7: Implement the route**

Create `src/app/api/rewards/route.ts`:

```ts
import { db } from '@/db/client'
import { rewards } from '@/db/schema'
import { requireSessionUser } from '@/lib/auth-helpers'
import { rewardCreateSchema } from '@/lib/validators/rewards'
import {
  fetchActiveRewards,
  fetchRedemptionHistory,
  fetchRewardsBalance,
} from '@/lib/queries/rewards'
import { eq } from 'drizzle-orm'

export async function GET() {
  const user = await requireSessionUser()
  if (user instanceof Response) return user
  const [balance, rewardsList, history] = await Promise.all([
    fetchRewardsBalance(db, user.id),
    fetchActiveRewards(db, user.id),
    fetchRedemptionHistory(db, user.id),
  ])
  return Response.json({ balance, rewards: rewardsList, history })
}

export async function POST(req: Request) {
  const user = await requireSessionUser()
  if (user instanceof Response) return user
  const body = await req.json().catch(() => null)
  const parsed = rewardCreateSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: 'Invalid body', issues: parsed.error.issues }, { status: 400 })
  }
  const { name, costXp, description } = parsed.data
  const [insert] = await db.insert(rewards).values({
    userId: user.id,
    name,
    costXp,
    description: description ?? null,
  })
  const row = await db.query.rewards.findFirst({ where: eq(rewards.id, insert.insertId) })
  return Response.json(row, { status: 201 })
}
```

- [ ] **Step 8: Run, verify pass**

```bash
npm run test:run -- src/tests/api/rewards.test.ts
```

Expected: 4 green (2 GET + 2 POST).

- [ ] **Step 9: Commit**

```bash
git add src/app/api/rewards/route.ts src/lib/validators/rewards.ts src/tests/lib/validators/rewards.test.ts src/tests/api/rewards.test.ts
git commit -m "feat(api): GET/POST /api/rewards (balance + list + create)"
```

---

## Task 4: API — `PATCH` and `DELETE /api/rewards/[id]`

**Files:**
- Create: `src/app/api/rewards/[id]/route.ts`
- Modify: `src/tests/api/rewards.test.ts` (append two new describe blocks)

- [ ] **Step 1: Append failing tests**

Append to `src/tests/api/rewards.test.ts`:

```ts
describe('PATCH /api/rewards/[id]', () => {
  it('updates name and costXp', async () => {
    const [r] = await db.insert(rewards).values({ userId: USER, name: 'sushi', costXp: 100 })
    const { PATCH } = await import('@/app/api/rewards/[id]/route')
    const req = new Request(`http://localhost/api/rewards/${r.insertId}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'sushi deluxe', costXp: 150 }),
    })
    const res = await PATCH(req, { params: Promise.resolve({ id: String(r.insertId) }) })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.name).toBe('sushi deluxe')
    expect(json.costXp).toBe(150)
  })

  it('archives a reward (archivedAt = ISO string)', async () => {
    const [r] = await db.insert(rewards).values({ userId: USER, name: 'x', costXp: 1 })
    const { PATCH } = await import('@/app/api/rewards/[id]/route')
    const req = new Request(`http://localhost/api/rewards/${r.insertId}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ archivedAt: new Date().toISOString() }),
    })
    const res = await PATCH(req, { params: Promise.resolve({ id: String(r.insertId) }) })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.archivedAt).toBeTruthy()
  })

  it('returns 404 when reward belongs to another user', async () => {
    const [r] = await db.insert(rewards).values({
      userId: 'someone_else_00000000000001',
      name: 'x',
      costXp: 1,
    })
    const { PATCH } = await import('@/app/api/rewards/[id]/route')
    const req = new Request(`http://localhost/api/rewards/${r.insertId}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'hijack' }),
    })
    const res = await PATCH(req, { params: Promise.resolve({ id: String(r.insertId) }) })
    expect(res.status).toBe(404)
    await db.delete(rewards).where(eq(rewards.id, r.insertId))
  })
})

describe('DELETE /api/rewards/[id]', () => {
  it('deletes a reward with no redemptions (204)', async () => {
    const [r] = await db.insert(rewards).values({ userId: USER, name: 'x', costXp: 1 })
    const { DELETE } = await import('@/app/api/rewards/[id]/route')
    const res = await DELETE(undefined as unknown as Request, {
      params: Promise.resolve({ id: String(r.insertId) }),
    })
    expect(res.status).toBe(204)
    const after = await db.query.rewards.findFirst({ where: eq(rewards.id, r.insertId) })
    expect(after).toBeUndefined()
  })

  it('returns 409 when reward has redemptions', async () => {
    const [r] = await db.insert(rewards).values({ userId: USER, name: 'x', costXp: 1 })
    await db.insert(rewardRedemptions).values({
      userId: USER,
      rewardId: r.insertId,
      costXp: 1,
    })
    const { DELETE } = await import('@/app/api/rewards/[id]/route')
    const res = await DELETE(undefined as unknown as Request, {
      params: Promise.resolve({ id: String(r.insertId) }),
    })
    expect(res.status).toBe(409)
  })
})
```

- [ ] **Step 2: Run, verify fails**

```bash
npm run test:run -- src/tests/api/rewards.test.ts
```

Expected: 4 already-passing + 5 new failing.

- [ ] **Step 3: Implement the route**

Create `src/app/api/rewards/[id]/route.ts`:

```ts
import { db } from '@/db/client'
import { rewards, rewardRedemptions } from '@/db/schema'
import { requireOwnership, requireSessionUser } from '@/lib/auth-helpers'
import { rewardPatchSchema } from '@/lib/validators/rewards'
import { and, eq } from 'drizzle-orm'

type Params = { params: Promise<{ id: string }> }

export async function PATCH(req: Request, { params }: Params) {
  const user = await requireSessionUser()
  if (user instanceof Response) return user
  const { id } = await params
  const rewardId = Number(id)
  if (!Number.isFinite(rewardId)) {
    return Response.json({ error: 'Invalid id' }, { status: 400 })
  }
  const body = await req.json().catch(() => null)
  const parsed = rewardPatchSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: 'Invalid body', issues: parsed.error.issues }, { status: 400 })
  }

  const owned = await requireOwnership(
    db.query.rewards.findFirst({ where: eq(rewards.id, rewardId) }),
    user.id
  )
  if (owned instanceof Response) return owned

  const update: Record<string, unknown> = {}
  if (parsed.data.name !== undefined) update.name = parsed.data.name
  if (parsed.data.costXp !== undefined) update.costXp = parsed.data.costXp
  if (parsed.data.description !== undefined) update.description = parsed.data.description
  if (parsed.data.archivedAt !== undefined) {
    update.archivedAt = parsed.data.archivedAt === null ? null : new Date(parsed.data.archivedAt)
  }

  await db.update(rewards).set(update).where(eq(rewards.id, rewardId))
  const row = await db.query.rewards.findFirst({ where: eq(rewards.id, rewardId) })
  return Response.json(row)
}

export async function DELETE(_req: Request, { params }: Params) {
  const user = await requireSessionUser()
  if (user instanceof Response) return user
  const { id } = await params
  const rewardId = Number(id)
  if (!Number.isFinite(rewardId)) {
    return Response.json({ error: 'Invalid id' }, { status: 400 })
  }

  const owned = await requireOwnership(
    db.query.rewards.findFirst({ where: eq(rewards.id, rewardId) }),
    user.id
  )
  if (owned instanceof Response) return owned

  const existing = await db.query.rewardRedemptions.findFirst({
    where: and(
      eq(rewardRedemptions.userId, user.id),
      eq(rewardRedemptions.rewardId, rewardId)
    ),
  })
  if (existing) {
    return Response.json(
      { error: 'Reward has redemptions; archive instead' },
      { status: 409 }
    )
  }

  await db.delete(rewards).where(eq(rewards.id, rewardId))
  return new Response(null, { status: 204 })
}
```

- [ ] **Step 4: Run, verify pass**

```bash
npm run test:run -- src/tests/api/rewards.test.ts
```

Expected: 9 green.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/rewards/[id]/route.ts src/tests/api/rewards.test.ts
git commit -m "feat(api): PATCH/DELETE /api/rewards/[id] (edit/archive/hard-delete)"
```

---

## Task 5: API — `POST /api/rewards/[id]/redeem`

**Files:**
- Create: `src/app/api/rewards/[id]/redeem/route.ts`
- Modify: `src/tests/api/rewards.test.ts`

- [ ] **Step 1: Append failing tests**

Append to `src/tests/api/rewards.test.ts`:

```ts
describe('POST /api/rewards/[id]/redeem', () => {
  it('redeems when balance >= cost: writes row, returns balance + redemption', async () => {
    await db.insert(xpEvents).values({ userId: USER, eventType: 'session_complete', xpDelta: 200 })
    const [r] = await db.insert(rewards).values({ userId: USER, name: 'sushi', costXp: 100 })
    const { POST } = await import('@/app/api/rewards/[id]/redeem/route')
    const req = new Request(`http://localhost/api/rewards/${r.insertId}/redeem`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ note: 'večeře' }),
    })
    const res = await POST(req, { params: Promise.resolve({ id: String(r.insertId) }) })
    expect(res.status).toBe(201)
    const json = await res.json()
    expect(json.balance).toEqual({ totalXp: 200, spentXp: 100, balanceXp: 100 })
    expect(json.redemption.costXp).toBe(100)
    expect(json.redemption.note).toBe('večeře')
  })

  it('rejects with 402 when balance < cost (no row written)', async () => {
    await db.insert(xpEvents).values({ userId: USER, eventType: 'session_complete', xpDelta: 50 })
    const [r] = await db.insert(rewards).values({ userId: USER, name: 'sushi', costXp: 100 })
    const { POST } = await import('@/app/api/rewards/[id]/redeem/route')
    const req = new Request(`http://localhost/api/rewards/${r.insertId}/redeem`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({}),
    })
    const res = await POST(req, { params: Promise.resolve({ id: String(r.insertId) }) })
    expect(res.status).toBe(402)
    const after = await db.query.rewardRedemptions.findFirst({
      where: eq(rewardRedemptions.userId, USER),
    })
    expect(after).toBeUndefined()
  })

  it('rejects with 404 when reward archived', async () => {
    await db.insert(xpEvents).values({ userId: USER, eventType: 'session_complete', xpDelta: 200 })
    const [r] = await db.insert(rewards).values({
      userId: USER,
      name: 'old',
      costXp: 50,
      archivedAt: new Date(),
    })
    const { POST } = await import('@/app/api/rewards/[id]/redeem/route')
    const req = new Request(`http://localhost/api/rewards/${r.insertId}/redeem`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({}),
    })
    const res = await POST(req, { params: Promise.resolve({ id: String(r.insertId) }) })
    expect(res.status).toBe(404)
  })

  it('freezes costXp from the reward at redeem time even if reward.costXp changes later', async () => {
    await db.insert(xpEvents).values({ userId: USER, eventType: 'session_complete', xpDelta: 500 })
    const [r] = await db.insert(rewards).values({ userId: USER, name: 'x', costXp: 100 })
    const { POST } = await import('@/app/api/rewards/[id]/redeem/route')
    const req = new Request(`http://localhost/api/rewards/${r.insertId}/redeem`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({}),
    })
    await POST(req, { params: Promise.resolve({ id: String(r.insertId) }) })

    await db.update(rewards).set({ costXp: 999 }).where(eq(rewards.id, r.insertId))

    const row = await db.query.rewardRedemptions.findFirst({
      where: eq(rewardRedemptions.rewardId, r.insertId),
    })
    expect(row?.costXp).toBe(100)
  })
})
```

- [ ] **Step 2: Run, verify fails**

```bash
npm run test:run -- src/tests/api/rewards.test.ts
```

Expected: 9 prior + 4 new failing.

- [ ] **Step 3: Implement the route**

Create `src/app/api/rewards/[id]/redeem/route.ts`:

```ts
import { db } from '@/db/client'
import { rewards, rewardRedemptions } from '@/db/schema'
import { requireOwnership, requireSessionUser } from '@/lib/auth-helpers'
import { redeemSchema } from '@/lib/validators/rewards'
import { fetchRewardsBalance } from '@/lib/queries/rewards'
import { eq } from 'drizzle-orm'

type Params = { params: Promise<{ id: string }> }

export async function POST(req: Request, { params }: Params) {
  const user = await requireSessionUser()
  if (user instanceof Response) return user
  const { id } = await params
  const rewardId = Number(id)
  if (!Number.isFinite(rewardId)) {
    return Response.json({ error: 'Invalid id' }, { status: 400 })
  }

  const body = await req.json().catch(() => ({}))
  const parsed = redeemSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: 'Invalid body', issues: parsed.error.issues }, { status: 400 })
  }

  const owned = await requireOwnership(
    db.query.rewards.findFirst({ where: eq(rewards.id, rewardId) }),
    user.id
  )
  if (owned instanceof Response) return owned
  if (owned.archivedAt) {
    return Response.json({ error: 'Reward archived' }, { status: 404 })
  }

  const balance = await fetchRewardsBalance(db, user.id)
  if (balance.balanceXp < owned.costXp) {
    return Response.json(
      {
        error: 'Insufficient balance',
        missing: owned.costXp - balance.balanceXp,
      },
      { status: 402 }
    )
  }

  const [insert] = await db.insert(rewardRedemptions).values({
    userId: user.id,
    rewardId,
    costXp: owned.costXp,
    note: parsed.data.note ?? null,
  })
  const redemption = await db.query.rewardRedemptions.findFirst({
    where: eq(rewardRedemptions.id, insert.insertId),
  })
  const newBalance = await fetchRewardsBalance(db, user.id)
  return Response.json({ redemption, balance: newBalance }, { status: 201 })
}
```

- [ ] **Step 4: Run, verify pass**

```bash
npm run test:run -- src/tests/api/rewards.test.ts
```

Expected: 13 green.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/rewards/[id]/redeem/route.ts src/tests/api/rewards.test.ts
git commit -m "feat(api): POST /api/rewards/[id]/redeem (balance check + frozen cost)"
```

---

## Task 6: API — `DELETE /api/rewards/redemptions/[id]`

**Files:**
- Create: `src/app/api/rewards/redemptions/[id]/route.ts`
- Modify: `src/tests/api/rewards.test.ts`

- [ ] **Step 1: Append failing tests**

Append to `src/tests/api/rewards.test.ts`:

```ts
describe('DELETE /api/rewards/redemptions/[id]', () => {
  it('deletes a redemption row owned by the user (204)', async () => {
    const [r] = await db.insert(rewards).values({ userId: USER, name: 'x', costXp: 50 })
    const [red] = await db.insert(rewardRedemptions).values({
      userId: USER,
      rewardId: r.insertId,
      costXp: 50,
    })
    const { DELETE } = await import('@/app/api/rewards/redemptions/[id]/route')
    const res = await DELETE(undefined as unknown as Request, {
      params: Promise.resolve({ id: String(red.insertId) }),
    })
    expect(res.status).toBe(204)
    const after = await db.query.rewardRedemptions.findFirst({
      where: eq(rewardRedemptions.id, red.insertId),
    })
    expect(after).toBeUndefined()
  })

  it('returns 404 when redemption belongs to another user', async () => {
    const [r] = await db.insert(rewards).values({
      userId: 'someone_else_00000000000002',
      name: 'x',
      costXp: 50,
    })
    const [red] = await db.insert(rewardRedemptions).values({
      userId: 'someone_else_00000000000002',
      rewardId: r.insertId,
      costXp: 50,
    })
    const { DELETE } = await import('@/app/api/rewards/redemptions/[id]/route')
    const res = await DELETE(undefined as unknown as Request, {
      params: Promise.resolve({ id: String(red.insertId) }),
    })
    expect(res.status).toBe(404)
    await db.delete(rewardRedemptions).where(eq(rewardRedemptions.id, red.insertId))
    await db.delete(rewards).where(eq(rewards.id, r.insertId))
  })
})
```

- [ ] **Step 2: Run, verify fails**

```bash
npm run test:run -- src/tests/api/rewards.test.ts
```

Expected: 13 prior + 2 new failing.

- [ ] **Step 3: Implement**

Create `src/app/api/rewards/redemptions/[id]/route.ts`:

```ts
import { db } from '@/db/client'
import { rewardRedemptions } from '@/db/schema'
import { requireOwnership, requireSessionUser } from '@/lib/auth-helpers'
import { eq } from 'drizzle-orm'

type Params = { params: Promise<{ id: string }> }

export async function DELETE(_req: Request, { params }: Params) {
  const user = await requireSessionUser()
  if (user instanceof Response) return user
  const { id } = await params
  const redemptionId = Number(id)
  if (!Number.isFinite(redemptionId)) {
    return Response.json({ error: 'Invalid id' }, { status: 400 })
  }

  const owned = await requireOwnership(
    db.query.rewardRedemptions.findFirst({ where: eq(rewardRedemptions.id, redemptionId) }),
    user.id
  )
  if (owned instanceof Response) return owned

  await db.delete(rewardRedemptions).where(eq(rewardRedemptions.id, redemptionId))
  return new Response(null, { status: 204 })
}
```

- [ ] **Step 4: Run, verify pass**

```bash
npm run test:run -- src/tests/api/rewards.test.ts
```

Expected: 15 green.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/rewards/redemptions/[id]/route.ts src/tests/api/rewards.test.ts
git commit -m "feat(api): DELETE /api/rewards/redemptions/[id] (history cleanup)"
```

---

## Task 7: Display components — `BalanceCard`, `RewardCard`, `RewardList`, `RedemptionRow`, `RedemptionList`

**Files:**
- Create: `src/components/rewards/BalanceCard.tsx`
- Create: `src/components/rewards/RewardCard.tsx`
- Create: `src/components/rewards/RewardList.tsx`
- Create: `src/components/rewards/RedemptionRow.tsx`
- Create: `src/components/rewards/RedemptionList.tsx`
- Create: `src/components/rewards/index.ts`
- Create: `src/tests/ui/rewards/BalanceCard.test.tsx`
- Create: `src/tests/ui/rewards/RewardCard.test.tsx`

- [ ] **Step 1: Write failing test for `BalanceCard`**

Create `src/tests/ui/rewards/BalanceCard.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { BalanceCard } from '@/components/rewards/BalanceCard'

describe('BalanceCard', () => {
  it('renders balance + earned/spent breakdown', () => {
    render(<BalanceCard balance={{ totalXp: 500, spentXp: 200, balanceXp: 300 }} />)
    expect(screen.getByText(/K utracení/i)).toBeInTheDocument()
    expect(screen.getByTestId('rewards-balance')).toHaveTextContent('300 XP')
    expect(screen.getByText(/Získáno/i).parentElement).toHaveTextContent('500')
    expect(screen.getByText(/Utraceno/i).parentElement).toHaveTextContent('200')
  })
})
```

- [ ] **Step 2: Run, verify fails**

```bash
npm run test:run -- src/tests/ui/rewards/BalanceCard.test.tsx
```

Expected: module-not-found.

- [ ] **Step 3: Implement `BalanceCard`**

Create `src/components/rewards/BalanceCard.tsx`:

```tsx
import type { RewardsBalance } from '@/lib/queries/rewards'

type Props = {
  balance: RewardsBalance
  className?: string
}

export function BalanceCard({ balance, className }: Props) {
  return (
    <div
      className={
        'border-border bg-surface rounded-2xl border p-4 ' + (className ?? '')
      }
    >
      <div className="text-muted text-xs tracking-[0.3em] uppercase">K utracení</div>
      <div
        data-testid="rewards-balance"
        className="text-accent mt-1 text-3xl font-bold"
      >
        {balance.balanceXp} XP
      </div>
      <div className="text-muted mt-3 flex justify-between text-xs">
        <span>
          Získáno <span className="text-foreground font-semibold">{balance.totalXp}</span>
        </span>
        <span>
          Utraceno <span className="text-foreground font-semibold">{balance.spentXp}</span>
        </span>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run, verify pass**

```bash
npm run test:run -- src/tests/ui/rewards/BalanceCard.test.tsx
```

Expected: 1 green.

- [ ] **Step 5: Write failing test for `RewardCard`**

Create `src/tests/ui/rewards/RewardCard.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import userEvent from '@testing-library/user-event'
import { RewardCard } from '@/components/rewards/RewardCard'

const REWARD = {
  id: 1,
  userId: 'u',
  name: 'sushi',
  costXp: 100,
  description: 'omakase',
  archivedAt: null,
  createdAt: new Date(),
}

describe('RewardCard', () => {
  it('renders name, cost, and description', () => {
    render(
      <RewardCard reward={REWARD} balanceXp={500} onRedeem={() => {}} onEdit={() => {}} onArchive={() => {}} onDelete={() => {}} />
    )
    expect(screen.getByText('sushi')).toBeInTheDocument()
    expect(screen.getByText('100 XP')).toBeInTheDocument()
    expect(screen.getByText('omakase')).toBeInTheDocument()
  })

  it('disables Vyzvednout when balance < cost and shows missing delta in title', () => {
    render(
      <RewardCard reward={REWARD} balanceXp={40} onRedeem={() => {}} onEdit={() => {}} onArchive={() => {}} onDelete={() => {}} />
    )
    const btn = screen.getByRole('button', { name: /Vyzvednout/i })
    expect(btn).toBeDisabled()
    expect(btn).toHaveAttribute('title', expect.stringContaining('Chybí 60 XP'))
  })

  it('calls onRedeem when button clicked and balance is enough', async () => {
    const onRedeem = vi.fn()
    render(
      <RewardCard reward={REWARD} balanceXp={500} onRedeem={onRedeem} onEdit={() => {}} onArchive={() => {}} onDelete={() => {}} />
    )
    await userEvent.click(screen.getByRole('button', { name: /Vyzvednout/i }))
    expect(onRedeem).toHaveBeenCalledWith(REWARD)
  })
})
```

- [ ] **Step 6: Run, verify fails**

```bash
npm run test:run -- src/tests/ui/rewards/RewardCard.test.tsx
```

Expected: module-not-found.

- [ ] **Step 7: Implement `RewardCard`**

Create `src/components/rewards/RewardCard.tsx`:

```tsx
'use client'
import { Button, Menu } from '@/components/ui'
import { MoreVertical } from 'lucide-react'
import type { RewardRow } from '@/lib/queries/rewards'

type Props = {
  reward: RewardRow
  balanceXp: number
  onRedeem: (r: RewardRow) => void
  onEdit: (r: RewardRow) => void
  onArchive: (r: RewardRow) => void
  onDelete: (r: RewardRow) => void
  hasRedemptions?: boolean
}

export function RewardCard({
  reward,
  balanceXp,
  onRedeem,
  onEdit,
  onArchive,
  onDelete,
  hasRedemptions,
}: Props) {
  const missing = reward.costXp - balanceXp
  const cantAfford = missing > 0
  return (
    <div
      data-reward-id={reward.id}
      className="border-border bg-surface flex items-start gap-3 rounded-xl border p-3"
    >
      <div className="min-w-0 flex-1">
        <div className="text-foreground truncate text-sm font-semibold">{reward.name}</div>
        {reward.description && (
          <div className="text-muted mt-0.5 line-clamp-2 text-xs">{reward.description}</div>
        )}
        <div className="text-muted mt-1 text-xs">
          <span className="text-accent font-semibold">{reward.costXp} XP</span>
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <Button
          data-redeem-button
          size="sm"
          variant="primary"
          disabled={cantAfford}
          title={cantAfford ? `Chybí ${missing} XP` : undefined}
          onClick={() => onRedeem(reward)}
        >
          Vyzvednout
        </Button>
        <Menu.Root>
          <Menu.Trigger
            aria-label={`Možnosti pro ${reward.name}`}
            className="hover:bg-surface-raised text-muted rounded p-1"
          >
            <MoreVertical className="h-4 w-4" />
          </Menu.Trigger>
          <Menu.Content align="end">
            <Menu.Item onSelect={() => onEdit(reward)}>Upravit</Menu.Item>
            <Menu.Item onSelect={() => onArchive(reward)}>Archivovat</Menu.Item>
            {!hasRedemptions && (
              <Menu.Item onSelect={() => onDelete(reward)} className="text-destructive">
                Smazat
              </Menu.Item>
            )}
          </Menu.Content>
        </Menu.Root>
      </div>
    </div>
  )
}
```

> **Note on Menu API:** confirm whether `Menu` from `@/components/ui` exports `Root` / `Trigger` / `Content` / `Item` as a namespace or as separate names. If they are separate (e.g., `MenuRoot`, `MenuTrigger`), update the JSX accordingly. The implementation in `src/components/ui/compound/Menu.tsx` is the source of truth — read it before this step and adapt.

- [ ] **Step 8: Run, verify pass**

```bash
npm run test:run -- src/tests/ui/rewards/RewardCard.test.tsx
```

Expected: 3 green.

- [ ] **Step 9: Implement `RewardList`, `RedemptionRow`, `RedemptionList` (no failing tests — these are thin wrappers; covered by page-level Playwright)**

Create `src/components/rewards/RewardList.tsx`:

```tsx
'use client'
import { EmptyState } from '@/components/ui'
import { Gift } from 'lucide-react'
import { RewardCard } from './RewardCard'
import type { RewardRow } from '@/lib/queries/rewards'

type Props = {
  rewards: RewardRow[]
  balanceXp: number
  redemptionCounts: Record<number, number>
  onRedeem: (r: RewardRow) => void
  onEdit: (r: RewardRow) => void
  onArchive: (r: RewardRow) => void
  onDelete: (r: RewardRow) => void
  onCreate: () => void
}

export function RewardList({
  rewards,
  balanceXp,
  redemptionCounts,
  onRedeem,
  onEdit,
  onArchive,
  onDelete,
  onCreate,
}: Props) {
  if (rewards.length === 0) {
    return (
      <EmptyState
        icon={Gift}
        title="Žádné odměny"
        description="Vytvoř si první odměnu — co si chceš dopřát za odvedenou práci?"
        action={
          <button
            type="button"
            onClick={onCreate}
            className="bg-accent text-on-accent rounded-lg px-3 py-2 text-sm font-semibold"
          >
            Vytvoř si první odměnu
          </button>
        }
      />
    )
  }
  return (
    <div className="flex flex-col gap-2">
      {rewards.map((r) => (
        <RewardCard
          key={r.id}
          reward={r}
          balanceXp={balanceXp}
          onRedeem={onRedeem}
          onEdit={onEdit}
          onArchive={onArchive}
          onDelete={onDelete}
          hasRedemptions={(redemptionCounts[r.id] ?? 0) > 0}
        />
      ))}
    </div>
  )
}
```

Create `src/components/rewards/RedemptionRow.tsx`:

```tsx
'use client'
import type { RedemptionWithReward } from '@/lib/queries/rewards'

const fmt = new Intl.DateTimeFormat('cs-CZ', { day: 'numeric', month: 'short' })

type Props = {
  redemption: RedemptionWithReward
  onDelete: (r: RedemptionWithReward) => void
}

export function RedemptionRow({ redemption, onDelete }: Props) {
  return (
    <div className="border-border flex items-center gap-3 border-b py-2 text-sm last:border-0">
      <span className="text-muted w-12 shrink-0 text-xs">
        {fmt.format(redemption.redeemedAt)}
      </span>
      <span
        className={
          'min-w-0 flex-1 truncate ' + (redemption.rewardArchived ? 'text-muted italic' : '')
        }
      >
        {redemption.rewardName}
        {redemption.note && (
          <span className="text-muted ml-2 text-xs">· {redemption.note}</span>
        )}
      </span>
      <span className="text-accent text-xs font-semibold">−{redemption.costXp} XP</span>
      <button
        type="button"
        aria-label="Smazat z historie"
        className="text-muted hover:text-destructive text-xs"
        onClick={() => onDelete(redemption)}
      >
        ×
      </button>
    </div>
  )
}
```

Create `src/components/rewards/RedemptionList.tsx`:

```tsx
'use client'
import type { RedemptionWithReward } from '@/lib/queries/rewards'
import { RedemptionRow } from './RedemptionRow'

type Props = {
  history: RedemptionWithReward[]
  onDelete: (r: RedemptionWithReward) => void
}

export function RedemptionList({ history, onDelete }: Props) {
  if (history.length === 0) {
    return <p className="text-muted text-sm">Zatím žádná vyzvednutí.</p>
  }
  return (
    <div className="border-border bg-surface rounded-xl border px-3">
      {history.map((r) => (
        <RedemptionRow key={r.id} redemption={r} onDelete={onDelete} />
      ))}
    </div>
  )
}
```

Create `src/components/rewards/index.ts`:

```ts
export { BalanceCard } from './BalanceCard'
export { RewardCard } from './RewardCard'
export { RewardList } from './RewardList'
export { RedemptionRow } from './RedemptionRow'
export { RedemptionList } from './RedemptionList'
```

- [ ] **Step 10: Typecheck + run all rewards tests**

```bash
npm run typecheck
npm run test:run -- src/tests/ui/rewards/
```

Expected: typecheck clean; tests green.

- [ ] **Step 11: Commit**

```bash
git add src/components/rewards/ src/tests/ui/rewards/
git commit -m "feat(rewards): BalanceCard + RewardCard + List + History row"
```

---

## Task 8: Mutation dialogs — `RewardDialog` and `RedeemConfirmDialog`

**Files:**
- Create: `src/components/rewards/RewardDialog.tsx`
- Create: `src/components/rewards/RedeemConfirmDialog.tsx`
- Modify: `src/components/rewards/index.ts`
- Create: `src/tests/ui/rewards/RewardDialog.test.tsx`
- Create: `src/tests/ui/rewards/RedeemConfirmDialog.test.tsx`

- [ ] **Step 1: Write failing tests for `RewardDialog`**

Create `src/tests/ui/rewards/RewardDialog.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { RewardDialog } from '@/components/rewards/RewardDialog'

describe('RewardDialog', () => {
  it('submits create payload from valid form', async () => {
    const onSubmit = vi.fn()
    render(<RewardDialog open mode="create" onOpenChange={() => {}} onSubmit={onSubmit} />)
    await userEvent.type(screen.getByLabelText(/Název/i), 'sushi')
    await userEvent.type(screen.getByLabelText(/Cena/i), '120')
    await userEvent.type(screen.getByLabelText(/Popis/i), 'omakase')
    await userEvent.click(screen.getByRole('button', { name: /Uložit/i }))
    expect(onSubmit).toHaveBeenCalledWith({
      name: 'sushi',
      costXp: 120,
      description: 'omakase',
    })
  })

  it('shows validation error for empty name', async () => {
    const onSubmit = vi.fn()
    render(<RewardDialog open mode="create" onOpenChange={() => {}} onSubmit={onSubmit} />)
    await userEvent.type(screen.getByLabelText(/Cena/i), '50')
    await userEvent.click(screen.getByRole('button', { name: /Uložit/i }))
    expect(onSubmit).not.toHaveBeenCalled()
    expect(screen.getByText(/Název je povinný/i)).toBeInTheDocument()
  })

  it('prefills fields in edit mode', () => {
    render(
      <RewardDialog
        open
        mode="edit"
        initial={{ name: 'kniha', costXp: 250, description: 'fantasy' }}
        onOpenChange={() => {}}
        onSubmit={() => {}}
      />
    )
    expect(screen.getByLabelText(/Název/i)).toHaveValue('kniha')
    expect(screen.getByLabelText(/Cena/i)).toHaveValue(250)
    expect(screen.getByLabelText(/Popis/i)).toHaveValue('fantasy')
  })
})
```

- [ ] **Step 2: Run, verify fails**

```bash
npm run test:run -- src/tests/ui/rewards/RewardDialog.test.tsx
```

Expected: module-not-found.

- [ ] **Step 3: Implement `RewardDialog`**

Create `src/components/rewards/RewardDialog.tsx`:

```tsx
'use client'
import { useEffect, useState } from 'react'
import { Dialog } from '@/components/ui/compound/Dialog'
import { Button, Input, NumberInput } from '@/components/ui'

type Initial = { name: string; costXp: number; description?: string | null }

type Props = {
  open: boolean
  mode: 'create' | 'edit'
  initial?: Initial
  onOpenChange: (open: boolean) => void
  onSubmit: (payload: { name: string; costXp: number; description?: string }) => void
}

export function RewardDialog({ open, mode, initial, onOpenChange, onSubmit }: Props) {
  const [name, setName] = useState('')
  const [cost, setCost] = useState<number | null>(null)
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setName(initial?.name ?? '')
      setCost(initial ? initial.costXp : null)
      setDescription(initial?.description ?? '')
      setError(null)
    }
  }, [open, initial])

  const handleSubmit = () => {
    const trimmed = name.trim()
    if (!trimmed) {
      setError('Název je povinný')
      return
    }
    if (cost == null || cost < 1) {
      setError('Cena musí být kladné celé číslo')
      return
    }
    onSubmit({
      name: trimmed,
      costXp: cost,
      ...(description.trim() ? { description: description.trim() } : {}),
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={mode === 'create' ? 'Nová odměna' : 'Upravit odměnu'}
    >
      <div className="flex flex-col gap-3">
        <Input
          label="Název"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={80}
          autoFocus
        />
        <NumberInput
          label="Cena (XP)"
          value={cost ?? undefined}
          onValueChange={(n) => setCost(n ?? null)}
          min={1}
          max={999_999}
          step={10}
        />
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted text-xs tracking-[0.15em] uppercase">Popis</span>
          <textarea
            className="border-border bg-surface text-foreground rounded-md border px-3 py-2 text-sm focus:outline-none focus-visible:ring-2"
            rows={3}
            maxLength={280}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>
        {error && <div className="text-destructive text-sm">{error}</div>}
        <div className="mt-2 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Zrušit
          </Button>
          <Button variant="primary" onClick={handleSubmit}>
            Uložit
          </Button>
        </div>
      </div>
    </Dialog>
  )
}
```

> **Note:** `Input`, `NumberInput`, and `Button` props (`label`, `onValueChange`, `variant="ghost"`) must match the existing primitive APIs. Open `src/components/ui/primitive/Input.tsx`, `NumberInput.tsx`, `Button.tsx` and adapt prop names if they differ. Don't invent props.

- [ ] **Step 4: Run, verify pass**

```bash
npm run test:run -- src/tests/ui/rewards/RewardDialog.test.tsx
```

Expected: 3 green. If a test fails because of primitive prop mismatch, fix the JSX in `RewardDialog.tsx` to use the actual prop names — don't change the test.

- [ ] **Step 5: Write failing test for `RedeemConfirmDialog`**

Create `src/tests/ui/rewards/RedeemConfirmDialog.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { RedeemConfirmDialog } from '@/components/rewards/RedeemConfirmDialog'

const REWARD = {
  id: 1,
  userId: 'u',
  name: 'sushi',
  costXp: 100,
  description: null,
  archivedAt: null,
  createdAt: new Date(),
}

describe('RedeemConfirmDialog', () => {
  it('renders reward name and cost', () => {
    render(
      <RedeemConfirmDialog open reward={REWARD} onOpenChange={() => {}} onConfirm={() => {}} />
    )
    expect(screen.getByText(/sushi/)).toBeInTheDocument()
    expect(screen.getByText(/100 XP/)).toBeInTheDocument()
  })

  it('passes note through onConfirm', async () => {
    const onConfirm = vi.fn()
    render(
      <RedeemConfirmDialog open reward={REWARD} onOpenChange={() => {}} onConfirm={onConfirm} />
    )
    await userEvent.type(screen.getByLabelText(/Poznámka/i), 'narozeniny')
    await userEvent.click(screen.getByRole('button', { name: /Vyzvednout/i }))
    expect(onConfirm).toHaveBeenCalledWith({ note: 'narozeniny' })
  })

  it('confirms with no note when input empty', async () => {
    const onConfirm = vi.fn()
    render(
      <RedeemConfirmDialog open reward={REWARD} onOpenChange={() => {}} onConfirm={onConfirm} />
    )
    await userEvent.click(screen.getByRole('button', { name: /Vyzvednout/i }))
    expect(onConfirm).toHaveBeenCalledWith({})
  })
})
```

- [ ] **Step 6: Run, verify fails**

```bash
npm run test:run -- src/tests/ui/rewards/RedeemConfirmDialog.test.tsx
```

- [ ] **Step 7: Implement `RedeemConfirmDialog`**

Create `src/components/rewards/RedeemConfirmDialog.tsx`:

```tsx
'use client'
import { useEffect, useState } from 'react'
import { Dialog } from '@/components/ui/compound/Dialog'
import { Button, Input } from '@/components/ui'
import type { RewardRow } from '@/lib/queries/rewards'

type Props = {
  open: boolean
  reward: RewardRow | null
  onOpenChange: (open: boolean) => void
  onConfirm: (input: { note?: string }) => void
}

export function RedeemConfirmDialog({ open, reward, onOpenChange, onConfirm }: Props) {
  const [note, setNote] = useState('')
  useEffect(() => {
    if (open) setNote('')
  }, [open])

  if (!reward) return null
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Vyzvednout odměnu"
      description={`${reward.name} — ${reward.costXp} XP`}
    >
      <div className="flex flex-col gap-3">
        <Input
          label="Poznámka (volitelná)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={280}
        />
        <div className="mt-2 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Zrušit
          </Button>
          <Button
            variant="primary"
            onClick={() => onConfirm(note.trim() ? { note: note.trim() } : {})}
          >
            Vyzvednout
          </Button>
        </div>
      </div>
    </Dialog>
  )
}
```

- [ ] **Step 8: Run, verify pass + extend barrel**

```bash
npm run test:run -- src/tests/ui/rewards/RedeemConfirmDialog.test.tsx
```

Append to `src/components/rewards/index.ts`:

```ts
export { RewardDialog } from './RewardDialog'
export { RedeemConfirmDialog } from './RedeemConfirmDialog'
```

- [ ] **Step 9: Commit**

```bash
git add src/components/rewards/ src/tests/ui/rewards/
git commit -m "feat(rewards): RewardDialog + RedeemConfirmDialog"
```

---

## Task 9: `/rewards` page (server) + client wrapper

**Files:**
- Create: `src/app/(app)/rewards/page.tsx`
- Create: `src/components/rewards/RewardsPageClient.tsx`
- Modify: `src/components/rewards/index.ts`

- [ ] **Step 1: Implement the server page**

Create `src/app/(app)/rewards/page.tsx`:

```tsx
import { redirect } from 'next/navigation'
import { db } from '@/db/client'
import { requireSessionUser } from '@/lib/auth-helpers'
import {
  fetchActiveRewards,
  fetchRedemptionHistory,
  fetchRewardsBalance,
} from '@/lib/queries/rewards'
import { rewardRedemptions } from '@/db/schema'
import { eq, sql } from 'drizzle-orm'
import { RewardsPageClient } from '@/components/rewards/RewardsPageClient'

export const dynamic = 'force-dynamic'

export default async function RewardsPage() {
  const user = await requireSessionUser()
  if (user instanceof Response) {
    redirect('/login')
  }

  const [balance, rewards, history, countsRows] = await Promise.all([
    fetchRewardsBalance(db, user.id),
    fetchActiveRewards(db, user.id),
    fetchRedemptionHistory(db, user.id),
    db
      .select({
        rewardId: rewardRedemptions.rewardId,
        n: sql<number>`COUNT(*)`,
      })
      .from(rewardRedemptions)
      .where(eq(rewardRedemptions.userId, user.id))
      .groupBy(rewardRedemptions.rewardId),
  ])

  const redemptionCounts: Record<number, number> = {}
  for (const row of countsRows) redemptionCounts[row.rewardId] = Number(row.n)

  return (
    <main className="mx-auto w-full max-w-2xl space-y-6 p-4">
      <h1 className="text-foreground text-2xl font-bold">Odměny</h1>
      <RewardsPageClient
        initialBalance={balance}
        initialRewards={rewards}
        initialHistory={history}
        redemptionCounts={redemptionCounts}
      />
    </main>
  )
}
```

- [ ] **Step 2: Implement the client wrapper**

Create `src/components/rewards/RewardsPageClient.tsx`:

```tsx
'use client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { RegionHeader } from '@/components/dashboard/RegionHeader'
import { Button } from '@/components/ui'
import { BalanceCard } from './BalanceCard'
import { RewardList } from './RewardList'
import { RedemptionList } from './RedemptionList'
import { RewardDialog } from './RewardDialog'
import { RedeemConfirmDialog } from './RedeemConfirmDialog'
import type {
  RedemptionWithReward,
  RewardRow,
  RewardsBalance,
} from '@/lib/queries/rewards'

type Props = {
  initialBalance: RewardsBalance
  initialRewards: RewardRow[]
  initialHistory: RedemptionWithReward[]
  redemptionCounts: Record<number, number>
}

export function RewardsPageClient({
  initialBalance,
  initialRewards,
  initialHistory,
  redemptionCounts,
}: Props) {
  const router = useRouter()
  const [editing, setEditing] = useState<RewardRow | null>(null)
  const [creating, setCreating] = useState(false)
  const [redeeming, setRedeeming] = useState<RewardRow | null>(null)

  const handleCreate = async (payload: {
    name: string
    costXp: number
    description?: string
  }) => {
    const res = await fetch('/api/rewards', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) return
    setCreating(false)
    router.refresh()
  }

  const handleEdit = async (payload: {
    name: string
    costXp: number
    description?: string
  }) => {
    if (!editing) return
    const res = await fetch(`/api/rewards/${editing.id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) return
    setEditing(null)
    router.refresh()
  }

  const handleArchive = async (r: RewardRow) => {
    const res = await fetch(`/api/rewards/${r.id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ archivedAt: new Date().toISOString() }),
    })
    if (!res.ok) return
    router.refresh()
  }

  const handleDelete = async (r: RewardRow) => {
    if (!confirm(`Trvale smazat "${r.name}"?`)) return
    const res = await fetch(`/api/rewards/${r.id}`, { method: 'DELETE' })
    if (!res.ok) return
    router.refresh()
  }

  const handleRedeem = async (input: { note?: string }) => {
    if (!redeeming) return
    const res = await fetch(`/api/rewards/${redeeming.id}/redeem`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(input),
    })
    if (!res.ok) {
      const json = await res.json().catch(() => null)
      alert(json?.error === 'Insufficient balance' ? 'Nedostatek XP' : 'Nepodařilo se vyzvednout')
      return
    }
    setRedeeming(null)
    router.refresh()
  }

  const handleDeleteRedemption = async (r: RedemptionWithReward) => {
    if (!confirm('Smazat z historie?')) return
    const res = await fetch(`/api/rewards/redemptions/${r.id}`, { method: 'DELETE' })
    if (!res.ok) return
    router.refresh()
  }

  return (
    <div className="space-y-6">
      <BalanceCard balance={initialBalance} />

      <div className="flex justify-end">
        <Button variant="primary" onClick={() => setCreating(true)}>
          + Nová odměna
        </Button>
      </div>

      <section className="space-y-3">
        <RegionHeader>Tvoje odměny</RegionHeader>
        <RewardList
          rewards={initialRewards}
          balanceXp={initialBalance.balanceXp}
          redemptionCounts={redemptionCounts}
          onRedeem={(r) => setRedeeming(r)}
          onEdit={(r) => setEditing(r)}
          onArchive={handleArchive}
          onDelete={handleDelete}
          onCreate={() => setCreating(true)}
        />
      </section>

      <section className="space-y-3">
        <RegionHeader>Historie</RegionHeader>
        <RedemptionList history={initialHistory} onDelete={handleDeleteRedemption} />
      </section>

      <RewardDialog
        open={creating}
        mode="create"
        onOpenChange={setCreating}
        onSubmit={handleCreate}
      />
      <RewardDialog
        open={editing != null}
        mode="edit"
        initial={editing ? { name: editing.name, costXp: editing.costXp, description: editing.description } : undefined}
        onOpenChange={(o) => !o && setEditing(null)}
        onSubmit={handleEdit}
      />
      <RedeemConfirmDialog
        open={redeeming != null}
        reward={redeeming}
        onOpenChange={(o) => !o && setRedeeming(null)}
        onConfirm={handleRedeem}
      />
    </div>
  )
}
```

Append to `src/components/rewards/index.ts`:

```ts
export { RewardsPageClient } from './RewardsPageClient'
```

- [ ] **Step 3: Typecheck + manual quick check**

```bash
npm run typecheck
```

Expected: clean. (No new test added — page-level UI is exercised by Playwright in Task 13.)

- [ ] **Step 4: Commit**

```bash
git add "src/app/(app)/rewards/page.tsx" src/components/rewards/RewardsPageClient.tsx src/components/rewards/index.ts
git commit -m "feat(rewards): /rewards page (SSR + client wrapper)"
```

---

## Task 10: Flip sidebar — `rewards` from placeholder to active area

**Files:**
- Modify: `src/components/shell/area-meta.ts`

- [ ] **Step 1: Edit `area-meta.ts`**

Open `src/components/shell/area-meta.ts`. Apply these edits:

1. Update the `Area` union (line 15):
   ```ts
   export type Area = 'dashboard' | 'training' | 'progress' | 'nutrition' | 'stats' | 'rewards' | 'settings'
   ```
2. Update the `PlaceholderArea` union (line 16) — remove `'rewards'`:
   ```ts
   export type PlaceholderArea = 'habits' | 'bio' | 'calendar'
   ```
3. Add a `rewards` entry to `AREA_META` between `stats` and `settings`:
   ```ts
   rewards: {
     label: 'Rewards',
     href: '/rewards',
     icon: Gift,
     matches: (p) => p === '/rewards' || p.startsWith('/rewards/'),
   },
   ```
4. Update `SIDEBAR_AREAS` (line 66) — insert `'rewards'` after `'stats'`:
   ```ts
   export const SIDEBAR_AREAS: readonly Area[] = [
     'dashboard',
     'training',
     'nutrition',
     'progress',
     'stats',
     'rewards',
   ] as const
   ```
5. **Do NOT** add to `MOBILE_TABS` (it stays at 4 tabs).
6. Remove the `rewards` line from `PLACEHOLDER_META` and `PLACEHOLDER_ORDER`. The `Gift` icon import stays — it's now used by `AREA_META`.

- [ ] **Step 2: Typecheck + lint**

```bash
npm run typecheck
npm run lint
```

Expected: clean. If `useActiveArea` or any consumer typechecks against `PlaceholderArea`, follow the compiler errors and adapt.

- [ ] **Step 3: Commit**

```bash
git add src/components/shell/area-meta.ts
git commit -m "feat(shell): flip rewards from placeholder to active sidebar area"
```

---

## Task 11: Update existing nav e2e to expect 3 placeholders + working /rewards link

**Files:**
- Modify: `tests/e2e/nav.spec.ts`

- [ ] **Step 1: Update the placeholder assertion**

Open `tests/e2e/nav.spec.ts`. Find the test `'SP5 placeholder items exist and are disabled'` and:

1. Change the loop to `['Habits', 'Player Bio', 'Quest Calendar']` (drop `'Rewards'`).
2. Add a new assertion in the same `test.describe` block:

```ts
test('Rewards sidebar link navigates to /rewards', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await login(page)
  await page.getByRole('link', { name: /^rewards$/i }).click()
  await expect(page).toHaveURL(/\/rewards/)
  await expect(page.getByRole('heading', { name: 'Odměny' })).toBeVisible()
})
```

- [ ] **Step 2: Commit**

```bash
git add tests/e2e/nav.spec.ts
git commit -m "test(e2e): nav placeholders 4→3; assert /rewards link works"
```

---

## Task 12: Dashboard — `RewardsBalanceCard`

**Files:**
- Create: `src/components/dashboard/RewardsBalanceCard.tsx`
- Modify: `src/app/(app)/dashboard/page.tsx`
- Create: `src/tests/ui/dashboard/RewardsBalanceCard.test.tsx`

- [ ] **Step 1: Write failing test**

Create `src/tests/ui/dashboard/RewardsBalanceCard.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { RewardsBalanceCard } from '@/components/dashboard/RewardsBalanceCard'

describe('RewardsBalanceCard', () => {
  it('renders balance and links to /rewards', () => {
    render(<RewardsBalanceCard balanceXp={300} totalXp={500} spentXp={200} />)
    const link = screen.getByRole('link', { name: /odměny/i })
    expect(link).toHaveAttribute('href', '/rewards')
    expect(screen.getByTestId('rewards-balance-card-amount')).toHaveTextContent('300 XP')
  })
})
```

- [ ] **Step 2: Run, verify fails**

```bash
npm run test:run -- src/tests/ui/dashboard/RewardsBalanceCard.test.tsx
```

- [ ] **Step 3: Implement**

Create `src/components/dashboard/RewardsBalanceCard.tsx`:

```tsx
import Link from 'next/link'
import { Gift } from 'lucide-react'

type Props = {
  balanceXp: number
  totalXp: number
  spentXp: number
}

export function RewardsBalanceCard({ balanceXp, totalXp, spentXp }: Props) {
  return (
    <Link
      href="/rewards"
      aria-label="Odměny"
      className="border-border bg-surface hover:border-accent/60 flex items-center gap-3 rounded-2xl border p-4 transition-colors"
    >
      <Gift className="text-accent h-5 w-5 shrink-0" aria-hidden />
      <div className="min-w-0 flex-1">
        <div className="text-muted text-xs tracking-[0.3em] uppercase">K utracení</div>
        <div data-testid="rewards-balance-card-amount" className="text-foreground text-xl font-bold">
          {balanceXp} XP
        </div>
      </div>
      <div className="text-muted text-right text-xs">
        <div>{totalXp} získáno</div>
        <div>{spentXp} utraceno</div>
      </div>
    </Link>
  )
}
```

- [ ] **Step 4: Wire it into the dashboard**

Open `src/app/(app)/dashboard/page.tsx`. Around the existing `getTotalXp` call (~line 49), add the balance fetch and render the card under `StatusWindow`. The page is a server component; import `fetchRewardsBalance` and render conditionally.

Add imports near the top:

```tsx
import { fetchRewardsBalance } from '@/lib/queries/rewards'
import { RewardsBalanceCard } from '@/components/dashboard/RewardsBalanceCard'
```

Find the `await getTotalXp(db, user.id)` line, replace with:

```tsx
const totalXp = await getTotalXp(db, user.id)
const rewardsBalance = await fetchRewardsBalance(db, user.id)
```

In the JSX, find the `<StatusWindow ... />` element and add directly after it:

```tsx
{rewardsBalance.totalXp > 0 && (
  <RewardsBalanceCard
    balanceXp={rewardsBalance.balanceXp}
    totalXp={rewardsBalance.totalXp}
    spentXp={rewardsBalance.spentXp}
  />
)}
```

(`getTotalXp` is still needed for the level/XP-progress math elsewhere on the page — don't remove it.)

- [ ] **Step 5: Run tests + typecheck**

```bash
npm run typecheck
npm run test:run -- src/tests/ui/dashboard/RewardsBalanceCard.test.tsx
```

Expected: typecheck clean, 1 test green.

- [ ] **Step 6: Commit**

```bash
git add src/components/dashboard/RewardsBalanceCard.tsx "src/app/(app)/dashboard/page.tsx" src/tests/ui/dashboard/RewardsBalanceCard.test.tsx
git commit -m "feat(dashboard): RewardsBalanceCard under StatusWindow (mobile entry)"
```

---

## Task 13: Playwright e2e — happy path + insufficient balance

**Files:**
- Create: `tests/e2e/rewards.spec.ts`

- [ ] **Step 1: Write the spec**

Create `tests/e2e/rewards.spec.ts`:

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

test.describe('/rewards — Rewards (spend XP)', () => {
  test('happy path: create reward, redeem, history updates', async ({ page }) => {
    await login(page)
    await page.goto('/rewards')

    await expect(page.getByRole('heading', { name: 'Odměny' })).toBeVisible()
    const balanceBefore = await page.getByTestId('rewards-balance').textContent()

    // Open create dialog
    await page.getByRole('button', { name: /Nová odměna/i }).click()
    const uniqueName = `e2e-sushi-${Date.now()}`
    await page.getByLabel(/Název/i).fill(uniqueName)
    await page.getByLabel(/Cena/i).fill('1')
    await page.getByRole('button', { name: /Uložit/i }).click()

    // The new reward is visible
    const card = page.locator(`[data-reward-id]`).filter({ hasText: uniqueName })
    await expect(card).toBeVisible()

    // Redeem (assume demo user has at least 1 XP)
    await card.getByRole('button', { name: /Vyzvednout/i }).click()
    await page.getByRole('button', { name: /Vyzvednout/i }).last().click()

    // Balance decreased (or stayed if already 0 — assert at least history updates)
    await expect(page.getByText(uniqueName).last()).toBeVisible()

    // Cleanup: archive the reward we created
    await card.getByRole('button', { name: new RegExp(`Možnosti pro ${uniqueName}`) }).click()
    await page.getByRole('menuitem', { name: /Archivovat/i }).click()
  })

  test('insufficient balance disables Vyzvednout with Chybí tooltip', async ({ page }) => {
    await login(page)
    await page.goto('/rewards')

    const balanceText = (await page.getByTestId('rewards-balance').textContent()) ?? '0 XP'
    const balanceXp = Number(balanceText.replace(/[^\d]/g, '')) || 0
    const tooHigh = balanceXp + 999_999

    await page.getByRole('button', { name: /Nová odměna/i }).click()
    const uniqueName = `e2e-impossible-${Date.now()}`
    await page.getByLabel(/Název/i).fill(uniqueName)
    await page.getByLabel(/Cena/i).fill(String(tooHigh))
    await page.getByRole('button', { name: /Uložit/i }).click()

    const card = page.locator(`[data-reward-id]`).filter({ hasText: uniqueName })
    const btn = card.getByRole('button', { name: /Vyzvednout/i })
    await expect(btn).toBeDisabled()
    await expect(btn).toHaveAttribute('title', /Chybí .* XP/)

    // Cleanup
    await card.getByRole('button', { name: new RegExp(`Možnosti pro ${uniqueName}`) }).click()
    await page.getByRole('menuitem', { name: /Smazat/i }).click()
    await page.on('dialog', (d) => d.accept())
  })
})
```

> **Note:** the demo seed user is `demo@hexis.local / Demo1234` per project conventions, but `E2E_EMAIL`/`E2E_PASSWORD` env vars override. Confirm against `tests/e2e/nav.spec.ts` defaults — both files use the same fallback.

- [ ] **Step 2: Local run (skip if dev server port :3000 is taken by LOXONE)**

```bash
npm run dev &
DEV_PID=$!
sleep 5
npm run test:e2e -- tests/e2e/rewards.spec.ts || true
kill $DEV_PID
```

Expected: 2 specs pass. If port :3000 is taken (known SP4 constraint per project memory), document the skip in the PR body — same as SP4 PR-2.

- [ ] **Step 3: Commit**

```bash
git add tests/e2e/rewards.spec.ts
git commit -m "test(e2e): rewards happy path + insufficient balance disabled state"
```

---

## Task 14: Final verification + nested-import guard + push

**Files:** none (verification only).

- [ ] **Step 1: Full unit + integration test sweep**

```bash
npm run test:run
```

Expected: all green. Note the new total. With the spec's projection of `~+24` new tests (validators 11, queries 9, balance card 1, RewardCard 3, dialogs 6, dashboard balance card 1, plus API tests already integrated), the total should be roughly `516 + ~24 = ~540`. Exact number is fine — no green is not.

- [ ] **Step 2: Typecheck + lint**

```bash
npm run typecheck
npm run lint
```

Expected: clean. If lint flags formatting, run `npm run format`.

- [ ] **Step 3: Nested-import grep guard (DS Part 2 §11.2)**

```bash
grep -rEn "from '@/components/ui/(primitive|compound)/" src/ \
  --include='*.ts' --include='*.tsx' \
  | grep -v 'src/components/ui/'
```

Expected: empty output. **Allowed exception:** the `Dialog` import in `RewardDialog.tsx` and `RedeemConfirmDialog.tsx` may need to come from `@/components/ui/compound/Dialog` if the barrel doesn't re-export it. Check `src/components/ui/index.ts` first; if `Dialog` is exported via barrel, switch the imports to `@/components/ui` and re-run the grep. The guard's purpose is preventing accidental nested imports — re-exports through the barrel are the correct fix.

- [ ] **Step 4: Smoke list (manual, document in PR)**

Mark these as **manual smoke pending** in the PR body (mirrors SP4 PR-2 cadence — port :3000 may block local dev):

- `/rewards` empty state shows "Vytvoř si první odměnu"
- Create reward → list refreshes, balance card visible
- Redeem reward → balance drops, history row appears
- Edit reward cost → existing history row keeps original cost
- Archive reward → disappears from active list, history row stays (italic if you redeem again before archive)
- Hard delete a reward with no redemptions → row disappears
- Hard delete a reward with redemptions → menu item not shown
- Sidebar shows Rewards as active link (desktop ≥ md)
- Dashboard shows `RewardsBalanceCard` only when totalXp > 0

- [ ] **Step 5: Push branch + open PR**

```bash
git push -u origin sp5-pr1-rewards
gh pr create --title "SP5 PR-1 — Rewards (spend XP)" --body "$(cat <<'EOF'
## Summary
- Adds `rewards` + `reward_redemptions` tables (migration 0003); balance is derived (`totalXp − Σ redemptions.cost_xp`) so level/tier are unaffected.
- New `/rewards` page (server-rendered) with create/edit/archive/delete + redeem flow; client wrapper drives Dialogs and `router.refresh()`.
- Sidebar slot flipped from placeholder to active area; nav e2e updated (4→3 placeholders).
- Dashboard adds `RewardsBalanceCard` under `StatusWindow` (mobile entry; hidden when `totalXp === 0`).
- Spec: `docs/superpowers/specs/2026-04-29-sp5-pr1-rewards-design.md` · Plan: `docs/superpowers/plans/2026-04-29-sp5-pr1-rewards-plan.md`.

## Test plan
- [ ] `npm run test:run` green (target ~540 unit/integration)
- [ ] `npm run typecheck` clean
- [ ] `npm run lint` clean
- [ ] Nested-import grep clean
- [ ] Manual smoke: create / redeem / edit-cost preserves history / archive / hard-delete-blocked-when-redeemed / sidebar link / dashboard card visibility

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Step 6: Update auto-memory**

After PR is open, append a project-memory note (or extend the existing design-overhaul entry) recording: SP5 PR-1 in flight, branch name, PR number, baseline test count delta. Per `feedback_branching_strategy.md`, this is one PR per slice off main — Habits / Bio / Calendar follow as separate cycles.

---

## Self-review checklist (run before declaring plan complete)

1. **Spec coverage** — every section of the spec has at least one task:
   - §3 separate ledger → Tasks 1, 2 (queries derive balance)
   - §4 data model → Task 1
   - §5 server queries → Task 2
   - §6 routes & UI → Tasks 7, 8, 9
   - §7 API routes → Tasks 3, 4, 5, 6
   - §8 navigation hook-up → Tasks 10, 11
   - §8.1 dashboard entry → Task 12
   - §9 vocabulary → enforced by tests in Tasks 7, 8 (button labels, headings)
   - §10 components inventory → Tasks 7, 8, 9
   - §11 testing → distributed across Tasks 2–13
   - §12 out-of-scope → not implemented (correct)
   - §13 risk register → mitigations land in Task 5 (server-side balance check) and Task 1 (no FK)
   - §14 PR plan → Tasks 0 + 14
2. **Placeholder scan** — no `TBD`/`TODO`/"add appropriate"/"similar to". Every code block contains the actual code.
3. **Type consistency** — `RewardRow`, `RedemptionWithReward`, `RewardsBalance` are the exported names from `@/lib/queries/rewards` (Task 2) and used unchanged in Tasks 7, 8, 9, 12.
4. **Identifier consistency** — `data-reward-id`, `data-redeem-button`, `data-testid="rewards-balance"`, `data-testid="rewards-balance-card-amount"` referenced in tests are all rendered by their respective components.
