import { describe, it, expect } from 'vitest'
import { sparklinePath } from '@/lib/sparkline'

describe('sparklinePath', () => {
  it('returns null for empty data', () => {
    expect(sparklinePath([], 100, 32)).toBeNull()
  })
  it('returns null when all values are null', () => {
    expect(sparklinePath([null, null], 100, 32)).toBeNull()
  })
  it('produces straight horizontal line for constant values', () => {
    const path = sparklinePath([5, 5, 5], 100, 32)
    expect(path).toMatch(/M 0 16 L 50 16 L 100 16/)
  })
  it('skips null values and connects neighbors', () => {
    const path = sparklinePath([1, null, 3], 100, 32)
    expect(path).toMatch(/M 0 \d+ L 100 \d+/)
  })
  it('maps min value to bottom, max to top (y-inverted)', () => {
    const path = sparklinePath([0, 10], 100, 32)!
    expect(path).toContain('M 0 32')
    expect(path).toContain('L 100 0')
  })
})
