const MS_PER_DAY = 86_400_000

export function daysSince(startedAt: string | null, today: Date): number | null {
  if (!startedAt) return null
  const startMs = Date.parse(`${startedAt}T00:00:00Z`)
  const todayMs = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())
  if (Number.isNaN(startMs)) return null
  if (startMs > todayMs) return 0
  return Math.floor((todayMs - startMs) / MS_PER_DAY) + 1
}
