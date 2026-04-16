import { describe, it, expect } from 'vitest'
import { levelToTier, levelToTierMeta, nextTierMeta, xpToProgress } from '@/lib/tiers'

describe('levelToTier', () => {
  it.each([
    [1, 1],
    [5, 1],
    [6, 2],
    [15, 2],
    [16, 3],
    [30, 3],
    [31, 4],
    [50, 4],
    [51, 5],
    [100, 5],
  ])('L%i → tier %i', (level, expected) => {
    expect(levelToTier(level)).toBe(expected)
  })
})

describe('levelToTierMeta', () => {
  it('returns Warrior meta for L16', () => {
    const m = levelToTierMeta(16)
    expect(m.name).toBe('Warrior')
    expect(m.tier).toBe(3)
  })
})

describe('nextTierMeta', () => {
  it('returns tier 2 for L5', () => {
    expect(nextTierMeta(5)?.tier).toBe(2)
  })
  it('returns tier 3 for L6', () => {
    expect(nextTierMeta(6)?.tier).toBe(3)
  })
  it('returns null for L51+', () => {
    expect(nextTierMeta(51)).toBeNull()
  })
})

describe('xpToProgress', () => {
  it('returns 0/100 at level 1 start', () => {
    expect(xpToProgress(0, 1)).toEqual({ current: 0, max: 100, percent: 0 })
  })
  it('returns 50% at half of level 1', () => {
    const p = xpToProgress(50, 1)
    expect(p.current).toBe(50)
    expect(p.percent).toBe(50)
  })
  it('returns 0 at start of level 2 (100 XP)', () => {
    expect(xpToProgress(100, 2)).toEqual({ current: 0, max: 300, percent: 0 })
  })
  it('caps percent at 100', () => {
    expect(xpToProgress(1000, 1).percent).toBeLessThanOrEqual(100)
  })
})
