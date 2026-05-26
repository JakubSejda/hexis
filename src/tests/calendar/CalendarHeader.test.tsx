// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CalendarHeader } from '@/components/calendar/CalendarHeader'

describe('CalendarHeader', () => {
  it('renders cs-CZ month + year label', () => {
    render(<CalendarHeader ym="2026-05" currentYm="2026-05" />)
    expect(screen.getByText(/květen 2026/i)).toBeInTheDocument()
  })

  it('renders prev link to ?ym=2026-04', () => {
    render(<CalendarHeader ym="2026-05" currentYm="2026-05" />)
    const prev = screen.getByRole('link', { name: /předchozí měsíc/i })
    expect(prev).toHaveAttribute('href', '/calendar?ym=2026-04')
  })

  it('renders next link to ?ym=2026-06', () => {
    render(<CalendarHeader ym="2026-05" currentYm="2026-05" />)
    const next = screen.getByRole('link', { name: /další měsíc/i })
    expect(next).toHaveAttribute('href', '/calendar?ym=2026-06')
  })

  it('handles year wrap on prev (Jan → previous Dec)', () => {
    render(<CalendarHeader ym="2026-01" currentYm="2026-05" />)
    expect(screen.getByRole('link', { name: /předchozí měsíc/i })).toHaveAttribute(
      'href',
      '/calendar?ym=2025-12'
    )
  })

  it('handles year wrap on next (Dec → next Jan)', () => {
    render(<CalendarHeader ym="2026-12" currentYm="2026-05" />)
    expect(screen.getByRole('link', { name: /další měsíc/i })).toHaveAttribute(
      'href',
      '/calendar?ym=2027-01'
    )
  })

  it('hides "Dnes" button on current month', () => {
    render(<CalendarHeader ym="2026-05" currentYm="2026-05" />)
    expect(screen.queryByRole('link', { name: /^dnes$/i })).not.toBeInTheDocument()
  })

  it('shows "Dnes" button when not current month, linking to /calendar (no ?ym)', () => {
    render(<CalendarHeader ym="2026-04" currentYm="2026-05" />)
    const dnes = screen.getByRole('link', { name: /^dnes$/i })
    expect(dnes).toHaveAttribute('href', '/calendar')
  })
})
