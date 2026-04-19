// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'

describe('RTL wiring smoke', () => {
  it('renders a div and finds it', () => {
    render(<div data-testid="hello">hello</div>)
    expect(screen.getByTestId('hello')).toBeInTheDocument()
    expect(screen.getByTestId('hello')).toHaveTextContent('hello')
  })
})
