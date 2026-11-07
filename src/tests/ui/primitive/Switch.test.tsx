// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Switch } from '@/components/ui'

describe('Switch', () => {
  it('exposes role=switch with aria-checked reflecting state', () => {
    const { rerender } = render(<Switch checked={false} onChange={() => {}} label="Notifikace" />)
    const sw = screen.getByRole('switch', { name: 'Notifikace' })
    expect(sw).toHaveAttribute('aria-checked', 'false')
    rerender(<Switch checked onChange={() => {}} label="Notifikace" />)
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true')
  })

  it('calls onChange with the toggled value', async () => {
    const onChange = vi.fn()
    render(<Switch checked={false} onChange={onChange} label="X" />)
    await userEvent.click(screen.getByRole('switch'))
    expect(onChange).toHaveBeenCalledWith(true)
  })

  it('does not call onChange when disabled', async () => {
    const onChange = vi.fn()
    render(<Switch checked={false} onChange={onChange} disabled label="X" />)
    await userEvent.click(screen.getByRole('switch'))
    expect(onChange).not.toHaveBeenCalled()
  })

  it('is a pill track that lights up in the accent when on', () => {
    render(<Switch checked onChange={() => {}} label="X" />)
    const sw = screen.getByRole('switch')
    expect(sw).toHaveClass('rounded-full')
    expect(sw).toHaveClass('bg-accent')
    expect(sw.className).not.toContain('-primary')
  })

  it('falls back to the border track when off', () => {
    render(<Switch checked={false} onChange={() => {}} label="X" />)
    expect(screen.getByRole('switch')).toHaveClass('bg-border')
  })
})
