// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HabitWeeklyRow } from '@/components/habits/HabitWeeklyRow'

afterEach(cleanup)

const baseHabit = {
  id: 7,
  name: 'Pondělky meditace',
  weight: 'light' as const,
  weeklyTarget: 4,
  completedThisWeek: 2,
  completedToday: false,
  currentStreak: 6,
}

describe('HabitWeeklyRow', () => {
  it('renders name, weight pill, progress, and streak in týdnech', () => {
    render(<HabitWeeklyRow habit={baseHabit} onCheck={vi.fn()} />)
    expect(screen.getByText('Pondělky meditace')).toBeInTheDocument()
    expect(screen.getByText('×0.5')).toBeInTheDocument()
    expect(screen.getByText('2/4 tento týden')).toBeInTheDocument()
    expect(screen.getByText('🔥 6 t')).toBeInTheDocument()
  })

  it('shows "Splněno dnes" button when not yet checked today', () => {
    render(<HabitWeeklyRow habit={baseHabit} onCheck={vi.fn()} />)
    expect(screen.getByRole('button', { name: /splněno dnes/i })).toBeEnabled()
  })

  it('disables button after today is already checked', () => {
    render(<HabitWeeklyRow habit={{ ...baseHabit, completedToday: true }} onCheck={vi.fn()} />)
    expect(screen.getByRole('button', { name: /splněno dnes/i })).toBeDisabled()
  })

  it('calls onCheck when button clicked', async () => {
    const onCheck = vi.fn()
    render(<HabitWeeklyRow habit={baseHabit} onCheck={onCheck} />)
    await userEvent.click(screen.getByRole('button', { name: /splněno dnes/i }))
    expect(onCheck).toHaveBeenCalledWith(7)
  })

  it('shows progress bar filled to (completedThisWeek / weeklyTarget)', () => {
    const { container } = render(
      <HabitWeeklyRow habit={{ ...baseHabit, completedThisWeek: 3 }} onCheck={vi.fn()} />
    )
    const bar = container.querySelector('[data-progress-fill]') as HTMLElement
    expect(bar.style.width).toBe('75%')
  })

  it('caps progress at 100%', () => {
    const { container } = render(
      <HabitWeeklyRow habit={{ ...baseHabit, completedThisWeek: 9 }} onCheck={vi.fn()} />
    )
    const bar = container.querySelector('[data-progress-fill]') as HTMLElement
    expect(bar.style.width).toBe('100%')
  })
})
