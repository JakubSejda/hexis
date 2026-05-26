// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LifetimeTotals } from '@/components/bio/LifetimeTotals'

describe('LifetimeTotals', () => {
  it('renders 4 tile labels', () => {
    render(<LifetimeTotals sessions={12} sets={300} liftedKg={12480} totalXp={5400} />)
    expect(screen.getByText(/sessions/i)).toBeInTheDocument()
    expect(screen.getByText(/sets/i)).toBeInTheDocument()
    expect(screen.getByText(/lifted/i)).toBeInTheDocument()
    expect(screen.getByText(/^xp$/i)).toBeInTheDocument()
  })

  it('renders raw counts including 0', () => {
    render(<LifetimeTotals sessions={0} sets={0} liftedKg={0} totalXp={0} />)
    expect(screen.getAllByText('0').length).toBeGreaterThanOrEqual(2)
    expect(screen.getByText('0 kg')).toBeInTheDocument()
  })

  it('formats liftedKg with cs-CZ thousands separator', () => {
    render(<LifetimeTotals sessions={1} sets={1} liftedKg={12480} totalXp={1} />)
    expect(screen.getByText(/12\s?480 kg/)).toBeInTheDocument()
  })
})
