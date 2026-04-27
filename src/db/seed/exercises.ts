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
  {
    name: 'Incline DB Press',
    type: 'db',
    primary: 'chest-upper',
    secondary: ['delts-front', 'triceps'],
  },
  { name: 'Lat Pulldown (wide grip)', type: 'cable', primary: 'lats', secondary: ['biceps'] },
  {
    name: 'Seated DB Shoulder Press',
    type: 'db',
    primary: 'delts-front',
    secondary: ['triceps', 'traps-upper'],
  },
  {
    name: 'Seated Cable Row (neutral)',
    type: 'cable',
    primary: 'traps-mid',
    secondary: ['biceps', 'delts-rear', 'rhomboids'],
  },
  { name: 'Cable Lateral Raises', type: 'cable', primary: 'delts-side' },
  { name: 'Barbell Curl', type: 'barbell', primary: 'biceps', secondary: ['forearms'] },
  { name: 'EZ Bar Curl', type: 'barbell', primary: 'biceps', secondary: ['forearms'] },
  { name: 'Incline DB Curl', type: 'db', primary: 'biceps' },
  { name: 'Overhead Triceps Extension', type: 'db', primary: 'triceps' },
  { name: 'Rear Delt Cable Fly', type: 'cable', primary: 'delts-rear', secondary: ['rhomboids'] },

  // UB — Upper B (objemový)
  {
    name: 'Bench Press',
    type: 'barbell',
    primary: 'chest-mid',
    secondary: ['delts-front', 'triceps'],
  },
  {
    name: 'Flat DB Press',
    type: 'db',
    primary: 'chest-mid',
    secondary: ['delts-front', 'triceps'],
  },
  {
    name: 'Chest Supported Cable Row',
    type: 'cable',
    primary: 'traps-mid',
    secondary: ['biceps', 'rhomboids'],
  },
  { name: 'Cable Chest Fly (low)', type: 'cable', primary: 'chest-lower' },
  { name: 'Neutral Grip Pulldown', type: 'cable', primary: 'lats', secondary: ['biceps'] },
  {
    name: 'Cable Single Arm High Row',
    type: 'cable',
    primary: 'traps-mid',
    secondary: ['delts-rear', 'rhomboids'],
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
    secondary: ['glutes', 'hamstrings', 'adductors'],
  },
  { name: 'Leg Extension', type: 'machine', primary: 'quads' },
  {
    name: 'Romanian Deadlift (DB)',
    type: 'db',
    primary: 'hamstrings',
    secondary: ['glutes', 'rhomboids'],
  },
  {
    name: 'Standing Calf Raises',
    type: 'machine',
    primary: 'calves-gastroc',
    secondary: ['calves-soleus'],
  },
  { name: 'Cable Crunch', type: 'cable', primary: 'abs-upper', secondary: ['abs-lower'] },
  { name: 'Plank', type: 'bodyweight', primary: 'abs-lower', secondary: ['abs-upper', 'obliques'] },
  { name: 'Ab Wheel Rollout', type: 'bodyweight', primary: 'abs-upper', secondary: ['abs-lower'] },

  // LB — Lower B (hamstring důraz)
  {
    name: 'Romanian Deadlift (Barbell)',
    type: 'barbell',
    primary: 'hamstrings',
    secondary: ['glutes', 'rhomboids'],
  },
  { name: 'Lying Leg Curl', type: 'machine', primary: 'hamstrings' },
  { name: 'Goblet Squat', type: 'db', primary: 'quads', secondary: ['glutes', 'adductors'] },
  { name: 'Hip Thrust', type: 'barbell', primary: 'glutes', secondary: ['hamstrings'] },
  { name: 'Hanging Knee Raise', type: 'bodyweight', primary: 'abs-lower', secondary: ['obliques'] },
  {
    name: 'Dead Bug',
    type: 'bodyweight',
    primary: 'abs-lower',
    secondary: ['abs-upper', 'obliques'],
  },
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
