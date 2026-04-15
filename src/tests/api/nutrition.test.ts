import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { eq } from 'drizzle-orm'
import { db } from '@/db/client'
import { nutritionDays, users, xpEvents } from '@/db/schema'
import { newUlid } from '@/lib/ulid'

const TEST_USER_ID = newUlid()

vi.mock('@/lib/auth-helpers', () => ({
  getSessionUser: vi.fn().mockResolvedValue({
    id: TEST_USER_ID,
    email: 'm3-nut@hexis.test',
  }),
  requireSessionUser: vi.fn(),
  requireOwnership: vi.fn(),
}))

async function seedUser() {
  await db.delete(users).where(eq(users.id, TEST_USER_ID))
  await db.insert(users).values({
    id: TEST_USER_ID,
    email: `m3-nut-${TEST_USER_ID}@hexis.test`,
    level: 1,
    trackedMacros: ['kcal', 'protein'],
  })
}

async function clean() {
  await db.delete(xpEvents).where(eq(xpEvents.userId, TEST_USER_ID))
  await db.delete(nutritionDays).where(eq(nutritionDays.userId, TEST_USER_ID))
  await db.delete(users).where(eq(users.id, TEST_USER_ID))
}

beforeEach(async () => {
  await clean()
  await seedUser()
})
afterAll(async () => {
  await clean()
})

const { GET, PUT } = await import('@/app/api/nutrition/route')

describe('GET /api/nutrition', () => {
  it('rejects without month query', async () => {
    const res = await GET(new Request('http://localhost/api/nutrition'))
    expect(res.status).toBe(400)
  })

  it('rejects malformed month', async () => {
    const res = await GET(new Request('http://localhost/api/nutrition?month=2026-4'))
    expect(res.status).toBe(400)
  })

  it('returns items within month bounds', async () => {
    await db.insert(nutritionDays).values([
      { userId: TEST_USER_ID, date: '2026-04-01', kcalActual: 2000 },
      { userId: TEST_USER_ID, date: '2026-04-30', kcalActual: 2100 },
      { userId: TEST_USER_ID, date: '2026-03-31', kcalActual: 1900 },
    ])
    const res = await GET(new Request('http://localhost/api/nutrition?month=2026-04'))
    const body = await res.json()
    expect(body.items).toHaveLength(2)
  })
})

describe('PUT /api/nutrition', () => {
  it('inserts a new day and awards 10 XP', async () => {
    const res = await PUT(
      new Request('http://localhost/api/nutrition', {
        method: 'PUT',
        body: JSON.stringify({ date: '2026-04-15', kcalActual: 1800, proteinG: 140 }),
        headers: { 'content-type': 'application/json' },
      })
    )
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.xpDelta).toBe(10)
    const xp = await db.select().from(xpEvents).where(eq(xpEvents.userId, TEST_USER_ID))
    expect(xp).toHaveLength(1)
    expect(xp[0]!.eventType).toBe('nutrition_logged')
    expect(xp[0]!.xpDelta).toBe(10)
  })

  it('updates existing day without XP', async () => {
    await PUT(
      new Request('http://localhost/api/nutrition', {
        method: 'PUT',
        body: JSON.stringify({ date: '2026-04-15', kcalActual: 1800 }),
        headers: { 'content-type': 'application/json' },
      })
    )
    const res = await PUT(
      new Request('http://localhost/api/nutrition', {
        method: 'PUT',
        body: JSON.stringify({ date: '2026-04-15', kcalActual: 1900 }),
        headers: { 'content-type': 'application/json' },
      })
    )
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.xpDelta).toBe(0)
  })

  it('rejects missing date', async () => {
    const res = await PUT(
      new Request('http://localhost/api/nutrition', {
        method: 'PUT',
        body: '{}',
        headers: { 'content-type': 'application/json' },
      })
    )
    expect(res.status).toBe(400)
  })
})

const { DELETE } = await import('@/app/api/nutrition/[id]/route')

describe('DELETE /api/nutrition/[id]', () => {
  it('deletes and reverses XP', async () => {
    const putRes = await PUT(
      new Request('http://localhost/api/nutrition', {
        method: 'PUT',
        body: JSON.stringify({ date: '2026-04-15', kcalActual: 1800 }),
        headers: { 'content-type': 'application/json' },
      })
    )
    const { id } = await putRes.json()
    const res = await DELETE(
      new Request(`http://localhost/api/nutrition/${id}`, { method: 'DELETE' }),
      {
        params: Promise.resolve({ id: String(id) }),
      }
    )
    expect(res.status).toBe(204)
    const xp = await db.select().from(xpEvents).where(eq(xpEvents.userId, TEST_USER_ID))
    const sum = xp.reduce((acc, e) => acc + e.xpDelta, 0)
    expect(sum).toBe(0)
  })

  it('returns 404 for foreign id', async () => {
    const res = await DELETE(
      new Request('http://localhost/api/nutrition/999999', { method: 'DELETE' }),
      {
        params: Promise.resolve({ id: '999999' }),
      }
    )
    expect(res.status).toBe(404)
  })
})
