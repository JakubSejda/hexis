// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Dialog } from '@/components/ui'

describe('Dialog', () => {
  it('does not render content when open=false', () => {
    render(
      <Dialog open={false} onOpenChange={() => {}} title="Smazat sérii?">
        body
      </Dialog>
    )
    expect(screen.queryByText('Smazat sérii?')).toBeNull()
    expect(screen.queryByText('body')).toBeNull()
  })

  it('renders title, description, and children when open', () => {
    render(
      <Dialog open onOpenChange={() => {}} title="Smazat sérii?" description="Akce nelze vrátit.">
        <button>OK</button>
      </Dialog>
    )
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Smazat sérii?')).toBeInTheDocument()
    expect(screen.getByText('Akce nelze vrátit.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'OK' })).toBeInTheDocument()
  })

  it('calls onOpenChange(false) when Escape is pressed', async () => {
    const onOpenChange = vi.fn()
    render(
      <Dialog open onOpenChange={onOpenChange} title="T">
        body
      </Dialog>
    )
    await userEvent.keyboard('{Escape}')
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('does NOT close on Escape when dismissible=false', async () => {
    const onOpenChange = vi.fn()
    render(
      <Dialog open onOpenChange={onOpenChange} title="T" dismissible={false}>
        body
      </Dialog>
    )
    await userEvent.keyboard('{Escape}')
    expect(onOpenChange).not.toHaveBeenCalled()
  })

  it('associates description via aria-describedby', () => {
    render(
      <Dialog open onOpenChange={() => {}} title="T" description="D">
        x
      </Dialog>
    )
    const dialog = screen.getByRole('dialog')
    const describedBy = dialog.getAttribute('aria-describedby')
    expect(describedBy).toBeTruthy()
    const desc = document.getElementById(describedBy!)
    expect(desc?.textContent).toBe('D')
  })
})
