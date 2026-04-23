// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Tooltip } from '@/components/ui'

describe('Tooltip', () => {
  it('renders trigger children', () => {
    render(
      <Tooltip content="Info">
        <button>Trigger</button>
      </Tooltip>
    )
    expect(screen.getByRole('button', { name: 'Trigger' })).toBeInTheDocument()
  })

  it('is hidden by default', () => {
    render(
      <Tooltip content="Hidden info">
        <button>T</button>
      </Tooltip>
    )
    expect(screen.queryByText('Hidden info')).toBeNull()
  })

  it('opens on focus and shows content', async () => {
    render(
      <Tooltip content="Focus info">
        <button>T</button>
      </Tooltip>
    )
    await userEvent.tab()
    const hits = await screen.findAllByText('Focus info')
    expect(hits.length).toBeGreaterThan(0)
  })

  it('closes on blur', async () => {
    render(
      <>
        <Tooltip content="Focus info">
          <button>T</button>
        </Tooltip>
        <button>Other</button>
      </>
    )
    await userEvent.tab()
    await screen.findAllByText('Focus info')
    await userEvent.tab()
    expect(screen.queryByRole('tooltip')).toBeNull()
  })
})
