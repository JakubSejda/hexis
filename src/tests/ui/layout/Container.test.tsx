// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Container } from '@/components/ui/layout/Container'

describe('Container', () => {
  it('renders children inside a div by default', () => {
    render(
      <Container>
        <span data-testid="child" />
      </Container>
    )
    expect(screen.getByTestId('child')).toBeInTheDocument()
  })

  it('applies md max-width by default', () => {
    render(<Container data-testid="c">x</Container>)
    expect(screen.getByTestId('c')).toHaveClass('max-w-2xl')
  })

  it('applies sm max-width when size=sm', () => {
    render(
      <Container size="sm" data-testid="c">
        x
      </Container>
    )
    expect(screen.getByTestId('c')).toHaveClass('max-w-md')
  })

  it('applies lg max-width when size=lg', () => {
    render(
      <Container size="lg" data-testid="c">
        x
      </Container>
    )
    expect(screen.getByTestId('c')).toHaveClass('max-w-4xl')
  })

  it('supports polymorphic `as` prop', () => {
    render(
      <Container as="section" data-testid="c">
        x
      </Container>
    )
    expect(screen.getByTestId('c').tagName).toBe('SECTION')
  })

  it('merges user className', () => {
    render(
      <Container className="custom" data-testid="c">
        x
      </Container>
    )
    expect(screen.getByTestId('c')).toHaveClass('custom')
  })

  it('applies w-full without max-width when size=full', () => {
    render(
      <Container size="full" data-testid="c">
        x
      </Container>
    )
    const el = screen.getByTestId('c')
    expect(el).toHaveClass('w-full')
    expect(el).not.toHaveClass('max-w-md')
    expect(el).not.toHaveClass('max-w-2xl')
    expect(el).not.toHaveClass('max-w-4xl')
  })

  it('omits mx-auto when size=full (edge-to-edge)', () => {
    render(
      <Container size="full" data-testid="c">
        x
      </Container>
    )
    expect(screen.getByTestId('c')).not.toHaveClass('mx-auto')
  })

  it('applies mx-auto when size is sm|md|lg', () => {
    const sizes = ['sm', 'md', 'lg'] as const
    for (const size of sizes) {
      const { unmount } = render(
        <Container size={size} data-testid={`c-${size}`}>
          x
        </Container>
      )
      expect(screen.getByTestId(`c-${size}`)).toHaveClass('mx-auto')
      unmount()
    }
  })
})
