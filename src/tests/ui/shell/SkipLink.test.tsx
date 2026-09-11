// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SkipLink } from '@/components/shell/SkipLink'

describe('SkipLink', () => {
  it('points at the main landmark', () => {
    render(<SkipLink />)
    expect(screen.getByRole('link', { name: 'Přeskočit na obsah' })).toHaveAttribute(
      'href',
      '#main'
    )
  })

  it('stays out of the layout until it is focused', () => {
    render(<SkipLink />)
    const link = screen.getByRole('link')
    // Off-canvas rather than display:none — a hidden link is not focusable.
    expect(link).toHaveClass('sr-only')
    expect(link.className).toMatch(/focus-visible:not-sr-only/)
  })

  it('lands on the HUD plate when it does appear', () => {
    render(<SkipLink />)
    const link = screen.getByRole('link')
    expect(link).toHaveClass('hud-clip-sm')
    expect(link.className).toMatch(/focus-visible:bg-system/)
  })
})
