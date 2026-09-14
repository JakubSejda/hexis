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
    expect(screen.getByRole('link', { name: /přehled/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /trénink/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /výživa/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /návyky/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /více/i })).toBeInTheDocument()
  })

  it('marks the Nutrition tab active when pathname is /nutrition', () => {
    vi.mocked(usePathname).mockReturnValue('/nutrition')
    render(<BottomNav />)
    expect(screen.getByRole('link', { name: /výživa/i })).toHaveAttribute('aria-current', 'page')
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
    expect(screen.getByRole('link', { name: /progres/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /statistiky/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /odměny/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /profil hráče/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /kalendář questů/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /nastavení/i })).toBeInTheDocument()
  })
})
