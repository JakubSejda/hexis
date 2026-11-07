// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QuestCard } from '@/components/dashboard/QuestCard'
import type { QuestObjective } from '@/lib/queries/dashboard-sessions'

const objectives: QuestObjective[] = [
  { exerciseId: 1, name: 'Incline DB Press', targetSets: 4, doneSets: 4 },
  { exerciseId: 2, name: 'Lat Pulldown', targetSets: 4, doneSets: 1 },
  { exerciseId: 3, name: 'Seated DB Shoulder Press', targetSets: 3, doneSets: 0 },
  { exerciseId: 4, name: 'Seated Cable Row', targetSets: 3, doneSets: 0 },
  { exerciseId: 5, name: 'Cable Lateral Raises', targetSets: 3, doneSets: 0 },
  { exerciseId: 6, name: 'Barbell Curl', targetSets: 3, doneSets: 0 },
]

describe('QuestCard', () => {
  it('splits the plan name into a title and a subtitle', () => {
    render(
      <QuestCard
        quest={{ kind: 'scheduled', planId: 1, planName: 'Upper A — Silový', exerciseCount: 9 }}
        objectives={[]}
        streak={0}
      />
    )
    expect(screen.getByRole('heading', { name: 'Upper A' })).toBeInTheDocument()
    expect(screen.getByText('Silový')).toBeInTheDocument()
  })

  it('lists the first four objectives with progress and counts the rest', () => {
    render(
      <QuestCard
        quest={{ kind: 'active', sessionId: 7, planName: 'Upper A', completed: 2, total: 9 }}
        objectives={objectives}
        streak={3}
      />
    )
    expect(screen.getAllByRole('listitem')).toHaveLength(4)
    expect(screen.getByText('4/4').closest('li')).toHaveAttribute('data-done', 'true')
    expect(screen.getByText('1/4').closest('li')).not.toHaveAttribute('data-done')
    expect(screen.getByText('+ 2 další cviky')).toBeInTheDocument()
  })

  it('continues the running session instead of starting a new one', () => {
    render(
      <QuestCard
        quest={{ kind: 'active', sessionId: 7, planName: 'Upper A', completed: 2, total: 9 }}
        objectives={objectives}
        streak={3}
      />
    )
    expect(screen.getByRole('link', { name: /pokračovat v questu/i })).toHaveAttribute(
      'href',
      '/training/7'
    )
    expect(screen.queryByText(/přeruší/)).toBeNull()
  })

  it('warns that skipping today breaks the streak, with correct Czech plural', () => {
    render(
      <QuestCard
        quest={{ kind: 'scheduled', planId: 1, planName: 'Lower A', exerciseCount: 8 }}
        objectives={[]}
        streak={1}
      />
    )
    expect(screen.getByText(/série 1 den přeruší/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /přijmout quest/i })).toHaveAttribute(
      'href',
      '/training'
    )
  })

  it('shows a rest day without a call to action', () => {
    render(
      <QuestCard quest={{ kind: 'rest', nextPlanName: 'Lower B' }} objectives={[]} streak={2} />
    )
    expect(screen.getByText(/zítra na tebe čeká Lower B/i)).toBeInTheDocument()
    expect(screen.queryByRole('link')).toBeNull()
  })

  it('nudges a new player to pick a plan', () => {
    render(<QuestCard quest={{ kind: 'no-plan' }} objectives={[]} streak={0} />)
    expect(screen.getByRole('link', { name: /vybrat plán/i })).toHaveAttribute('href', '/training')
  })
})
