// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { MuscleRank, RADAR_AXES } from '../MuscleRank'

describe('MuscleRank', () => {
  it('exposes 22 axes in the documented clockwise order', () => {
    expect(RADAR_AXES.length).toBe(22)
    expect(RADAR_AXES[0]).toBe('chest-upper')
    expect(RADAR_AXES[RADAR_AXES.length - 1]).toBe('calves-soleus')
  })

  it('renders an SVG with role=img and the rank radar aria-label', () => {
    const { container } = render(<MuscleRank ranks={{}} />)
    const svg = container.querySelector('svg')
    expect(svg?.getAttribute('role')).toBe('img')
    expect(svg?.getAttribute('aria-label')).toBe('Muscle rank radar')
  })

  it('renders one axis line per slug', () => {
    const { container } = render(<MuscleRank ranks={{}} />)
    expect(container.querySelectorAll('[data-axis]').length).toBe(22)
  })

  it('renders one axis dot per slug colored by rank', () => {
    const ranks = { 'chest-mid': 'S' as const, lats: 'D' as const }
    const { container } = render(<MuscleRank ranks={ranks} />)
    const chestDot = container.querySelector('[data-dot="chest-mid"]')
    const latsDot = container.querySelector('[data-dot="lats"]')
    expect(chestDot?.getAttribute('fill')).toBe('#fbbf24')
    expect(latsDot?.getAttribute('fill')).toBe('#94a3b8')
  })

  it('renders the polygon path connecting all rank radii', () => {
    const { container } = render(<MuscleRank ranks={{}} />)
    expect(container.querySelector('[data-polygon="true"]')).not.toBeNull()
  })

  it('renders 4 grid rings for D/C/B/A (S is the outer edge)', () => {
    const { container } = render(<MuscleRank ranks={{}} />)
    expect(container.querySelectorAll('[data-grid-ring]').length).toBe(4)
  })
})
