// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SegmentedControl } from '@/components/ui'

const RANGES = [
  { label: '30d', value: '30' },
  { label: '90d', value: '90' },
  { label: '1y', value: '365' },
]

describe('SegmentedControl', () => {
  it('is a named group of radios, not a tablist', () => {
    render(
      <SegmentedControl
        name="range"
        label="Období"
        options={RANGES}
        value="30"
        onChange={() => {}}
      />
    )
    // A tablist promises tab panels it does not have; a radio group is what
    // "pick one of these values" actually is — and it arrives with keyboard
    // support and screen-reader semantics for free.
    expect(screen.queryByRole('tablist')).toBeNull()
    expect(screen.getByRole('group', { name: 'Období' })).toBeInTheDocument()
    expect(screen.getAllByRole('radio')).toHaveLength(3)
  })

  it('marks the current value as checked', () => {
    render(
      <SegmentedControl
        name="range"
        label="Období"
        options={RANGES}
        value="90"
        onChange={() => {}}
      />
    )
    expect(screen.getByRole('radio', { name: '90d' })).toBeChecked()
    expect(screen.getByRole('radio', { name: '30d' })).not.toBeChecked()
  })

  it('reports the picked value', async () => {
    const onChange = vi.fn()
    render(
      <SegmentedControl
        name="range"
        label="Období"
        options={RANGES}
        value="30"
        onChange={onChange}
      />
    )
    await userEvent.click(screen.getByRole('radio', { name: '1y' }))
    expect(onChange).toHaveBeenCalledWith('365')
  })

  it('keeps every segment a full touch target', () => {
    render(
      <SegmentedControl
        name="range"
        label="Období"
        options={RANGES}
        value="30"
        onChange={() => {}}
      />
    )
    const label = screen.getByText('30d').closest('label')!
    expect(label.className).toMatch(/min-h-11/)
  })
})
