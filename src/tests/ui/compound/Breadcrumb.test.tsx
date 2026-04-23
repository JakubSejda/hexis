// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Breadcrumb } from '@/components/ui/compound/Breadcrumb'

describe('Breadcrumb', () => {
  it('renders a nav with role and aria-label', () => {
    render(<Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Settings' }]} />)
    expect(screen.getByRole('navigation', { name: /breadcrumb/i })).toBeInTheDocument()
  })

  it('renders one <li> per item', () => {
    const { container } = render(
      <Breadcrumb
        items={[{ label: 'A', href: '/a' }, { label: 'B', href: '/a/b' }, { label: 'C' }]}
      />
    )
    expect(container.querySelectorAll('li').length).toBe(3)
  })

  it('renders non-last items with href as <a> links', () => {
    render(
      <Breadcrumb
        items={[{ label: 'A', href: '/a' }, { label: 'B', href: '/a/b' }, { label: 'C' }]}
      />
    )
    expect(screen.getByRole('link', { name: 'A' })).toHaveAttribute('href', '/a')
    expect(screen.getByRole('link', { name: 'B' })).toHaveAttribute('href', '/a/b')
  })

  it('renders the last item as plain text with aria-current="page"', () => {
    render(<Breadcrumb items={[{ label: 'A', href: '/a' }, { label: 'Current' }]} />)
    expect(screen.queryByRole('link', { name: 'Current' })).toBeNull()
    const current = screen.getByText('Current')
    expect(current).toHaveAttribute('aria-current', 'page')
  })

  it('renders N-1 separators for N items', () => {
    const { container } = render(
      <Breadcrumb
        items={[{ label: 'A', href: '/a' }, { label: 'B', href: '/a/b' }, { label: 'C' }]}
      />
    )
    const separators = container.querySelectorAll('[data-breadcrumb-separator]')
    expect(separators.length).toBe(2)
  })

  it('renders a single item without any separator', () => {
    const { container } = render(<Breadcrumb items={[{ label: 'Only' }]} />)
    expect(container.querySelectorAll('[data-breadcrumb-separator]').length).toBe(0)
    expect(screen.getByText('Only')).toHaveAttribute('aria-current', 'page')
  })

  it('renders non-last item without href as a plain span (no link)', () => {
    render(<Breadcrumb items={[{ label: 'NoHref' }, { label: 'Current' }]} />)
    expect(screen.queryByRole('link', { name: 'NoHref' })).toBeNull()
    expect(screen.getByText('NoHref')).toBeInTheDocument()
  })
})
