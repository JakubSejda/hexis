import { describe, it, expect } from 'vitest'
import { ageFromBirthDate } from '@/lib/bio-age'

describe('ageFromBirthDate', () => {
  it('returns null when birthDate is null', () => {
    expect(ageFromBirthDate(null, new Date('2026-05-07'))).toBeNull()
  })

  it('returns 25 when birthday equals today and 25 years apart', () => {
    expect(ageFromBirthDate('2001-05-07', new Date('2026-05-07'))).toBe(25)
  })

  it('returns 24 the day before birthday', () => {
    expect(ageFromBirthDate('2001-05-08', new Date('2026-05-07'))).toBe(24)
  })

  it('handles leap-day birthday for non-leap year (Feb 28 = not yet)', () => {
    expect(ageFromBirthDate('2000-02-29', new Date('2026-02-28'))).toBe(25)
    expect(ageFromBirthDate('2000-02-29', new Date('2026-03-01'))).toBe(26)
  })

  it('returns null for invalid date string', () => {
    expect(ageFromBirthDate('not-a-date', new Date('2026-05-07'))).toBeNull()
  })

  it('returns 0 when birthDate is in the future', () => {
    expect(ageFromBirthDate('2030-01-01', new Date('2026-05-07'))).toBe(0)
  })
})
