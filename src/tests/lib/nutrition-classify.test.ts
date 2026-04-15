import { describe, it, expect } from 'vitest'
import { classifyDay, classifyMacro } from '@/lib/nutrition-classify'

describe('classifyDay (background heatmap)', () => {
  it('returns "empty" when no actual data', () => {
    expect(classifyDay({ kcalActual: null, targetKcal: 2000 })).toBe('empty')
  })
  it('returns "empty" when no target', () => {
    expect(classifyDay({ kcalActual: 1800, targetKcal: null })).toBe('empty')
  })
  it('returns "hit" when kcal <= target * 1.1', () => {
    expect(classifyDay({ kcalActual: 2200, targetKcal: 2000 })).toBe('hit')
    expect(classifyDay({ kcalActual: 1500, targetKcal: 2000 })).toBe('hit')
  })
  it('returns "miss" when kcal > target * 1.1', () => {
    expect(classifyDay({ kcalActual: 2300, targetKcal: 2000 })).toBe('miss')
  })
})

describe('classifyMacro (dot color)', () => {
  it('returns "none" when no target', () => {
    expect(classifyMacro({ actual: 100, target: null })).toBe('none')
  })
  it('returns "none" when no actual', () => {
    expect(classifyMacro({ actual: null, target: 150 })).toBe('none')
  })
  it('returns "hit" when actual <= target', () => {
    expect(classifyMacro({ actual: 150, target: 150 })).toBe('hit')
    expect(classifyMacro({ actual: 100, target: 150 })).toBe('hit')
  })
  it('returns "near" when actual within (target, target*1.1]', () => {
    expect(classifyMacro({ actual: 160, target: 150 })).toBe('near')
    expect(classifyMacro({ actual: 165, target: 150 })).toBe('near')
  })
  it('returns "miss" when actual > target * 1.1', () => {
    expect(classifyMacro({ actual: 170, target: 150 })).toBe('miss')
  })
})
