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
    ;['Přehled', 'Trénink', 'Výživa', 'Progres', 'Statistiky'].forEach((label) => {
      expect(screen.getByRole('link', { name: new RegExp(`^${label}$`) })).toBeInTheDocument()
    })
  })

  it('renders the Settings footer link', () => {
    vi.mocked(usePathname).mockReturnValue('/dashboard')
    render(<Sidebar />)
    expect(screen.getByRole('link', { name: /^nastavení$/i })).toBeInTheDocument()
  })

  it('renders Quest Calendar as an active sidebar link', () => {
    vi.mocked(usePathname).mockReturnValue('/dashboard')
    render(<Sidebar />)
    const link = screen.getByRole('link', { name: /^kalendář questů$/i })
    expect(link).toHaveAttribute('href', '/calendar')
    expect(link).not.toHaveAttribute('aria-disabled')
  })

  it('marks Quest Calendar active on /calendar', () => {
    vi.mocked(usePathname).mockReturnValue('/calendar')
    render(<Sidebar />)
    const link = screen.getByRole('link', { name: /^kalendář questů$/i })
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
    const link = screen.getByRole('link', { name: /^profil hráče$/i })
    expect(link).toHaveAttribute('href', '/bio')
    expect(link).not.toHaveAttribute('aria-disabled')
  })

  it('marks Player Bio active on /bio', () => {
    vi.mocked(usePathname).mockReturnValue('/bio')
    render(<Sidebar />)
    const link = screen.getByRole('link', { name: /^profil hráče$/i })
    expect(link).toHaveAttribute('aria-current', 'page')
  })

  it('renders Habits as an active sidebar link', () => {
    vi.mocked(usePathname).mockReturnValue('/dashboard')
    render(<Sidebar />)
    const link = screen.getByRole('link', { name: /^návyky$/i })
    expect(link).toHaveAttribute('href', '/habits')
    expect(link).not.toHaveAttribute('aria-disabled')
  })

  it('renders Rewards as an active sidebar link', () => {
    vi.mocked(usePathname).mockReturnValue('/dashboard')
    render(<Sidebar />)
    expect(screen.getByRole('link', { name: /^odměny$/i })).toBeInTheDocument()
  })

  it('marks the active Life Area with aria-current on /progress', () => {
    vi.mocked(usePathname).mockReturnValue('/progress')
    render(<Sidebar />)
    const progress = screen.getByRole('link', { name: /^progres$/i })
    expect(progress).toHaveAttribute('aria-current', 'page')
  })

  it('marks Settings active on /settings/macros', () => {
    vi.mocked(usePathname).mockReturnValue('/settings/macros')
    render(<Sidebar />)
    const settings = screen.getByRole('link', { name: /^nastavení$/i })
    expect(settings).toHaveAttribute('aria-current', 'page')
  })
})
