// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { render, screen, cleanup, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HabitsPageClient } from '@/components/habits/HabitsPageClient'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}))

vi.mock('@/components/ui', async () => {
  const actual = await vi.importActual<typeof import('@/components/ui')>('@/components/ui')
  return { ...actual, useToast: () => ({ show: vi.fn() }) }
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

beforeEach(() => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: () => Promise.resolve({ streak: 1 }),
  }) as unknown as typeof fetch
})

const dailyHabit = {
  id: 1,
  userId: 'u1',
  name: 'Voda',
  cadence: 'daily' as const,
  weeklyTarget: null,
  weight: 'standard' as const,
  currentStreak: 0,
  completedToday: false,
  archivedAt: null,
  createdAt: new Date(),
}

describe('HabitsPageClient — empty state', () => {
  it('renders empty CTA when no active habits', () => {
    render(<HabitsPageClient initialHabits={[]} initialArchived={[]} />)
    expect(screen.getByText(/založ první návyk/i)).toBeInTheDocument()
    expect(screen.getByText(/tap = check, drž = vrátit zpět/i)).toBeInTheDocument()
  })
})

describe('HabitsPageClient — sections', () => {
  it('renders Daily section header when daily habits exist', () => {
    render(<HabitsPageClient initialHabits={[dailyHabit]} initialArchived={[]} />)
    expect(screen.getByText('Daily')).toBeInTheDocument()
  })

  it('renders Weekly section when weekly habits exist', () => {
    const w = {
      ...dailyHabit,
      id: 2,
      name: 'M',
      cadence: 'weekly' as const,
      weeklyTarget: 3,
      weight: 'light' as const,
      completedThisWeek: 0,
    }
    render(<HabitsPageClient initialHabits={[w]} initialArchived={[]} />)
    expect(screen.getByText('Weekly')).toBeInTheDocument()
  })

  it('renders Archive section header with count when archived exist', () => {
    const arch = { ...dailyHabit, id: 3, archivedAt: new Date().toISOString() }
    render(<HabitsPageClient initialHabits={[]} initialArchived={[arch]} />)
    expect(screen.getByText(/archive \(1\)/i)).toBeInTheDocument()
  })
})

describe('HabitsPageClient — interactions', () => {
  it('opens create dialog when "+ Nový" is clicked', async () => {
    render(<HabitsPageClient initialHabits={[dailyHabit]} initialArchived={[]} />)
    await userEvent.click(screen.getByRole('button', { name: /\+ nový/i }))
    expect(screen.getByText(/nový návyk/i)).toBeInTheDocument()
  })

  it('POSTs to /api/habits/[id]/check on row tap (optimistic)', async () => {
    render(<HabitsPageClient initialHabits={[dailyHabit]} initialArchived={[]} />)
    await userEvent.click(screen.getByRole('checkbox', { name: /voda/i }))
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringMatching(/\/api\/habits\/1\/check/),
        expect.objectContaining({ method: 'POST' })
      )
    })
  })
})
