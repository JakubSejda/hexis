// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Avatar } from '@/components/ui'

describe('Avatar', () => {
  it('renders an <img> with given src and alt', () => {
    render(<Avatar src="/me.jpg" alt="Jakub Sejda" data-testid="a" />)
    const el = screen.getByTestId('a')
    expect(el.tagName).toBe('IMG')
    expect(el).toHaveAttribute('src', '/me.jpg')
    expect(el).toHaveAttribute('alt', 'Jakub Sejda')
  })

  it('renders initials from alt when src is missing', () => {
    render(<Avatar alt="Jakub Sejda" data-testid="a" />)
    const el = screen.getByTestId('a')
    expect(el.tagName).toBe('DIV')
    expect(el).toHaveTextContent('JS')
  })

  it('renders single-word alt as single initial', () => {
    render(<Avatar alt="Jakub" data-testid="a" />)
    expect(screen.getByTestId('a')).toHaveTextContent('J')
  })

  it('renders custom fallback when provided', () => {
    render(<Avatar alt="x" fallback={<span data-testid="fb">🙂</span>} data-testid="a" />)
    expect(screen.getByTestId('fb')).toBeInTheDocument()
  })

  it('applies size=md by default (h-10 w-10)', () => {
    render(<Avatar alt="X Y" data-testid="a" />)
    const el = screen.getByTestId('a')
    expect(el).toHaveClass('h-10')
    expect(el).toHaveClass('w-10')
  })

  it('applies size=xs (h-6 w-6)', () => {
    render(<Avatar alt="X Y" size="xs" data-testid="a" />)
    const el = screen.getByTestId('a')
    expect(el).toHaveClass('h-6')
    expect(el).toHaveClass('w-6')
  })

  it('applies size=sm (h-8 w-8)', () => {
    render(<Avatar alt="X Y" size="sm" data-testid="a" />)
    const el = screen.getByTestId('a')
    expect(el).toHaveClass('h-8')
    expect(el).toHaveClass('w-8')
  })

  it('applies size=lg (h-12 w-12)', () => {
    render(<Avatar alt="X Y" size="lg" data-testid="a" />)
    const el = screen.getByTestId('a')
    expect(el).toHaveClass('h-12')
    expect(el).toHaveClass('w-12')
  })

  it('applies size=xl (h-16 w-16)', () => {
    render(<Avatar alt="X Y" size="xl" data-testid="a" />)
    const el = screen.getByTestId('a')
    expect(el).toHaveClass('h-16')
    expect(el).toHaveClass('w-16')
  })

  it('renders as rounded-full', () => {
    render(<Avatar alt="X Y" data-testid="a" />)
    expect(screen.getByTestId('a')).toHaveClass('rounded-full')
  })

  it('uppercases initials automatically', () => {
    render(<Avatar alt="jakub sejda" data-testid="a" />)
    expect(screen.getByTestId('a')).toHaveTextContent('JS')
  })
})
