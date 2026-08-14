// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AppError from '@/app/(app)/error'

describe('(app) error boundary', () => {
  it('renders title, digest and retry button that calls reset', async () => {
    const reset = vi.fn()
    const error = Object.assign(new Error('boom'), { digest: 'abc123' })
    render(<AppError error={error} reset={reset} />)
    expect(screen.getByRole('heading', { name: 'Něco se pokazilo' })).toBeInTheDocument()
    expect(screen.getByText(/abc123/)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Zkusit znovu' }))
    expect(reset).toHaveBeenCalledOnce()
  })
})
