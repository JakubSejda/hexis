import { describe, it, expect } from 'vitest'
import { computeRankSummary } from '../MuscleRankSection'

describe('computeRankSummary', () => {
  it('returns empty when sessionCount < 3', () => {
    expect(computeRankSummary({ 'chest-mid': 999_999 }, 0).kind).toBe('empty')
    expect(computeRankSummary({ 'chest-mid': 999_999 }, 2).kind).toBe('empty')
  })

  it('returns ranked when sessionCount >= 3', () => {
    const out = computeRankSummary({ 'chest-mid': 60000 }, 3)
    expect(out.kind).toBe('ranked')
  })

  it('fills missing slugs with rank D', () => {
    const out = computeRankSummary({ 'chest-mid': 60000 }, 5)
    if (out.kind !== 'ranked') throw new Error('expected ranked')
    expect(out.ranks['chest-mid']).toBe('S')
    expect(out.ranks.lats).toBe('D')
    expect(Object.keys(out.ranks).length).toBe(22)
  })

  it('counts ranks across all 22 slugs', () => {
    const out = computeRankSummary({ 'chest-mid': 60000 }, 5)
    if (out.kind !== 'ranked') throw new Error('expected ranked')
    const total = out.counts.S + out.counts.A + out.counts.B + out.counts.C + out.counts.D
    expect(total).toBe(22)
    expect(out.counts.S).toBe(1)
    expect(out.counts.D).toBe(21)
  })

  it('weakest3 picks the lowest-ranked slugs (tiebreak: smaller volume first)', () => {
    const volumes = {
      'chest-mid': 60000, // S
      lats: 50000, // S
      biceps: 30000, // S
      forearms: 0, // D
      'abs-lower': 0, // D
      obliques: 0, // D
      'delts-rear': 0, // D
    }
    const out = computeRankSummary(volumes, 5)
    if (out.kind !== 'ranked') throw new Error('expected ranked')
    expect(out.weakest3.length).toBe(3)
    for (const w of out.weakest3) {
      expect(w.rank).toBe('D')
    }
  })
})
