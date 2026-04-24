import { describe, it, expect } from 'vitest'
import { resolveTodayQuest } from '@/lib/today-quest'

const mkDate = (iso: string) => new Date(iso + 'T12:00:00Z')

const samplePlans = [
  { id: 1, name: 'Upper A', order: 0 },
  { id: 2, name: 'Lower A', order: 1 },
  { id: 3, name: 'Upper B', order: 2 },
  { id: 4, name: 'Lower B', order: 3 },
]

describe('resolveTodayQuest', () => {
  const today = mkDate('2026-04-24')

  it('returns "active" when there is an unfinished session', () => {
    const q = resolveTodayQuest({
      activeSession: { id: 77, planName: 'Upper A', completed: 3, total: 5 },
      lastFinished: null,
      plans: samplePlans,
      exerciseCounts: new Map([
        [1, 5],
        [2, 6],
        [3, 5],
        [4, 6],
      ]),
      today,
    })
    expect(q).toEqual({
      kind: 'active',
      sessionId: 77,
      planName: 'Upper A',
      completed: 3,
      total: 5,
    })
  })

  it('returns "no-plan" when plans array is empty (no active session)', () => {
    const q = resolveTodayQuest({
      activeSession: null,
      lastFinished: null,
      plans: [],
      exerciseCounts: new Map(),
      today,
    })
    expect(q).toEqual({ kind: 'no-plan' })
  })

  it('returns "rest" when last finished session is today', () => {
    const q = resolveTodayQuest({
      activeSession: null,
      lastFinished: { planId: 1, finishedAt: mkDate('2026-04-24') },
      plans: samplePlans,
      exerciseCounts: new Map([
        [1, 5],
        [2, 6],
      ]),
      today,
    })
    expect(q).toEqual({ kind: 'rest', nextPlanName: 'Lower A' })
  })

  it('returns "rest" with null nextPlanName if only one plan exists', () => {
    const q = resolveTodayQuest({
      activeSession: null,
      lastFinished: { planId: 9, finishedAt: mkDate('2026-04-24') },
      plans: [{ id: 9, name: 'Only', order: 0 }],
      exerciseCounts: new Map([[9, 5]]),
      today,
    })
    expect(q).toEqual({ kind: 'rest', nextPlanName: 'Only' })
  })

  it('returns "scheduled" with the next plan after last finished', () => {
    const q = resolveTodayQuest({
      activeSession: null,
      lastFinished: { planId: 1, finishedAt: mkDate('2026-04-22') },
      plans: samplePlans,
      exerciseCounts: new Map([
        [1, 5],
        [2, 6],
        [3, 5],
        [4, 6],
      ]),
      today,
    })
    expect(q).toEqual({ kind: 'scheduled', planName: 'Lower A', exerciseCount: 6 })
  })

  it('returns "scheduled" with first plan when lastFinished is null and plans exist', () => {
    const q = resolveTodayQuest({
      activeSession: null,
      lastFinished: null,
      plans: samplePlans,
      exerciseCounts: new Map([[1, 5]]),
      today,
    })
    expect(q).toEqual({ kind: 'scheduled', planName: 'Upper A', exerciseCount: 5 })
  })

  it('wraps around to first plan when last finished was the last in rotation', () => {
    const q = resolveTodayQuest({
      activeSession: null,
      lastFinished: { planId: 4, finishedAt: mkDate('2026-04-22') },
      plans: samplePlans,
      exerciseCounts: new Map([
        [1, 5],
        [4, 6],
      ]),
      today,
    })
    expect(q).toEqual({ kind: 'scheduled', planName: 'Upper A', exerciseCount: 5 })
  })

  it('exerciseCount falls back to 0 when map has no entry for plan', () => {
    const q = resolveTodayQuest({
      activeSession: null,
      lastFinished: null,
      plans: samplePlans,
      exerciseCounts: new Map(),
      today,
    })
    expect(q).toEqual({ kind: 'scheduled', planName: 'Upper A', exerciseCount: 0 })
  })

  it('active state wins over all others (even with empty plans)', () => {
    const q = resolveTodayQuest({
      activeSession: { id: 1, planName: 'X', completed: 0, total: 0 },
      lastFinished: null,
      plans: [],
      exerciseCounts: new Map(),
      today,
    })
    expect(q.kind).toBe('active')
  })
})
