// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MoreSheet } from '@/components/shell'

describe('MoreSheet', () => {
  it('lists all six sheet areas as links', () => {
    render(<MoreSheet open onOpenChange={() => {}} activeArea={null} />)
    for (const name of [
      /progress/i,
      /stats/i,
      /rewards/i,
      /player bio/i,
      /quest calendar/i,
      /settings/i,
    ]) {
      expect(screen.getByRole('link', { name })).toBeInTheDocument()
    }
  })

  it('marks the active area with aria-current', () => {
    render(<MoreSheet open onOpenChange={() => {}} activeArea="rewards" />)
    expect(screen.getByRole('link', { name: /rewards/i })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: /stats/i })).not.toHaveAttribute('aria-current')
  })

  it('closes when a link is clicked', async () => {
    const onOpenChange = vi.fn()
    render(<MoreSheet open onOpenChange={onOpenChange} activeArea={null} />)
    await userEvent.click(screen.getByRole('link', { name: /rewards/i }))
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})
