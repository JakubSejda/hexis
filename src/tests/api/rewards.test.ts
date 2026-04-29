import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest'
import { db } from '@/db/client'
import { users, xpEvents, rewards, rewardRedemptions } from '@/db/schema'
import { eq, like } from 'drizzle-orm'

const PREFIX = 'rwapi_'
const USER = `${PREFIX}user000000000001`

vi.mock('@/lib/auth-helpers', () => ({
  getSessionUser: vi.fn().mockResolvedValue({ id: USER, email: `${USER}@hexis.local`, name: 'X' }),
  requireSessionUser: vi
    .fn()
    .mockResolvedValue({ id: USER, email: `${USER}@hexis.local`, name: 'X' }),
}))

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
