import { describe, it, expect } from 'vitest'
import {
  detectMilestone,
  xpForMilestone,
  HABIT_MILESTONES,
  MILESTONE_BASE_XP,
  WEIGHT_MULTIPLIER,
} from '@/lib/habits/milestone'

describe('detectMilestone', () => {
  it('returns null when streak does not match a milestone', () => {
    expect(detectMilestone(0)).toBeNull()
    expect(detectMilestone(1)).toBeNull()
    expect(detectMilestone(6)).toBeNull()
    expect(detectMilestone(8)).toBeNull()
    expect(detectMilestone(29)).toBeNull()
    expect(detectMilestone(101)).toBeNull()
    expect(detectMilestone(99)).toBeNull()
  })

  it('returns 7 / 30 / 100 when streak hits exactly', () => {
    expect(detectMilestone(7)).toBe(7)
    expect(detectMilestone(30)).toBe(30)
    expect(detectMilestone(100)).toBe(100)
  })
})

describe('xpForMilestone', () => {
  it('returns base XP for standard weight', () => {
    expect(xpForMilestone(7, 'standard')).toBe(50)
    expect(xpForMilestone(30, 'standard')).toBe(200)
    expect(xpForMilestone(100, 'standard')).toBe(1000)
  })

  it('halves XP for light weight', () => {
    expect(xpForMilestone(7, 'light')).toBe(25)
    expect(xpForMilestone(30, 'light')).toBe(100)
    expect(xpForMilestone(100, 'light')).toBe(500)
  })

  it('doubles XP for heavy weight', () => {
    expect(xpForMilestone(7, 'heavy')).toBe(100)
    expect(xpForMilestone(30, 'heavy')).toBe(400)
    expect(xpForMilestone(100, 'heavy')).toBe(2000)
  })

  it('always returns an integer', () => {
    for (const m of HABIT_MILESTONES) {
      for (const w of ['light', 'standard', 'heavy'] as const) {
        const xp = xpForMilestone(m, w)
        expect(Number.isInteger(xp)).toBe(true)
      }
    }
  })
})

describe('constants', () => {
  it('HABIT_MILESTONES is [7, 30, 100]', () => {
    expect(HABIT_MILESTONES).toEqual([7, 30, 100])
  })

  it('MILESTONE_BASE_XP covers all milestones', () => {
    expect(MILESTONE_BASE_XP[7]).toBe(50)
    expect(MILESTONE_BASE_XP[30]).toBe(200)
    expect(MILESTONE_BASE_XP[100]).toBe(1000)
  })

  it('WEIGHT_MULTIPLIER table', () => {
    expect(WEIGHT_MULTIPLIER.light).toBe(0.5)
    expect(WEIGHT_MULTIPLIER.standard).toBe(1)
    expect(WEIGHT_MULTIPLIER.heavy).toBe(2)
  })
})
