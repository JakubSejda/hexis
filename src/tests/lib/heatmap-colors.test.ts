import { describe, it, expect } from 'vitest'
import { volumeToColor, slugToZones, SLUG_TO_ZONE } from '@/lib/heatmap-colors'
import { MUSCLE_GROUPS } from '@/db/seed/muscle-groups'

describe('volumeToColor', () => {
  it('returns INACTIVE color for 0 volume', () => {
    expect(volumeToColor(0, 1000)).toBe('#1f2733')
  })

  it('returns INACTIVE color when maxVolume is 0', () => {
    expect(volumeToColor(500, 0)).toBe('#1f2733')
  })

  it('returns red for ratio >= 0.76', () => {
    expect(volumeToColor(800, 1000)).toBe('#ef4444')
    expect(volumeToColor(760, 1000)).toBe('#ef4444')
  })

  it('returns amber for ratio in [0.51, 0.75]', () => {
    expect(volumeToColor(510, 1000)).toBe('#f59e0b')
    expect(volumeToColor(750, 1000)).toBe('#f59e0b')
  })

  it('returns emerald for ratio in [0.26, 0.50]', () => {
    expect(volumeToColor(260, 1000)).toBe('#10b981')
    expect(volumeToColor(500, 1000)).toBe('#10b981')
  })

  it('returns dark green for ratio in [0.01, 0.25]', () => {
    expect(volumeToColor(10, 1000)).toBe('#065f46')
    expect(volumeToColor(250, 1000)).toBe('#065f46')
  })
})

describe('SLUG_TO_ZONE', () => {
  it('maps every MUSCLE_GROUPS slug to a zone', () => {
    const orphans = MUSCLE_GROUPS.map((mg) => mg.slug).filter((slug) => !(slug in SLUG_TO_ZONE))
    expect(orphans).toEqual([])
  })

  it('covers all 22 expected new-schema slugs', () => {
    const expected = [
      'chest-upper',
      'chest-mid',
      'chest-lower',
      'delts-front',
      'delts-side',
      'delts-rear',
      'lats',
      'traps-upper',
      'traps-mid',
      'rhomboids',
      'biceps',
      'triceps',
      'forearms',
      'abs-upper',
      'abs-lower',
      'obliques',
      'quads',
      'hamstrings',
      'glutes',
      'calves-gastroc',
      'calves-soleus',
      'adductors',
    ]
    for (const slug of expected) {
      expect(SLUG_TO_ZONE[slug]).toBeDefined()
    }
  })
})

describe('slugToZones', () => {
  it('returns empty array for unknown slug', () => {
    expect(slugToZones('not-a-slug')).toEqual([])
  })

  it('returns single entry for front-only slug', () => {
    const result = slugToZones('chest-mid')
    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({ view: 'front' })
  })

  it('returns two entries for both-views slug', () => {
    const result = slugToZones('calves-gastroc')
    expect(result).toHaveLength(2)
    expect(result.map((r) => r.view).sort()).toEqual(['back', 'front'])
  })
})
