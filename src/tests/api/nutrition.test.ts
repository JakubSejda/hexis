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

const { GET } = await import('@/app/api/nutrition/route')

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
