import { isNull } from 'drizzle-orm'
import type { DB } from '../client'
import { exercises, muscleGroups, exerciseMuscleGroups } from '../schema'

type ExerciseSeed = {
  name: string
  type: 'barbell' | 'db' | 'cable' | 'machine' | 'bodyweight' | 'smith'
  primary: string // muscle_groups.slug
  secondary?: string[] // muscle_groups.slug[]
}

export const EXERCISES: ExerciseSeed[] = [
  // UA — Upper A (silový)
  { name: 'Incline DB Press', type: 'db', primary: 'chest', secondary: ['shoulders', 'triceps'] },
  { name: 'Lat Pulldown (wide grip)', type: 'cable', primary: 'back-lats', secondary: ['biceps'] },
  { name: 'Seated DB Shoulder Press', type: 'db', primary: 'shoulders', secondary: ['triceps'] },
  {
    name: 'Seated Cable Row (neutral)',
    type: 'cable',
    primary: 'back-mid',
    secondary: ['biceps', 'back-rear-delt'],
  },
  { name: 'Cable Lateral Raises', type: 'cable', primary: 'shoulders' },
  { name: 'Barbell Curl', type: 'barbell', primary: 'biceps', secondary: ['forearms'] },
  { name: 'EZ Bar Curl', type: 'barbell', primary: 'biceps', secondary: ['forearms'] },
  { name: 'Incline DB Curl', type: 'db', primary: 'biceps' },
  { name: 'Overhead Triceps Extension', type: 'db', primary: 'triceps' },
  { name: 'Rear Delt Cable Fly', type: 'cable', primary: 'back-rear-delt' },

  // UB — Upper B (objemový)
  { name: 'Bench Press', type: 'barbell', primary: 'chest', secondary: ['shoulders', 'triceps'] },
  { name: 'Flat DB Press', type: 'db', primary: 'chest', secondary: ['shoulders', 'triceps'] },
  { name: 'Chest Supported Cable Row', type: 'cable', primary: 'back-mid', secondary: ['biceps'] },
  { name: 'Cable Chest Fly (low)', type: 'cable', primary: 'chest' },
  { name: 'Neutral Grip Pulldown', type: 'cable', primary: 'back-lats', secondary: ['biceps'] },
  {
    name: 'Cable Single Arm High Row',
    type: 'cable',
    primary: 'back-mid',
    secondary: ['back-rear-delt'],
  },
  { name: 'Cable Curl', type: 'cable', primary: 'biceps' },
  { name: 'Hammer Curl (DB)', type: 'db', primary: 'biceps', secondary: ['forearms'] },
  { name: 'Single Arm Triceps Pushdown', type: 'cable', primary: 'triceps' },

  // LA — Lower A (quad důraz)
  { name: 'Leg Press', type: 'machine', primary: 'quads', secondary: ['glutes', 'hamstrings'] },
  {
    name: 'Smith Machine Squat',
    type: 'smith',
    primary: 'quads',
    secondary: ['glutes', 'hamstrings'],
  },
  { name: 'Leg Extension', type: 'machine', primary: 'quads' },
  {
    name: 'Romanian Deadlift (DB)',
    type: 'db',
    primary: 'hamstrings',
    secondary: ['glutes', 'back-mid'],
  },
  { name: 'Standing Calf Raises', type: 'machine', primary: 'calves' },
  { name: 'Cable Crunch', type: 'cable', primary: 'abs' },
  { name: 'Plank', type: 'bodyweight', primary: 'abs', secondary: ['obliques'] },
  { name: 'Ab Wheel Rollout', type: 'bodyweight', primary: 'abs' },

  // LB — Lower B (hamstring důraz)
  {
    name: 'Romanian Deadlift (Barbell)',
    type: 'barbell',
    primary: 'hamstrings',
    secondary: ['glutes', 'back-mid'],
  },
  { name: 'Lying Leg Curl', type: 'machine', primary: 'hamstrings' },
  { name: 'Goblet Squat', type: 'db', primary: 'quads', secondary: ['glutes'] },
  { name: 'Hip Thrust', type: 'barbell', primary: 'glutes', secondary: ['hamstrings'] },
  { name: 'Hanging Knee Raise', type: 'bodyweight', primary: 'abs', secondary: ['obliques'] },
  { name: 'Dead Bug', type: 'bodyweight', primary: 'abs' },
]

export async function seedExercises(db: DB): Promise<void> {
  // 1) Insert všechny cviky (user_id = null → curated)
  for (const ex of EXERCISES) {
    await db.insert(exercises).values({
      userId: null,
      name: ex.name,
      type: ex.type,
    })
  }

  // 2) Načíst mapu slug → muscle_group.id
  const groups = await db.select().from(muscleGroups)
  const mgMap = new Map(groups.map((g) => [g.slug, g.id]))

  // 3) Načíst mapu name → exercise.id (curated only)
  const insertedExercises = await db.select().from(exercises).where(isNull(exercises.userId))
  const exMap = new Map(insertedExercises.map((e) => [e.name, e.id]))

  // 4) Insert exercise_muscle_groups s is_primary
  for (const ex of EXERCISES) {
    const exId = exMap.get(ex.name)
    if (!exId) throw new Error(`Exercise not found: ${ex.name}`)

    const primaryMgId = mgMap.get(ex.primary)
    if (!primaryMgId) throw new Error(`Muscle group not found: ${ex.primary}`)

    await db.insert(exerciseMuscleGroups).values({
      exerciseId: exId,
      muscleGroupId: primaryMgId,
      isPrimary: true,
    })

    for (const secSlug of ex.secondary ?? []) {
      const secMgId = mgMap.get(secSlug)
      if (!secMgId) throw new Error(`Muscle group not found: ${secSlug}`)

      await db.insert(exerciseMuscleGroups).values({
        exerciseId: exId,
        muscleGroupId: secMgId,
        isPrimary: false,
      })
    }
  }
}
