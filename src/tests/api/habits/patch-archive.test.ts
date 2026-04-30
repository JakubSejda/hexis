import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest'
import { db } from '@/db/client'
import { users, habits, habitCompletions } from '@/db/schema'
import { eq, like } from 'drizzle-orm'
import { PATCH } from '@/app/api/habits/[id]/route'
import { POST as ARCHIVE } from '@/app/api/habits/[id]/archive/route'

const PREFIX = 'hbpa_'
const USER = `${PREFIX}user000000000001`
const OTHER = `${PREFIX}user000000000002`

vi.mock('@/lib/auth-helpers', async () => {
  const real = await vi.importActual<typeof import('@/lib/auth-helpers')>('@/lib/auth-helpers')
  return {
    ...real,
    requireSessionUser: vi.fn().mockResolvedValue({ id: USER, email: 't@t', name: 'T' }),
  }
})

beforeAll(async () => {
  await db.insert(users).values([
    { id: USER, email: `${PREFIX}u1@hexis.local`, name: 'P1', passwordHash: 'x' },
    { id: OTHER, email: `${PREFIX}u2@hexis.local`, name: 'P2', passwordHash: 'x' },
  ])
})

afterAll(async () => {
  await db.delete(habitCompletions).where(like(habitCompletions.userId, `${PREFIX}%`))
  await db.delete(habits).where(like(habits.userId, `${PREFIX}%`))
  await db.delete(users).where(like(users.id, `${PREFIX}%`))
})

beforeEach(async () => {
  await db.delete(habitCompletions).where(like(habitCompletions.userId, `${PREFIX}%`))
  await db.delete(habits).where(like(habits.userId, `${PREFIX}%`))
})

function patchReq(body: unknown) {
  return new Request('http://test', {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('PATCH /api/habits/[id]', () => {
  it('updates name and weight', async () => {
    const [h] = await db.insert(habits).values({
      userId: USER,
      name: 'Voda',
      cadence: 'daily',
      weight: 'standard',
    })
    const res = await PATCH(patchReq({ name: 'Voda 2L', weight: 'heavy' }), {
      params: Promise.resolve({ id: String(h.insertId) }),
    })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.habit).toMatchObject({ name: 'Voda 2L', weight: 'heavy' })
  })

  it('rejects cadence patch (immutable)', async () => {
    const [h] = await db.insert(habits).values({
      userId: USER,
      name: 'Voda',
      cadence: 'daily',
      weight: 'standard',
    })
    const res = await PATCH(patchReq({ cadence: 'weekly' }), {
      params: Promise.resolve({ id: String(h.insertId) }),
    })
    expect(res.status).toBe(400)
  })

  it('rejects weeklyTarget patch (immutable)', async () => {
    const [h] = await db.insert(habits).values({
      userId: USER,
      name: 'M',
      cadence: 'weekly',
      weeklyTarget: 3,
      weight: 'light',
    })
    const res = await PATCH(patchReq({ weeklyTarget: 5 }), {
      params: Promise.resolve({ id: String(h.insertId) }),
    })
    expect(res.status).toBe(400)
  })

  it('returns 404 when habit belongs to someone else (no leak)', async () => {
    const [h] = await db.insert(habits).values({
      userId: OTHER,
      name: 'Other',
      cadence: 'daily',
      weight: 'standard',
    })
    const res = await PATCH(patchReq({ name: 'X' }), {
      params: Promise.resolve({ id: String(h.insertId) }),
    })
    expect(res.status).toBe(404)
  })

  it('rejects empty patch', async () => {
    const [h] = await db.insert(habits).values({
      userId: USER,
      name: 'Voda',
      cadence: 'daily',
      weight: 'standard',
    })
    const res = await PATCH(patchReq({}), {
      params: Promise.resolve({ id: String(h.insertId) }),
    })
    expect(res.status).toBe(400)
  })

  it('rejects duplicate name on rename (case-insensitive)', async () => {
    await db.insert(habits).values({
      userId: USER,
      name: 'Voda',
      cadence: 'daily',
      weight: 'standard',
    })
    const [h2] = await db.insert(habits).values({
      userId: USER,
      name: 'Čtení',
      cadence: 'daily',
      weight: 'standard',
    })
    const res = await PATCH(patchReq({ name: 'voda' }), {
      params: Promise.resolve({ id: String(h2.insertId) }),
    })
    expect(res.status).toBe(409)
  })
})

describe('POST /api/habits/[id]/archive', () => {
  it('sets archivedAt to now', async () => {
    const [h] = await db.insert(habits).values({
      userId: USER,
      name: 'Voda',
      cadence: 'daily',
      weight: 'standard',
    })
    const res = await ARCHIVE(new Request('http://test', { method: 'POST' }), {
      params: Promise.resolve({ id: String(h.insertId) }),
    })
    expect(res.status).toBe(200)
    const row = await db.query.habits.findFirst({ where: eq(habits.id, h.insertId) })
    expect(row?.archivedAt).not.toBeNull()
  })

  it('is idempotent (re-archiving an archived habit returns 200)', async () => {
    const [h] = await db.insert(habits).values({
      userId: USER,
      name: 'V',
      cadence: 'daily',
      weight: 'standard',
      archivedAt: new Date(),
    })
    const res = await ARCHIVE(new Request('http://test', { method: 'POST' }), {
      params: Promise.resolve({ id: String(h.insertId) }),
    })
    expect(res.status).toBe(200)
  })

  it("returns 404 for someone else's habit", async () => {
    const [h] = await db.insert(habits).values({
      userId: OTHER,
      name: 'X',
      cadence: 'daily',
      weight: 'standard',
    })
    const res = await ARCHIVE(new Request('http://test', { method: 'POST' }), {
      params: Promise.resolve({ id: String(h.insertId) }),
    })
    expect(res.status).toBe(404)
  })
})
