import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { db } from '@/db/client'
import { users, xpEvents, habits, habitCompletions } from '@/db/schema'
import { eq, like } from 'drizzle-orm'
import {
  fetchActiveHabitsWithStreak,
  fetchHabitWithCompletions,
  findActiveHabitByCaseInsensitiveName,
  hasMilestoneBeenAwarded,
} from '@/lib/queries/habits'

const PREFIX = 'hbtest_'
const USER = `${PREFIX}user000000000001`

beforeAll(async () => {
  await db.insert(users).values({
    id: USER,
    email: `${PREFIX}user@hexis.local`,
    name: 'Habits Test',
    passwordHash: 'x',
  })
})

afterAll(async () => {
  await db.delete(habitCompletions).where(eq(habitCompletions.userId, USER))
  await db.delete(habits).where(eq(habits.userId, USER))
  await db.delete(xpEvents).where(eq(xpEvents.userId, USER))
  await db.delete(users).where(like(users.id, `${PREFIX}%`))
})

beforeEach(async () => {
  await db.delete(habitCompletions).where(eq(habitCompletions.userId, USER))
  await db.delete(habits).where(eq(habits.userId, USER))
  await db.delete(xpEvents).where(eq(xpEvents.userId, USER))
})

const TODAY = '2026-04-29'

describe('fetchActiveHabitsWithStreak', () => {
  it('returns empty array when user has no habits', async () => {
    expect(await fetchActiveHabitsWithStreak(db, USER, TODAY)).toEqual([])
  })

  it('excludes archived habits', async () => {
    await db.insert(habits).values([
      { userId: USER, name: 'Active', cadence: 'daily', weight: 'standard' },
      { userId: USER, name: 'Old', cadence: 'daily', weight: 'standard', archivedAt: new Date() },
    ])
    const r = await fetchActiveHabitsWithStreak(db, USER, TODAY)
    expect(r).toHaveLength(1)
    expect(r[0]?.name).toBe('Active')
  })

  it('computes streak for daily habit', async () => {
    const [h] = await db.insert(habits).values({
      userId: USER,
      name: 'Voda',
      cadence: 'daily',
      weight: 'standard',
    })
    await db.insert(habitCompletions).values([
      { habitId: h.insertId, userId: USER, completedOn: '2026-04-29' },
      { habitId: h.insertId, userId: USER, completedOn: '2026-04-28' },
      { habitId: h.insertId, userId: USER, completedOn: '2026-04-27' },
    ])
    const [row] = await fetchActiveHabitsWithStreak(db, USER, TODAY)
    expect(row?.currentStreak).toBe(3)
    expect(row?.completedToday).toBe(true)
  })

  it('reports completedToday=false when today is not checked', async () => {
    const [h] = await db.insert(habits).values({
      userId: USER,
      name: 'Voda',
      cadence: 'daily',
      weight: 'standard',
    })
    await db.insert(habitCompletions).values({
      habitId: h.insertId,
      userId: USER,
      completedOn: '2026-04-28',
    })
    const [row] = await fetchActiveHabitsWithStreak(db, USER, TODAY)
    expect(row?.completedToday).toBe(false)
    expect(row?.currentStreak).toBe(1)
  })

  it('computes weekly streak + completedThisWeek progress', async () => {
    const [h] = await db.insert(habits).values({
      userId: USER,
      name: 'Meditace',
      cadence: 'weekly',
      weeklyTarget: 3,
      weight: 'light',
    })
    await db.insert(habitCompletions).values([
      { habitId: h.insertId, userId: USER, completedOn: '2026-04-27' },
      { habitId: h.insertId, userId: USER, completedOn: '2026-04-28' },
      { habitId: h.insertId, userId: USER, completedOn: '2026-04-20' },
      { habitId: h.insertId, userId: USER, completedOn: '2026-04-21' },
      { habitId: h.insertId, userId: USER, completedOn: '2026-04-22' },
    ])
    const [row] = await fetchActiveHabitsWithStreak(db, USER, TODAY)
    expect(row?.currentStreak).toBe(1)
    expect(row?.completedThisWeek).toBe(2)
  })
})

describe('fetchHabitWithCompletions', () => {
  it('returns null for non-existent habit', async () => {
    expect(await fetchHabitWithCompletions(db, USER, 99999)).toBeNull()
  })

  it('returns null when habit belongs to another user', async () => {
    const [h] = await db.insert(habits).values({
      userId: USER,
      name: 'Voda',
      cadence: 'daily',
      weight: 'standard',
    })
    expect(await fetchHabitWithCompletions(db, 'other_user', h.insertId)).toBeNull()
  })

  it('returns habit + last 200 completion dates desc', async () => {
    const [h] = await db.insert(habits).values({
      userId: USER,
      name: 'Voda',
      cadence: 'daily',
      weight: 'standard',
    })
    await db.insert(habitCompletions).values([
      { habitId: h.insertId, userId: USER, completedOn: '2026-04-29' },
      { habitId: h.insertId, userId: USER, completedOn: '2026-04-27' },
      { habitId: h.insertId, userId: USER, completedOn: '2026-04-28' },
    ])
    const r = await fetchHabitWithCompletions(db, USER, h.insertId)
    expect(r?.completionDates).toEqual(['2026-04-29', '2026-04-28', '2026-04-27'])
  })
})

