// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Grid } from '@/components/ui'

describe('Grid', () => {
  it('applies grid with default cols=2 and gap-4', () => {
    render(
      <Grid data-testid="g">
        <span />
      </Grid>
    )
    const el = screen.getByTestId('g')
    expect(el).toHaveClass('grid')
    expect(el).toHaveClass('grid-cols-2')
    expect(el).toHaveClass('gap-4')
  })

  it.each([1, 2, 3, 4] as const)('applies grid-cols-%i when cols=%i', (cols) => {
    render(
      <Grid cols={cols} data-testid="g">
        <span />
      </Grid>
    )
    expect(screen.getByTestId('g')).toHaveClass(`grid-cols-${cols}`)
  })

  it('applies responsive cols at sm/md breakpoints', () => {
    render(
      <Grid cols={1} responsive={{ sm: 2, md: 4 }} data-testid="g">
        <span />
      </Grid>
    )
    const el = screen.getByTestId('g')
    expect(el).toHaveClass('grid-cols-1')
    expect(el).toHaveClass('sm:grid-cols-2')
    expect(el).toHaveClass('md:grid-cols-4')
  })
})
