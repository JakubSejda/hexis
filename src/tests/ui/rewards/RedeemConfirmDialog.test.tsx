// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { RedeemConfirmDialog } from '@/components/rewards/RedeemConfirmDialog'

const REWARD = {
  id: 1,
  userId: 'u',
  name: 'sushi',
  costXp: 100,
  description: null,
  archivedAt: null,
  createdAt: new Date(),
}

describe('RedeemConfirmDialog', () => {
  it('renders reward name and cost', () => {
    render(
      <RedeemConfirmDialog open reward={REWARD} onOpenChange={() => {}} onConfirm={() => {}} />
    )
    expect(screen.getByText(/sushi/)).toBeInTheDocument()
    expect(screen.getByText(/100 XP/)).toBeInTheDocument()
  })

  it('passes note through onConfirm', async () => {
    const onConfirm = vi.fn()
    render(
      <RedeemConfirmDialog open reward={REWARD} onOpenChange={() => {}} onConfirm={onConfirm} />
    )
    await userEvent.type(screen.getByLabelText(/Poznámka/i), 'narozeniny')
    await userEvent.click(screen.getByRole('button', { name: /Vyzvednout/i }))
    expect(onConfirm).toHaveBeenCalledWith({ note: 'narozeniny' })
  })

  it('confirms with no note when input empty', async () => {
    const onConfirm = vi.fn()
    render(
      <RedeemConfirmDialog open reward={REWARD} onOpenChange={() => {}} onConfirm={onConfirm} />
    )
    await userEvent.click(screen.getByRole('button', { name: /Vyzvednout/i }))
    expect(onConfirm).toHaveBeenCalledWith({})
  })
})
