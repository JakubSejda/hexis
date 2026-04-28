import { describe, it, expect } from 'vitest'
import { volumeToColor } from '@/lib/heatmap-colors'

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
