// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CalendarGrid } from '@/components/calendar/CalendarGrid'
import type { CalendarDay } from '@/lib/calendar/types'

function makeMay2026(): CalendarDay[] {
  return Array.from({ length: 31 }, (_, i) => ({
    date: `2026-05-${String(i + 1).padStart(2, '0')}`,
    signals: { training: false, habit: false, weigh: false, photo: false },
    isToday: false,
    isFuture: false,
    inStreak: false,
    forecastPlanName: null,
  }))
}

describe('CalendarGrid', () => {
  it('renders all 7 weekday headers in Czech (Po Út St Čt Pá So Ne)', () => {
    render(<CalendarGrid days={makeMay2026()} />)
    ;['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'].forEach((d) => {
      expect(screen.getByText(d)).toBeInTheDocument()
    })
  })

  it('renders one cell per day', () => {
    const { container } = render(<CalendarGrid days={makeMay2026()} />)
    expect(container.querySelectorAll('[data-date]').length).toBe(31)
  })

  it('inserts leading empty cells so the 1st sits under the correct weekday header', () => {
    // 2026-05-01 is a Friday → leading 4 empty cells (Po Út St Čt)
    const { container } = render(<CalendarGrid days={makeMay2026()} />)
    const blankCells = container.querySelectorAll('[data-blank="true"]')
    expect(blankCells.length).toBe(4)
  })
})
