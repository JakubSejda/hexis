// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LifeAreaCard } from '@/components/dashboard/LifeAreaCard'

describe('LifeAreaCard', () => {
  const base = {
    label: 'TRAINING',
    value: '3 sessions',
    secondary: 'this week',
    href: '/training',
    visual: <div data-testid="viz" />,
  }

  it('renders label, value, secondary, and visual', () => {
    render(<LifeAreaCard {...base} empty={false} />)
    expect(screen.getByText('TRAINING')).toBeInTheDocument()
    expect(screen.getByText('3 sessions')).toBeInTheDocument()
    expect(screen.getByText('this week')).toBeInTheDocument()
    expect(screen.getByTestId('viz')).toBeInTheDocument()
  })

  it('wraps contents in an anchor to href', () => {
    render(<LifeAreaCard {...base} empty={false} />)
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/training')
  })

  it('applies muted styling when empty', () => {
    render(<LifeAreaCard {...base} empty={true} />)
    const link = screen.getByRole('link')
    expect(link.className).toContain('opacity-60')
  })

  it('omits visual when null', () => {
    render(<LifeAreaCard {...base} visual={null} empty={false} />)
    expect(screen.queryByTestId('viz')).toBeNull()
  })
})
