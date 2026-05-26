// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CalendarGridClient } from '@/components/calendar/CalendarGridClient'
import type { CalendarDay } from '@/lib/calendar/types'

vi.stubGlobal(
  'fetch',
  vi.fn(
    async () =>
      new Response(
        JSON.stringify({
          date: '2026-05-15',
          sessions: [],
          habits: [],
          measurement: null,
          photos: [],
        }),
        { status: 200 }
      )
  )
)

const day = (date: string, over: Partial<CalendarDay> = {}): CalendarDay => ({
  date,
  signals: { training: false, habit: false, weigh: false, photo: false },
  isToday: false,
  isFuture: false,
  inStreak: false,
  forecastPlanName: null,
  ...over,
})

describe('CalendarGridClient', () => {
  it('renders the grid and opens modal when a day is clicked', async () => {
    render(<CalendarGridClient days={[day('2026-05-15', { isToday: true }), day('2026-05-16')]} />)
    expect(screen.queryByRole('button', { name: /zavřít/i })).not.toBeInTheDocument()
    const cell = document.querySelector('[data-date="2026-05-15"]') as HTMLElement
    fireEvent.click(cell)
    expect(await screen.findByRole('button', { name: /zavřít/i })).toBeInTheDocument()
  })

  it('does not open modal for blank cells', () => {
    render(<CalendarGridClient days={[day('2026-05-15')]} />)
    // blank cells live in the grid header rendering — clicking outside data-date should not open
    const grid = document.querySelector('.grid') as HTMLElement
    fireEvent.click(grid)
    expect(screen.queryByRole('button', { name: /zavřít/i })).not.toBeInTheDocument()
  })
})
