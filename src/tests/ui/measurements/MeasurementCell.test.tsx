// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MeasurementCell } from '@/components/measurements/MeasurementCell'

describe('MeasurementCell', () => {
  it('names the field and row it belongs to', () => {
    // In a table of five measures across many weeks, "82.5" or "—" alone tells
    // a screen-reader user nothing about what they are about to edit.
    render(
      <MeasurementCell
        value={82.5}
        precision={2}
        label="Váha, 12. 5."
        onCommit={vi.fn(async () => {})}
      />
    )
    expect(screen.getByRole('button', { name: /Váha, 12\. 5\./ })).toBeInTheDocument()
  })

  it('still names an empty cell', () => {
    render(
      <MeasurementCell
        value={null}
        precision={1}
        label="Pas, 12. 5."
        onCommit={vi.fn(async () => {})}
      />
    )
    const button = screen.getByRole('button', { name: /Pas, 12\. 5\./ })
    expect(button).toHaveTextContent('—')
  })
})
