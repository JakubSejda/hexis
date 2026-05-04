const MS_PER_DAY = 86_400_000

function parseYmd(ymd: string): Date {
  const parts = ymd.split('-').map(Number)
  const y = parts[0] ?? 1970
  const m = parts[1] ?? 1
  const d = parts[2] ?? 1
  return new Date(Date.UTC(y, m - 1, d))
}

function toYmd(date: Date): string {
  const y = date.getUTCFullYear()
  const m = String(date.getUTCMonth() + 1).padStart(2, '0')
  const d = String(date.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function addDaysYmd(ymd: string, delta: number): string {
  const t = parseYmd(ymd).getTime()
  return toYmd(new Date(t + delta * MS_PER_DAY))
}

export function countConsecutiveDays(completions: string[], today: string): number {
  const set = new Set(completions)
  let cursor: string
  if (set.has(today)) {
    cursor = today
  } else if (set.has(addDaysYmd(today, -1))) {
    cursor = addDaysYmd(today, -1)
  } else {
    return 0
  }
  let n = 0
  while (set.has(cursor)) {
    n++
    cursor = addDaysYmd(cursor, -1)
  }
  return n
}

export function isoWeekKey(ymd: string): string {
  const date = parseYmd(ymd)
  const dayOfWeek = date.getUTCDay() || 7
  date.setUTCDate(date.getUTCDate() + 4 - dayOfWeek)
  const year = date.getUTCFullYear()
  const yearStart = new Date(Date.UTC(year, 0, 1))
  const week = Math.ceil(((date.getTime() - yearStart.getTime()) / MS_PER_DAY + 1) / 7)
  return `${year}-W${String(week).padStart(2, '0')}`
}

export function countConsecutiveClosedWeeks(
  completions: string[],
  weeklyTarget: number,
  today: string
): number {
  const currentWeek = isoWeekKey(today)
  const counts = new Map<string, number>()
  for (const c of completions) {
    const key = isoWeekKey(c)
    if (key === currentWeek) continue
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }

  let cursor = addDaysYmd(today, -7)
  let n = 0
  for (let i = 0; i < 200; i++) {
    const key = isoWeekKey(cursor)
    if ((counts.get(key) ?? 0) >= weeklyTarget) {
      n++
      cursor = addDaysYmd(cursor, -7)
    } else {
      break
    }
  }
  return n
}
