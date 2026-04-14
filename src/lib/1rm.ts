/**
 * Estimate 1 Rep Max (1RM) from a weight × reps set.
 * Returns the average of Epley and Brzycki formulas, rounded to 0.1 kg.
 * Brzycki is undefined for reps >= 37; in that case we fall back to Epley alone.
 */
export function estimate1RM(weight: number, reps: number): number {
  if (weight <= 0 || reps <= 0) return 0
  if (reps === 1) return weight
  const epley = weight * (1 + reps / 30)
  if (reps >= 37) return Math.round(epley * 10) / 10
  const brzycki = (weight * 36) / (37 - reps)
  return Math.round(((epley + brzycki) / 2) * 10) / 10
}
