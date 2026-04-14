import { describe, it, expect } from 'vitest'
import { suggestNextSet } from '@/lib/progression'

const BARBELL_PLAN = {
  targetSets: 4,
  repMin: 6,
  repMax: 8,
  exerciseType: 'barbell' as const,
}

describe('suggestNextSet — first session (no history)', () => {
  it('prefills repMin and lets user set weight (weight=null)', () => {
    const r = suggestNextSet({
      history: [],
      planExercise: BARBELL_PLAN,
      currentSessionSets: [],
    })
    expect(r.weightKg).toBeNull()
    expect(r.reps).toBe(6)
    expect(r.reason).toMatch(/první/i)
  })
})

describe('suggestNextSet — start of session, with history', () => {
  it('all sets hit repMax → +2.5 kg, reset to repMin', () => {
    const r = suggestNextSet({
      history: [
        {
          startedAt: new Date(),
          sets: [
            { weightKg: 60, reps: 8 },
            { weightKg: 60, reps: 8 },
            { weightKg: 60, reps: 8 },
            { weightKg: 60, reps: 8 },
          ],
        },
      ],
      planExercise: BARBELL_PLAN,
      currentSessionSets: [],
    })
    expect(r.weightKg).toBe(62.5)
    expect(r.reps).toBe(6)
    expect(r.reason).toMatch(/progres/i)
  })

  it('partial hit → same weight, +1 rep capped at repMax', () => {
    const r = suggestNextSet({
      history: [
        {
          startedAt: new Date(),
          sets: [
            { weightKg: 60, reps: 8 },
            { weightKg: 60, reps: 7 },
            { weightKg: 60, reps: 7 },
            { weightKg: 60, reps: 7 },
          ],
        },
      ],
      planExercise: BARBELL_PLAN,
      currentSessionSets: [],
    })
    expect(r.weightKg).toBe(60)
    expect(r.reps).toBe(8)
  })

  it('last session degraded (below repMin) → same weight, repMin', () => {
    const r = suggestNextSet({
      history: [
        {
          startedAt: new Date(),
          sets: [
            { weightKg: 60, reps: 5 },
            { weightKg: 60, reps: 5 },
          ],
        },
      ],
      planExercise: BARBELL_PLAN,
      currentSessionSets: [],
    })
    expect(r.weightKg).toBe(60)
    expect(r.reps).toBe(6)
  })

  it('db increment is +1 kg (not 2.5)', () => {
    const r = suggestNextSet({
      history: [
        {
          startedAt: new Date(),
          sets: [
            { weightKg: 20, reps: 8 },
            { weightKg: 20, reps: 8 },
            { weightKg: 20, reps: 8 },
            { weightKg: 20, reps: 8 },
          ],
        },
      ],
      planExercise: { ...BARBELL_PLAN, exerciseType: 'db' },
      currentSessionSets: [],
    })
    expect(r.weightKg).toBe(21)
  })

  it('bodyweight: weight=null, reps only', () => {
    const r = suggestNextSet({
      history: [
        {
          startedAt: new Date(),
          sets: [
            { weightKg: null, reps: 10 },
            { weightKg: null, reps: 10 },
          ],
        },
      ],
      planExercise: { targetSets: 3, repMin: 8, repMax: 12, exerciseType: 'bodyweight' },
      currentSessionSets: [],
    })
    expect(r.weightKg).toBeNull()
    expect(r.reps).toBe(11)
  })
})

describe('suggestNextSet — per-set re-eval within current session', () => {
  it('previous set hit target → next set same weight same reps', () => {
    const r = suggestNextSet({
      history: [
        {
          startedAt: new Date(),
          sets: [
            { weightKg: 60, reps: 8 },
            { weightKg: 60, reps: 8 },
            { weightKg: 60, reps: 8 },
            { weightKg: 60, reps: 8 },
          ],
        },
      ],
      planExercise: BARBELL_PLAN,
      currentSessionSets: [{ setIndex: 0, weightKg: 62.5, reps: 8 }],
    })
    expect(r.weightKg).toBe(62.5)
    // reps: the previous set logged 8 which is ≥ repMin, so keep 8
    expect(r.reps).toBe(8)
  })

  it('previous set RPE 10 and below repMin → down-target weight', () => {
    const r = suggestNextSet({
      history: [
        {
          startedAt: new Date(),
          sets: [
            { weightKg: 60, reps: 8 },
            { weightKg: 60, reps: 8 },
            { weightKg: 60, reps: 8 },
            { weightKg: 60, reps: 8 },
          ],
        },
      ],
      planExercise: BARBELL_PLAN,
      currentSessionSets: [{ setIndex: 0, weightKg: 62.5, reps: 4, rpe: 10 }],
    })
    expect(r.weightKg).toBe(60) // down-weight by 1 increment
    expect(r.reason).toMatch(/down/i)
  })

  it('previous set at/above repMin → keep same', () => {
    const r = suggestNextSet({
      history: [
        {
          startedAt: new Date(),
          sets: [
            { weightKg: 60, reps: 8 },
            { weightKg: 60, reps: 8 },
            { weightKg: 60, reps: 8 },
            { weightKg: 60, reps: 8 },
          ],
        },
      ],
      planExercise: BARBELL_PLAN,
      currentSessionSets: [{ setIndex: 0, weightKg: 62.5, reps: 6 }],
    })
    expect(r.weightKg).toBe(62.5)
  })
})

describe('suggestNextSet — ad-hoc exercise (no plan)', () => {
  it('without planExercise and without history → empty suggestion', () => {
    const r = suggestNextSet({
      history: [],
      planExercise: null,
      currentSessionSets: [],
    })
    expect(r.weightKg).toBeNull()
    expect(r.reps).toBeNull()
    expect(r.reason).toMatch(/ad-hoc|nová/i)
  })

  it('ad-hoc with history uses last session as anchor', () => {
    const r = suggestNextSet({
      history: [
        {
          startedAt: new Date(),
          sets: [
            { weightKg: 30, reps: 10 },
            { weightKg: 30, reps: 10 },
          ],
        },
      ],
      planExercise: null,
      currentSessionSets: [],
    })
    expect(r.weightKg).toBe(30)
    expect(r.reps).toBe(10)
  })
})
