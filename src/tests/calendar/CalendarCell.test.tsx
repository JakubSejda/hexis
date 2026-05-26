// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CalendarCell } from '@/components/calendar/CalendarCell'
import type { CalendarDay } from '@/lib/calendar/types'

function day(over: Partial<CalendarDay> = {}): CalendarDay {
  return {
    date: '2026-05-15',
    signals: { training: false, habit: false, weigh: false, photo: false },
    isToday: false,
    isFuture: false,
    inStreak: false,
    forecastPlanName: null,
    ...over,
  }
}

describe('CalendarCell', () => {
  it('renders the day number', () => {
    render(<CalendarCell day={day({ date: '2026-05-15' })} />)
    expect(screen.getByText('15')).toBeInTheDocument()
  })

  it('renders 4 dot indicators with data-signal attrs', () => {
    const { container } = render(
      <CalendarCell
        day={day({ signals: { training: true, habit: true, weigh: false, photo: true } })}
      />
    )
    const trainingDot = container.querySelector('[data-signal="training"]')
    const habitDot = container.querySelector('[data-signal="habit"]')
    const weighDot = container.querySelector('[data-signal="weigh"]')
    const photoDot = container.querySelector('[data-signal="photo"]')
    expect(trainingDot).toHaveAttribute('data-active', 'true')
    expect(habitDot).toHaveAttribute('data-active', 'true')
    expect(weighDot).toHaveAttribute('data-active', 'false')
    expect(photoDot).toHaveAttribute('data-active', 'true')
  })

  it('sets data-today on today', () => {
    const { container } = render(<CalendarCell day={day({ isToday: true })} />)
    expect(container.querySelector('[data-today="true"]')).toBeInTheDocument()
  })

  it('sets data-streak on inStreak cells', () => {
    const { container } = render(
      <CalendarCell
        day={day({
          inStreak: true,
          signals: { training: true, habit: false, weigh: false, photo: false },
        })}
      />
    )
    expect(container.querySelector('[data-streak="true"]')).toBeInTheDocument()
  })

  it('renders forecast plan label and dotted treatment on forecast day', () => {
    render(<CalendarCell day={day({ isFuture: true, forecastPlanName: 'Plán A' })} />)
    expect(screen.getByText(/plán a\?/i)).toBeInTheDocument()
  })

  it('dims plain future cells (no forecast, no signals shown)', () => {
    const { container } = render(<CalendarCell day={day({ isFuture: true })} />)
    expect(container.querySelector('[data-future="true"]')).toBeInTheDocument()
  })

  it('exposes data-date for click delegation', () => {
    const { container } = render(<CalendarCell day={day({ date: '2026-05-15' })} />)
    expect(container.querySelector('[data-date="2026-05-15"]')).toBeInTheDocument()
  })
})
