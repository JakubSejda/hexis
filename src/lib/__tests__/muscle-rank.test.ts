import { describe, it, expect } from 'vitest'
import { volumeToRank, RANK_THRESHOLDS, RANK_COLORS } from '@/lib/muscle-rank'
import { MUSCLE_GROUPS } from '@/db/seed/muscle-groups'

describe('RANK_THRESHOLDS', () => {
  it('has thresholds for every seeded muscle slug', () => {
    for (const mg of MUSCLE_GROUPS) {
      expect(RANK_THRESHOLDS[mg.slug], `missing thresholds for ${mg.slug}`).toBeDefined()
    }
  })

  it('thresholds are strictly ascending per slug', () => {
    for (const [slug, t] of Object.entries(RANK_THRESHOLDS)) {
      expect(t.length, slug).toBe(4)
      expect(t[0] < t[1] && t[1] < t[2] && t[2] < t[3], slug).toBe(true)
    }
  })
})

describe('RANK_COLORS', () => {
  it('defines a color for D, C, B, A, S', () => {
    for (const r of ['D', 'C', 'B', 'A', 'S'] as const) {
      expect(RANK_COLORS[r]).toMatch(/^#[0-9a-f]{6}$/i)
    }
  })
})

describe('volumeToRank', () => {
  it('returns D for an unknown slug regardless of volume', () => {
    expect(volumeToRank(999_999, 'mystery-muscle')).toBe('D')
  })

  it('returns D when volume is below the C threshold', () => {
    const [c] = RANK_THRESHOLDS['chest-mid']!
    expect(volumeToRank(0, 'chest-mid')).toBe('D')
    expect(volumeToRank(c - 1, 'chest-mid')).toBe('D')
  })

  it('crosses to C exactly at the C threshold', () => {
    const [c] = RANK_THRESHOLDS['chest-mid']!
    expect(volumeToRank(c, 'chest-mid')).toBe('C')
  })

  it('crosses to B exactly at the B threshold', () => {
    const [, b] = RANK_THRESHOLDS['chest-mid']!
    expect(volumeToRank(b, 'chest-mid')).toBe('B')
  })

  it('crosses to A exactly at the A threshold', () => {
    const [, , a] = RANK_THRESHOLDS['chest-mid']!
    expect(volumeToRank(a, 'chest-mid')).toBe('A')
  })

  it('crosses to S exactly at the S threshold', () => {
    const [, , , s] = RANK_THRESHOLDS['chest-mid']!
    expect(volumeToRank(s, 'chest-mid')).toBe('S')
    expect(volumeToRank(s * 10, 'chest-mid')).toBe('S')
  })
})
