// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { AnatomicalBodyDual } from '../AnatomicalBodyDual'

describe('AnatomicalBodyDual', () => {
  it('renders both front and back svgs', () => {
    const { container } = render(<AnatomicalBodyDual highlights={{}} />)
    expect(container.querySelectorAll('svg[role="img"]').length).toBe(2)
  })

  it('passes split highlights to each view', () => {
    const { container } = render(
      <AnatomicalBodyDual highlights={{ 'chest-mid': '#f00', lats: '#0f0' }} />
    )
    const frontChest = container.querySelector('svg[aria-label*="front"] [data-muscle="chest-mid"]')
    const backLats = container.querySelector('svg[aria-label*="back"] [data-muscle="lats"]')
    expect(frontChest?.getAttribute('fill')).toBe('#f00')
    expect(backLats?.getAttribute('fill')).toBe('#0f0')
  })

  it('renders tab controls labeled Zepředu / Zezadu', () => {
    render(<AnatomicalBodyDual highlights={{}} />)
    expect(screen.getByRole('tab', { name: 'Zepředu' })).toBeDefined()
    expect(screen.getByRole('tab', { name: 'Zezadu' })).toBeDefined()
  })

  it('toggles aria-selected when a tab is clicked', () => {
    render(<AnatomicalBodyDual highlights={{}} />)
    const back = screen.getByRole('tab', { name: 'Zezadu' })
    fireEvent.click(back)
    expect(back.getAttribute('aria-selected')).toBe('true')
    expect(screen.getByRole('tab', { name: 'Zepředu' }).getAttribute('aria-selected')).toBe('false')
  })
})
