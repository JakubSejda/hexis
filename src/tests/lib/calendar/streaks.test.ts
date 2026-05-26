import { describe, it, expect } from 'vitest'
import { detectTrainingStreaks } from '@/lib/calendar/streaks'
import type { CalendarDay } from '@/lib/calendar/types'

function makeDay(date: string, training: boolean, opts?: Partial<CalendarDay>): CalendarDay {
  return {
    date,
    signals: { training, habit: false, weigh: false, photo: false },
    isToday: false,
    isFuture: false,
    inStreak: false,
    forecastPlanName: null,
    ...opts,
  }
}

describe('detectTrainingStreaks', () => {
  it('does nothing on an empty array', () => {
    const days: CalendarDay[] = []
    detectTrainingStreaks(days)
    expect(days).toEqual([])
  })

  it('does not mark a run of length 2', () => {
    const days = [
      makeDay('2026-05-01', true),
      makeDay('2026-05-02', true),
      makeDay('2026-05-03', false),
    ]
    detectTrainingStreaks(days)
    expect(days.every((d) => d.inStreak === false)).toBe(true)
  })

  it('marks every day of a run of length 3', () => {
    const days = [
      makeDay('2026-05-01', true),
      makeDay('2026-05-02', true),
      makeDay('2026-05-03', true),
      makeDay('2026-05-04', false),
    ]
    detectTrainingStreaks(days)
    expect(days[0]!.inStreak).toBe(true)
    expect(days[1]!.inStreak).toBe(true)
    expect(days[2]!.inStreak).toBe(true)
    expect(days[3]!.inStreak).toBe(false)
  })

  it('marks long runs (length 10)', () => {
    const days = Array.from({ length: 10 }, (_, i) =>
      makeDay(`2026-05-${String(i + 1).padStart(2, '0')}`, true)
    )
    detectTrainingStreaks(days)
    expect(days.every((d) => d.inStreak === true)).toBe(true)
  })

  it('handles multiple separate runs in one month', () => {
    const days = [
      makeDay('2026-05-01', true),
      makeDay('2026-05-02', true),
      makeDay('2026-05-03', true),
      makeDay('2026-05-04', false),
      makeDay('2026-05-05', true),
      makeDay('2026-05-06', true),
      makeDay('2026-05-07', true),
    ]
    detectTrainingStreaks(days)
    expect(days[0]!.inStreak).toBe(true)
    expect(days[2]!.inStreak).toBe(true)
    expect(days[3]!.inStreak).toBe(false)
    expect(days[4]!.inStreak).toBe(true)
    expect(days[6]!.inStreak).toBe(true)
  })

  it('breaks the run on a gap (false day)', () => {
    const days = [
      makeDay('2026-05-01', true),
      makeDay('2026-05-02', true),
      makeDay('2026-05-03', false),
      makeDay('2026-05-04', true),
      makeDay('2026-05-05', true),
    ]
    detectTrainingStreaks(days)
    expect(days.every((d) => d.inStreak === false)).toBe(true)
  })

  it('excludes future/forecast cells from streak (forecast does not count even if training=true)', () => {
    const days = [
      makeDay('2026-05-13', true),
      makeDay('2026-05-14', true),
      makeDay('2026-05-15', true, { isToday: true }),
      makeDay('2026-05-16', true, { isFuture: true, forecastPlanName: 'Plán A' }),
    ]
    detectTrainingStreaks(days)
    expect(days[0]!.inStreak).toBe(true)
    expect(days[1]!.inStreak).toBe(true)
    expect(days[2]!.inStreak).toBe(true)
    expect(days[3]!.inStreak).toBe(false)
  })
})
