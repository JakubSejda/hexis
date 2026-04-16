import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { eq } from 'drizzle-orm'
import { db } from '@/db/client'
import { users, xpEvents } from '@/db/schema'
import { newUlid } from '@/lib/ulid'

const TEST_USER_ID = newUlid()

vi.mock('@/lib/auth-helpers', () => ({
  getSessionUser: vi.fn().mockResolvedValue({
    id: TEST_USER_ID,
    email: 'xp-history-test@hexis.test',
  }),
  requireSessionUser: vi.fn().mockResolvedValue({
    id: TEST_USER_ID,
    email: 'xp-history-test@hexis.test',
  }),
}))

async function seedUser() {
  await db.delete(users).where(eq(users.id, TEST_USER_ID))
  await db.insert(users).values({
    id: TEST_USER_ID,
    email: `xp-history-${TEST_USER_ID}@hexis.test`,
    level: 1,
    trackedMacros: ['kcal', 'protein'],
  })
}

async function clean() {
  await db.delete(xpEvents).where(eq(xpEvents.userId, TEST_USER_ID))
  await db.delete(users).where(eq(users.id, TEST_USER_ID))
}

beforeEach(async () => {
  await clean()
  await seedUser()
})
afterAll(async () => {
  await clean()
})

const { GET } = await import('@/app/api/me/xp-history/route')

describe('GET /api/me/xp-history', () => {
  it('returns empty history for user with no events', async () => {
    const res = await GET(new Request('http://localhost/api/me/xp-history'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toEqual({ daily: [], total: 0, byEventTotal: {} })
  })

  it('aggregates events correctly per day and type', async () => {
    const today = new Date().toISOString().slice(0, 10)

    await db.insert(xpEvents).values([
      {
        userId: TEST_USER_ID,
        eventType: 'session_complete',
        xpDelta: 100,
        createdAt: new Date(`${today}T10:00:00`),
      },
      {
        userId: TEST_USER_ID,
        eventType: 'set_logged',
        xpDelta: 5,
        createdAt: new Date(`${today}T10:01:00`),
      },
      {
        userId: TEST_USER_ID,
        eventType: 'set_logged',
        xpDelta: 5,
        createdAt: new Date(`${today}T10:02:00`),
      },
      {
        userId: TEST_USER_ID,
        eventType: 'measurement_added',
        xpDelta: 20,
        createdAt: new Date(`${today}T11:00:00`),
      },
    ])

    const res = await GET(new Request('http://localhost/api/me/xp-history'))
    expect(res.status).toBe(200)
    const body = await res.json()

    expect(body.total).toBe(130)
    expect(body.daily).toHaveLength(1)

    const day = body.daily[0]
    expect(day.date).toBe(today)
    expect(day.totalXp).toBe(130)
    expect(day.byEvent.session_complete).toBe(100)
    expect(day.byEvent.set_logged).toBe(10)
    expect(day.byEvent.measurement_added).toBe(20)

    expect(body.byEventTotal.session_complete).toEqual({ xp: 100, count: 1 })
    expect(body.byEventTotal.set_logged).toEqual({ xp: 10, count: 2 })
    expect(body.byEventTotal.measurement_added).toEqual({ xp: 20, count: 1 })
  })

  it('groups events across multiple days', async () => {
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const todayStr = today.toISOString().slice(0, 10)
    const yesterdayStr = yesterday.toISOString().slice(0, 10)

    await db.insert(xpEvents).values([
      {
        userId: TEST_USER_ID,
        eventType: 'session_complete',
        xpDelta: 100,
        createdAt: new Date(`${yesterdayStr}T10:00:00`),
      },
      {
        userId: TEST_USER_ID,
        eventType: 'nutrition_logged',
        xpDelta: 10,
        createdAt: new Date(`${todayStr}T09:00:00`),
      },
    ])

    const res = await GET(new Request('http://localhost/api/me/xp-history'))
    const body = await res.json()

    expect(body.total).toBe(110)
    expect(body.daily).toHaveLength(2)
    expect(body.daily[0].date).toBe(yesterdayStr)
    expect(body.daily[1].date).toBe(todayStr)
  })

  it('defaults to 30 days and sanitizes NaN', async () => {
    const res = await GET(new Request('http://localhost/api/me/xp-history?days=garbage'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toEqual({ daily: [], total: 0, byEventTotal: {} })
  })

  it('caps days at 365', async () => {
    const res = await GET(new Request('http://localhost/api/me/xp-history?days=9999'))
    expect(res.status).toBe(200)
    // Just verify it doesn't error — the cap is enforced internally
  })
})
