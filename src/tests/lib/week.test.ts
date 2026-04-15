import { describe, it, expect } from 'vitest'
import { toWeekStart, weekRange } from '@/lib/week'

describe('toWeekStart', () => {
  it('returns Monday for a Wednesday', () => {
    expect(toWeekStart(new Date('2026-04-15'))).toBe('2026-04-13')
  })
  it('returns same day for a Monday', () => {
    expect(toWeekStart(new Date('2026-04-13'))).toBe('2026-04-13')
  })
  it('returns previous Monday for a Sunday', () => {
    expect(toWeekStart(new Date('2026-04-19'))).toBe('2026-04-13')
  })
  it('handles year boundary correctly', () => {
    expect(toWeekStart(new Date('2026-01-01'))).toBe('2025-12-29')
  })
})

describe('weekRange', () => {
  it('returns N consecutive Mondays ending at this week', () => {
    const range = weekRange(new Date('2026-04-15'), 3)
    expect(range).toEqual(['2026-03-30', '2026-04-06', '2026-04-13'])
  })
})
