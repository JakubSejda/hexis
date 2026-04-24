// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { WeekPeek } from '@/components/dashboard/WeekPeek'
import type { WeekPeekDay } from '@/lib/week-peek'

const days: WeekPeekDay[] = [
  { weekdayLabel: 'Po', status: 'workout' },
  { weekdayLabel: 'Út', status: 'rest' },
  { weekdayLabel: 'St', status: 'workout' },
  { weekdayLabel: 'Čt', status: 'empty' },
  { weekdayLabel: 'Pá', status: 'empty' },
  { weekdayLabel: 'So', status: 'empty' },
  { weekdayLabel: 'Ne', status: 'empty' },
]

describe('WeekPeek', () => {
  it('renders all 7 weekday labels', () => {
    render(<WeekPeek days={days} />)
    for (const label of ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne']) {
      expect(screen.getByText(label)).toBeInTheDocument()
    }
  })

  it('renders legend line with all three glyphs', () => {
    render(<WeekPeek days={days} />)
    expect(screen.getByText(/workout/i)).toBeInTheDocument()
    expect(screen.getByText(/rest/i)).toBeInTheDocument()
    expect(screen.getByText(/future/i)).toBeInTheDocument()
  })

  it('wraps in a link to /training', () => {
    render(<WeekPeek days={days} />)
    expect(screen.getByRole('link')).toHaveAttribute('href', '/training')
  })

  it('applies status-specific data attributes on each day cell', () => {
    const { container } = render(<WeekPeek days={days} />)
    const cells = container.querySelectorAll('[data-day-status]')
    expect(cells).toHaveLength(7)
    expect(cells[0]!.getAttribute('data-day-status')).toBe('workout')
    expect(cells[1]!.getAttribute('data-day-status')).toBe('rest')
    expect(cells[3]!.getAttribute('data-day-status')).toBe('empty')
  })
})
