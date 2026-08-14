import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { db } from '@/db/client'
import { users } from '@/db/schema'
import { eq, like } from 'drizzle-orm'
import { POST } from '@/app/api/user/onboarded/route'

const PREFIX = 'onbd_'
const USER = 'onbd_user000000000001'

vi.mock('@/lib/auth-helpers', () => ({
  getSessionUser: vi
    .fn()
    .mockResolvedValue({ id: 'onbd_user000000000001', email: 't@t', name: 'T' }),
  requireSessionUser: vi
    .fn()
    .mockResolvedValue({ id: 'onbd_user000000000001', email: 't@t', name: 'T' }),
}))

beforeAll(async () => {
  await db.insert(users).values({
    id: USER,
    email: `${PREFIX}u@hexis.local`,
    name: 'Onboard',
    passwordHash: 'x',
  })
})

afterAll(async () => {
  await db.delete(users).where(like(users.id, `${PREFIX}%`))
})

describe('POST /api/user/onboarded', () => {
  it('stamps onboarded_at on first call and returns ok', async () => {
    const res = await POST()
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true })
    const [row] = await db.select().from(users).where(eq(users.id, USER))
    expect(row?.onboardedAt).not.toBeNull()
  })

  it('is idempotent — second call does not move the timestamp', async () => {
    const [before] = await db.select().from(users).where(eq(users.id, USER))
    const res = await POST()
    expect(res.status).toBe(200)
    const [after] = await db.select().from(users).where(eq(users.id, USER))
    expect(after?.onboardedAt?.getTime()).toBe(before?.onboardedAt?.getTime())
  })
})
