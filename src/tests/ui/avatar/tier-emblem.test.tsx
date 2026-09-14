// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TierBadge } from '@/components/avatar/TierBadge'
import { TierLadder } from '@/components/avatar/TierLadder'
import { TIERS } from '@/lib/tiers'

/**
 * The tier emblem was a pre-Reforge circle SVG (public/avatars/tier-N.svg,
 * April) while the dashboard used HexEmblem — two emblem languages for one
 * concept. This slice retires the circles.
 */
describe('TierBadge', () => {
  it('is the HUD hex emblem, not the old circle asset', () => {
    render(<TierBadge tier={3} />)
    const emblem = screen.getByRole('img', { name: /tier 3/i })
    expect(emblem.tagName.toLowerCase()).toBe('svg')
    expect(document.querySelector('img[src*="/avatars/"]')).toBeNull()
  })

  it('shows the tier as a roman numeral, not a level number', () => {
    render(<TierBadge tier={4} />)
    expect(screen.getByText('IV')).toBeInTheDocument()
  })

  it('carries the tier colour on the core ring', () => {
    render(<TierBadge tier={5} />)
    const core = screen.getByRole('img', { name: /tier 5/i }).querySelectorAll('polygon')[2]!
    expect(core.getAttribute('stroke')).toBe(TIERS[4]!.color)
  })
})

describe('TierLadder', () => {
  it('marks the current tier with a glow rather than a round ring', () => {
    const { container } = render(<TierLadder currentTier={2} />)
    expect(container.innerHTML).not.toMatch(/rounded/)
    expect(container.innerHTML).toContain('drop-shadow')
  })
})

describe('tier palette', () => {
  it('runs on the amber heat ramp — progression is temperature', () => {
    // One family, coldest to hottest. Cyan stays system, emerald stays success
    // (R7), so neither can carry a tier.
    expect(TIERS.map((t) => t.color)).toEqual([
      '#78350f',
      '#b45309',
      '#d97706',
      '#f59e0b',
      '#fbbf24',
    ])
  })

  it('keeps the retired hues out', () => {
    const retired = ['#10b981', '#34d399', '#0ea5e9', '#64748b']
    for (const tier of TIERS) {
      expect(retired).not.toContain(tier.color)
      expect(retired).not.toContain(tier.accent)
    }
  })
})
