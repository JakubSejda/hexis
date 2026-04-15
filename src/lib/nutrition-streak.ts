import type { DayClass } from './nutrition-classify'

/**
 * Counts consecutive "hit" days going backwards from yesterday.
 * Today is ignored (incomplete data). Streak breaks on "miss" or "empty".
 */
export function calcStreak(args: {
  today: Date
  days: { date: string; class: DayClass }[]
}): number {
  const byDate = new Map(args.days.map((d) => [d.date, d.class]))
  let streak = 0
  const cursor = new Date(
    Date.UTC(args.today.getUTCFullYear(), args.today.getUTCMonth(), args.today.getUTCDate())
  )
  cursor.setUTCDate(cursor.getUTCDate() - 1)
  for (let i = 0; i < 365; i++) {
    const key = cursor.toISOString().slice(0, 10)
    if (byDate.get(key) === 'hit') {
      streak++
    } else {
      break
    }
    cursor.setUTCDate(cursor.getUTCDate() - 1)
  }
  return streak
}
