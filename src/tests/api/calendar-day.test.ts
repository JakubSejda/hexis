import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest'
import { like } from 'drizzle-orm'

vi.mock('@/lib/auth-helpers', () => ({
  requireSessionUser: vi.fn(),
}))

import { db } from '@/db/client'
import { users, sessions } from '@/db/schema'
import { requireSessionUser } from '@/lib/auth-helpers'
import { GET } from '@/app/api/calendar/day/route'

const PREFIX = 'apicd_'
const USER = `${PREFIX}user00000000000001`

async function cleanup() {
  await db.delete(sessions).where(like(sessions.userId, `${PREFIX}%`))
  await db.delete(users).where(like(users.id, `${PREFIX}%`))
}

beforeAll(cleanup)
afterAll(cleanup)

beforeEach(async () => {
  await cleanup()
  await db.insert(users).values({ id: USER, email: `${PREFIX}u@hexis.local` })
  vi.mocked(requireSessionUser).mockResolvedValue({
    id: USER,
    email: `${PREFIX}u@hexis.local`,
    name: null,
  } as never)
})

describe('GET /api/calendar/day', () => {
  it('returns 200 with empty shape on a no-data day', async () => {
    const res = await GET(new Request('http://test/api/calendar/day?date=2026-05-15'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toEqual({
      date: '2026-05-15',
      sessions: [],
      habits: [],
      measurement: null,
      photos: [],
    })
  })

  it('returns 200 with sessions when data exists', async () => {
    await db.insert(sessions).values({
      userId: USER,
      startedAt: new Date('2026-05-15T10:00:00Z'),
      finishedAt: new Date('2026-05-15T11:00:00Z'),
    })
    const res = await GET(new Request('http://test/api/calendar/day?date=2026-05-15'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.sessions.length).toBe(1)
  })

  it('returns 401 when no session', async () => {
    vi.mocked(requireSessionUser).mockResolvedValue(
      new Response('Unauthorized', { status: 401 }) as never
    )
    const res = await GET(new Request('http://test/api/calendar/day?date=2026-05-15'))
    expect(res.status).toBe(401)
  })

  it('returns 400 on malformed date', async () => {
    const res = await GET(new Request('http://test/api/calendar/day?date=2026/05/15'))
    expect(res.status).toBe(400)
  })

  it('returns 400 when date param is missing', async () => {
    const res = await GET(new Request('http://test/api/calendar/day'))
    expect(res.status).toBe(400)
  })
})
