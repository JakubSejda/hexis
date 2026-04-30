import { describe, it, expect } from 'vitest'
import { countConsecutiveDays, countConsecutiveClosedWeeks, isoWeekKey } from '@/lib/habits/streak'

const d = (s: string) => s

describe('countConsecutiveDays', () => {
  it('returns 0 for empty completions', () => {
    expect(countConsecutiveDays([], d('2026-04-29'))).toBe(0)
  })

  it('returns 1 when only today is checked', () => {
    expect(countConsecutiveDays([d('2026-04-29')], d('2026-04-29'))).toBe(1)
  })

  it('returns 1 when only yesterday is checked, today missing (in-flight day)', () => {
    expect(countConsecutiveDays([d('2026-04-28')], d('2026-04-29'))).toBe(1)
  })

  it('returns 0 when today missing AND yesterday missing', () => {
    expect(countConsecutiveDays([d('2026-04-27')], d('2026-04-29'))).toBe(0)
  })

  it('counts back through consecutive days ending today', () => {
    expect(
      countConsecutiveDays(
        [d('2026-04-29'), d('2026-04-28'), d('2026-04-27'), d('2026-04-26')],
        d('2026-04-29')
      )
    ).toBe(4)
  })

  it('stops at the first gap', () => {
    expect(
      countConsecutiveDays([d('2026-04-29'), d('2026-04-28'), d('2026-04-26')], d('2026-04-29'))
    ).toBe(2)
  })

  it('ignores ordering of input array', () => {
    expect(
      countConsecutiveDays(
        [d('2026-04-26'), d('2026-04-29'), d('2026-04-28'), d('2026-04-27')],
        d('2026-04-29')
      )
    ).toBe(4)
  })

  it('deduplicates duplicate dates (defensive)', () => {
    expect(
      countConsecutiveDays([d('2026-04-29'), d('2026-04-29'), d('2026-04-28')], d('2026-04-29'))
    ).toBe(2)
  })
})

describe('isoWeekKey', () => {
  it('returns YYYY-Www format', () => {
    expect(isoWeekKey('2026-04-29')).toMatch(/^\d{4}-W\d{2}$/)
  })

  it('Monday and Sunday of the same ISO week share a key', () => {
    expect(isoWeekKey('2026-04-27')).toBe(isoWeekKey('2026-05-03'))
  })

  it('Sunday vs next Monday differ', () => {
    expect(isoWeekKey('2026-05-03')).not.toBe(isoWeekKey('2026-05-04'))
  })

  it('handles ISO year rollover (Jan 1 in week 53 of prior year)', () => {
    expect(isoWeekKey('2027-01-01')).toBe('2026-W53')
  })
})

describe('countConsecutiveClosedWeeks', () => {
  it('returns 0 for empty completions', () => {
    expect(countConsecutiveClosedWeeks([], 3, d('2026-04-29'))).toBe(0)
  })

  it('current week does NOT count toward streak even if target hit', () => {
    expect(
      countConsecutiveClosedWeeks(
        [d('2026-04-27'), d('2026-04-28'), d('2026-04-29')],
        3,
        d('2026-04-29')
      )
    ).toBe(0)
  })

  it('counts last closed week if it hit target', () => {
    expect(
      countConsecutiveClosedWeeks(
        [d('2026-04-20'), d('2026-04-21'), d('2026-04-22')],
        3,
        d('2026-04-29')
      )
    ).toBe(1)
  })

  it('counts back through consecutive closed weeks', () => {
    expect(
      countConsecutiveClosedWeeks(
        [
          d('2026-04-20'),
          d('2026-04-21'),
          d('2026-04-22'),
          d('2026-04-13'),
          d('2026-04-14'),
          d('2026-04-15'),
          d('2026-04-16'),
          d('2026-04-06'),
          d('2026-04-07'),
          d('2026-04-08'),
        ],
        3,
        d('2026-04-29')
      )
    ).toBe(3)
  })

  it('stops at first closed week below target', () => {
    expect(
      countConsecutiveClosedWeeks(
        [
          d('2026-04-20'),
          d('2026-04-21'),
          d('2026-04-22'),
          d('2026-04-13'),
          d('2026-04-14'),
          d('2026-04-06'),
          d('2026-04-07'),
          d('2026-04-08'),
        ],
        3,
        d('2026-04-29')
      )
    ).toBe(1)
  })

  it('skips current in-flight week when computing streak', () => {
    expect(
      countConsecutiveClosedWeeks(
        [
          d('2026-04-27'),
          d('2026-04-28'),
          d('2026-04-29'),
          d('2026-04-13'),
          d('2026-04-14'),
          d('2026-04-15'),
        ],
        3,
        d('2026-04-29')
      )
    ).toBe(0)
  })
})
