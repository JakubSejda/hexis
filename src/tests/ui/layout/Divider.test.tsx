// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Divider } from '@/components/ui/layout/Divider'

describe('Divider', () => {
  it('renders an hr with border-border class when no label', () => {
    render(<Divider data-testid="d" />)
    const el = screen.getByTestId('d')
    expect(el.tagName).toBe('HR')
    expect(el).toHaveClass('border-border')
  })

  it('renders label between two rules when label provided', () => {
    render(<Divider label="OR" />)
    expect(screen.getByText('OR')).toBeInTheDocument()
  })
})
