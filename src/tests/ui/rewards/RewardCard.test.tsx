// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import userEvent from '@testing-library/user-event'
import { RewardCard } from '@/components/rewards/RewardCard'

const REWARD = {
  id: 1,
  userId: 'u',
  name: 'sushi',
  costXp: 100,
  description: 'omakase',
  archivedAt: null,
  createdAt: new Date(),
}

describe('RewardCard', () => {
  it('renders name, cost, and description', () => {
    render(
      <RewardCard
        reward={REWARD}
        balanceXp={500}
        onRedeem={() => {}}
        onEdit={() => {}}
        onArchive={() => {}}
        onDelete={() => {}}
      />
    )
    expect(screen.getByText('sushi')).toBeInTheDocument()
    expect(screen.getByText('100 XP')).toBeInTheDocument()
    expect(screen.getByText('omakase')).toBeInTheDocument()
  })

  it('disables Vyzvednout when balance < cost and shows missing delta in title', () => {
    render(
      <RewardCard
        reward={REWARD}
        balanceXp={40}
        onRedeem={() => {}}
        onEdit={() => {}}
        onArchive={() => {}}
        onDelete={() => {}}
      />
    )
    const btn = screen.getByRole('button', { name: /Vyzvednout/i })
    expect(btn).toBeDisabled()
    expect(btn).toHaveAttribute('title', expect.stringContaining('Chybí 60 XP'))
  })

  it('calls onRedeem when button clicked and balance is enough', async () => {
    const onRedeem = vi.fn()
    render(
      <RewardCard
        reward={REWARD}
        balanceXp={500}
        onRedeem={onRedeem}
        onEdit={() => {}}
        onArchive={() => {}}
        onDelete={() => {}}
      />
    )
    await userEvent.click(screen.getByRole('button', { name: /Vyzvednout/i }))
    expect(onRedeem).toHaveBeenCalledWith(REWARD)
  })
})
