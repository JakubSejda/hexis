import { describe, it, expect } from 'vitest'
import { resolveUserToday } from '@/lib/habits/tz'

describe('resolveUserToday', () => {
  it('returns UTC today when offset header is absent', () => {
    const now = new Date('2026-04-29T14:00:00Z')
    expect(resolveUserToday(null, now)).toBe('2026-04-29')
  })

  it('shifts forward when offset is negative (UTC+2 = -120 from JS perspective)', () => {
    const now = new Date('2026-04-29T23:30:00Z')
    expect(resolveUserToday('-120', now)).toBe('2026-04-30')
  })

  it('shifts backward when offset is positive (UTC-5 = +300)', () => {
    const now = new Date('2026-04-29T02:00:00Z')
    expect(resolveUserToday('300', now)).toBe('2026-04-28')
  })

  it('caps offset at +/- 840 minutes (14h)', () => {
    const now = new Date('2026-04-29T12:00:00Z')
    expect(resolveUserToday('9999', now)).toBe('2026-04-28')
  })

  it('falls back to UTC on garbage input', () => {
    const now = new Date('2026-04-29T14:00:00Z')
    expect(resolveUserToday('not-a-number', now)).toBe('2026-04-29')
  })
})
