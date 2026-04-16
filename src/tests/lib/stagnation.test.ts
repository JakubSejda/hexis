import { describe, it, expect } from 'vitest'
import { detectStagnation } from '@/lib/stagnation'

describe('detectStagnation', () => {
  const today = new Date('2026-04-16')

  it('returns not stagnant when PR was recent', () => {
    const result = detectStagnation({
      exerciseId: 1,
      exerciseName: 'Bench Press',
      sets: [
        { weightKg: 80, reps: 5, completedAt: '2026-04-14' },
        { weightKg: 82.5, reps: 5, completedAt: '2026-04-16' },
      ],
      now: today,
    })
    expect(result.isStagnant).toBe(false)
    expect(result.weeksSincePr).toBe(0)
  })

  it('returns stagnant after 2 weeks without PR', () => {
    const result = detectStagnation({
      exerciseId: 1,
      exerciseName: 'Bench Press',
      sets: [
        { weightKg: 80, reps: 8, completedAt: '2026-03-25' },
        { weightKg: 80, reps: 6, completedAt: '2026-04-01' },
        { weightKg: 80, reps: 7, completedAt: '2026-04-08' },
        { weightKg: 80, reps: 7, completedAt: '2026-04-15' },
      ],
      now: today,
    })
    expect(result.isStagnant).toBe(true)
    expect(result.weeksSincePr).toBeGreaterThanOrEqual(2)
    expect(result.suggestion).toBe('deload')
  })

  it('suggests variation after 4+ weeks', () => {
    const result = detectStagnation({
      exerciseId: 1,
      exerciseName: 'Bench Press',
      sets: [
        { weightKg: 80, reps: 5, completedAt: '2026-03-01' },
        { weightKg: 80, reps: 5, completedAt: '2026-03-15' },
        { weightKg: 80, reps: 5, completedAt: '2026-04-01' },
        { weightKg: 80, reps: 5, completedAt: '2026-04-15' },
      ],
      now: today,
    })
    expect(result.isStagnant).toBe(true)
    expect(result.suggestion).toBe('variation')
  })

  it('handles empty sets array', () => {
    const result = detectStagnation({
      exerciseId: 1,
      exerciseName: 'Bench Press',
      sets: [],
      now: today,
    })
    expect(result.isStagnant).toBe(false)
    expect(result.weeksSincePr).toBe(0)
  })

  it('handles single set', () => {
    const result = detectStagnation({
      exerciseId: 1,
      exerciseName: 'Bench Press',
      sets: [{ weightKg: 60, reps: 10, completedAt: '2026-04-14' }],
      now: today,
    })
    expect(result.isStagnant).toBe(false)
  })
})
