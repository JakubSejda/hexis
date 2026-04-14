import { describe, it, expect } from 'vitest'
import { estimate1RM } from '@/lib/1rm'

describe('estimate1RM', () => {
  it('reps=1 returns weight', () => {
    expect(estimate1RM(100, 1)).toBe(100)
  })

  it('reps=5 at 100kg is ~114.6 (Epley+Brzycki avg)', () => {
    const v = estimate1RM(100, 5)
    expect(v).toBeGreaterThan(113)
    expect(v).toBeLessThan(116)
  })

  it('reps=10 at 60kg is ~80', () => {
    const v = estimate1RM(60, 10)
    expect(v).toBeGreaterThan(78)
    expect(v).toBeLessThan(82)
  })

  it('reps=0 returns 0', () => {
    expect(estimate1RM(100, 0)).toBe(0)
  })

  it('weight=0 returns 0', () => {
    expect(estimate1RM(0, 8)).toBe(0)
  })

  it('reps>=37 degrades gracefully (Brzycki undefined)', () => {
    const v = estimate1RM(60, 40)
    expect(Number.isFinite(v)).toBe(true)
    expect(v).toBeGreaterThan(60)
  })
})
