// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Card } from '@/components/ui'

/** Reforge HUD plate contract: outer element = clipped edge-light layer
 * (hud-clip + p-px + edge color), first child = clipped surface layer
 * that carries bg + padding. data-testid and className land on the outer. */
const inner = (el: HTMLElement) => el.firstElementChild as HTMLElement

describe('Card', () => {
  it('renders children inside a <div> by default', () => {
    render(<Card data-testid="c">body</Card>)
    const el = screen.getByTestId('c')
    expect(el.tagName).toBe('DIV')
    expect(el).toHaveTextContent('body')
  })

  it('renders as a HUD plate (clipped edge layer + surface layer)', () => {
    render(<Card data-testid="c">x</Card>)
    const el = screen.getByTestId('c')
    expect(el).toHaveClass('hud-clip')
    expect(el).toHaveClass('p-px')
    expect(el).toHaveClass('bg-border')
    expect(inner(el)).toHaveClass('hud-clip')
    expect(inner(el)).toHaveClass('bg-surface')
  })

  it('edge="system" and edge="accent" recolor the edge layer', () => {
    const { rerender } = render(
      <Card edge="system" data-testid="c">
        x
      </Card>
    )
    expect(screen.getByTestId('c')).toHaveClass('bg-system')
    rerender(
      <Card edge="accent" data-testid="c">
        x
      </Card>
    )
    expect(screen.getByTestId('c')).toHaveClass('bg-accent')
  })

  it('applies interactive variant classes (cyan edge hover + cursor + focus ring)', () => {
    render(
      <Card variant="interactive" data-testid="c">
        x
      </Card>
    )
    const el = screen.getByTestId('c')
    expect(el).toHaveClass('cursor-pointer')
    expect(el.className).toMatch(/hover:bg-system/)
    expect(el.className).toMatch(/focus-visible:ring-2/)
    expect(inner(el).className).toMatch(/group-hover:bg-surface-raised/)
  })

  it('applies flush variant (plate, no padding)', () => {
    render(
      <Card variant="flush" data-testid="c">
        x
      </Card>
    )
    const el = screen.getByTestId('c')
    expect(el).toHaveClass('hud-clip')
    expect(inner(el)).not.toHaveClass('p-4')
    expect(inner(el)).not.toHaveClass('p-2')
  })

  it('applies padding=md by default (p-4 on the surface layer)', () => {
    render(<Card data-testid="c">x</Card>)
    expect(inner(screen.getByTestId('c'))).toHaveClass('p-4')
  })

  it('applies padding=none (no padding classes)', () => {
    render(
      <Card padding="none" data-testid="c">
        x
      </Card>
    )
    const el = inner(screen.getByTestId('c'))
    expect(el).not.toHaveClass('p-2')
    expect(el).not.toHaveClass('p-4')
    expect(el).not.toHaveClass('p-6')
  })

  it('applies padding=sm (p-2)', () => {
    render(
      <Card padding="sm" data-testid="c">
        x
      </Card>
    )
    expect(inner(screen.getByTestId('c'))).toHaveClass('p-2')
  })

  it('applies padding=lg (p-6)', () => {
    render(
      <Card padding="lg" data-testid="c">
        x
      </Card>
    )
    expect(inner(screen.getByTestId('c'))).toHaveClass('p-6')
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

  it('merges user className on the outer element via cn()', () => {
    render(
      <Card className="mt-4" data-testid="c">
        x
      </Card>
    )
    const el = screen.getByTestId('c')
    expect(el).toHaveClass('mt-4')
    expect(el).toHaveClass('hud-clip')
  })

  it('lets explicit padding override flush default (variant="flush" + padding="md" applies p-4)', () => {
    render(
      <Card variant="flush" padding="md" data-testid="c">
        x
      </Card>
    )
    expect(inner(screen.getByTestId('c'))).toHaveClass('p-4')
  })
})
