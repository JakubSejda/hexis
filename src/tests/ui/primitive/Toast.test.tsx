// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ToastProvider, useToast } from '@/components/ui'

function Trigger({ tone }: { tone?: 'success' | 'error' | 'info' }) {
  const { show } = useToast()
  return (
    <button type="button" onClick={() => show('Uloženo', tone)}>
      show
    </button>
  )
}

function renderWithToast(tone?: 'success' | 'error' | 'info') {
  return render(
    <ToastProvider>
      <Trigger tone={tone} />
    </ToastProvider>
  )
}

describe('Toast', () => {
  it('announces async confirmations to assistive tech', async () => {
    renderWithToast()
    await userEvent.click(screen.getByRole('button', { name: 'show' }))

    const region = screen.getByRole('status')
    expect(region).toHaveAttribute('aria-live', 'polite')
    expect(region).toHaveTextContent('Uloženo')
  })

  it('keeps the live region mounted while empty, so the first toast is announced', () => {
    // A region inserted together with its message is often missed by screen
    // readers — it has to exist before the text arrives.
    renderWithToast()
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('paints the error tone from tokens, not a raw colour', async () => {
    renderWithToast('error')
    await userEvent.click(screen.getByRole('button', { name: 'show' }))

    const toast = screen.getByText('Uloženo')
    expect(toast).toHaveClass('bg-danger')
    expect(toast).toHaveClass('text-background')
    expect(toast.className).not.toContain('text-white')
  })
})
