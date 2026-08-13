// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BottomNav } from '@/components/shell'

vi.mock('next/navigation', () => ({
  usePathname: vi.fn(),
}))

import { usePathname } from 'next/navigation'

describe('BottomNav', () => {
  it('renders four daily tabs (Dashboard, Training, Nutrition, Habits) + Více button', () => {
    vi.mocked(usePathname).mockReturnValue('/dashboard')
    render(<BottomNav />)
    expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /training/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /nutrition/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /habits/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /více/i })).toBeInTheDocument()
  })

  it('marks the Nutrition tab active when pathname is /nutrition', () => {
    vi.mocked(usePathname).mockReturnValue('/nutrition')
    render(<BottomNav />)
    expect(screen.getByRole('link', { name: /nutrition/i })).toHaveAttribute('aria-current', 'page')
  })

  it('marks no link active on /progress but highlights the Více button', () => {
    vi.mocked(usePathname).mockReturnValue('/progress')
    render(<BottomNav />)
    expect(screen.queryByRole('link', { current: 'page' })).toBeNull()
    expect(screen.getByRole('button', { name: /více/i })).toHaveClass('text-accent')
  })

  it('opens the Více sheet with the six remaining areas', async () => {
    vi.mocked(usePathname).mockReturnValue('/dashboard')
    render(<BottomNav />)
    const more = screen.getByRole('button', { name: /více/i })
    expect(more).toHaveAttribute('aria-expanded', 'false')
    await userEvent.click(more)
    expect(more).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('link', { name: /progress/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /stats/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /rewards/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /player bio/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /quest calendar/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /settings/i })).toBeInTheDocument()
  })
})
