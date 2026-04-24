import { describe, it, expect } from 'vitest'
import { computeWorkoutStreak } from '@/lib/workout-streak'

describe('computeWorkoutStreak', () => {
  const mkDate = (iso: string) => new Date(iso + 'T12:00:00Z')

  it('returns 0 when no sessions', () => {
    expect(computeWorkoutStreak([], mkDate('2026-04-24'))).toBe(0)
  })

  it('returns 1 when session today', () => {
    expect(computeWorkoutStreak([mkDate('2026-04-24')], mkDate('2026-04-24'))).toBe(1)
  })

  it('returns 3 for three consecutive days ending today', () => {
    const dates = [mkDate('2026-04-24'), mkDate('2026-04-23'), mkDate('2026-04-22')]
    expect(computeWorkoutStreak(dates, mkDate('2026-04-24'))).toBe(3)
  })

  it('allows yesterday as start if no session today yet', () => {
    const dates = [mkDate('2026-04-23'), mkDate('2026-04-22')]
    expect(computeWorkoutStreak(dates, mkDate('2026-04-24'))).toBe(2)
  })

  it('returns 0 if gap of 2+ days from today', () => {
    const dates = [mkDate('2026-04-21'), mkDate('2026-04-20')]
    expect(computeWorkoutStreak(dates, mkDate('2026-04-24'))).toBe(0)
  })

  it('ignores duplicate sessions within a single day', () => {
    const dates = [mkDate('2026-04-24'), mkDate('2026-04-24'), mkDate('2026-04-23')]
    expect(computeWorkoutStreak(dates, mkDate('2026-04-24'))).toBe(2)
  })
})
