/**
 * Counts consecutive days ending today (or yesterday, if no session today yet)
 * on which at least one workout session started. Returns 0 if the chain is broken.
 */
export function computeWorkoutStreak(startedAts: Date[], now: Date = new Date()): number {
  if (startedAts.length === 0) return 0
  const days = new Set(startedAts.map((d) => d.toISOString().slice(0, 10)))
  const cursor = new Date(now)
  cursor.setUTCHours(0, 0, 0, 0)
  const todayKey = cursor.toISOString().slice(0, 10)
  if (!days.has(todayKey)) {
    cursor.setUTCDate(cursor.getUTCDate() - 1)
    if (!days.has(cursor.toISOString().slice(0, 10))) return 0
  }
  let streak = 0
  while (days.has(cursor.toISOString().slice(0, 10))) {
    streak += 1
    cursor.setUTCDate(cursor.getUTCDate() - 1)
  }
  return streak
}
