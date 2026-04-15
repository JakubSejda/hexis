import { describe, it, expect } from 'vitest'
import { calcDelta, deltaDirection } from '@/lib/measurement-delta'

describe('calcDelta', () => {
  it('returns null when current is null', () => {
    expect(calcDelta(null, 67.5)).toBeNull()
  })
  it('returns null when previous is null', () => {
    expect(calcDelta(67.5, null)).toBeNull()
  })
  it('returns difference when both present', () => {
    expect(calcDelta(67.5, 68.0)).toBeCloseTo(-0.5, 2)
    expect(calcDelta(68.0, 67.5)).toBeCloseTo(0.5, 2)
  })
})

describe('deltaDirection', () => {
  it('returns "neutral" for null delta', () => {
    expect(deltaDirection(null, 'lower-is-good')).toBe('neutral')
  })
  it('lower-is-good: negative delta is good', () => {
    expect(deltaDirection(-0.5, 'lower-is-good')).toBe('good')
    expect(deltaDirection(0.5, 'lower-is-good')).toBe('bad')
  })
  it('higher-is-good: positive delta is good', () => {
    expect(deltaDirection(0.5, 'higher-is-good')).toBe('good')
    expect(deltaDirection(-0.5, 'higher-is-good')).toBe('bad')
  })
  it('zero delta is neutral', () => {
    expect(deltaDirection(0, 'lower-is-good')).toBe('neutral')
  })
})
