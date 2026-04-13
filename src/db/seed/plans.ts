import { isNull } from 'drizzle-orm'
import type { DB } from '../client'
import { plans, planExercises, exercises } from '../schema'

// Seed plány jsou vázané na konkrétního uživatele. Plans se seedují v bootstrap
// (po vytvoření reálného usera), ne v obecném `db:seed`.

type PlanExerciseSeed = {
  exerciseName: string
  targetSets: number
  repMin: number
  repMax: number
  restSec: number
}

type PlanSeed = {
  name: string
  slug: string
  order: number
  exercises: PlanExerciseSeed[]
}

export const PLANS: PlanSeed[] = [
  {
    name: 'Upper A — Silový',
    slug: 'UA',
    order: 1,
    exercises: [
      { exerciseName: 'Incline DB Press', targetSets: 4, repMin: 6, repMax: 8, restSec: 180 },
      {
        exerciseName: 'Lat Pulldown (wide grip)',
        targetSets: 4,
        repMin: 6,
        repMax: 8,
        restSec: 180,
      },
      {
        exerciseName: 'Seated DB Shoulder Press',
        targetSets: 3,
        repMin: 8,
        repMax: 10,
        restSec: 120,
      },
      {
        exerciseName: 'Seated Cable Row (neutral)',
        targetSets: 3,
        repMin: 8,
        repMax: 10,
        restSec: 120,
      },
      { exerciseName: 'Cable Lateral Raises', targetSets: 3, repMin: 12, repMax: 15, restSec: 60 },
      { exerciseName: 'Barbell Curl', targetSets: 3, repMin: 8, repMax: 10, restSec: 90 },
      { exerciseName: 'Incline DB Curl', targetSets: 3, repMin: 10, repMax: 12, restSec: 60 },
      {
        exerciseName: 'Overhead Triceps Extension',
        targetSets: 3,
        repMin: 8,
        repMax: 10,
        restSec: 90,
      },
      { exerciseName: 'Rear Delt Cable Fly', targetSets: 2, repMin: 15, repMax: 20, restSec: 60 },
    ],
  },
  {
    name: 'Upper B — Objemový',
    slug: 'UB',
    order: 3,
    exercises: [
      { exerciseName: 'Bench Press', targetSets: 4, repMin: 8, repMax: 12, restSec: 120 },
      {
        exerciseName: 'Chest Supported Cable Row',
        targetSets: 4,
        repMin: 10,
        repMax: 12,
        restSec: 120,
      },
      { exerciseName: 'Cable Chest Fly (low)', targetSets: 3, repMin: 12, repMax: 15, restSec: 60 },
      { exerciseName: 'Neutral Grip Pulldown', targetSets: 3, repMin: 8, repMax: 10, restSec: 120 },
      {
        exerciseName: 'Cable Single Arm High Row',
        targetSets: 3,
        repMin: 12,
        repMax: 15,
        restSec: 60,
      },
      { exerciseName: 'Cable Lateral Raises', targetSets: 3, repMin: 12, repMax: 15, restSec: 60 },
      { exerciseName: 'Cable Curl', targetSets: 3, repMin: 10, repMax: 12, restSec: 60 },
      { exerciseName: 'Hammer Curl (DB)', targetSets: 3, repMin: 10, repMax: 12, restSec: 60 },
      {
        exerciseName: 'Single Arm Triceps Pushdown',
        targetSets: 3,
        repMin: 12,
        repMax: 15,
        restSec: 60,
      },
    ],
  },
  {
    name: 'Lower A — Quad důraz',
    slug: 'LA',
    order: 2,
    exercises: [
      { exerciseName: 'Leg Press', targetSets: 4, repMin: 8, repMax: 12, restSec: 180 },
      { exerciseName: 'Smith Machine Squat', targetSets: 3, repMin: 8, repMax: 10, restSec: 120 },
      { exerciseName: 'Leg Extension', targetSets: 3, repMin: 12, repMax: 15, restSec: 60 },
      {
        exerciseName: 'Romanian Deadlift (DB)',
        targetSets: 3,
        repMin: 10,
        repMax: 12,
        restSec: 120,
      },
      { exerciseName: 'Standing Calf Raises', targetSets: 4, repMin: 15, repMax: 20, restSec: 60 },
      { exerciseName: 'Cable Crunch', targetSets: 3, repMin: 15, repMax: 20, restSec: 60 },
      { exerciseName: 'Plank', targetSets: 3, repMin: 30, repMax: 60, restSec: 60 },
      { exerciseName: 'Ab Wheel Rollout', targetSets: 3, repMin: 10, repMax: 15, restSec: 60 },
    ],
  },
  {
    name: 'Lower B — Hamstring důraz',
    slug: 'LB',
    order: 4,
    exercises: [
      {
        exerciseName: 'Romanian Deadlift (Barbell)',
        targetSets: 4,
        repMin: 8,
        repMax: 10,
        restSec: 180,
      },
      { exerciseName: 'Lying Leg Curl', targetSets: 4, repMin: 10, repMax: 12, restSec: 120 },
      { exerciseName: 'Goblet Squat', targetSets: 3, repMin: 12, repMax: 15, restSec: 120 },
      { exerciseName: 'Hip Thrust', targetSets: 3, repMin: 10, repMax: 12, restSec: 120 },
      { exerciseName: 'Leg Extension', targetSets: 3, repMin: 12, repMax: 15, restSec: 60 },
      { exerciseName: 'Standing Calf Raises', targetSets: 4, repMin: 15, repMax: 20, restSec: 60 },
      { exerciseName: 'Hanging Knee Raise', targetSets: 3, repMin: 15, repMax: 20, restSec: 60 },
      { exerciseName: 'Dead Bug', targetSets: 3, repMin: 10, repMax: 10, restSec: 60 },
    ],
  },
]

export async function seedPlans(db: DB, userId: string): Promise<void> {
  // Načíst map name → exercise.id (curated cviky)
  const allExercises = await db.select().from(exercises).where(isNull(exercises.userId))
  const exMap = new Map(allExercises.map((e) => [e.name, e.id]))

  for (const p of PLANS) {
    const [plan] = await db
      .insert(plans)
      .values({
        userId,
        name: p.name,
        slug: p.slug,
        order: p.order,
      })
      .$returningId()

    if (!plan) throw new Error(`Failed to insert plan: ${p.name}`)
    const planId = plan.id

    for (let i = 0; i < p.exercises.length; i++) {
      const pe = p.exercises[i]!
      const exId = exMap.get(pe.exerciseName)
      if (!exId) throw new Error(`Exercise not in catalog: ${pe.exerciseName}`)

      await db.insert(planExercises).values({
        planId,
        exerciseId: exId,
        order: i + 1,
        targetSets: pe.targetSets,
        repMin: pe.repMin,
        repMax: pe.repMax,
        restSec: pe.restSec,
      })
    }
  }
}
