import { describe, it, expect } from 'vitest'
import { computeAttributes, type AttributeInputs } from '@/lib/attributes'

const zero: AttributeInputs = {
  liftedKg: 0,
  sets: 0,
  nutritionDays30: 0,
  weighWeeks8: 0,
  sessions28: 0,
  bestHabitStreak: 0,
}

const byKey = (i: AttributeInputs) =>
  Object.fromEntries(computeAttributes(i).map((a) => [a.key, a.value]))

describe('computeAttributes', () => {
  it('starts every attribute at 1 for a new player', () => {
    expect(byKey(zero)).toEqual({ sil: 1, vit: 1, vyd: 1, dis: 1 })
  })

  it('grows Síla with lifted volume, fast early and slower later', () => {
    expect(byKey({ ...zero, liftedKg: 10_000 }).sil).toBe(5)
    expect(byKey({ ...zero, liftedKg: 100_000 }).sil).toBe(15)
  })

  it('grows Vitalita from logged food days and weigh-in weeks', () => {
    expect(byKey({ ...zero, nutritionDays30: 30, weighWeeks8: 8 }).vit).toBe(1 + 10 + 4)
  })

  it('grows Výdrž with the number of sets', () => {
    expect(byKey({ ...zero, sets: 1000 }).vyd).toBe(11)
  })

  it('grows Disciplína with recent sessions and habit streaks', () => {
    expect(byKey({ ...zero, sessions28: 12, bestHabitStreak: 21 }).dis).toBe(1 + 6 + 3)
  })

  it('labels every attribute in Czech with the habit that feeds it', () => {
    const attrs = computeAttributes(zero)
    expect(attrs.map((a) => a.short)).toEqual(['SÍL', 'VIT', 'VÝD', 'DIS'])
    for (const a of attrs) expect(a.source).toMatch(/^z /)
  })
})
