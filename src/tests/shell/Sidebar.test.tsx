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

  it('renders Quest Calendar as an active sidebar link', () => {
    vi.mocked(usePathname).mockReturnValue('/dashboard')
    render(<Sidebar />)
    const link = screen.getByRole('link', { name: /^quest calendar$/i })
    expect(link).toHaveAttribute('href', '/calendar')
    expect(link).not.toHaveAttribute('aria-disabled')
  })

  it('marks Quest Calendar active on /calendar', () => {
    vi.mocked(usePathname).mockReturnValue('/calendar')
    render(<Sidebar />)
    const link = screen.getByRole('link', { name: /^quest calendar$/i })
    expect(link).toHaveAttribute('aria-current', 'page')
  })

  it('renders no SP5 placeholder items', () => {
    vi.mocked(usePathname).mockReturnValue('/dashboard')
    render(<Sidebar />)
    expect(document.querySelector('[aria-disabled="true"]')).toBeNull()
  })

  it('renders Player Bio as an active sidebar link', () => {
    vi.mocked(usePathname).mockReturnValue('/dashboard')
    render(<Sidebar />)
    const link = screen.getByRole('link', { name: /^player bio$/i })
    expect(link).toHaveAttribute('href', '/bio')
    expect(link).not.toHaveAttribute('aria-disabled')
  })

  it('marks Player Bio active on /bio', () => {
    vi.mocked(usePathname).mockReturnValue('/bio')
    render(<Sidebar />)
    const link = screen.getByRole('link', { name: /^player bio$/i })
    expect(link).toHaveAttribute('aria-current', 'page')
  })

  it('renders Habits as an active sidebar link', () => {
    vi.mocked(usePathname).mockReturnValue('/dashboard')
    render(<Sidebar />)
    const link = screen.getByRole('link', { name: /^habits$/i })
    expect(link).toHaveAttribute('href', '/habits')
    expect(link).not.toHaveAttribute('aria-disabled')
  })

  it('renders Rewards as an active sidebar link', () => {
    vi.mocked(usePathname).mockReturnValue('/dashboard')
    render(<Sidebar />)
    expect(screen.getByRole('link', { name: /^rewards$/i })).toBeInTheDocument()
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
