import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { eq } from 'drizzle-orm'
import { db } from '@/db/client'
import { users } from '@/db/schema'
import { newUlid } from '@/lib/ulid'

const { TEST_USER_ID } = vi.hoisted(() => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { ulid } = require('ulid')
  return { TEST_USER_ID: ulid() as string }
})

vi.mock('@/lib/auth-helpers', () => ({
  getSessionUser: vi.fn().mockResolvedValue({
    id: TEST_USER_ID,
    email: 'macros@hexis.test',
  }),
  requireSessionUser: vi.fn(),
  requireOwnership: vi.fn(),
}))

beforeEach(async () => {
  await db.delete(users).where(eq(users.id, TEST_USER_ID))
  await db.insert(users).values({
    id: TEST_USER_ID,
    email: `macros-${TEST_USER_ID}@hexis.test`,
    level: 1,
    trackedMacros: ['kcal', 'protein'],
  })
})
afterAll(async () => {
  await db.delete(users).where(eq(users.id, TEST_USER_ID))
})

import { GET, PUT } from '@/app/api/user/macros/route'

describe('GET /api/user/macros', () => {
  it('returns default kcal+protein for new user', async () => {
    const res = await GET()
    const body = await res.json()
    expect(body.macros).toEqual(['kcal', 'protein'])
  })
})

describe('PUT /api/user/macros', () => {
  it('always coerces required macros into the result', async () => {
    const res = await PUT(
      new Request('http://localhost/api/user/macros', {
        method: 'PUT',
        body: JSON.stringify({ macros: ['carbs'] }),
        headers: { 'content-type': 'application/json' },
      })
    )
    const body = await res.json()
    expect(body.macros).toContain('kcal')
    expect(body.macros).toContain('protein')
    expect(body.macros).toContain('carbs')
  })

  it('rejects unknown macro', async () => {
    const res = await PUT(
      new Request('http://localhost/api/user/macros', {
        method: 'PUT',
        body: JSON.stringify({ macros: ['vitamins'] }),
        headers: { 'content-type': 'application/json' },
      })
    )
    expect(res.status).toBe(400)
  })

  it('handles all 5 macros', async () => {
    const res = await PUT(
      new Request('http://localhost/api/user/macros', {
        method: 'PUT',
        body: JSON.stringify({ macros: ['kcal', 'protein', 'carbs', 'fat', 'sugar'] }),
        headers: { 'content-type': 'application/json' },
      })
    )
    const body = await res.json()
    expect(body.macros).toEqual(['kcal', 'protein', 'carbs', 'fat', 'sugar'])
  })
})
