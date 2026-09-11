// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { useDesktopAutoFocus } from '@/components/ui'

function stubViewport(matches: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }))
  )
}

function Probe({ open }: { open: boolean }) {
  const ref = useDesktopAutoFocus<HTMLInputElement>(open)
  return <input ref={ref} aria-label="Název" />
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('useDesktopAutoFocus', () => {
  it('focuses the field on a desktop viewport', () => {
    stubViewport(true)
    render(<Probe open />)
    expect(screen.getByLabelText('Název')).toHaveFocus()
  })

  it('leaves focus alone on a phone — the keyboard would cover the sheet', () => {
    stubViewport(false)
    render(<Probe open />)
    expect(screen.getByLabelText('Název')).not.toHaveFocus()
  })

  it('does not steal focus while the sheet is closed', () => {
    stubViewport(true)
    render(<Probe open={false} />)
    expect(screen.getByLabelText('Název')).not.toHaveFocus()
  })
})
