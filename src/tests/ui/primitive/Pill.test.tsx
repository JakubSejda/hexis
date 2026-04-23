// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Pill, Tag } from '@/components/ui/primitive/Pill'

describe('Pill', () => {
  it('renders children inside a <span> by default', () => {
    render(<Pill data-testid="p">draft</Pill>)
    const el = screen.getByTestId('p')
    expect(el.tagName).toBe('SPAN')
    expect(el).toHaveTextContent('draft')
  })

  it('applies neutral variant styling by default', () => {
    render(<Pill data-testid="p">x</Pill>)
    const el = screen.getByTestId('p')
    expect(el).toHaveClass('bg-surface-raised')
    expect(el).toHaveClass('text-foreground')
  })

  it('applies success variant', () => {
    render(
      <Pill variant="success" data-testid="p">
        ok
      </Pill>
    )
    const el = screen.getByTestId('p')
    expect(el).toHaveClass('bg-primary-soft')
    expect(el).toHaveClass('text-primary')
  })

  it('applies warning variant', () => {
    render(
      <Pill variant="warning" data-testid="p">
        warn
      </Pill>
    )
    const el = screen.getByTestId('p')
    expect(el).toHaveClass('bg-accent-soft')
    expect(el).toHaveClass('text-accent')
  })

  it('applies danger variant', () => {
    render(
      <Pill variant="danger" data-testid="p">
        err
      </Pill>
    )
    const el = screen.getByTestId('p')
    expect(el).toHaveClass('bg-danger')
    expect(el).toHaveClass('text-background')
  })

  it('applies accent variant', () => {
    render(
      <Pill variant="accent" data-testid="p">
        new
      </Pill>
    )
    const el = screen.getByTestId('p')
    expect(el).toHaveClass('bg-accent')
    expect(el).toHaveClass('text-background')
  })

  it('applies size=sm by default (text-xs + h-5)', () => {
    render(<Pill data-testid="p">x</Pill>)
    const el = screen.getByTestId('p')
    expect(el).toHaveClass('text-xs')
    expect(el).toHaveClass('h-5')
  })

  it('applies size=md (text-sm + h-6)', () => {
    render(
      <Pill size="md" data-testid="p">
        x
      </Pill>
    )
    const el = screen.getByTestId('p')
    expect(el).toHaveClass('text-sm')
    expect(el).toHaveClass('h-6')
  })

  it('uses rounded-md (8px per token scale)', () => {
    render(<Pill data-testid="p">x</Pill>)
    expect(screen.getByTestId('p')).toHaveClass('rounded-md')
  })

  it('merges user className via cn()', () => {
    render(
      <Pill className="ml-2" data-testid="p">
        x
      </Pill>
    )
    expect(screen.getByTestId('p')).toHaveClass('ml-2')
  })
})

describe('Tag', () => {
  it('renders as <span> when no handlers', () => {
    render(<Tag data-testid="t">label</Tag>)
    const el = screen.getByTestId('t')
    expect(el.tagName).toBe('SPAN')
  })

  it('renders as <button> when onClick provided', () => {
    render(
      <Tag onClick={() => {}} data-testid="t">
        click
      </Tag>
    )
    const el = screen.getByTestId('t')
    expect(el.tagName).toBe('BUTTON')
  })

  it('renders a span group with remove button when onRemove provided (no onClick)', () => {
    render(
      <Tag onRemove={() => {}} data-testid="t">
        rm
      </Tag>
    )
    const el = screen.getByTestId('t')
    expect(el.tagName).toBe('SPAN')
    expect(el.getAttribute('role')).toBe('group')
    expect(el.querySelector('[data-testid="tag-remove"]')).not.toBeNull()
    expect(el.querySelector('[data-testid="tag-remove"]')?.tagName).toBe('BUTTON')
  })

  it('fires onClick when clicked', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(
      <Tag onClick={onClick} data-testid="t">
        click
      </Tag>
    )
    await user.click(screen.getByTestId('t'))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('renders an X icon when onRemove is provided', () => {
    render(
      <Tag onRemove={() => {}} data-testid="t">
        rm
      </Tag>
    )
    const el = screen.getByTestId('t')
    expect(el.querySelector('[data-testid="tag-remove"]')).not.toBeNull()
  })

  it('fires onRemove and stops onClick propagation when X clicked', async () => {
    const user = userEvent.setup()
    const onRemove = vi.fn()
    const onClick = vi.fn()
    render(
      <Tag onClick={onClick} onRemove={onRemove} data-testid="t">
        rm
      </Tag>
    )
    const remove = screen.getByTestId('t').querySelector('[data-testid="tag-remove"]')!
    await user.click(remove as Element)
    expect(onRemove).toHaveBeenCalledTimes(1)
    expect(onClick).not.toHaveBeenCalled()
  })

  it('inherits Pill variant styling', () => {
    render(
      <Tag variant="success" data-testid="t">
        ok
      </Tag>
    )
    const el = screen.getByTestId('t')
    expect(el).toHaveClass('bg-primary-soft')
    expect(el).toHaveClass('text-primary')
  })
})
