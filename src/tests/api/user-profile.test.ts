import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest'
import { eq, like } from 'drizzle-orm'

vi.mock('@/lib/auth-helpers', () => ({
  requireSessionUser: vi.fn(),
}))

import { db } from '@/db/client'
import { users } from '@/db/schema'
import { requireSessionUser } from '@/lib/auth-helpers'
import { GET, PUT } from '@/app/api/user/profile/route'

const PREFIX = 'apipr_'
const USER = `${PREFIX}user00000000000001`

async function cleanup() {
  await db.delete(users).where(like(users.id, `${PREFIX}%`))
}

beforeAll(cleanup)
afterAll(cleanup)

beforeEach(async () => {
  await cleanup()
  await db.insert(users).values({ id: USER, email: `${PREFIX}p@hexis.local` })
  vi.mocked(requireSessionUser).mockResolvedValue({
    id: USER,
    email: `${PREFIX}p@hexis.local`,
    name: null,
  } as never)
})

describe('GET /api/user/profile', () => {
  it('returns current profile (all-null for fresh user)', async () => {
    const res = await GET()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.profile).toEqual({
      name: null,
      birthDate: null,
      gender: null,
      heightCm: null,
      goalKg: null,
      goalText: null,
      startedAt: null,
    })
  })

  it('returns 401 when no session', async () => {
    vi.mocked(requireSessionUser).mockResolvedValue(
      new Response('Unauthorized', { status: 401 }) as never
    )
    const res = await GET()
    expect(res.status).toBe(401)
  })
})

describe('PUT /api/user/profile', () => {
  it('updates a single field and returns the new profile', async () => {
    const res = await PUT(
      new Request('http://test/api/user/profile', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ heightCm: 180 }),
      })
    )
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.profile.heightCm).toBe(180)
    const row = await db.select().from(users).where(eq(users.id, USER)).limit(1)
    expect(row[0]?.heightCm).toBe(180)
  })

  it('clears a field when null is sent', async () => {
    await db.update(users).set({ heightCm: 180 }).where(eq(users.id, USER))
    const res = await PUT(
      new Request('http://test/api/user/profile', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ heightCm: null }),
      })
    )
    expect(res.status).toBe(200)
    const row = await db.select().from(users).where(eq(users.id, USER)).limit(1)
    expect(row[0]?.heightCm).toBeNull()
  })

  it('returns 400 on invalid input', async () => {
    const res = await PUT(
      new Request('http://test/api/user/profile', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ heightCm: 999 }),
      })
    )
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('Invalid body')
    expect(Array.isArray(body.issues)).toBe(true)
  })

  it('returns 400 on malformed JSON', async () => {
    const res = await PUT(
      new Request('http://test/api/user/profile', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: 'not-json',
      })
    )
    expect(res.status).toBe(400)
  })

  it('returns 401 when no session', async () => {
    vi.mocked(requireSessionUser).mockResolvedValue(
      new Response('Unauthorized', { status: 401 }) as never
    )
    const res = await PUT(
      new Request('http://test/api/user/profile', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({}),
      })
    )
    expect(res.status).toBe(401)
  })

  it('stores goalKg as decimal compatible with Drizzle', async () => {
    const res = await PUT(
      new Request('http://test/api/user/profile', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ goalKg: 78.5 }),
      })
    )
    expect(res.status).toBe(200)
    const row = await db.select().from(users).where(eq(users.id, USER)).limit(1)
    expect(Number(row[0]?.goalKg)).toBe(78.5)
  })
})
