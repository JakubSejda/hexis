// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { RegionHeader } from '@/components/dashboard/RegionHeader'

describe('RegionHeader', () => {
  it('renders children as uppercase letter-spaced text', () => {
    render(<RegionHeader>Life Areas</RegionHeader>)
    const el = screen.getByText('Life Areas')
    expect(el).toBeInTheDocument()
    const wrapper = el.parentElement as HTMLElement
    expect(wrapper.className).toContain('uppercase')
    expect(wrapper.className).toContain('tracking-[0.2em]')
    expect(wrapper.className).toContain('text-muted')
  })
})
