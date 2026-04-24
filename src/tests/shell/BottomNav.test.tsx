// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BottomNav } from '@/components/shell'

vi.mock('next/navigation', () => ({
  usePathname: vi.fn(),
}))

import { usePathname } from 'next/navigation'

describe('BottomNav', () => {
  it('renders four tabs: Dashboard, Training, Progress, Stats', () => {
    vi.mocked(usePathname).mockReturnValue('/dashboard')
    render(<BottomNav />)
    expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /training/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /progress/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /stats/i })).toBeInTheDocument()
  })

  it('marks the Progress tab active when pathname is /progress/photos', () => {
    vi.mocked(usePathname).mockReturnValue('/progress/photos')
    render(<BottomNav />)
    const progress = screen.getByRole('link', { name: /progress/i })
    expect(progress).toHaveAttribute('aria-current', 'page')
  })

  it('does not mark any tab active when pathname is /nutrition', () => {
    vi.mocked(usePathname).mockReturnValue('/nutrition')
    render(<BottomNav />)
    expect(screen.queryByRole('link', { current: 'page' })).toBeNull()
  })
})
