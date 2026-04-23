// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Input } from '@/components/ui'

describe('Input', () => {
  it('renders an <input> element', () => {
    render(<Input data-testid="i" />)
    const el = screen.getByTestId('i')
    expect(el.tagName).toBe('INPUT')
  })

  it('applies default variant + md size by default', () => {
    render(<Input data-testid="i" />)
    const el = screen.getByTestId('i')
    expect(el).toHaveClass('h-10')
  })

  it('applies size=sm (h-8) and size=lg (h-12)', () => {
    const { rerender } = render(<Input size="sm" data-testid="i" />)
    expect(screen.getByTestId('i')).toHaveClass('h-8')
    rerender(<Input size="lg" data-testid="i" />)
    expect(screen.getByTestId('i')).toHaveClass('h-12')
  })

  it('renders a label element when label prop provided', () => {
    render(<Input label="E-mail" data-testid="i" />)
    expect(screen.getByText('E-mail')).toBeInTheDocument()
  })

  it('associates label with input via htmlFor/id', () => {
    render(<Input label="E-mail" id="email" data-testid="i" />)
    const label = screen.getByText('E-mail').closest('label')
    expect(label?.getAttribute('for')).toBe('email')
    expect(screen.getByTestId('i').getAttribute('id')).toBe('email')
  })

  it('renders hint below when provided and no error', () => {
    render(<Input hint="max 20 chars" data-testid="i" />)
    expect(screen.getByText('max 20 chars')).toBeInTheDocument()
  })

  it('renders error below when provided, and hides hint', () => {
    render(<Input hint="max 20 chars" error="Required" data-testid="i" />)
    expect(screen.getByText('Required')).toBeInTheDocument()
    expect(screen.queryByText('max 20 chars')).toBeNull()
  })

  it('sets aria-invalid and red border when error present', () => {
    render(<Input error="bad" data-testid="i" />)
    const el = screen.getByTestId('i')
    expect(el.getAttribute('aria-invalid')).toBe('true')
    expect(el).toHaveClass('border-danger')
  })

  it('renders a search icon when variant="search"', () => {
    render(<Input variant="search" data-testid="i" />)
    const wrapper = screen.getByTestId('i').parentElement!
    expect(wrapper.querySelector('[data-testid="input-search-icon"]')).not.toBeNull()
  })

  it('renders iconLeft and iconRight slots', () => {
    render(
      <Input
        iconLeft={<span data-testid="l" />}
        iconRight={<span data-testid="r" />}
        data-testid="i"
      />
    )
    expect(screen.getByTestId('l')).toBeInTheDocument()
    expect(screen.getByTestId('r')).toBeInTheDocument()
  })

  it('forwards onChange and other HTML attrs', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Input onChange={onChange} data-testid="i" />)
    await user.type(screen.getByTestId('i'), 'a')
    expect(onChange).toHaveBeenCalled()
  })

  it('lets user className override base via cn()', () => {
    render(<Input className="bg-red-500" data-testid="i" />)
    expect(screen.getByTestId('i')).toHaveClass('bg-red-500')
  })

  it('links error/hint to input via aria-describedby', () => {
    const { rerender } = render(<Input hint="help" data-testid="i" />)
    let el = screen.getByTestId('i')
    const describedBy = el.getAttribute('aria-describedby')
    expect(describedBy).toBeTruthy()
    expect(document.getElementById(describedBy!)).toHaveTextContent('help')

    rerender(<Input hint="help" error="bad" data-testid="i" />)
    el = screen.getByTestId('i')
    const describedBy2 = el.getAttribute('aria-describedby')
    expect(describedBy2).toBeTruthy()
    expect(document.getElementById(describedBy2!)).toHaveTextContent('bad')
  })

  it('omits aria-describedby when no hint or error', () => {
    render(<Input data-testid="i" />)
    const el = screen.getByTestId('i')
    expect(el.getAttribute('aria-describedby')).toBeNull()
  })
})
