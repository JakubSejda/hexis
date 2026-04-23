// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { HeroBanner } from '@/components/ui'

describe('HeroBanner', () => {
  it('renders children inside a section', () => {
    render(
      <HeroBanner>
        <h1>Vítej zpět</h1>
      </HeroBanner>
    )
    const section = screen.getByRole('region')
    expect(section.tagName).toBe('SECTION')
    expect(section).toContainElement(screen.getByText('Vítej zpět'))
  })

  it('is full-bleed (w-full) by default', () => {
    render(<HeroBanner>x</HeroBanner>)
    expect(screen.getByRole('region').className).toContain('w-full')
  })

  it('defaults to md height (h-48)', () => {
    render(<HeroBanner>x</HeroBanner>)
    expect(screen.getByRole('region').className).toContain('h-48')
  })

  it('applies sm height (h-32)', () => {
    render(<HeroBanner height="sm">x</HeroBanner>)
    expect(screen.getByRole('region').className).toContain('h-32')
  })

  it('applies lg height (h-64)', () => {
    render(<HeroBanner height="lg">x</HeroBanner>)
    expect(screen.getByRole('region').className).toContain('h-64')
  })

  it('renders no <img> when imageSrc is omitted (gradient-only)', () => {
    const { container } = render(<HeroBanner>x</HeroBanner>)
    expect(container.querySelector('img')).toBeNull()
  })

  it('renders an <img> with alt when imageSrc is provided', () => {
    render(
      <HeroBanner imageSrc="/hero.jpg" imageAlt="Hero">
        x
      </HeroBanner>
    )
    const img = screen.getByAltText('Hero')
    expect(img.tagName).toBe('IMG')
  })

  it('renders a gradient overlay by default', () => {
    const { container } = render(
      <HeroBanner imageSrc="/h.jpg" imageAlt="">
        x
      </HeroBanner>
    )
    const overlay = container.querySelector('[data-hero-overlay="gradient"]')
    expect(overlay).toBeTruthy()
  })

  it('renders a dark overlay when overlay="dark"', () => {
    const { container } = render(
      <HeroBanner imageSrc="/h.jpg" imageAlt="" overlay="dark">
        x
      </HeroBanner>
    )
    expect(container.querySelector('[data-hero-overlay="dark"]')).toBeTruthy()
  })

  it('renders no overlay when overlay="none"', () => {
    const { container } = render(
      <HeroBanner imageSrc="/h.jpg" imageAlt="" overlay="none">
        x
      </HeroBanner>
    )
    expect(container.querySelector('[data-hero-overlay]')).toBeNull()
  })

  it('merges a custom className', () => {
    render(<HeroBanner className="custom-x">x</HeroBanner>)
    expect(screen.getByRole('region').className).toContain('custom-x')
  })
})
