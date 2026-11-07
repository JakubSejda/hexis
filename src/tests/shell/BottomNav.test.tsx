// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BottomNav } from '@/components/shell'

vi.mock('next/navigation', () => ({
  usePathname: vi.fn(),
}))

import { usePathname } from 'next/navigation'

describe('BottomNav', () => {
  it('renders the four daily tabs plus the player profile — no hidden "Více"', () => {
    vi.mocked(usePathname).mockReturnValue('/dashboard')
    render(<BottomNav />)
    for (const name of [/přehled/i, /trénink/i, /výživa/i, /návyky/i, /profil/i]) {
      expect(screen.getByRole('link', { name })).toBeInTheDocument()
    }
    expect(screen.queryByRole('button', { name: /více/i })).toBeNull()
  })

  it('marks the Nutrition tab active when pathname is /nutrition', () => {
    vi.mocked(usePathname).mockReturnValue('/nutrition')
    render(<BottomNav />)
    expect(screen.getByRole('link', { name: /výživa/i })).toHaveAttribute('aria-current', 'page')
  })

  it('keeps Profil lit on the areas that hang off the profile', () => {
    for (const path of ['/bio', '/progress', '/stats', '/rewards', '/calendar', '/settings']) {
      vi.mocked(usePathname).mockReturnValue(path)
      const { unmount } = render(<BottomNav />)
      expect(screen.getByRole('link', { name: /profil/i })).toHaveAttribute('aria-current', 'page')
      unmount()
    }
  })
})
