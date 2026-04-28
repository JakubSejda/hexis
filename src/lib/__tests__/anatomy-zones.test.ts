import { describe, it, expect } from 'vitest'
import { SLUG_ZONES, applyHighlights } from '@/lib/anatomy-zones'
import { MUSCLE_GROUPS } from '@/db/seed/muscle-groups'

describe('SLUG_ZONES', () => {
  it('has an entry for every seeded muscle slug', () => {
    for (const mg of MUSCLE_GROUPS) {
      expect(SLUG_ZONES[mg.slug], `missing zone for ${mg.slug}`).toBeDefined()
    }
  })

  it('only uses front | back | both views', () => {
    for (const [slug, info] of Object.entries(SLUG_ZONES)) {
      expect(['front', 'back', 'both'], slug).toContain(info.view)
    }
  })
})

describe('applyHighlights', () => {
  it('routes a front-only slug to the front map', () => {
    const out = applyHighlights({ 'chest-mid': '#ff0000' })
    expect(out.front['chest-mid']).toBe('#ff0000')
    expect(out.back['chest-mid']).toBeUndefined()
  })

  it('routes a back-only slug to the back map', () => {
    const out = applyHighlights({ lats: '#00ff00' })
    expect(out.back.lats).toBe('#00ff00')
    expect(out.front.lats).toBeUndefined()
  })

  it('duplicates a both-view slug into both maps', () => {
    const out = applyHighlights({ 'delts-side': '#0000ff' })
    expect(out.front['delts-side']).toBe('#0000ff')
    expect(out.back['delts-side']).toBe('#0000ff')
  })

  it('ignores unknown slugs', () => {
    const out = applyHighlights({ 'mystery-muscle': '#fff' })
    expect(out.front).toEqual({})
    expect(out.back).toEqual({})
  })
})
