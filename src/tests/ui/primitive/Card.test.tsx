// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Card } from '@/components/ui'

describe('Card', () => {
  it('renders children inside a <div> by default', () => {
    render(<Card data-testid="c">body</Card>)
    const el = screen.getByTestId('c')
    expect(el.tagName).toBe('DIV')
    expect(el).toHaveTextContent('body')
  })

  it('applies default variant classes (bg-surface, border, rounded-2xl)', () => {
    render(<Card data-testid="c">x</Card>)
    const el = screen.getByTestId('c')
    expect(el).toHaveClass('bg-surface')
    expect(el).toHaveClass('border')
    expect(el).toHaveClass('border-border')
    expect(el).toHaveClass('rounded-2xl')
  })

  it('applies interactive variant classes (hover + cursor + focus ring)', () => {
    render(
      <Card variant="interactive" data-testid="c">
        x
      </Card>
    )
    const el = screen.getByTestId('c')
    expect(el.className).toMatch(/hover:bg-surface-raised/)
    expect(el).toHaveClass('cursor-pointer')
    expect(el.className).toMatch(/focus-visible:ring-2/)
  })

  it('applies flush variant (border + rounded, no padding)', () => {
    render(
      <Card variant="flush" data-testid="c">
        x
      </Card>
    )
    const el = screen.getByTestId('c')
    expect(el).toHaveClass('border')
    expect(el).toHaveClass('rounded-2xl')
    expect(el).not.toHaveClass('p-4')
    expect(el).not.toHaveClass('p-2')
  })

  it('applies padding=md by default (p-4)', () => {
    render(<Card data-testid="c">x</Card>)
    expect(screen.getByTestId('c')).toHaveClass('p-4')
  })

  it('applies padding=none (no padding classes)', () => {
    render(
      <Card padding="none" data-testid="c">
        x
      </Card>
    )
    const el = screen.getByTestId('c')
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
    expect(screen.getByTestId('c')).toHaveClass('p-2')
  })

  it('applies padding=lg (p-6)', () => {
    render(
      <Card padding="lg" data-testid="c">
        x
      </Card>
    )
    expect(screen.getByTestId('c')).toHaveClass('p-6')
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
    const el = screen.getByTestId('c')
    expect(el.tagName).toBe('BUTTON')
  })

  it('lets user className override base via cn()', () => {
    render(
      <Card className="rounded-none" data-testid="c">
        x
      </Card>
    )
    const el = screen.getByTestId('c')
    expect(el).toHaveClass('rounded-none')
    expect(el).not.toHaveClass('rounded-2xl')
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
