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
import { fetchVolumeProgress } from '@/lib/queries/volume-progress'
import { eq } from 'drizzle-orm'

const TEST_USER_ID = 'volum_test_000000000001'

describe('fetchVolumeProgress', () => {
  let chestExId: number

  beforeAll(async () => {
    await db.insert(users).values({
      id: TEST_USER_ID,
      email: 'volume-test@hexis.local',
      name: 'Volume Test',
      passwordHash: 'x',
    })
    const chestMg = await db.query.muscleGroups.findFirst({
      where: eq(muscleGroups.slug, 'chest'),
    })

    const [ex] = await db.insert(exercises).values({
      name: 'Vol Test Bench',
      type: 'barbell',
    })
    chestExId = ex.insertId
    await db.insert(exerciseMuscleGroups).values({
      exerciseId: chestExId,
      muscleGroupId: chestMg!.id,
      isPrimary: true,
    })

    // Session on 2026-04-14 (Monday)
    const [s1] = await db.insert(sessions).values({
      userId: TEST_USER_ID,
      startedAt: new Date('2026-04-14T10:00:00Z'),
      finishedAt: new Date('2026-04-14T11:00:00Z'),
    })
    await db.insert(sessionSets).values([
      {
        sessionId: s1.insertId,
        exerciseId: chestExId,
        setIndex: 0,
        weightKg: '80.00',
        reps: 8,
        completedAt: new Date('2026-04-14T10:10:00Z'),
      },
      {
        sessionId: s1.insertId,
        exerciseId: chestExId,
        setIndex: 1,
        weightKg: '80.00',
        reps: 8,
        completedAt: new Date('2026-04-14T10:15:00Z'),
      },
    ])
  })

  afterAll(async () => {
    await db.delete(sessionSets)
    await db.delete(sessions).where(eq(sessions.userId, TEST_USER_ID))
    await db.delete(exerciseMuscleGroups).where(eq(exerciseMuscleGroups.exerciseId, chestExId))
    await db.delete(exercises).where(eq(exercises.name, 'Vol Test Bench'))
    await db.delete(users).where(eq(users.id, TEST_USER_ID))
  })

  it('returns weekly volume grouped by muscle category', async () => {
    const result = await fetchVolumeProgress(db, TEST_USER_ID, 30)
    expect(result.length).toBeGreaterThanOrEqual(1)
    const week = result.find((w) => w.weekStart === '2026-04-13')
    expect(week).toBeDefined()
    // 80 * 8 * 2 = 1280
    expect(week!.chest).toBe(1280)
  })

  it('returns empty for user with no data', async () => {
    const result = await fetchVolumeProgress(db, 'nonexistent_user_00001', 30)
    expect(result).toEqual([])
  })
})
