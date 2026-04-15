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

// eslint-disable-next-line @typescript-eslint/no-require-imports -- dynamic after mock
const { GET } = await import('@/app/api/measurements/route')

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
