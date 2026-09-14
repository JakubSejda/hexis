// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { RegionHeader } from '@/components/dashboard/RegionHeader'

describe('RegionHeader', () => {
  it('renders the label as a real heading in the region eyebrow style', () => {
    render(<RegionHeader>Oblasti života</RegionHeader>)
    const heading = screen.getByRole('heading', { name: 'Oblasti života', level: 2 })
    expect(heading.className).toContain('uppercase')
    expect(heading.className).toContain('tracking-[0.2em]')
    expect(heading.className).toContain('text-muted')
  })
})
