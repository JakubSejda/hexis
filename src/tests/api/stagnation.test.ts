import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { db } from '@/db/client'
import { users, exercises, sessions, sessionSets } from '@/db/schema'
import { fetchStagnatingExercises } from '@/lib/queries/stagnation'
import { eq } from 'drizzle-orm'

const TEST_USER_ID = 'stagn_test_000000000001'

describe('fetchStagnatingExercises', () => {
  let benchId: number

  beforeAll(async () => {
    await db.insert(users).values({
      id: TEST_USER_ID,
      email: 'stagnation-test@hexis.local',
      name: 'Stagnation Test',
      passwordHash: 'x',
    })
    const [ex] = await db.insert(exercises).values({
      name: 'Stag Test Bench',
      type: 'barbell',
    })
    benchId = ex.insertId

    // Create sessions over 4 weeks with no 1RM improvement
    for (let weekOffset = 0; weekOffset < 4; weekOffset++) {
      const date = new Date('2026-03-25')
      date.setDate(date.getDate() + weekOffset * 7)
      const [s] = await db.insert(sessions).values({
        userId: TEST_USER_ID,
        startedAt: date,
        finishedAt: new Date(date.getTime() + 3600000),
      })
      await db.insert(sessionSets).values({
        sessionId: s.insertId,
        exerciseId: benchId,
        setIndex: 0,
        weightKg: '80.00',
        reps: 5,
        completedAt: new Date(date.getTime() + 600000),
      })
    }
  })

  afterAll(async () => {
    // Clean up in reverse order of FK dependencies
    await db.delete(sessionSets)
    await db.delete(sessions).where(eq(sessions.userId, TEST_USER_ID))
    await db.delete(exercises).where(eq(exercises.name, 'Stag Test Bench'))
    await db.delete(users).where(eq(users.id, TEST_USER_ID))
  })

  it('detects stagnating exercises', async () => {
    const result = await fetchStagnatingExercises(db, TEST_USER_ID, new Date('2026-04-16'))
    const bench = result.find((r) => r.exerciseId === benchId)
    expect(bench).toBeDefined()
    expect(bench!.isStagnant).toBe(true)
  })

  it('returns empty for user with no data', async () => {
    const result = await fetchStagnatingExercises(db, 'nonexistent_user_00001', new Date())
    expect(result).toEqual([])
  })
})
