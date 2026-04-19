// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Stack } from '@/components/ui/layout/Stack'

describe('Stack', () => {
  it('applies flex-col and default gap-4', () => {
    render(
      <Stack data-testid="s">
        <span />
      </Stack>
    )
    const el = screen.getByTestId('s')
    expect(el).toHaveClass('flex')
    expect(el).toHaveClass('flex-col')
    expect(el).toHaveClass('gap-4')
  })

  it.each([2, 3, 4, 6, 8] as const)('applies gap-%i when gap=%i', (gap) => {
    render(
      <Stack gap={gap} data-testid="s">
        <span />
      </Stack>
    )
    expect(screen.getByTestId('s')).toHaveClass(`gap-${gap}`)
  })

  it('supports polymorphic `as`', () => {
    render(
      <Stack as="ul" data-testid="s">
        <li />
      </Stack>
    )
    expect(screen.getByTestId('s').tagName).toBe('UL')
  })
})
