export type Goal = 'lower-is-good' | 'higher-is-good'
export type Direction = 'good' | 'bad' | 'neutral'

/** Returns `current - previous`, or null if either value is missing. */
export function calcDelta(current: number | null, previous: number | null): number | null {
  if (current == null || previous == null) return null
  return current - previous
}

/** Interprets a delta value as good/bad/neutral given the optimization direction. */
export function deltaDirection(delta: number | null, goal: Goal): Direction {
  if (delta == null || delta === 0) return 'neutral'
  if (goal === 'lower-is-good') return delta < 0 ? 'good' : 'bad'
  return delta > 0 ? 'good' : 'bad'
}
