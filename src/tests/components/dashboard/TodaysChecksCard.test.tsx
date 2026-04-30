// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { render, screen, cleanup, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TodaysChecksCard } from '@/components/dashboard/TodaysChecksCard'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}))
vi.mock('@/components/ui', async () => {
  const actual = await vi.importActual<typeof import('@/components/ui')>('@/components/ui')
  return { ...actual, useToast: () => ({ show: vi.fn() }) }
})

afterEach(cleanup)
beforeEach(() => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ streak: 1 }),
  }) as unknown as typeof fetch
})

const make = (overrides = {}) => ({
  id: 1,
  name: 'Voda',
  cadence: 'daily' as const,
  weeklyTarget: null,
  weight: 'standard' as const,
  currentStreak: 5,
  completedToday: false,
  archivedAt: null,
  userId: 'u1',
  createdAt: new Date(),
  ...overrides,
})

describe('TodaysChecksCard', () => {
  it('renders nothing when there are no daily habits', () => {
    const { container } = render(<TodaysChecksCard dailyHabits={[]} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders all daily habits up to 5', () => {
    const habits = Array.from({ length: 7 }, (_, i) => make({ id: i + 1, name: `H${i + 1}` }))
    render(<TodaysChecksCard dailyHabits={habits} />)
    expect(screen.getByText('H1')).toBeInTheDocument()
    expect(screen.getByText('H5')).toBeInTheDocument()
    expect(screen.queryByText('H6')).not.toBeInTheDocument()
    expect(screen.getByText(/a 2 další/i)).toBeInTheDocument()
  })

  it('shows "X ze Y hotovo" footer count', () => {
    const habits = [
      make({ id: 1, completedToday: true }),
      make({ id: 2, completedToday: true }),
      make({ id: 3, completedToday: false }),
    ]
    render(<TodaysChecksCard dailyHabits={habits} />)
    expect(screen.getByText(/2 ze 3 hotovo/)).toBeInTheDocument()
  })

  it('links to /habits via "Otevřít"', () => {
    render(<TodaysChecksCard dailyHabits={[make()]} />)
    expect(screen.getByRole('link', { name: /otevřít/i })).toHaveAttribute('href', '/habits')
  })

  it('calls /api/habits/[id]/check on tap', async () => {
    render(<TodaysChecksCard dailyHabits={[make()]} />)
    await userEvent.click(screen.getByRole('checkbox', { name: /voda/i }))
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringMatching(/\/api\/habits\/1\/check/),
        expect.objectContaining({ method: 'POST' })
      )
    })
  })
})
