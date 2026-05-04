import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest'
import { db } from '@/db/client'
import { users, habits, habitCompletions, xpEvents } from '@/db/schema'
import { eq, like } from 'drizzle-orm'
import { POST, DELETE } from '@/app/api/habits/[id]/check/route'

const PREFIX = 'hbck_'
const USER = 'hbck_user000000000001'

vi.mock('@/lib/auth-helpers', () => ({
  getSessionUser: vi
    .fn()
    .mockResolvedValue({ id: 'hbck_user000000000001', email: 't@t', name: 'T' }),
  requireSessionUser: vi
    .fn()
    .mockResolvedValue({ id: 'hbck_user000000000001', email: 't@t', name: 'T' }),
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

const TODAY = '2026-04-29'

beforeAll(async () => {
  vi.setSystemTime(new Date(`${TODAY}T12:00:00Z`))
  await db.insert(users).values({
    id: USER,
    email: `${PREFIX}u@hexis.local`,
    name: 'Check',
    passwordHash: 'x',
  })
})

afterAll(async () => {
  vi.useRealTimers()
  await db.delete(xpEvents).where(eq(xpEvents.userId, USER))
  await db.delete(habitCompletions).where(eq(habitCompletions.userId, USER))
  await db.delete(habits).where(eq(habits.userId, USER))
  await db.delete(users).where(like(users.id, `${PREFIX}%`))
})

beforeEach(async () => {
  await db.delete(xpEvents).where(eq(xpEvents.userId, USER))
  await db.delete(habitCompletions).where(eq(habitCompletions.userId, USER))
  await db.delete(habits).where(eq(habits.userId, USER))
})

function postReq(body: unknown, tz?: string) {
  const headers = new Headers({ 'content-type': 'application/json' })
  if (tz) headers.set('X-User-Tz-Offset', tz)
  return new Request('http://test', { method: 'POST', headers, body: JSON.stringify(body) })
}

function delReq(date: string) {
  return new Request(`http://test?date=${date}`, { method: 'DELETE' })
}

async function makeDailyHabit(weight: 'light' | 'standard' | 'heavy' = 'standard') {
  const [h] = await db.insert(habits).values({
    userId: USER,
    name: 'Voda',
    cadence: 'daily',
    weight,
  })
  return h.insertId
}

async function seedCompletions(habitId: number, dates: string[]) {
  await db
    .insert(habitCompletions)
    .values(dates.map((d) => ({ habitId, userId: USER, completedOn: d })))
}

describe('POST /api/habits/[id]/check', () => {
  it('inserts a completion and returns streak=1 for first check', async () => {
    const id = await makeDailyHabit()
    const res = await POST(postReq({ date: TODAY }), {
      params: Promise.resolve({ id: String(id) }),
    })
    expect(res.status).toBe(201)
    const json = await res.json()
    expect(json.streak).toBe(1)
    expect(json.milestoneAwardedXp).toBeUndefined()
  })

  it('is idempotent on the same date (returns existing, streak unchanged)', async () => {
    const id = await makeDailyHabit()
    await POST(postReq({ date: TODAY }), { params: Promise.resolve({ id: String(id) }) })
    const res2 = await POST(postReq({ date: TODAY }), {
      params: Promise.resolve({ id: String(id) }),
    })
    expect(res2.status).toBe(201)
    const rows = await db.select().from(habitCompletions).where(eq(habitCompletions.habitId, id))
    expect(rows).toHaveLength(1)
  })

  it('emits milestone xp_event when crossing 7-day streak (standard weight = +50)', async () => {
    const id = await makeDailyHabit('standard')
    await seedCompletions(id, [
      '2026-04-23',
      '2026-04-24',
      '2026-04-25',
      '2026-04-26',
      '2026-04-27',
      '2026-04-28',
    ])
    const res = await POST(postReq({ date: TODAY }), {
      params: Promise.resolve({ id: String(id) }),
    })
    expect(res.status).toBe(201)
    const json = await res.json()
    expect(json.streak).toBe(7)
    expect(json.milestoneAwardedXp).toBe(50)
    const xp = await db.select().from(xpEvents).where(eq(xpEvents.userId, USER))
    expect(xp).toHaveLength(1)
    expect(xp[0]?.eventType).toBe('habit_streak')
    expect(xp[0]?.xpDelta).toBe(50)
    expect(xp[0]?.meta).toMatchObject({ habitId: id, milestone: 7, weight: 'standard' })
  })

  it('emits weighted XP for heavy weight (×2)', async () => {
    const id = await makeDailyHabit('heavy')
    await seedCompletions(id, [
      '2026-04-23',
      '2026-04-24',
      '2026-04-25',
      '2026-04-26',
      '2026-04-27',
      '2026-04-28',
    ])
    const res = await POST(postReq({ date: TODAY }), {
      params: Promise.resolve({ id: String(id) }),
    })
    const json = await res.json()
    expect(json.milestoneAwardedXp).toBe(100)
  })

  it('does not emit milestone twice for the same habit + threshold', async () => {
    const id = await makeDailyHabit()
    await seedCompletions(id, [
      '2026-04-23',
      '2026-04-24',
      '2026-04-25',
      '2026-04-26',
      '2026-04-27',
      '2026-04-28',
    ])
    const res1 = await POST(postReq({ date: TODAY }), {
      params: Promise.resolve({ id: String(id) }),
    })
    expect((await res1.json()).milestoneAwardedXp).toBe(50)
    await DELETE(delReq(TODAY), { params: Promise.resolve({ id: String(id) }) })
    const res2 = await POST(postReq({ date: TODAY }), {
      params: Promise.resolve({ id: String(id) }),
    })
    const json2 = await res2.json()
    expect(json2.streak).toBe(7)
    expect(json2.milestoneAwardedXp).toBeUndefined()
    const xp = await db.select().from(xpEvents).where(eq(xpEvents.userId, USER))
    expect(xp).toHaveLength(1)
  })

  it('rejects future date', async () => {
    const id = await makeDailyHabit()
    const res = await POST(postReq({ date: '2030-01-01' }), {
      params: Promise.resolve({ id: String(id) }),
    })
    expect(res.status).toBe(400)
  })

  it('returns 404 for non-existent habit', async () => {
    const res = await POST(postReq({ date: TODAY }), {
      params: Promise.resolve({ id: '999999' }),
    })
    expect(res.status).toBe(404)
  })

  it('returns 400 for malformed date', async () => {
    const id = await makeDailyHabit()
    const res = await POST(postReq({ date: '29-04-2026' }), {
      params: Promise.resolve({ id: String(id) }),
    })
    expect(res.status).toBe(400)
  })
})

describe('DELETE /api/habits/[id]/check', () => {
  it('deletes the completion for the given date', async () => {
    const id = await makeDailyHabit()
    await POST(postReq({ date: TODAY }), { params: Promise.resolve({ id: String(id) }) })
    const res = await DELETE(delReq(TODAY), { params: Promise.resolve({ id: String(id) }) })
    expect(res.status).toBe(204)
    const rows = await db.select().from(habitCompletions).where(eq(habitCompletions.habitId, id))
    expect(rows).toHaveLength(0)
  })

  it('is idempotent: deleting non-existent completion returns 204', async () => {
    const id = await makeDailyHabit()
    const res = await DELETE(delReq(TODAY), { params: Promise.resolve({ id: String(id) }) })
    expect(res.status).toBe(204)
  })

  it('does NOT remove milestone XP event (level never decreases)', async () => {
    const id = await makeDailyHabit()
    await seedCompletions(id, [
      '2026-04-23',
      '2026-04-24',
      '2026-04-25',
      '2026-04-26',
      '2026-04-27',
      '2026-04-28',
    ])
    await POST(postReq({ date: TODAY }), { params: Promise.resolve({ id: String(id) }) })
    await DELETE(delReq(TODAY), { params: Promise.resolve({ id: String(id) }) })
    const xp = await db.select().from(xpEvents).where(eq(xpEvents.userId, USER))
    expect(xp).toHaveLength(1)
  })
})
