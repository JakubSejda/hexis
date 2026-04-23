// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ProgressBar } from '@/components/ui/primitive/ProgressBar'

describe('ProgressBar', () => {
  it('renders with role=progressbar and aria values', () => {
    render(<ProgressBar value={30} max={100} />)
    const bar = screen.getByRole('progressbar')
    expect(bar).toHaveAttribute('aria-valuenow', '30')
    expect(bar).toHaveAttribute('aria-valuemax', '100')
  })

  it('clamps fill width to 100% when value > max', () => {
    render(<ProgressBar value={150} max={100} />)
    const bar = screen.getByRole('progressbar')
    const fill = bar.firstChild as HTMLElement
    expect(fill.style.width).toBe('100%')
  })

  it('renders 0% when max is 0 or null', () => {
    const { rerender } = render(<ProgressBar value={5} max={0} />)
    let fill = screen.getByRole('progressbar').firstChild as HTMLElement
    expect(fill.style.width).toBe('0%')
    rerender(<ProgressBar value={5} max={null} />)
    fill = screen.getByRole('progressbar').firstChild as HTMLElement
    expect(fill.style.width).toBe('0%')
  })

  it('default variant uses tone color (primary = emerald)', () => {
    render(<ProgressBar value={50} max={100} />)
    const fill = screen.getByRole('progressbar').firstChild as HTMLElement
    expect(fill.style.background).toMatch(/rgb\(16,\s*185,\s*129\)/)
    expect(fill.className).not.toContain('shadow-')
  })

  it('variant="xp" forces amber fill regardless of tone prop', () => {
    render(<ProgressBar value={50} max={100} variant="xp" tone="danger" />)
    const fill = screen.getByRole('progressbar').firstChild as HTMLElement
    expect(fill.style.background).toMatch(/rgb\(245,\s*158,\s*11\)/)
  })

  it('variant="xp" applies a glow shadow class', () => {
    render(<ProgressBar value={50} max={100} variant="xp" />)
    const fill = screen.getByRole('progressbar').firstChild as HTMLElement
    expect(fill.className).toContain('shadow-')
  })
})
