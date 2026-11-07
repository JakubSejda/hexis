// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Card } from '@/components/ui'

/** D plate contract: one rounded surface with a hairline edge; bg, padding,
 * data-testid and className all land on the same element. */

describe('Card', () => {
  it('renders children inside a <div> by default', () => {
    render(<Card data-testid="c">body</Card>)
    const el = screen.getByTestId('c')
    expect(el.tagName).toBe('DIV')
    expect(el).toHaveTextContent('body')
  })

  it('renders as a D plate (card radius, hairline edge, surface)', () => {
    render(<Card data-testid="c">x</Card>)
    const el = screen.getByTestId('c')
    expect(el).toHaveClass('rounded-card', 'border', 'border-border', 'bg-surface')
    expect(el.className).not.toMatch(/hud-clip/)
  })

  it('edge="system" and edge="accent" recolor the hairline', () => {
    const { rerender } = render(
      <Card edge="system" data-testid="c">
        x
      </Card>
    )
    expect(screen.getByTestId('c').className).toMatch(/border-system/)
    rerender(
      <Card edge="accent" data-testid="c">
        x
      </Card>
    )
    expect(screen.getByTestId('c').className).toMatch(/border-accent/)
    expect(screen.getByTestId('c')).toHaveClass('shadow-glow')
  })

  it('applies interactive variant classes (raised hover + cursor + focus ring)', () => {
    render(
      <Card variant="interactive" data-testid="c">
        x
      </Card>
    )
    const el = screen.getByTestId('c')
    expect(el).toHaveClass('cursor-pointer')
    expect(el.className).toMatch(/hover:bg-surface-raised/)
    expect(el.className).toMatch(/focus-visible:ring-2/)
  })

  it('applies flush variant (plate, no padding)', () => {
    render(
      <Card variant="flush" data-testid="c">
        x
      </Card>
    )
    const el = screen.getByTestId('c')
    expect(el).toHaveClass('rounded-card')
    expect(el.className).not.toMatch(/\bp-\d/)
  })

  it.each([
    ['sm', 'p-3'],
    ['md', 'p-4'],
    ['lg', 'p-5'],
  ] as const)('applies padding=%s (%s)', (padding, cls) => {
    render(
      <Card padding={padding} data-testid="c">
        x
      </Card>
    )
    expect(screen.getByTestId('c')).toHaveClass(cls)
  })

  it('applies padding=md by default', () => {
    render(<Card data-testid="c">x</Card>)
    expect(screen.getByTestId('c')).toHaveClass('p-4')
  })

  it('applies padding=none (no padding classes)', () => {
    render(
      <Card padding="none" data-testid="c">
        x
      </Card>
    )
    expect(screen.getByTestId('c').className).not.toMatch(/\bp-\d/)
  })

  it('renders <a> with href when as="a"', () => {
    render(
      <Card as="a" href="/strength" data-testid="c">
        link
      </Card>
    )
    const el = screen.getByTestId('c')
    expect(el.tagName).toBe('A')
    expect(el).toHaveAttribute('href', '/strength')
  })

  it('renders <button> when as="button"', () => {
    render(
      <Card as="button" data-testid="c">
        click
      </Card>
    )
    expect(screen.getByTestId('c').tagName).toBe('BUTTON')
  })

  it('merges user className via cn(), letting it override the radius', () => {
    render(
      <Card className="rounded-control mt-4" data-testid="c">
        x
      </Card>
    )
    const el = screen.getByTestId('c')
    expect(el).toHaveClass('mt-4', 'rounded-control')
    expect(el).not.toHaveClass('rounded-card')
  })

  it('lets explicit padding override flush default (variant="flush" + padding="md" applies p-4)', () => {
    render(
      <Card variant="flush" padding="md" data-testid="c">
        x
      </Card>
    )
    expect(screen.getByTestId('c')).toHaveClass('p-4')
  })
})
