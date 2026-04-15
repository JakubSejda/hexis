/** Returns the Monday of the ISO week containing `date` as YYYY-MM-DD. */
export function toWeekStart(date: Date): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  const dayOfWeek = d.getUTCDay()
  const offset = dayOfWeek === 0 ? 6 : dayOfWeek - 1
  d.setUTCDate(d.getUTCDate() - offset)
  return d.toISOString().slice(0, 10)
}

/** Returns `weeks` consecutive Monday dates (YYYY-MM-DD) ending at the week containing `endDate`. */
export function weekRange(endDate: Date, weeks: number): string[] {
  const end = toWeekStart(endDate)
  const out: string[] = []
  const cursor = new Date(`${end}T00:00:00Z`)
  for (let i = weeks - 1; i >= 0; i--) {
    const d = new Date(cursor)
    d.setUTCDate(d.getUTCDate() - i * 7)
    out.push(d.toISOString().slice(0, 10))
  }
  return out
}
