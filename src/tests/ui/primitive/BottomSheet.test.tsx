// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BottomSheet } from '@/components/ui/primitive/BottomSheet'

describe('BottomSheet', () => {
  it('does not render content when open=false', () => {
    render(
      <BottomSheet open={false} onOpenChange={() => {}} title="T">
        body
      </BottomSheet>
    )
    expect(screen.queryByText('body')).toBeNull()
  })

  it('renders title and body when open', () => {
    render(
      <BottomSheet open onOpenChange={() => {}} title="Vyber cvik">
        <p>body</p>
      </BottomSheet>
    )
    expect(screen.getByText('Vyber cvik')).toBeInTheDocument()
    expect(screen.getByText('body')).toBeInTheDocument()
  })

  it('renders description and associates via aria-describedby', () => {
    render(
      <BottomSheet open onOpenChange={() => {}} title="T" description="Popis akce.">
        body
      </BottomSheet>
    )
    expect(screen.getByText('Popis akce.')).toBeInTheDocument()
    const dialog = screen.getByRole('dialog')
    const id = dialog.getAttribute('aria-describedby')
    expect(id).toBeTruthy()
    expect(document.getElementById(id!)?.textContent).toBe('Popis akce.')
  })

  it('calls onOpenChange(false) on Escape', async () => {
    const onOpenChange = vi.fn()
    render(
      <BottomSheet open onOpenChange={onOpenChange} title="T">
        body
      </BottomSheet>
    )
    await userEvent.keyboard('{Escape}')
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})
