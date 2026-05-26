// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { GoalCard } from '@/components/bio/GoalCard'

describe('GoalCard', () => {
  it('renders goalText and goalKg when populated', () => {
    render(
      <GoalCard
        goalKg={70}
        goalText="Pull 10 reps na 100 kg"
        currentWeightKg={78}
        startedWeightKg={80}
      />
    )
    expect(screen.getByText('Pull 10 reps na 100 kg')).toBeInTheDocument()
    expect(screen.getByText('→ 70 kg')).toBeInTheDocument()
  })

  it('renders empty state when goalKg is null', () => {
    render(<GoalCard goalKg={null} goalText={null} currentWeightKg={78} startedWeightKg={80} />)
    const link = screen.getByRole('link', { name: /nastav si svůj cíl/i })
    expect(link).toHaveAttribute('href', '/settings/profile')
  })

  it('renders progress bar with start and goal labels (cutting)', () => {
    render(<GoalCard goalKg={70} goalText="Sušit" currentWeightKg={78} startedWeightKg={80} />)
    expect(screen.getByText(/^80 kg$/)).toBeInTheDocument()
    expect(screen.getByText(/^70 kg$/)).toBeInTheDocument()
  })

  it('renders a progressbar role with aria-valuenow reflecting progress', () => {
    render(<GoalCard goalKg={70} goalText="Sušit" currentWeightKg={78} startedWeightKg={80} />)
    const bar = screen.getByRole('progressbar')
    expect(Number(bar.getAttribute('aria-valuenow'))).toBe(20)
  })
})
