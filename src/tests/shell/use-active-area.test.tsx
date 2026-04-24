// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useActiveArea } from '@/components/shell'

vi.mock('next/navigation', () => ({
  usePathname: vi.fn(),
}))

import { usePathname } from 'next/navigation'

describe('useActiveArea', () => {
  it('returns "dashboard" for /dashboard', () => {
    vi.mocked(usePathname).mockReturnValue('/dashboard')
    const { result } = renderHook(() => useActiveArea())
    expect(result.current).toBe('dashboard')
  })

  it('returns "training" for /training and /training/:id', () => {
    vi.mocked(usePathname).mockReturnValue('/training/abc-123')
    const { result } = renderHook(() => useActiveArea())
    expect(result.current).toBe('training')
  })

  it('returns "progress" for /progress and /progress/photos', () => {
    vi.mocked(usePathname).mockReturnValue('/progress/photos')
    const { result } = renderHook(() => useActiveArea())
    expect(result.current).toBe('progress')
  })

  it('returns "stats" for /stats/strength', () => {
    vi.mocked(usePathname).mockReturnValue('/stats/strength')
    const { result } = renderHook(() => useActiveArea())
    expect(result.current).toBe('stats')
  })

  it('returns null for unmatched paths', () => {
    vi.mocked(usePathname).mockReturnValue('/login')
    const { result } = renderHook(() => useActiveArea())
    expect(result.current).toBeNull()
  })
})
