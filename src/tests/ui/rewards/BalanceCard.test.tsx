// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { BalanceCard } from '@/components/rewards/BalanceCard'

describe('BalanceCard', () => {
  it('renders balance + earned/spent breakdown', () => {
    render(<BalanceCard balance={{ totalXp: 500, spentXp: 200, balanceXp: 300 }} />)
    expect(screen.getByText(/K utracení/i)).toBeInTheDocument()
    expect(screen.getByTestId('rewards-balance')).toHaveTextContent('300 XP')
    expect(screen.getByText(/Získáno/i).parentElement).toHaveTextContent('500')
    expect(screen.getByText(/Utraceno/i).parentElement).toHaveTextContent('200')
  })
})
