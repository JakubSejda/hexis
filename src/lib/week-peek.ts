export type WeekPeekDay = {
  weekdayLabel: string
  status: 'workout' | 'rest' | 'empty'
}

const LABELS = ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'] as const

function isoKey(d: Date): string {
  return d.toISOString().slice(0, 10)
}

/** Monday of the ISO week containing `d`, at 00:00 UTC. */
function mondayOf(d: Date): Date {
  const out = new Date(d)
  out.setUTCHours(0, 0, 0, 0)
  // getUTCDay: 0=Sun, 1=Mon, ..., 6=Sat → shift so Monday=0
  const shift = (out.getUTCDay() + 6) % 7
  out.setUTCDate(out.getUTCDate() - shift)
  return out
}

export function resolveWeekPeek(sessionDates: Date[], today: Date): WeekPeekDay[] {
  const mon = mondayOf(today)
  const todayKey = isoKey(today)
  const sessionDayKeys = new Set(sessionDates.map(isoKey))

  const result: WeekPeekDay[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(mon)
    d.setUTCDate(mon.getUTCDate() + i)
    const key = isoKey(d)
    const prevKey = (() => {
      const p = new Date(d)
      p.setUTCDate(p.getUTCDate() - 1)
      return isoKey(p)
    })()

    const hasSession = sessionDayKeys.has(key)
    const hadYesterday = sessionDayKeys.has(prevKey)
    const isFuture = key > todayKey

    let status: WeekPeekDay['status']
    if (isFuture) status = 'empty'
    else if (hasSession) status = 'workout'
    else if (hadYesterday) status = 'rest'
    else status = 'empty'

    result.push({ weekdayLabel: LABELS[i]!, status })
  }
  return result
}
