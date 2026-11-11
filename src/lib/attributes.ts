/**
 * Character attributes, derived from what the player actually logs — no
 * stored stats, no migration. Each one grows with a different habit so the
 * profile rewards a balanced routine, and each carries the reason it moved.
 */

export type AttributeKey = 'sil' | 'vit' | 'vyd' | 'dis'

export type Attribute = {
  key: AttributeKey
  short: string
  label: string
  value: number
  source: string
}

export type AttributeInputs = {
  /** lifetime kg × reps */
  liftedKg: number
  /** lifetime logged sets */
  sets: number
  /** days with a nutrition entry in the last 30 days */
  nutritionDays30: number
  /** weeks with a weight entry in the last 8 weeks */
  weighWeeks8: number
  /** workout sessions started in the last 28 days */
  sessions28: number
  /** longest current streak among active habits */
  bestHabitStreak: number
}

const floor = Math.floor

export function computeAttributes(i: AttributeInputs): Attribute[] {
  return [
    {
      key: 'sil',
      short: 'SÍL',
      label: 'Síla',
      // 10 t lifted ≈ 5, 100 t ≈ 15: early gains come fast, later ones are earned.
      value: 1 + floor(Math.sqrt(Math.max(0, i.liftedKg) / 500)),
      source: 'z objemu tréninku',
    },
    {
      key: 'vit',
      short: 'VIT',
      label: 'Vitalita',
      value: 1 + floor(i.nutritionDays30 / 3) + floor(i.weighWeeks8 / 2),
      source: 'z jídla a měření',
    },
    {
      key: 'vyd',
      short: 'VÝD',
      label: 'Výdrž',
      // 100 sets ≈ 4, 1 000 sets ≈ 11
      value: 1 + floor(Math.sqrt(Math.max(0, i.sets) / 10)),
      source: 'z počtu sérií',
    },
    {
      key: 'dis',
      short: 'DIS',
      label: 'Disciplína',
      value: 1 + floor(i.sessions28 / 2) + floor(i.bestHabitStreak / 7),
      source: 'z pravidelnosti a návyků',
    },
  ]
}
