// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Home } from 'lucide-react'
import { NavLink } from '@/components/ui'

describe('NavLink', () => {
  it('side variant, active: aria-current + accent + left border', () => {
    render(
      <NavLink href="/dashboard" active variant="side" icon={Home}>
        Dashboard
      </NavLink>
    )
    const link = screen.getByRole('link', { name: 'Dashboard' })
    expect(link).toHaveAttribute('aria-current', 'page')
    expect(link).toHaveClass('text-accent')
    expect(link).toHaveClass('border-l-2')
  })

  it('side variant, inactive: muted, no aria-current', () => {
    render(
      <NavLink href="/training" active={false} variant="side" icon={Home}>
        Training
      </NavLink>
    )
    const link = screen.getByRole('link', { name: 'Training' })
    expect(link).not.toHaveAttribute('aria-current')
    expect(link).toHaveClass('text-muted')
  })

  it('bottom variant: column layout + text-xs + larger icon', () => {
    render(
      <NavLink href="/dashboard" active={false} variant="bottom" icon={Home}>
        Dashboard
      </NavLink>
    )
    const link = screen.getByRole('link', { name: 'Dashboard' })
    expect(link).toHaveClass('flex-col')
    expect(link).toHaveClass('text-xs')
    expect(link.querySelector('svg')).toHaveClass('h-6')
  })
})
