// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Sheet } from '@/components/ui'

function open(props: Partial<React.ComponentProps<typeof Sheet>> = {}) {
  return render(
    <Sheet open onOpenChange={() => {}} title="Upravit sérii" {...props}>
      <p>body</p>
    </Sheet>
  )
}

describe('Sheet', () => {
  it('renders nothing when closed', () => {
    render(
      <Sheet open={false} onOpenChange={() => {}} title="T">
        body
      </Sheet>
    )
    expect(screen.queryByText('body')).toBeNull()
  })

  it('renders title and children when open', () => {
    open()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Upravit sérii')).toBeInTheDocument()
    expect(screen.getByText('body')).toBeInTheDocument()
  })

  it('associates the description via aria-describedby', () => {
    open({ description: 'Akce nelze vrátit.' })
    const id = screen.getByRole('dialog').getAttribute('aria-describedby')
    expect(id).toBeTruthy()
    expect(document.getElementById(id!)?.textContent).toBe('Akce nelze vrátit.')
  })

  it('closes on Escape', async () => {
    const onOpenChange = vi.fn()
    render(
      <Sheet open onOpenChange={onOpenChange} title="T">
        body
      </Sheet>
    )
    await userEvent.keyboard('{Escape}')
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('holds Escape when dismissible=false', async () => {
    const onOpenChange = vi.fn()
    render(
      <Sheet open onOpenChange={onOpenChange} title="T" dismissible={false}>
        body
      </Sheet>
    )
    await userEvent.keyboard('{Escape}')
    expect(onOpenChange).not.toHaveBeenCalled()
  })

  it('is a two-layer HUD plate, like every other surface', () => {
    open()
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveClass('bg-border')
    const inner = dialog.firstElementChild as HTMLElement
    expect(inner).toHaveClass('bg-surface')
  })

  it('carries the responsive sheet clip, never a radius', () => {
    open()
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveClass('hud-sheet')
    expect(dialog.className).not.toMatch(/rounded-/)
  })

  it('titles with a mono eyebrow, not a card heading', () => {
    open()
    const title = screen.getByText('Upravit sérii')
    expect(title).toHaveClass('font-mono')
    expect(title).toHaveClass('uppercase')
    expect(title.className).not.toMatch(/font-semibold/)
  })

  it('docks to the bottom edge on phones and centres from md up', () => {
    open()
    const dialog = screen.getByRole('dialog')
    expect(dialog.className).toMatch(/\bbottom-0\b/)
    expect(dialog.className).toMatch(/md:top-1\/2/)
  })

  it('keeps the page behind it from scrolling', () => {
    open()
    expect(screen.getByRole('dialog')).toHaveClass('overscroll-contain')
  })

  it('replaces the focus outline it removes', () => {
    open()
    const cls = screen.getByRole('dialog').className
    expect(cls).toMatch(/focus-visible:ring/)
    expect(cls).not.toMatch(/(?<!-)\bfocus:outline-none\b/)
  })

  it('shows a grab handle on phones only, hidden from assistive tech', () => {
    open()
    const grabber = screen.getByTestId('sheet-grabber')
    expect(grabber).toHaveAttribute('aria-hidden', 'true')
    expect(grabber.className).toMatch(/md:hidden/)
  })

  it('does not pull focus into the sheet on a phone — Radix does that by default', () => {
    // matchMedia defaults to no-match in the suite, i.e. a phone viewport.
    render(
      <Sheet open onOpenChange={() => {}} title="T">
        <input aria-label="Název" />
      </Sheet>
    )
    expect(screen.getByLabelText('Název')).not.toHaveFocus()
  })

  it('respects the safe area at the bottom of the phone', () => {
    open()
    const inner = screen.getByRole('dialog').firstElementChild as HTMLElement
    expect(inner.className).toMatch(/safe-area-inset-bottom/)
  })

  it('offers a visible way out — there is no Escape key on a phone', async () => {
    const onOpenChange = vi.fn()
    render(
      <Sheet open onOpenChange={onOpenChange} title="T">
        body
      </Sheet>
    )
    await userEvent.click(screen.getByRole('button', { name: 'Zavřít' }))
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('drops the close button when the sheet must be answered', () => {
    render(
      <Sheet open onOpenChange={() => {}} title="T" dismissible={false}>
        body
      </Sheet>
    )
    expect(screen.queryByRole('button', { name: 'Zavřít' })).toBeNull()
  })
})
