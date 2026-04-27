import type { DB } from '../client'
import { muscleGroups } from '../schema'

export const MUSCLE_GROUPS = [
  // Chest split
  { slug: 'chest-upper', name: 'Hrudník — horní' },
  { slug: 'chest-mid', name: 'Hrudník — střední' },
  { slug: 'chest-lower', name: 'Hrudník — spodní' },
  // Deltoid split
  { slug: 'delts-front', name: 'Přední deltoid' },
  { slug: 'delts-side', name: 'Boční deltoid' },
  { slug: 'delts-rear', name: 'Zadní deltoid' },
  // Back
  { slug: 'lats', name: 'Záda — latissimus' },
  { slug: 'traps-upper', name: 'Trapézy — horní' },
  { slug: 'traps-mid', name: 'Trapézy — střední' },
  { slug: 'rhomboids', name: 'Rhomboidy' },
  // Arms
  { slug: 'biceps', name: 'Biceps' },
  { slug: 'triceps', name: 'Triceps' },
  { slug: 'forearms', name: 'Předloktí' },
  // Core
  { slug: 'abs-upper', name: 'Břicho — horní' },
  { slug: 'abs-lower', name: 'Břicho — spodní' },
  { slug: 'obliques', name: 'Šikmé břicho' },
  // Legs
  { slug: 'quads', name: 'Quadriceps' },
  { slug: 'hamstrings', name: 'Hamstringy' },
  { slug: 'glutes', name: 'Hýždě' },
  { slug: 'calves-gastroc', name: 'Lýtka — gastrocnemius' },
  { slug: 'calves-soleus', name: 'Lýtka — soleus' },
  { slug: 'adductors', name: 'Přitahovače' },
] as const

export async function seedMuscleGroups(db: DB): Promise<void> {
  await db.insert(muscleGroups).values([...MUSCLE_GROUPS])
}
