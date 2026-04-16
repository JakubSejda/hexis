import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { db } from '@/db/client'
import { users, exercises, sessions, sessionSets } from '@/db/schema'
import { fetchStrengthProgress } from '@/lib/queries/strength-progress'
import { eq } from 'drizzle-orm'

const TEST_USER_ID = 'stren_test_000000000001'

describe('fetchStrengthProgress', () => {
  beforeAll(async () => {
    await db.insert(users).values({
      id: TEST_USER_ID,
      email: 'strength-test@hexis.local',
      name: 'Strength Test',
      passwordHash: 'x',
    })

    const [exResult] = await db.insert(exercises).values({
      name: 'Test Bench',
      type: 'barbell',
    })
    const exerciseId = exResult.insertId

    // Session 1: 2026-04-01
    const [s1Result] = await db.insert(sessions).values({
      userId: TEST_USER_ID,
      startedAt: new Date('2026-04-01T10:00:00Z'),
      finishedAt: new Date('2026-04-01T11:00:00Z'),
    })
    await db.insert(sessionSets).values({
      sessionId: s1Result.insertId,
      exerciseId,
      setIndex: 0,
      weightKg: '80.00',
      reps: 5,
      completedAt: new Date('2026-04-01T10:10:00Z'),
    })

    // Session 2: 2026-04-08
    const [s2Result] = await db.insert(sessions).values({
      userId: TEST_USER_ID,
      startedAt: new Date('2026-04-08T10:00:00Z'),
      finishedAt: new Date('2026-04-08T11:00:00Z'),
    })
    await db.insert(sessionSets).values({
      sessionId: s2Result.insertId,
      exerciseId,
      setIndex: 0,
      weightKg: '82.50',
      reps: 5,
      completedAt: new Date('2026-04-08T10:10:00Z'),
    })
  })

  afterAll(async () => {
    const ex = await db.query.exercises.findFirst({ where: eq(exercises.name, 'Test Bench') })
    if (ex) {
      await db.delete(sessionSets).where(eq(sessionSets.exerciseId, ex.id))
    }
    await db.delete(sessions).where(eq(sessions.userId, TEST_USER_ID))
    if (ex) {
      await db.delete(exercises).where(eq(exercises.id, ex.id))
    }
    await db.delete(users).where(eq(users.id, TEST_USER_ID))
  })

  it('returns daily best 1RM for an exercise', async () => {
    const ex = await db.query.exercises.findFirst({ where: eq(exercises.name, 'Test Bench') })
    const result = await fetchStrengthProgress(db, TEST_USER_ID, ex!.id, 30)
    expect(result.length).toBeGreaterThanOrEqual(2)
    expect(result[0]!.best1rm).toBeGreaterThan(0)
    expect(result[1]!.best1rm).toBeGreaterThan(result[0]!.best1rm)
  })

  it('returns empty array for unknown exercise', async () => {
    const result = await fetchStrengthProgress(db, TEST_USER_ID, 99999, 30)
    expect(result).toEqual([])
  })
})
