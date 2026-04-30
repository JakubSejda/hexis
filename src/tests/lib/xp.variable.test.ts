import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { db } from '@/db/client'
import { users, xpEvents } from '@/db/schema'
import { eq, like } from 'drizzle-orm'
import { awardXpVariable, getTotalXp } from '@/lib/xp'

const PREFIX = 'xpvtest_'
const USER = `${PREFIX}user000000000001`

beforeAll(async () => {
  await db.insert(users).values({
    id: USER,
    email: `${PREFIX}user@hexis.local`,
    name: 'XP Variable Test',
    passwordHash: 'x',
  })
})

afterAll(async () => {
  await db.delete(xpEvents).where(eq(xpEvents.userId, USER))
  await db.delete(users).where(like(users.id, `${PREFIX}%`))
})

beforeEach(async () => {
  await db.delete(xpEvents).where(eq(xpEvents.userId, USER))
})

describe('awardXpVariable', () => {
  it('inserts an xp_events row with the explicit delta and meta', async () => {
    await awardXpVariable({
      db,
      userId: USER,
      event: 'habit_streak',
      xpDelta: 50,
      meta: { habitId: 1, milestone: 7, weight: 'standard' },
    })
    const rows = await db.select().from(xpEvents).where(eq(xpEvents.userId, USER))
    expect(rows).toHaveLength(1)
    expect(rows[0]?.eventType).toBe('habit_streak')
    expect(rows[0]?.xpDelta).toBe(50)
    expect(rows[0]?.meta).toEqual({ habitId: 1, milestone: 7, weight: 'standard' })
  })

  it('updates user.level when xp crosses a level boundary', async () => {
    await awardXpVariable({
      db,
      userId: USER,
      event: 'habit_streak',
      xpDelta: 500,
      meta: { habitId: 1, milestone: 30, weight: 'heavy' },
    })
    const u = await db.query.users.findFirst({ where: eq(users.id, USER) })
    expect(u?.level).toBe(3)
  })

  it('contributes to getTotalXp', async () => {
    await awardXpVariable({
      db,
      userId: USER,
      event: 'habit_streak',
      xpDelta: 50,
      meta: { habitId: 1, milestone: 7, weight: 'standard' },
    })
    expect(await getTotalXp(db, USER)).toBe(50)
  })
})
