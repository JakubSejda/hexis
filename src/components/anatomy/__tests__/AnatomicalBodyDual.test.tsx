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

  it('offers the view as a radio group, not a tablist without panels', () => {
    render(<AnatomicalBodyDual highlights={{}} />)
    expect(screen.queryByRole('tablist')).toBeNull()
    expect(screen.getByRole('radio', { name: 'Zepředu' })).toBeDefined()
    expect(screen.getByRole('radio', { name: 'Zezadu' })).toBeDefined()
  })

  it('checks the picked view', () => {
    render(<AnatomicalBodyDual highlights={{}} />)
    const back = screen.getByRole('radio', { name: 'Zezadu' })
    fireEvent.click(back)
    expect(back).toBeChecked()
    expect(screen.getByRole('radio', { name: 'Zepředu' })).not.toBeChecked()
  })
})
