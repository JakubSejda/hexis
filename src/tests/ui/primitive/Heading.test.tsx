// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Heading } from '@/components/ui'

describe('Heading', () => {
  it('renders <h1> when level=1 by default', () => {
    render(<Heading level={1}>Title</Heading>)
    const el = screen.getByRole('heading', { level: 1 })
    expect(el.tagName).toBe('H1')
    expect(el).toHaveTextContent('Title')
  })

  it('renders <h2> when level=2', () => {
    render(<Heading level={2}>Sub</Heading>)
    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument()
  })

  it('renders <h3> when level=3', () => {
    render(<Heading level={3}>Tiny</Heading>)
    expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument()
  })

  it('allows as="div" to render a <div> while retaining visual level', () => {
    render(
      <Heading level={1} as="div" data-testid="h">
        Visual H1
      </Heading>
    )
    const el = screen.getByTestId('h')
    expect(el.tagName).toBe('DIV')
    expect(el).toHaveClass('text-2xl')
    expect(el).toHaveClass('font-semibold')
  })

  it('default variant level=1 → text-2xl font-semibold', () => {
    render(
      <Heading level={1} data-testid="h">
        x
      </Heading>
    )
    const el = screen.getByTestId('h')
    expect(el).toHaveClass('text-2xl')
    expect(el).toHaveClass('font-semibold')
  })

  it('default variant level=2 → text-lg font-semibold', () => {
    render(
      <Heading level={2} data-testid="h">
        x
      </Heading>
    )
    const el = screen.getByTestId('h')
    expect(el).toHaveClass('text-lg')
    expect(el).toHaveClass('font-semibold')
  })

  it('default variant level=3 → text-base font-semibold', () => {
    render(
      <Heading level={3} data-testid="h">
        x
      </Heading>
    )
    const el = screen.getByTestId('h')
    expect(el).toHaveClass('text-base')
    expect(el).toHaveClass('font-semibold')
  })

  it('display variant applies text-3xl font-semibold tracking-tight regardless of level', () => {
    render(
      <Heading level={1} variant="display" data-testid="h">
        Hero
      </Heading>
    )
    const el = screen.getByTestId('h')
    expect(el).toHaveClass('text-3xl')
    expect(el).toHaveClass('font-semibold')
    expect(el).toHaveClass('tracking-tight')
  })

  it('region variant applies font-mono uppercase tracking-[0.2em] text-muted', () => {
    render(
      <Heading level={2} variant="region" data-testid="h">
        Life Areas
      </Heading>
    )
    const el = screen.getByTestId('h')
    expect(el).toHaveClass('font-mono')
    expect(el).toHaveClass('uppercase')
    expect(el).toHaveClass('text-muted')
    expect(el.className).toMatch(/tracking-/)
  })

  it('forwards className through cn() (last-wins via tailwind-merge)', () => {
    render(
      <Heading level={1} className="text-red-500" data-testid="h">
        x
      </Heading>
    )
    const el = screen.getByTestId('h')
    expect(el).toHaveClass('text-red-500')
  })
})
