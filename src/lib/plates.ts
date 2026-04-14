export type PlateInventoryEntry = { weightKg: number; pairs: number }

export type CalculateArgs = {
  targetKg: number
  bar: { weightKg: number }
  inventory: PlateInventoryEntry[]
}

export type PlateResult = {
  perSide: Array<{ weightKg: number; count: number }>
  missingKg: number
}

/**
 * Returns true if plateWeight can be exactly decomposed into 2 distinct smaller
 * plates from the given list, where neither of those plates is itself decomposable
 * the same way. This marks a plate as "redundant" (e.g. 15 = 10+5).
 */
function isRedundant(plateWeight: number, all: PlateInventoryEntry[]): boolean {
  const smaller = all.filter((p) => p.weightKg < plateWeight)
  for (let i = 0; i < smaller.length; i++) {
    for (let j = i + 1; j < smaller.length; j++) {
      const a = smaller[i]!.weightKg
      const b = smaller[j]!.weightKg
      if (Math.abs(a + b - plateWeight) < 1e-9) {
        if (!isRedundant(a, all) && !isRedundant(b, all)) {
          return true
        }
      }
    }
  }
  return false
}

/**
 * Greedy-fill plate calculator (heaviest-first, redundant-plate-aware).
 * Takes target total weight, bar weight, and inventory (pairs available).
 * Returns plates per side (heaviest first) and missingKg if inventory is insufficient.
 *
 * Redundant plates (e.g. 15 kg = 10+5, both non-redundant) are skipped when a
 * heavier non-same plate has already been placed, forcing granular decomposition.
 * Exception: if the rack is empty when we reach the redundant plate, use it normally
 * (no smaller combination has been "avoided" yet).
 */
export function calculatePlates(args: CalculateArgs): PlateResult {
  const { targetKg, bar, inventory } = args
  if (targetKg < bar.weightKg) {
    throw new Error(`Cílová váha ${targetKg} kg je pod váhou bar (${bar.weightKg} kg)`)
  }
  let remainder = (targetKg - bar.weightKg) / 2
  if (remainder <= 0) return { perSide: [], missingKg: 0 }

  const sorted = [...inventory].sort((a, b) => b.weightKg - a.weightKg)
  const redundant = new Set(sorted.map((p) => p.weightKg).filter((w) => isRedundant(w, sorted)))

  const perSide: PlateResult['perSide'] = []
  let lastPlacedWeight: number | null = null

  for (const plate of sorted) {
    if (remainder <= 0) break
    let used = 0
    while (used < plate.pairs && plate.weightKg <= remainder + 1e-6) {
      // Skip redundant plates unless:
      // - the rack is still completely empty (first plate ever), OR
      // - this plate is the same weight as the last placed plate (continuing a run of same denomination)
      const rackEmpty = perSide.length === 0 && used === 0
      const continuingRun = plate.weightKg === lastPlacedWeight || used > 0
      if (redundant.has(plate.weightKg) && !rackEmpty && !continuingRun) break
      remainder -= plate.weightKg
      used += 1
    }
    if (used > 0) {
      perSide.push({ weightKg: plate.weightKg, count: used })
      lastPlacedWeight = plate.weightKg
    }
  }

  const missingKg = remainder > 1e-6 ? Math.round(remainder * 2 * 100) / 100 : 0
  return { perSide, missingKg }
}
