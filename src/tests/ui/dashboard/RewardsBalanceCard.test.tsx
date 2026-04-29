// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { RewardsBalanceCard } from '@/components/dashboard/RewardsBalanceCard'

describe('RewardsBalanceCard', () => {
  it('renders balance and links to /rewards', () => {
    render(<RewardsBalanceCard balanceXp={300} totalXp={500} spentXp={200} />)
    const link = screen.getByRole('link', { name: /odměny/i })
    expect(link).toHaveAttribute('href', '/rewards')
    expect(screen.getByTestId('rewards-balance-card-amount')).toHaveTextContent('300 XP')
  })
})
