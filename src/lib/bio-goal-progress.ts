export function goalProgress(
  start: number | null,
  current: number | null,
  goal: number | null
): number {
  if (start === null || current === null || goal === null) return 0
  if (start === goal) return 1
  const span = goal - start
  const moved = current - start
  const ratio = moved / span
  if (ratio <= 0) return 0
  if (ratio >= 1) return 1
  return ratio
}
