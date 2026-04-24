// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Sidebar } from '@/components/shell'

vi.mock('next/navigation', () => ({
  usePathname: vi.fn(),
}))

import { usePathname } from 'next/navigation'

describe('Sidebar', () => {
  it('renders the HEXIS brand and all five Life Areas', () => {
    vi.mocked(usePathname).mockReturnValue('/dashboard')
    render(<Sidebar />)
    expect(screen.getByText(/hexis/i)).toBeInTheDocument()
    ;['Dashboard', 'Training', 'Nutrition', 'Progress', 'Stats'].forEach((label) => {
      expect(screen.getByRole('link', { name: new RegExp(`^${label}$`) })).toBeInTheDocument()
    })
  })

  it('renders the Settings footer link', () => {
    vi.mocked(usePathname).mockReturnValue('/dashboard')
    render(<Sidebar />)
    expect(screen.getByRole('link', { name: /^settings$/i })).toBeInTheDocument()
  })

  it('renders 4 disabled SP5 placeholder items with aria-disabled', () => {
    vi.mocked(usePathname).mockReturnValue('/dashboard')
    render(<Sidebar />)
    ;['Rewards', 'Habits', 'Player Bio', 'Quest Calendar'].forEach((label) => {
      const item = screen.getByText(label).closest('[aria-disabled="true"]')
      expect(item).toBeInTheDocument()
    })
  })

  it('marks the active Life Area with aria-current on /progress', () => {
    vi.mocked(usePathname).mockReturnValue('/progress')
    render(<Sidebar />)
    const progress = screen.getByRole('link', { name: /^progress$/i })
    expect(progress).toHaveAttribute('aria-current', 'page')
  })

  it('marks Settings active on /settings/macros', () => {
    vi.mocked(usePathname).mockReturnValue('/settings/macros')
    render(<Sidebar />)
    const settings = screen.getByRole('link', { name: /^settings$/i })
    expect(settings).toHaveAttribute('aria-current', 'page')
  })
})
