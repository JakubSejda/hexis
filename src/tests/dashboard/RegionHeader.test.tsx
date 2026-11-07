// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { RegionHeader } from '@/components/dashboard/RegionHeader'

describe('RegionHeader', () => {
  it('renders the label as a real heading in the display caps style', () => {
    render(<RegionHeader>Oblasti života</RegionHeader>)
    const heading = screen.getByRole('heading', { name: 'Oblasti života', level: 2 })
    expect(heading.className).toContain('uppercase')
    expect(heading.className).toContain('font-display')
    expect(heading.className).not.toContain('font-mono')
  })
})
