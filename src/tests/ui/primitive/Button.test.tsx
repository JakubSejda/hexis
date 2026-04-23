// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from '@/components/ui/primitive/Button'

describe('Button', () => {
  it('renders children inside a <button> by default', () => {
    render(<Button>Go</Button>)
    const el = screen.getByRole('button', { name: /go/i })
    expect(el.tagName).toBe('BUTTON')
  })

  it('applies amber primary styling by default', () => {
    render(<Button>Go</Button>)
    const el = screen.getByRole('button')
    expect(el).toHaveClass('bg-accent')
    expect(el).toHaveClass('text-background')
  })

  it('applies emerald success styling when variant="success"', () => {
    render(<Button variant="success">Save</Button>)
    const el = screen.getByRole('button')
    expect(el).toHaveClass('bg-primary')
    expect(el).toHaveClass('text-background')
  })

  it('applies emerald outline secondary styling when variant="secondary"', () => {
    render(<Button variant="secondary">Cancel</Button>)
    const el = screen.getByRole('button')
    expect(el).toHaveClass('border')
    expect(el).toHaveClass('border-primary')
    expect(el).toHaveClass('text-primary')
  })

  it('applies transparent ghost styling when variant="ghost"', () => {
    render(<Button variant="ghost">More</Button>)
    const el = screen.getByRole('button')
    expect(el.className).toMatch(/hover:bg-surface-raised/)
  })

  it('applies red danger styling when variant="danger"', () => {
    render(<Button variant="danger">Delete</Button>)
    const el = screen.getByRole('button')
    expect(el).toHaveClass('bg-danger')
    expect(el).toHaveClass('text-background')
  })

  it('applies size=sm classes (h-8 px-3 text-sm)', () => {
    render(<Button size="sm">sm</Button>)
    const el = screen.getByRole('button')
    expect(el).toHaveClass('h-8')
    expect(el).toHaveClass('px-3')
    expect(el).toHaveClass('text-sm')
  })

  it('applies size=md classes by default (h-10 px-4 text-sm)', () => {
    render(<Button>md</Button>)
    const el = screen.getByRole('button')
    expect(el).toHaveClass('h-10')
    expect(el).toHaveClass('px-4')
    expect(el).toHaveClass('text-sm')
  })

  it('applies size=lg classes (h-12 px-6 text-base)', () => {
    render(<Button size="lg">lg</Button>)
    const el = screen.getByRole('button')
    expect(el).toHaveClass('h-12')
    expect(el).toHaveClass('px-6')
    expect(el).toHaveClass('text-base')
  })

  it('renders iconLeft and iconRight slots', () => {
    render(
      <Button iconLeft={<span data-testid="left" />} iconRight={<span data-testid="right" />}>
        label
      </Button>
    )
    expect(screen.getByTestId('left')).toBeInTheDocument()
    expect(screen.getByTestId('right')).toBeInTheDocument()
  })

  it('renders <a> when as="a" and passes href', () => {
    render(
      <Button as="a" href="/x">
        link
      </Button>
    )
    const el = screen.getByRole('link', { name: /link/i })
    expect(el.tagName).toBe('A')
    expect(el).toHaveAttribute('href', '/x')
  })

  it('replaces icons with spinner and sets aria-busy + disabled when loading', () => {
    render(
      <Button
        loading
        iconLeft={<span data-testid="left" />}
        iconRight={<span data-testid="right" />}
      >
        save
      </Button>
    )
    const el = screen.getByRole('button')
    expect(el).toHaveAttribute('aria-busy', 'true')
    expect(el).toBeDisabled()
    expect(screen.queryByTestId('left')).toBeNull()
    expect(screen.queryByTestId('right')).toBeNull()
    expect(el.querySelector('[data-testid="button-spinner"]')).not.toBeNull()
  })

  it('does not fire onClick when loading', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(
      <Button loading onClick={onClick}>
        save
      </Button>
    )
    await user.click(screen.getByRole('button'))
    expect(onClick).not.toHaveBeenCalled()
  })

  it('fires onClick normally when not loading', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(<Button onClick={onClick}>go</Button>)
    await user.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('lets user className override base via tailwind-merge (cn helper)', () => {
    render(<Button className="bg-red-500">go</Button>)
    const el = screen.getByRole('button')
    expect(el).toHaveClass('bg-red-500')
    expect(el).not.toHaveClass('bg-accent')
  })

  it('respects user-supplied disabled prop when not loading', () => {
    render(<Button disabled>disabled</Button>)
    const el = screen.getByRole('button')
    expect(el).toBeDisabled()
  })
})
