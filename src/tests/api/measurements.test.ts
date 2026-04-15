import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { eq } from 'drizzle-orm'
import { db } from '@/db/client'
import { measurements, users, xpEvents } from '@/db/schema'
import { newUlid } from '@/lib/ulid'

const TEST_USER_ID = newUlid()

vi.mock('@/lib/auth-helpers', () => ({
  getSessionUser: vi.fn().mockResolvedValue({
    id: TEST_USER_ID,
    email: 'm3-test@hexis.test',
  }),
}))

async function seedUser() {
  await db.delete(users).where(eq(users.id, TEST_USER_ID))
  await db.insert(users).values({
    id: TEST_USER_ID,
    email: `m3-test-${TEST_USER_ID}@hexis.test`,
    level: 1,
    trackedMacros: ['kcal', 'protein'],
  })
}

async function clean() {
  await db.delete(xpEvents).where(eq(xpEvents.userId, TEST_USER_ID))
  await db.delete(measurements).where(eq(measurements.userId, TEST_USER_ID))
  await db.delete(users).where(eq(users.id, TEST_USER_ID))
}

beforeEach(async () => {
  await clean()
  await seedUser()
})
afterAll(async () => {
  await clean()
})

const { GET, PUT } = await import('@/app/api/measurements/route')

describe('GET /api/measurements', () => {
  it('returns empty list for new user', async () => {
    const res = await GET(new Request('http://localhost/api/measurements'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.items).toEqual([])
  })

  it('returns measurements within default 8-week window', async () => {
    await db.insert(measurements).values({
      userId: TEST_USER_ID,
      weekStart: '2026-04-13',
      weightKg: '67.5',
    })
    const res = await GET(new Request('http://localhost/api/measurements'))
    const body = await res.json()
    expect(body.items.some((i: { weekStart: string }) => i.weekStart === '2026-04-13')).toBe(true)
  })
})

describe('PUT /api/measurements', () => {
  it('inserts a new week and awards 20 XP', async () => {
    const res = await PUT(
      new Request('http://localhost/api/measurements', {
        method: 'PUT',
        body: JSON.stringify({ weekStart: '2026-04-13', weightKg: 67.5 }),
        headers: { 'content-type': 'application/json' },
      })
    )
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.id).toBeGreaterThan(0)
    expect(body.xpDelta).toBe(20)
    const xp = await db.select().from(xpEvents).where(eq(xpEvents.userId, TEST_USER_ID))
    expect(xp).toHaveLength(1)
    expect(xp[0]!.eventType).toBe('measurement_added')
    expect(xp[0]!.xpDelta).toBe(20)
  })

  it('updates existing week without awarding XP', async () => {
    await PUT(
      new Request('http://localhost/api/measurements', {
        method: 'PUT',
        body: JSON.stringify({ weekStart: '2026-04-13', weightKg: 67.5 }),
        headers: { 'content-type': 'application/json' },
      })
    )
    const res = await PUT(
      new Request('http://localhost/api/measurements', {
        method: 'PUT',
        body: JSON.stringify({ weekStart: '2026-04-13', weightKg: 67.4 }),
        headers: { 'content-type': 'application/json' },
      })
    )
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.xpDelta).toBe(0)
  })

  it('rejects non-Monday weekStart', async () => {
    const res = await PUT(
      new Request('http://localhost/api/measurements', {
        method: 'PUT',
        body: JSON.stringify({ weekStart: '2026-04-15', weightKg: 67.5 }),
        headers: { 'content-type': 'application/json' },
      })
    )
    expect(res.status).toBe(400)
  })
})
