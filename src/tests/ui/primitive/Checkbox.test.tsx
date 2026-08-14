// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Checkbox } from '@/components/ui'

describe('Checkbox', () => {
  it('renders native checkbox with label and fires onChange', async () => {
    const onChange = vi.fn()
    render(<Checkbox label="Ranní protein" checked={false} onChange={onChange} />)
    const el = screen.getByRole('checkbox', { name: 'Ranní protein' })
    expect(el).toHaveClass('peer')
    await userEvent.click(el)
    expect(onChange).toHaveBeenCalledOnce()
  })

  it('renders bare input without label (aria-label passes through)', () => {
    render(<Checkbox aria-label="Návyk" checked readOnly />)
    const el = screen.getByRole('checkbox', { name: 'Návyk' })
    expect(el).toBeChecked()
    expect(el.parentElement?.tagName).not.toBe('LABEL')
  })

  it('respects disabled', () => {
    render(<Checkbox label="Ranní protein" disabled checked={false} readOnly />)
    expect(screen.getByRole('checkbox', { name: 'Ranní protein' })).toBeDisabled()
  })

  it('merges className', () => {
    render(<Checkbox aria-label="x" className="size-4" readOnly checked={false} />)
    expect(screen.getByRole('checkbox')).toHaveClass('size-4')
  })
})
