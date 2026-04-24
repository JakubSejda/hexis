// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StatusWindow } from '@/components/dashboard/StatusWindow'

describe('StatusWindow', () => {
  const base = {
    level: 7,
    currentXp: 340,
    xpToLevel: 500,
    xpForNext: 160,
    tier: 3 as const,
    tierName: 'Warrior',
    tierColor: '#ca8a04',
  }

  it('renders Level and tier name', () => {
    render(<StatusWindow {...base} streak={5} />)
    expect(screen.getByText('Level 7')).toBeInTheDocument()
    expect(screen.getByText(/Warrior/i)).toBeInTheDocument()
  })

  it('shows streak peek when streak > 0', () => {
    render(<StatusWindow {...base} streak={12} />)
    expect(screen.getByText(/day streak/i)).toBeInTheDocument()
    expect(screen.getByText('12')).toBeInTheDocument()
  })

  it('hides streak peek when streak === 0', () => {
    render(<StatusWindow {...base} streak={0} />)
    expect(screen.queryByText(/day streak/i)).toBeNull()
  })

  it('wraps in a link to /stats', () => {
    render(<StatusWindow {...base} streak={5} />)
    expect(screen.getByRole('link')).toHaveAttribute('href', '/stats')
  })

  it('applies animate-tier-glow via Avatar ringPulse when tier >= 3', () => {
    const { container } = render(<StatusWindow {...base} tier={3} streak={5} />)
    const glowEl = container.querySelector('.animate-tier-glow')
    expect(glowEl).not.toBeNull()
  })

  it('does NOT apply ringPulse when tier < 3', () => {
    const { container } = render(<StatusWindow {...base} tier={2} streak={5} />)
    const glowEl = container.querySelector('.animate-tier-glow')
    expect(glowEl).toBeNull()
  })

  it('shows XP remaining label', () => {
    render(<StatusWindow {...base} streak={5} />)
    expect(screen.getByText(/160 do L8/)).toBeInTheDocument()
  })
})
