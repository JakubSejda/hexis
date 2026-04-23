// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NumberInput } from '@/components/ui'

describe('NumberInput', () => {
  it('renders - button, input, + button', () => {
    render(<NumberInput value={5} onChange={() => {}} />)
    expect(screen.getByLabelText(/snížit/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/zvýšit/i)).toBeInTheDocument()
    expect(screen.getByRole('spinbutton')).toBeInTheDocument()
  })

  it('increments on + click by step', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<NumberInput value={5} onChange={onChange} step={2.5} />)
    await user.click(screen.getByLabelText(/zvýšit/i))
    expect(onChange).toHaveBeenCalledWith(7.5)
  })

  it('decrements on - click by step', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<NumberInput value={5} onChange={onChange} step={2.5} />)
    await user.click(screen.getByLabelText(/snížit/i))
    expect(onChange).toHaveBeenCalledWith(2.5)
  })

  it('clamps to min/max', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<NumberInput value={10} onChange={onChange} step={5} min={0} max={10} />)
    await user.click(screen.getByLabelText(/zvýšit/i))
    expect(onChange).toHaveBeenCalledWith(10)
  })

  it('renders suffix when provided', () => {
    render(<NumberInput value={5} onChange={() => {}} suffix="kg" />)
    expect(screen.getByText('kg')).toBeInTheDocument()
  })

  it('renders label when provided', () => {
    render(<NumberInput label="Hmotnost" value={5} onChange={() => {}} />)
    expect(screen.getByText('Hmotnost')).toBeInTheDocument()
  })

  it('renders hint when provided and no error', () => {
    render(<NumberInput hint="kroky po 2,5 kg" value={5} onChange={() => {}} />)
    expect(screen.getByText('kroky po 2,5 kg')).toBeInTheDocument()
  })

  it('renders error below and hides hint', () => {
    render(<NumberInput hint="h" error="Too low" value={0} onChange={() => {}} />)
    expect(screen.getByText('Too low')).toBeInTheDocument()
    expect(screen.queryByText('h')).toBeNull()
  })

  it('sets aria-invalid on inner input when error present', () => {
    render(<NumberInput error="bad" value={0} onChange={() => {}} />)
    const input = screen.getByRole('spinbutton')
    expect(input.getAttribute('aria-invalid')).toBe('true')
  })
})
