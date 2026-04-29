// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { RewardDialog } from '@/components/rewards/RewardDialog'

describe('RewardDialog', () => {
  it('submits create payload from valid form', async () => {
    const onSubmit = vi.fn()
    render(<RewardDialog open mode="create" onOpenChange={() => {}} onSubmit={onSubmit} />)
    await userEvent.type(screen.getByLabelText(/Název/i), 'sushi')
    await userEvent.type(screen.getByLabelText(/Cena/i), '120')
    await userEvent.type(screen.getByLabelText(/Popis/i), 'omakase')
    await userEvent.click(screen.getByRole('button', { name: /Uložit/i }))
    expect(onSubmit).toHaveBeenCalledWith({
      name: 'sushi',
      costXp: 120,
      description: 'omakase',
    })
  })

  it('shows validation error for empty name', async () => {
    const onSubmit = vi.fn()
    render(<RewardDialog open mode="create" onOpenChange={() => {}} onSubmit={onSubmit} />)
    await userEvent.type(screen.getByLabelText(/Cena/i), '50')
    await userEvent.click(screen.getByRole('button', { name: /Uložit/i }))
    expect(onSubmit).not.toHaveBeenCalled()
    expect(screen.getByText(/Název je povinný/i)).toBeInTheDocument()
  })

  it('prefills fields in edit mode', () => {
    render(
      <RewardDialog
        open
        mode="edit"
        initial={{ name: 'kniha', costXp: 250, description: 'fantasy' }}
        onOpenChange={() => {}}
        onSubmit={() => {}}
      />
    )
    expect(screen.getByLabelText(/Název/i)).toHaveValue('kniha')
    expect(screen.getByLabelText(/Cena/i)).toHaveValue(250)
    expect(screen.getByLabelText(/Popis/i)).toHaveValue('fantasy')
  })
})
