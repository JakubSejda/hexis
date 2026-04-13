import type { DB } from '../client'
import { muscleGroups } from '../schema'

export const MUSCLE_GROUPS = [
  { slug: 'chest', name: 'Hrudník' },
  { slug: 'back-lats', name: 'Záda — Lats' },
  { slug: 'back-mid', name: 'Záda — střed' },
  { slug: 'back-rear-delt', name: 'Zadní ramena' },
  { slug: 'shoulders', name: 'Ramena' },
  { slug: 'biceps', name: 'Biceps' },
  { slug: 'triceps', name: 'Triceps' },
  { slug: 'forearms', name: 'Předloktí' },
  { slug: 'abs', name: 'Core / Břicho' },
  { slug: 'obliques', name: 'Šikmé břicho' },
  { slug: 'quads', name: 'Quadriceps' },
  { slug: 'hamstrings', name: 'Hamstringy' },
  { slug: 'glutes', name: 'Hýždě' },
  { slug: 'calves', name: 'Lýtka' },
  { slug: 'adductors', name: 'Přitahovače' },
] as const

export async function seedMuscleGroups(db: DB): Promise<void> {
  await db.insert(muscleGroups).values(MUSCLE_GROUPS)
}
