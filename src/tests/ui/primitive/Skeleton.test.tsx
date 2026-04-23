// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Skeleton } from '@/components/ui/primitive/Skeleton'

describe('Skeleton', () => {
  it('renders a div with animate-pulse and surface-raised background', () => {
    render(<Skeleton data-testid="s" />)
    const el = screen.getByTestId('s')
    expect(el.tagName).toBe('DIV')
    expect(el).toHaveClass('animate-pulse')
    expect(el).toHaveClass('bg-surface-raised')
  })

  it('defaults to shape=text with 1 line', () => {
    render(<Skeleton data-testid="s" />)
    const el = screen.getByTestId('s')
    expect(el).toHaveClass('h-4')
    expect(el).toHaveClass('rounded')
  })

  it('renders multiple lines when shape=text + lines > 1', () => {
    render(<Skeleton shape="text" lines={3} data-testid="s" />)
    const wrapper = screen.getByTestId('s')
    expect(wrapper.querySelectorAll('[data-testid="skeleton-line"]').length).toBe(3)
  })

  it('renders shape=block (rounded-md, h-20 default)', () => {
    render(<Skeleton shape="block" data-testid="s" />)
    const el = screen.getByTestId('s')
    expect(el).toHaveClass('rounded-md')
    expect(el).toHaveClass('h-20')
  })

  it('renders shape=avatar (rounded-full + square aspect)', () => {
    render(<Skeleton shape="avatar" data-testid="s" />)
    const el = screen.getByTestId('s')
    expect(el).toHaveClass('rounded-full')
    expect(el).toHaveClass('h-10')
    expect(el).toHaveClass('w-10')
  })

  it('renders shape=card (rounded-2xl, h-32 default)', () => {
    render(<Skeleton shape="card" data-testid="s" />)
    const el = screen.getByTestId('s')
    expect(el).toHaveClass('rounded-2xl')
    expect(el).toHaveClass('h-32')
  })

  it('accepts width as Tailwind class string', () => {
    render(<Skeleton width="w-1/2" data-testid="s" />)
    expect(screen.getByTestId('s')).toHaveClass('w-1/2')
  })

  it('accepts width as a pixel number (inline style)', () => {
    render(<Skeleton width={120} data-testid="s" />)
    expect(screen.getByTestId('s')).toHaveStyle({ width: '120px' })
  })

  it('accepts height as a pixel number (inline style)', () => {
    render(<Skeleton height={80} data-testid="s" />)
    expect(screen.getByTestId('s')).toHaveStyle({ height: '80px' })
  })

  it('applies height to each line when shape=text + lines > 1 + height as number', () => {
    render(<Skeleton shape="text" lines={3} height={20} data-testid="s" />)
    const lines = screen.getByTestId('s').querySelectorAll('[data-testid="skeleton-line"]')
    expect(lines.length).toBe(3)
    lines.forEach((line) => {
      expect(line).toHaveStyle({ height: '20px' })
    })
  })
})
