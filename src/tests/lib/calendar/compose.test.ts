import { describe, it, expect } from 'vitest'
import { composeCalendarMonth } from '@/lib/calendar/compose'

const PLAN_A = { id: 1, name: 'Plán A', order: 0 }
const PLAN_B = { id: 2, name: 'Plán B', order: 1 }

describe('composeCalendarMonth', () => {
  it('generates 31 days for May 2026', () => {
    const days = composeCalendarMonth({
      ym: '2026-05',
      today: '2026-05-15',
      sessionDates: new Set(),
      habitDates: new Set(),
      weighDates: new Set(),
      photoDates: new Set(),
      lastFinishedPlanId: null,
      plans: [],
    })
    expect(days).toHaveLength(31)
    expect(days[0]?.date).toBe('2026-05-01')
    expect(days[30]?.date).toBe('2026-05-31')
  })

  it('generates 28 days for Feb 2026 (non-leap)', () => {
    const days = composeCalendarMonth({
      ym: '2026-02',
      today: '2026-02-15',
      sessionDates: new Set(),
      habitDates: new Set(),
      weighDates: new Set(),
      photoDates: new Set(),
      lastFinishedPlanId: null,
      plans: [],
    })
    expect(days).toHaveLength(28)
    expect(days[27]?.date).toBe('2026-02-28')
  })

  it('generates 29 days for Feb 2028 (leap)', () => {
    const days = composeCalendarMonth({
      ym: '2028-02',
      today: '2028-02-15',
      sessionDates: new Set(),
      habitDates: new Set(),
      weighDates: new Set(),
      photoDates: new Set(),
      lastFinishedPlanId: null,
      plans: [],
    })
    expect(days).toHaveLength(29)
  })

  it('flags signals from the provided Sets', () => {
    const days = composeCalendarMonth({
      ym: '2026-05',
      today: '2026-05-15',
      sessionDates: new Set(['2026-05-03', '2026-05-04']),
      habitDates: new Set(['2026-05-04']),
      weighDates: new Set(['2026-05-07']),
      photoDates: new Set(['2026-05-04']),
      lastFinishedPlanId: null,
      plans: [],
    })
    const may3 = days.find((d) => d.date === '2026-05-03')!
    const may4 = days.find((d) => d.date === '2026-05-04')!
    const may7 = days.find((d) => d.date === '2026-05-07')!
    expect(may3.signals).toEqual({ training: true, habit: false, weigh: false, photo: false })
    expect(may4.signals).toEqual({ training: true, habit: true, weigh: false, photo: true })
    expect(may7.signals).toEqual({ training: false, habit: false, weigh: true, photo: false })
  })

  it('flags isToday / isFuture relative to `today`', () => {
    const days = composeCalendarMonth({
      ym: '2026-05',
      today: '2026-05-15',
      sessionDates: new Set(),
      habitDates: new Set(),
      weighDates: new Set(),
      photoDates: new Set(),
      lastFinishedPlanId: null,
      plans: [],
    })
    expect(days.find((d) => d.date === '2026-05-15')!.isToday).toBe(true)
    expect(days.find((d) => d.date === '2026-05-14')!.isFuture).toBe(false)
    expect(days.find((d) => d.date === '2026-05-16')!.isFuture).toBe(true)
  })

  it('injects forecastPlanName only on today+1 when rotation is known', () => {
    const days = composeCalendarMonth({
      ym: '2026-05',
      today: '2026-05-15',
      sessionDates: new Set(),
      habitDates: new Set(),
      weighDates: new Set(),
      photoDates: new Set(),
      lastFinishedPlanId: 1,
      plans: [PLAN_A, PLAN_B],
    })
    expect(days.find((d) => d.date === '2026-05-15')!.forecastPlanName).toBeNull()
    expect(days.find((d) => d.date === '2026-05-16')!.forecastPlanName).toBe('Plán B')
    expect(days.find((d) => d.date === '2026-05-17')!.forecastPlanName).toBeNull()
  })

  it('falls back to first plan when lastFinishedPlanId is null', () => {
    const days = composeCalendarMonth({
      ym: '2026-05',
      today: '2026-05-15',
      sessionDates: new Set(),
      habitDates: new Set(),
      weighDates: new Set(),
      photoDates: new Set(),
      lastFinishedPlanId: null,
      plans: [PLAN_A, PLAN_B],
    })
    expect(days.find((d) => d.date === '2026-05-16')!.forecastPlanName).toBe('Plán A')
  })

  it('leaves forecast null when there are no plans', () => {
    const days = composeCalendarMonth({
      ym: '2026-05',
      today: '2026-05-15',
      sessionDates: new Set(),
      habitDates: new Set(),
      weighDates: new Set(),
      photoDates: new Set(),
      lastFinishedPlanId: null,
      plans: [],
    })
    expect(days.find((d) => d.date === '2026-05-16')!.forecastPlanName).toBeNull()
  })

  it('does not inject forecast if today+1 is in next month', () => {
    const days = composeCalendarMonth({
      ym: '2026-05',
      today: '2026-05-31',
      sessionDates: new Set(),
      habitDates: new Set(),
      weighDates: new Set(),
      photoDates: new Set(),
      lastFinishedPlanId: null,
      plans: [PLAN_A, PLAN_B],
    })
    expect(days.every((d) => d.forecastPlanName === null)).toBe(true)
  })

  it('inStreak defaults to false (streak detection is a separate pass)', () => {
    const days = composeCalendarMonth({
      ym: '2026-05',
      today: '2026-05-15',
      sessionDates: new Set(['2026-05-01', '2026-05-02', '2026-05-03']),
      habitDates: new Set(),
      weighDates: new Set(),
      photoDates: new Set(),
      lastFinishedPlanId: null,
      plans: [],
    })
    expect(days.every((d) => d.inStreak === false)).toBe(true)
  })
})
