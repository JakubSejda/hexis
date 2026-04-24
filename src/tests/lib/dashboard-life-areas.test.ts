import { describe, it, expect } from 'vitest'
import {
  resolveTrainingCard,
  resolveNutritionCard,
  resolveProgressCard,
  resolveStatsCard,
} from '@/lib/dashboard-life-areas'

const mkDate = (iso: string) => new Date(iso + 'T12:00:00Z')

describe('resolveTrainingCard', () => {
  it('counts sessions in the last 7 days and labels "this week"', () => {
    const sessions = [
      mkDate('2026-04-24'),
      mkDate('2026-04-23'),
      mkDate('2026-04-22'),
      mkDate('2026-04-15'), // outside 7-day window
    ]
    const r = resolveTrainingCard(sessions, mkDate('2026-04-24'))
    expect(r.value).toBe('3 sessions')
    expect(r.secondary).toBe('this week')
    expect(r.empty).toBe(false)
  })

  it('is empty when no sessions in last 30 days', () => {
    const r = resolveTrainingCard([mkDate('2026-03-01')], mkDate('2026-04-24'))
    expect(r.empty).toBe(true)
    expect(r.value).toBe('Žádné tréninky')
    expect(r.secondary).toBe('Začni')
  })

  it('shows 0 sessions this week but not empty if recent activity in 30 days', () => {
    const r = resolveTrainingCard([mkDate('2026-04-10')], mkDate('2026-04-24'))
    expect(r.empty).toBe(false)
    expect(r.value).toBe('0 sessions')
    expect(r.secondary).toBe('this week')
  })
})

describe('resolveNutritionCard', () => {
  it('shows today kcal and target when both present', () => {
    const r = resolveNutritionCard({ kcalActual: 1840, targetKcal: 2400 }, { targetKcal: 2400 })
    expect(r.value).toMatch(/1\s840 kcal/)
    expect(r.secondary).toMatch(/of\s2\s400/)
    expect(r.empty).toBe(false)
  })

  it('shows dash when no today row but target exists', () => {
    const r = resolveNutritionCard(null, { targetKcal: 2400 })
    expect(r.value).toBe('—')
    expect(r.secondary).toMatch(/of\s2\s400/)
    expect(r.empty).toBe(false)
  })

  it('is empty when no today row and no target', () => {
    const r = resolveNutritionCard(null, null)
    expect(r.empty).toBe(true)
    expect(r.value).toBe('Nelogováno')
    expect(r.secondary).toBe('Přidej')
  })

  it('shows "no target" when today row has kcal but no target', () => {
    const r = resolveNutritionCard({ kcalActual: 1500, targetKcal: null }, null)
    expect(r.value).toMatch(/1\s500 kcal/)
    expect(r.secondary).toBe('no target')
    expect(r.empty).toBe(false)
  })
})

describe('resolveProgressCard', () => {
  it('computes weekly delta from last two non-null values', () => {
    const r = resolveProgressCard([80.2, 80.0, null, 79.8, 79.4])
    expect(r.value).toBe('−0.4 kg')
    expect(r.secondary).toBe('last week')
    expect(r.empty).toBe(false)
  })

  it('shows positive sign for weight gain', () => {
    const r = resolveProgressCard([80.0, 80.2])
    expect(r.value).toBe('+0.2 kg')
  })

  it('shows em-dash when only one measurement', () => {
    const r = resolveProgressCard([80.0])
    expect(r.value).toBe('—')
    expect(r.secondary).toBe('last week')
    expect(r.empty).toBe(false)
  })

  it('is empty when entire series is null', () => {
    const r = resolveProgressCard([null, null, null, null])
    expect(r.empty).toBe(true)
    expect(r.value).toBe('Bez měření')
    expect(r.secondary).toBe('Zvaž se')
  })
})

describe('resolveStatsCard', () => {
  it('shows level and tier name when level > 1 or xp >= 50', () => {
    const r = resolveStatsCard(17, 2340)
    expect(r.value).toBe('Level 17')
    expect(r.secondary).toBe('Warrior')
    expect(r.empty).toBe(false)
  })

  it('is empty for brand-new characters (level 1 & xp < 50)', () => {
    const r = resolveStatsCard(1, 30)
    expect(r.empty).toBe(true)
    expect(r.value).toBe('Nová postava')
    expect(r.secondary).toBe('L1')
  })

  it('is not empty at level 1 if xp >= 50', () => {
    const r = resolveStatsCard(1, 60)
    expect(r.empty).toBe(false)
    expect(r.value).toBe('Level 1')
  })
})
