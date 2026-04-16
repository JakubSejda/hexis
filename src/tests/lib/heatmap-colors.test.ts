import { describe, it, expect } from 'vitest'
import { volumeToColor, slugToZones, SLUG_TO_ZONE } from '@/lib/heatmap-colors'

describe('volumeToColor', () => {
  it('returns inactive color for 0 volume', () => {
    expect(volumeToColor(0, 1000)).toBe('#1f2733')
  })
  it('returns dark green for low volume (1-25%)', () => {
    expect(volumeToColor(200, 1000)).toBe('#065f46')
  })
  it('returns emerald for medium volume (26-50%)', () => {
    expect(volumeToColor(400, 1000)).toBe('#10b981')
  })
  it('returns amber for high volume (51-75%)', () => {
    expect(volumeToColor(600, 1000)).toBe('#f59e0b')
  })
  it('returns red for max volume (76-100%)', () => {
    expect(volumeToColor(900, 1000)).toBe('#ef4444')
  })
  it('returns inactive when maxVolume is 0', () => {
    expect(volumeToColor(0, 0)).toBe('#1f2733')
  })
})

describe('slugToZones', () => {
  it('maps chest to front zone', () => {
    expect(slugToZones('chest')).toEqual([{ zone: 'chest', view: 'front' }])
  })
  it('maps shoulders to both views', () => {
    expect(slugToZones('shoulders')).toEqual([
      { zone: 'shoulders', view: 'front' },
      { zone: 'shoulders', view: 'back' },
    ])
  })
  it('maps all 3 back slugs to same zone', () => {
    expect(slugToZones('back-lats')).toEqual([{ zone: 'back-upper', view: 'back' }])
    expect(slugToZones('back-mid')).toEqual([{ zone: 'back-upper', view: 'back' }])
    expect(slugToZones('back-rear-delt')).toEqual([{ zone: 'back-upper', view: 'back' }])
  })
  it('all 15 slugs are mapped', () => {
    const allSlugs = [
      'chest',
      'back-lats',
      'back-mid',
      'back-rear-delt',
      'shoulders',
      'biceps',
      'triceps',
      'forearms',
      'abs',
      'obliques',
      'quads',
      'hamstrings',
      'glutes',
      'calves',
      'adductors',
    ]
    for (const slug of allSlugs) {
      expect(SLUG_TO_ZONE[slug]).toBeDefined()
    }
  })
})
