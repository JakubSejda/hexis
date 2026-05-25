import { describe, it, expect } from 'vitest'
import { daysSince } from '@/lib/bio-day-count'

describe('daysSince', () => {
  const today = new Date('2026-05-07T12:00:00Z')

  it('returns null when startedAt is null', () => {
    expect(daysSince(null, today)).toBeNull()
  })

  it('returns 1 when startedAt equals today (inclusive Day 1)', () => {
    expect(daysSince('2026-05-07', today)).toBe(1)
  })

  it('returns 2 when startedAt is yesterday', () => {
    expect(daysSince('2026-05-06', today)).toBe(2)
  })

  it('returns 366 for one year ago (2025-05-07 to 2026-05-07, inclusive, with leap year)', () => {
    expect(daysSince('2025-05-07', today)).toBe(366)
  })

  it('returns 0 when startedAt is in the future', () => {
    expect(daysSince('2026-12-31', today)).toBe(0)
  })

  it('treats the date as user-local (no TZ shift)', () => {
    expect(daysSince('2026-05-07', new Date('2026-05-07T23:59:00Z'))).toBe(1)
  })
})
