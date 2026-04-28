import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { db } from '@/db/client'
import {
  users,
  exercises,
  exerciseMuscleGroups,
  muscleGroups,
  sessions,
  sessionSets,
} from '@/db/schema'
import { fetchMuscleVolumesLast8Weeks } from '@/lib/queries/muscle-rank'
import { eq } from 'drizzle-orm'

const TEST_USER_ID = 'mrank_test_000000000001'

describe('fetchMuscleVolumesLast8Weeks', () => {
  let chestExId: number

  beforeAll(async () => {
    await db.insert(users).values({
      id: TEST_USER_ID,
      email: 'mrank-test@hexis.local',
      name: 'Muscle Rank Test',
      passwordHash: 'x',
    })
    const chestMg = await db.query.muscleGroups.findFirst({
      where: eq(muscleGroups.slug, 'chest-mid'),
    })
    const [ex] = await db.insert(exercises).values({
      name: 'Muscle Rank Test Bench',
      type: 'barbell',
    })
    chestExId = ex.insertId
    await db.insert(exerciseMuscleGroups).values({
      exerciseId: chestExId,
      muscleGroupId: chestMg!.id,
      isPrimary: true,
    })
  })

  afterAll(async () => {
    await db.delete(sessionSets).where(eq(sessionSets.exerciseId, chestExId))
    await db.delete(sessions).where(eq(sessions.userId, TEST_USER_ID))
    await db.delete(exerciseMuscleGroups).where(eq(exerciseMuscleGroups.exerciseId, chestExId))
    await db.delete(exercises).where(eq(exercises.id, chestExId))
    await db.delete(users).where(eq(users.id, TEST_USER_ID))
  })

  it('returns volumes only inside the 56-day window', async () => {
    const insideWindow = new Date()
    insideWindow.setDate(insideWindow.getDate() - 30)
    const outsideWindow = new Date()
    outsideWindow.setDate(outsideWindow.getDate() - 90)

    const [sIn] = await db.insert(sessions).values({
      userId: TEST_USER_ID,
      startedAt: insideWindow,
      finishedAt: insideWindow,
    })
    const [sOut] = await db.insert(sessions).values({
      userId: TEST_USER_ID,
      startedAt: outsideWindow,
      finishedAt: outsideWindow,
    })

    await db.insert(sessionSets).values([
      {
        sessionId: sIn.insertId,
        exerciseId: chestExId,
        setIndex: 1,
        reps: 10,
        weightKg: '50.00',
        completedAt: insideWindow,
      },
      {
        sessionId: sOut.insertId,
        exerciseId: chestExId,
        setIndex: 1,
        reps: 10,
        weightKg: '50.00',
        completedAt: outsideWindow,
      },
    ])

    const result = await fetchMuscleVolumesLast8Weeks(db, TEST_USER_ID)
    expect(result['chest-mid']).toBe(500)
  })

  it('returns an empty object when the user has no sessions in window', async () => {
    const result = await fetchMuscleVolumesLast8Weeks(db, 'nonexistent_user_99999')
    expect(result).toEqual({})
  })
})
