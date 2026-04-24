import { describe, it, expect } from 'vitest'
import { resolveWeekPeek } from '@/lib/week-peek'

const mkDate = (iso: string) => new Date(iso + 'T12:00:00Z')

describe('resolveWeekPeek', () => {
  // ISO week of 2026-04-24 (Friday) is Mon 2026-04-20 to Sun 2026-04-26
  const today = mkDate('2026-04-24') // Friday

  it('returns 7 days, Po through Ne', () => {
    const days = resolveWeekPeek([], today)
    expect(days).toHaveLength(7)
    expect(days.map((d) => d.weekdayLabel)).toEqual(['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'])
  })

  it('marks workout on days with a session', () => {
    const sessions = [mkDate('2026-04-20'), mkDate('2026-04-22'), mkDate('2026-04-24')]
    const days = resolveWeekPeek(sessions, today)
    expect(days[0]!.status).toBe('workout') // Po
    expect(days[1]!.status).toBe('rest') // Út — session yesterday, none today
    expect(days[2]!.status).toBe('workout') // St
    expect(days[3]!.status).toBe('rest') // Čt — session yesterday, none today
    expect(days[4]!.status).toBe('workout') // Pá (today)
    expect(days[5]!.status).toBe('empty') // So (future)
    expect(days[6]!.status).toBe('empty') // Ne (future)
  })

  it('marks all past days as empty if no sessions', () => {
    const days = resolveWeekPeek([], today)
    for (const d of days) expect(d.status).toBe('empty')
  })

  it('marks days with multiple sessions as workout (not double-counted)', () => {
    const sessions = [mkDate('2026-04-22'), mkDate('2026-04-22')]
    const days = resolveWeekPeek(sessions, today)
    expect(days[2]!.status).toBe('workout')
  })

  it('past day without session and without session the day before is empty', () => {
    const days = resolveWeekPeek([mkDate('2026-04-20')], today)
    expect(days[0]!.status).toBe('workout') // Po
    expect(days[1]!.status).toBe('rest') // Út — session yesterday
    expect(days[2]!.status).toBe('empty') // St — no session, no rest pattern
  })
})
