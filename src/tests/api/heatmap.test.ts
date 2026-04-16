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
import { fetchMuscleVolumes } from '@/lib/queries/heatmap'
import { eq } from 'drizzle-orm'

const TEST_USER_ID = 'heatm_test_000000000001'

describe('fetchMuscleVolumes', () => {
  let chestExId: number

  beforeAll(async () => {
    await db
      .insert(users)
      .values({
        id: TEST_USER_ID,
        email: 'heatmap-test@hexis.local',
        name: 'Heatmap Test',
        passwordHash: 'x',
      })
    const chestMg = await db.query.muscleGroups.findFirst({ where: eq(muscleGroups.slug, 'chest') })
    const [ex] = await db.insert(exercises).values({ name: 'Heatmap Test Bench', type: 'barbell' })
    chestExId = ex.insertId
    await db
      .insert(exerciseMuscleGroups)
      .values({ exerciseId: chestExId, muscleGroupId: chestMg!.id, isPrimary: true })
    const [s1] = await db
      .insert(sessions)
      .values({
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
    await db.delete(exercises).where(eq(exercises.name, 'Heatmap Test Bench'))
    await db.delete(users).where(eq(users.id, TEST_USER_ID))
  })

  it('returns volume per muscle slug', async () => {
    const result = await fetchMuscleVolumes(db, TEST_USER_ID, 30)
    expect(result.muscles.chest).toBe(1280)
    expect(result.maxVolume).toBeGreaterThanOrEqual(1280)
  })

  it('returns empty for user with no data', async () => {
    const result = await fetchMuscleVolumes(db, 'nonexistent_user_00001', 30)
    expect(Object.keys(result.muscles)).toHaveLength(0)
    expect(result.maxVolume).toBe(0)
  })
})
