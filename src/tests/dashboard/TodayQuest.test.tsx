// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TodayQuest } from '@/components/dashboard/TodayQuest'

describe('TodayQuest', () => {
  it('active: renders plan name and progress, links to /training/{id}', () => {
    render(
      <TodayQuest
        quest={{ kind: 'active', sessionId: 77, planName: 'Upper A', completed: 3, total: 5 }}
      />
    )
    expect(screen.getByText(/Pokračuj v Upper A/i)).toBeInTheDocument()
    expect(screen.getByText(/3 ze 5 cviků hotovo/i)).toBeInTheDocument()
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/training/77')
  })

  it('rest: shows "Rest day" and next plan preview, non-clickable', () => {
    render(<TodayQuest quest={{ kind: 'rest', nextPlanName: 'Lower A' }} />)
    expect(screen.getByText('Rest day')).toBeInTheDocument()
    expect(screen.getByText(/Dnes regeneruj\. Zítra: Lower A/)).toBeInTheDocument()
    expect(screen.queryByRole('link')).toBeNull()
  })

  it('rest with null nextPlanName shows only "Dnes regeneruj."', () => {
    render(<TodayQuest quest={{ kind: 'rest', nextPlanName: null }} />)
    expect(screen.getByText('Dnes regeneruj.')).toBeInTheDocument()
  })

  it('scheduled: shows plan name, exercise count, links to /training', () => {
    render(<TodayQuest quest={{ kind: 'scheduled', planName: 'Upper A', exerciseCount: 8 }} />)
    expect(screen.getByText(/Upper A/)).toBeInTheDocument()
    expect(screen.getByText(/8 cviků/)).toBeInTheDocument()
    expect(screen.getByRole('link')).toHaveAttribute('href', '/training')
  })

  it('no-plan: shows motivational copy, links to /training', () => {
    render(<TodayQuest quest={{ kind: 'no-plan' }} />)
    expect(screen.getByText(/Začni svojí cestu/)).toBeInTheDocument()
    expect(screen.getByText(/Nastav si svůj první plán/)).toBeInTheDocument()
    expect(screen.getByRole('link')).toHaveAttribute('href', '/training')
  })

  it("all clickable states render the TODAY'S QUEST label", () => {
    const states = [
      { kind: 'active', sessionId: 1, planName: 'X', completed: 0, total: 0 } as const,
      { kind: 'scheduled', planName: 'Y', exerciseCount: 5 } as const,
      { kind: 'no-plan' } as const,
    ]
    for (const quest of states) {
      const { unmount } = render(<TodayQuest quest={quest} />)
      expect(screen.getByText(/TODAY'S QUEST/i)).toBeInTheDocument()
      unmount()
    }
  })
})
