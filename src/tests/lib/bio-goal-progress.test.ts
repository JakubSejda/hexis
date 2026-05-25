import { describe, it, expect } from 'vitest'
import { goalProgress } from '@/lib/bio-goal-progress'

describe('goalProgress', () => {
  it('returns 0 when start is null', () => {
    expect(goalProgress(null, 78, 70)).toBe(0)
  })
  it('returns 0 when current is null', () => {
    expect(goalProgress(80, null, 70)).toBe(0)
  })
  it('returns 0 when goal is null', () => {
    expect(goalProgress(80, 78, null)).toBe(0)
  })
  it('returns 0.2 cutting (80 to 70, current 78)', () => {
    expect(goalProgress(80, 78, 70)).toBeCloseTo(0.2, 5)
  })
  it('returns 1 when current equals goal (cutting)', () => {
    expect(goalProgress(80, 70, 70)).toBe(1)
  })
  it('returns 1 when current overshoots goal (cutting past)', () => {
    expect(goalProgress(80, 65, 70)).toBe(1)
  })
  it('returns 0 when current has not moved (cutting)', () => {
    expect(goalProgress(80, 80, 70)).toBe(0)
  })
  it('handles bulking (start 70 to goal 80, current 73)', () => {
    expect(goalProgress(70, 73, 80)).toBeCloseTo(0.3, 5)
  })
  it('handles bulking goal reached', () => {
    expect(goalProgress(70, 80, 80)).toBe(1)
  })
  it('handles wrong-direction movement (cutting but gained weight)', () => {
    expect(goalProgress(80, 82, 70)).toBe(0)
  })
  it('handles start === goal (already there)', () => {
    expect(goalProgress(70, 70, 70)).toBe(1)
  })
})
