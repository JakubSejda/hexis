// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Select } from '@/components/ui/primitive/Select'

describe('Select', () => {
  it('renders a <select> with options', () => {
    render(
      <Select data-testid="s">
        <option value="a">A</option>
        <option value="b">B</option>
      </Select>
    )
    const el = screen.getByTestId('s')
    expect(el.tagName).toBe('SELECT')
    expect(el.querySelectorAll('option').length).toBe(2)
  })

  it('applies size=md by default (h-10)', () => {
    render(
      <Select data-testid="s">
        <option>x</option>
      </Select>
    )
    expect(screen.getByTestId('s')).toHaveClass('h-10')
  })

  it('applies size=sm (h-8) and size=lg (h-12)', () => {
    const { rerender } = render(
      <Select size="sm" data-testid="s">
        <option>x</option>
      </Select>
    )
    expect(screen.getByTestId('s')).toHaveClass('h-8')
    rerender(
      <Select size="lg" data-testid="s">
        <option>x</option>
      </Select>
    )
    expect(screen.getByTestId('s')).toHaveClass('h-12')
  })

  it('renders label when provided', () => {
    render(
      <Select label="Kategorie" data-testid="s">
        <option>x</option>
      </Select>
    )
    expect(screen.getByText('Kategorie')).toBeInTheDocument()
  })

  it('renders hint when provided and no error', () => {
    render(
      <Select hint="Choose one" data-testid="s">
        <option>x</option>
      </Select>
    )
    expect(screen.getByText('Choose one')).toBeInTheDocument()
  })

  it('renders error below, hides hint, sets aria-invalid + border-danger', () => {
    render(
      <Select hint="Choose one" error="Required" data-testid="s">
        <option>x</option>
      </Select>
    )
    const el = screen.getByTestId('s')
    expect(screen.getByText('Required')).toBeInTheDocument()
    expect(screen.queryByText('Choose one')).toBeNull()
    expect(el.getAttribute('aria-invalid')).toBe('true')
    expect(el).toHaveClass('border-danger')
  })

  it('renders a chevron icon on the right', () => {
    render(
      <Select data-testid="s">
        <option>x</option>
      </Select>
    )
    const wrapper = screen.getByTestId('s').parentElement!
    expect(wrapper.querySelector('[data-testid="select-chevron"]')).not.toBeNull()
  })

  it('fires onChange', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <Select onChange={onChange} data-testid="s">
        <option value="a">A</option>
        <option value="b">B</option>
      </Select>
    )
    await user.selectOptions(screen.getByTestId('s'), 'b')
    expect(onChange).toHaveBeenCalled()
  })

  it('merges user className', () => {
    render(
      <Select className="bg-red-500" data-testid="s">
        <option>x</option>
      </Select>
    )
    expect(screen.getByTestId('s')).toHaveClass('bg-red-500')
  })

  it('links error/hint to select via aria-describedby', () => {
    const { rerender } = render(
      <Select hint="help" data-testid="s">
        <option>x</option>
      </Select>
    )
    let el = screen.getByTestId('s')
    const describedBy = el.getAttribute('aria-describedby')
    expect(describedBy).toBeTruthy()
    expect(document.getElementById(describedBy!)).toHaveTextContent('help')

    rerender(
      <Select hint="help" error="bad" data-testid="s">
        <option>x</option>
      </Select>
    )
    el = screen.getByTestId('s')
    const describedBy2 = el.getAttribute('aria-describedby')
    expect(describedBy2).toBeTruthy()
    expect(document.getElementById(describedBy2!)).toHaveTextContent('bad')
  })

  it('omits aria-describedby when no hint or error', () => {
    render(
      <Select data-testid="s">
        <option>x</option>
      </Select>
    )
    expect(screen.getByTestId('s').getAttribute('aria-describedby')).toBeNull()
  })
})
