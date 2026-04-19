// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Section } from '@/components/ui/layout/Section'

describe('Section', () => {
  it('renders children', () => {
    render(
      <Section>
        <span data-testid="c" />
      </Section>
    )
    expect(screen.getByTestId('c')).toBeInTheDocument()
  })

  it('renders a region-style header from title with expanded letter-spacing', () => {
    render(<Section title="Life Areas">x</Section>)
    const header = screen.getByRole('heading', { level: 2 })
    expect(header).toHaveClass('font-mono')
    expect(header.className).toMatch(/tracking-/)
    expect(header.className).toMatch(/uppercase/)
    expect(header).toHaveTextContent(/life areas/i)
  })

  it('renders an action slot to the right of the header', () => {
    render(
      <Section title="X" action={<button>see all</button>}>
        body
      </Section>
    )
    expect(screen.getByRole('button', { name: /see all/i })).toBeInTheDocument()
  })

  it('omits the header when no title', () => {
    render(<Section>body</Section>)
    expect(screen.queryByRole('heading')).toBeNull()
  })
})
