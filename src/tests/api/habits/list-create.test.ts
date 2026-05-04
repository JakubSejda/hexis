import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest'
import { db } from '@/db/client'
import { users, habits, habitCompletions } from '@/db/schema'
import { eq, like } from 'drizzle-orm'
import { GET, POST } from '@/app/api/habits/route'

const PREFIX = 'hbapi_'
const USER = 'hbapi_user000000000001'

vi.mock('@/lib/auth-helpers', () => ({
  getSessionUser: vi
    .fn()
    .mockResolvedValue({ id: 'hbapi_user000000000001', email: 't@t', name: 'T' }),
  requireSessionUser: vi
    .fn()
    .mockResolvedValue({ id: 'hbapi_user000000000001', email: 't@t', name: 'T' }),
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
    email: `${PREFIX}u@hexis.local`,
    name: 'API Test',
    passwordHash: 'x',
  })
})

afterAll(async () => {
  await db.delete(habitCompletions).where(eq(habitCompletions.userId, USER))
  await db.delete(habits).where(eq(habits.userId, USER))
  await db.delete(users).where(like(users.id, `${PREFIX}%`))
})

beforeEach(async () => {
  await db.delete(habitCompletions).where(eq(habitCompletions.userId, USER))
  await db.delete(habits).where(eq(habits.userId, USER))
})

function req(opts: { method: string; body?: unknown; tzOffset?: string }) {
  const headers = new Headers({ 'content-type': 'application/json' })
  if (opts.tzOffset) headers.set('X-User-Tz-Offset', opts.tzOffset)
  return new Request('http://test/api/habits', {
    method: opts.method,
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  })
}

describe('GET /api/habits', () => {
  it('returns empty list for new user', async () => {
    const res = await GET(req({ method: 'GET' }))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.habits).toEqual([])
  })

  it('returns active habits with derived streak fields', async () => {
    await db.insert(habits).values({
      userId: USER,
      name: 'Voda',
      cadence: 'daily',
      weight: 'standard',
    })
    const res = await GET(req({ method: 'GET' }))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.habits).toHaveLength(1)
    expect(json.habits[0]).toMatchObject({
      name: 'Voda',
      cadence: 'daily',
      weight: 'standard',
      currentStreak: 0,
      completedToday: false,
    })
  })
})

describe('POST /api/habits', () => {
  it('creates a daily habit', async () => {
    const res = await POST(
      req({
        method: 'POST',
        body: { name: 'Voda', cadence: 'daily', weight: 'standard' },
      })
    )
    expect(res.status).toBe(201)
    const json = await res.json()
    expect(json.habit).toMatchObject({
      name: 'Voda',
      cadence: 'daily',
      weeklyTarget: null,
      weight: 'standard',
    })
  })

  it('creates a weekly habit', async () => {
    const res = await POST(
      req({
        method: 'POST',
        body: { name: 'Meditace', cadence: 'weekly', weeklyTarget: 3, weight: 'light' },
      })
    )
    expect(res.status).toBe(201)
    const json = await res.json()
    expect(json.habit).toMatchObject({
      name: 'Meditace',
      cadence: 'weekly',
      weeklyTarget: 3,
      weight: 'light',
    })
  })

  it('rejects duplicate name (case-insensitive) on the same user', async () => {
    await db.insert(habits).values({
      userId: USER,
      name: 'Voda',
      cadence: 'daily',
      weight: 'standard',
    })
    const res = await POST(
      req({
        method: 'POST',
        body: { name: 'voda', cadence: 'daily', weight: 'standard' },
      })
    )
    expect(res.status).toBe(409)
  })

  it('allows duplicate name if the existing one is archived', async () => {
    await db.insert(habits).values({
      userId: USER,
      name: 'Voda',
      cadence: 'daily',
      weight: 'standard',
      archivedAt: new Date(),
    })
    const res = await POST(
      req({
        method: 'POST',
        body: { name: 'Voda', cadence: 'daily', weight: 'standard' },
      })
    )
    expect(res.status).toBe(201)
  })

  it('rejects body that fails validation', async () => {
    const res = await POST(
      req({
        method: 'POST',
        body: { name: '', cadence: 'daily' },
      })
    )
    expect(res.status).toBe(400)
  })

  it('rejects daily habit with weeklyTarget', async () => {
    const res = await POST(
      req({
        method: 'POST',
        body: { name: 'X', cadence: 'daily', weeklyTarget: 3 },
      })
    )
    expect(res.status).toBe(400)
  })
})
