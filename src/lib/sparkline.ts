/**
 * Generates an SVG path `d` attribute for a sparkline.
 * Null values are skipped; neighbors are connected directly.
 * Returns null when there are no numeric values.
 */
export function sparklinePath(
  values: (number | null)[],
  width: number,
  height: number
): string | null {
  const points = values
    .map((v, i) => (v === null ? null : { i, v }))
    .filter((p): p is { i: number; v: number } => p !== null)
  if (points.length === 0) return null

  const nums = points.map((p) => p.v)
  const min = Math.min(...nums)
  const max = Math.max(...nums)
  const range = max - min
  const isConstant = range === 0
  const stepX = values.length > 1 ? width / (values.length - 1) : 0

  const segs = points.map((p, idx) => {
    const x = p.i * stepX
    const y = isConstant ? height / 2 : height - ((p.v - min) / range) * height
    return `${idx === 0 ? 'M' : 'L'} ${round(x)} ${round(y)}`
  })

  return segs.join(' ')
}

function round(n: number): number {
  return Math.round(n * 100) / 100
}
