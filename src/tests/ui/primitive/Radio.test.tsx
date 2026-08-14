// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Radio } from '@/components/ui'

describe('Radio', () => {
  it('renders native radio with label and fires onChange', async () => {
    const onChange = vi.fn()
    render(
      <>
        <Radio name="cadence" value="daily" label="Daily" checked readOnly />
        <Radio name="cadence" value="weekly" label="Weekly" checked={false} onChange={onChange} />
      </>
    )
    const weekly = screen.getByRole('radio', { name: 'Weekly' })
    expect(weekly).toHaveClass('peer')
    await userEvent.click(weekly)
    expect(onChange).toHaveBeenCalled()
  })

  it('respects disabled', () => {
    render(<Radio name="c" value="x" label="Daily" disabled readOnly checked={false} />)
    expect(screen.getByRole('radio', { name: 'Daily' })).toBeDisabled()
  })

  it('applies labelClassName to the label wrapper', () => {
    render(
      <Radio
        name="w"
        value="light"
        label="light"
        labelClassName="capitalize"
        readOnly
        checked={false}
      />
    )
    const el = screen.getByRole('radio', { name: 'light' })
    expect(el.closest('label')).toHaveClass('capitalize')
  })
})
