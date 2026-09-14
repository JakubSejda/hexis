// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ConfirmSheet } from '@/components/ui'

function setup(over: Partial<React.ComponentProps<typeof ConfirmSheet>> = {}) {
  const props = {
    open: true,
    onOpenChange: vi.fn(),
    title: 'Smazat odměnu?',
    description: 'Odměnu „Kino" tím smažeš natrvalo.',
    confirmLabel: 'Smazat',
    onConfirm: vi.fn(),
    ...over,
  }
  render(<ConfirmSheet {...props} />)
  return props
}

describe('ConfirmSheet', () => {
  it('states what will happen, in the app rather than a browser dialog', () => {
    setup()
    expect(screen.getByRole('dialog')).toHaveTextContent('Smazat odměnu?')
    expect(screen.getByRole('dialog')).toHaveTextContent('Odměnu „Kino" tím smažeš natrvalo.')
  })

  it('runs the action on confirm', async () => {
    const { onConfirm } = setup()
    await userEvent.click(screen.getByRole('button', { name: 'Smazat' }))
    expect(onConfirm).toHaveBeenCalledOnce()
  })

  it('closes without acting on cancel', async () => {
    const { onConfirm, onOpenChange } = setup()
    await userEvent.click(screen.getByRole('button', { name: 'Zrušit' }))
    expect(onConfirm).not.toHaveBeenCalled()
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('paints the confirm action as destructive', () => {
    setup()
    expect(screen.getByRole('button', { name: 'Smazat' }).className).toMatch(/danger/)
  })
})
