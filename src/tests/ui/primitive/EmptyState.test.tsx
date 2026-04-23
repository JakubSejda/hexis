// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Inbox } from 'lucide-react'
import { EmptyState } from '@/components/ui/primitive/EmptyState'

describe('EmptyState', () => {
  it('renders icon, title', () => {
    render(<EmptyState icon={Inbox} title="Žádná data" />)
    expect(screen.getByText('Žádná data')).toBeInTheDocument()
  })

  it('renders description when provided', () => {
    render(<EmptyState icon={Inbox} title="t" description="Přidej první záznam." />)
    expect(screen.getByText('Přidej první záznam.')).toBeInTheDocument()
  })

  it('omits description when not provided', () => {
    render(<EmptyState icon={Inbox} title="t" data-testid="es" />)
    const el = screen.getByTestId('es')
    expect(el.textContent).not.toContain('Přidej')
  })

  it('renders action node when provided', () => {
    render(<EmptyState icon={Inbox} title="t" action={<button data-testid="cta">go</button>} />)
    expect(screen.getByTestId('cta')).toBeInTheDocument()
  })

  it('renders icon as a 64px-sized Lucide component', () => {
    render(<EmptyState icon={Inbox} title="t" data-testid="es" />)
    const svg = screen.getByTestId('es').querySelector('svg')
    expect(svg).not.toBeNull()
    expect(svg?.getAttribute('width')).toBe('64')
    expect(svg?.getAttribute('height')).toBe('64')
  })

  it('applies muted color to icon', () => {
    render(<EmptyState icon={Inbox} title="t" data-testid="es" />)
    const svg = screen.getByTestId('es').querySelector('svg')
    expect(svg?.getAttribute('class')).toContain('text-muted')
  })

  it('title renders as a Heading level=2', () => {
    render(<EmptyState icon={Inbox} title="Title Text" />)
    const heading = screen.getByRole('heading', { level: 2 })
    expect(heading).toHaveTextContent('Title Text')
  })
})
