import { describe, it, expect } from 'vitest'
import { calcStreak } from '@/lib/nutrition-streak'

describe('calcStreak', () => {
  it('returns 0 when no days', () => {
    expect(calcStreak({ today: new Date('2026-04-15'), days: [] })).toBe(0)
  })
  it('counts back from yesterday, ignoring today', () => {
    expect(
      calcStreak({
        today: new Date('2026-04-15'),
        days: [
          { date: '2026-04-15', class: 'empty' },
          { date: '2026-04-14', class: 'hit' },
          { date: '2026-04-13', class: 'hit' },
          { date: '2026-04-12', class: 'hit' },
        ],
      })
    ).toBe(3)
  })
  it('breaks on a miss', () => {
    expect(
      calcStreak({
        today: new Date('2026-04-15'),
        days: [
          { date: '2026-04-14', class: 'hit' },
          { date: '2026-04-13', class: 'miss' },
          { date: '2026-04-12', class: 'hit' },
        ],
      })
    ).toBe(1)
  })
  it('breaks on an empty day', () => {
    expect(
      calcStreak({
        today: new Date('2026-04-15'),
        days: [
          { date: '2026-04-14', class: 'hit' },
          { date: '2026-04-13', class: 'empty' },
          { date: '2026-04-12', class: 'hit' },
        ],
      })
    ).toBe(1)
  })
})