describe('findActiveHabitByCaseInsensitiveName', () => {
  it('returns null when no match', async () => {
    expect(await findActiveHabitByCaseInsensitiveName(db, USER, 'Nope')).toBeNull()
  })

  it('matches case-insensitively', async () => {
    await db.insert(habits).values({
      userId: USER,
      name: 'Voda',
      cadence: 'daily',
      weight: 'standard',
    })
    const r = await findActiveHabitByCaseInsensitiveName(db, USER, 'voda')
    expect(r?.name).toBe('Voda')
  })

  it('ignores archived habits', async () => {
    await db.insert(habits).values({
      userId: USER,
      name: 'Voda',
      cadence: 'daily',
      weight: 'standard',
      archivedAt: new Date(),
    })
    expect(await findActiveHabitByCaseInsensitiveName(db, USER, 'voda')).toBeNull()
  })
})

describe('hasMilestoneBeenAwarded', () => {
  it('returns false when no xp_event for this habit/milestone', async () => {
    expect(await hasMilestoneBeenAwarded(db, USER, 1, 7)).toBe(false)
  })

  it('returns true after a habit_streak event was inserted', async () => {
    await db.insert(xpEvents).values({
      userId: USER,
      eventType: 'habit_streak',
      xpDelta: 50,
      meta: { habitId: 42, milestone: 7, weight: 'standard' },
    })
    expect(await hasMilestoneBeenAwarded(db, USER, 42, 7)).toBe(true)
    expect(await hasMilestoneBeenAwarded(db, USER, 42, 30)).toBe(false)
    expect(await hasMilestoneBeenAwarded(db, USER, 99, 7)).toBe(false)
  })
})

describe('weekly milestone emission inside fetchActiveHabitsWithStreak', () => {
  it('emits xp_event when weekly streak crosses 7 (standard weight = +50)', async () => {
    const [h] = await db.insert(habits).values({
      userId: USER,
      name: 'Pondělky',
      cadence: 'weekly',
      weeklyTarget: 1,
      weight: 'standard',
    })
    const dates = [
      '2026-04-20',
      '2026-04-13',
      '2026-04-06',
      '2026-03-30',
      '2026-03-23',
      '2026-03-16',
      '2026-03-09',
    ]
    await db
      .insert(habitCompletions)
      .values(dates.map((d) => ({ habitId: h.insertId, userId: USER, completedOn: d })))

    const result = await fetchActiveHabitsWithStreak(db, USER, TODAY)
    expect(result[0]?.currentStreak).toBe(7)

    const xp = await db.select().from(xpEvents).where(eq(xpEvents.userId, USER))
    expect(xp).toHaveLength(1)
    expect(xp[0]?.eventType).toBe('habit_streak')
    expect(xp[0]?.xpDelta).toBe(50)
    expect(xp[0]?.meta).toMatchObject({ habitId: h.insertId, milestone: 7, weight: 'standard' })
  })

  it('does not double-emit weekly milestone on subsequent GET', async () => {
    const [h] = await db.insert(habits).values({
      userId: USER,
      name: 'Pondělky',
      cadence: 'weekly',
      weeklyTarget: 1,
      weight: 'standard',
    })
    const dates = [
      '2026-04-20',
      '2026-04-13',
      '2026-04-06',
      '2026-03-30',
      '2026-03-23',
      '2026-03-16',
      '2026-03-09',
    ]
    await db
      .insert(habitCompletions)
      .values(dates.map((d) => ({ habitId: h.insertId, userId: USER, completedOn: d })))
    await fetchActiveHabitsWithStreak(db, USER, TODAY)
    await fetchActiveHabitsWithStreak(db, USER, TODAY)
    const xp = await db.select().from(xpEvents).where(eq(xpEvents.userId, USER))
    expect(xp).toHaveLength(1)
  })

  it('does NOT emit when streak is below threshold', async () => {
    const [h] = await db.insert(habits).values({
      userId: USER,
      name: 'P',
      cadence: 'weekly',
      weeklyTarget: 1,
      weight: 'standard',
    })
    await db.insert(habitCompletions).values([
      { habitId: h.insertId, userId: USER, completedOn: '2026-04-20' },
      { habitId: h.insertId, userId: USER, completedOn: '2026-04-13' },
    ])
    await fetchActiveHabitsWithStreak(db, USER, TODAY)
    const xp = await db.select().from(xpEvents).where(eq(xpEvents.userId, USER))
    expect(xp).toHaveLength(0)
  })

  it('does NOT emit for daily habits (those fire from /check route)', async () => {
    const [h] = await db.insert(habits).values({
      userId: USER,
      name: 'Voda',
      cadence: 'daily',
      weight: 'standard',
    })
    const dates = [
      '2026-04-23',
      '2026-04-24',
      '2026-04-25',
      '2026-04-26',
      '2026-04-27',
      '2026-04-28',
      '2026-04-29',
    ]
    await db
      .insert(habitCompletions)
      .values(dates.map((d) => ({ habitId: h.insertId, userId: USER, completedOn: d })))
    await fetchActiveHabitsWithStreak(db, USER, TODAY)
    const xp = await db.select().from(xpEvents).where(eq(xpEvents.userId, USER))
    expect(xp).toHaveLength(0)
  })
})
