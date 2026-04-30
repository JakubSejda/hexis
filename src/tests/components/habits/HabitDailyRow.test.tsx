// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HabitDailyRow } from '@/components/habits/HabitDailyRow'

afterEach(cleanup)

const baseProps = {
  habit: {
    id: 1,
    name: 'Voda',
    weight: 'standard' as const,
    currentStreak: 5,
    completedToday: false,
  },
}

describe('HabitDailyRow', () => {
  it('renders name, weight pill, and streak', () => {
    render(<HabitDailyRow {...baseProps} onCheck={vi.fn()} onUncheck={vi.fn()} />)
    expect(screen.getByText('Voda')).toBeInTheDocument()
    expect(screen.getByText('×1.0')).toBeInTheDocument()
    expect(screen.getByText('🔥 5')).toBeInTheDocument()
  })

  it('shows ×0.5 for light weight, ×2.0 for heavy', () => {
    render(
      <HabitDailyRow
        habit={{ ...baseProps.habit, weight: 'light' }}
        onCheck={vi.fn()}
        onUncheck={vi.fn()}
      />
    )
    expect(screen.getByText('×0.5')).toBeInTheDocument()
    cleanup()
    render(
      <HabitDailyRow
        habit={{ ...baseProps.habit, weight: 'heavy' }}
        onCheck={vi.fn()}
        onUncheck={vi.fn()}
      />
    )
    expect(screen.getByText('×2.0')).toBeInTheDocument()
  })

  it('renders unchecked checkbox when completedToday=false', () => {
    render(<HabitDailyRow {...baseProps} onCheck={vi.fn()} onUncheck={vi.fn()} />)
    const cb = screen.getByRole('checkbox')
    expect(cb).not.toBeChecked()
  })

  it('renders checked checkbox when completedToday=true', () => {
    render(
      <HabitDailyRow
        habit={{ ...baseProps.habit, completedToday: true }}
        onCheck={vi.fn()}
        onUncheck={vi.fn()}
      />
    )
    expect(screen.getByRole('checkbox')).toBeChecked()
  })

  it('calls onCheck when row is tapped while unchecked', async () => {
    const onCheck = vi.fn()
    render(<HabitDailyRow {...baseProps} onCheck={onCheck} onUncheck={vi.fn()} />)
    await userEvent.click(screen.getByRole('checkbox'))
    expect(onCheck).toHaveBeenCalledWith(1)
  })

  it('does NOT call onCheck when tapping a checked row (long-press required)', async () => {
    const onCheck = vi.fn()
    const onUncheck = vi.fn()
    render(
      <HabitDailyRow
        habit={{ ...baseProps.habit, completedToday: true }}
        onCheck={onCheck}
        onUncheck={onUncheck}
      />
    )
    await userEvent.click(screen.getByRole('checkbox'))
    expect(onCheck).not.toHaveBeenCalled()
    expect(onUncheck).not.toHaveBeenCalled()
  })

  it('exposes data-habit-id and data-habit-row for e2e', () => {
    const { container } = render(
      <HabitDailyRow {...baseProps} onCheck={vi.fn()} onUncheck={vi.fn()} />
    )
    expect(container.querySelector('[data-habit-row][data-habit-id="1"]')).toBeTruthy()
  })
})
