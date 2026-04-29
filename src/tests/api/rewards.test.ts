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
  requireOwnership: async <T extends { userId: string }>(
    rowPromise: Promise<T | undefined>,
    userId: string
  ): Promise<T | Response> => {
    const row = await rowPromise
    if (!row || row.userId !== userId) {
      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: { 'content-type': 'application/json' },
      })
    }
    return row
  },
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
      userId: 'someone_else_0000000000001',
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
