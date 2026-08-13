// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Textarea } from '@/components/ui'

describe('Textarea', () => {
  it('renders a textarea with label wired via htmlFor', () => {
    render(<Textarea label="Poznámka" />)
    const el = screen.getByLabelText('Poznámka')
    expect(el.tagName).toBe('TEXTAREA')
    expect(el).toHaveClass('rounded-md')
  })

  it('shows error state (border-danger + aria-invalid + message)', () => {
    render(<Textarea label="Poznámka" error="Povinné pole" data-testid="t" />)
    const el = screen.getByTestId('t')
    expect(el).toHaveAttribute('aria-invalid', 'true')
    expect(el).toHaveClass('border-danger')
    expect(screen.getByText('Povinné pole')).toBeInTheDocument()
  })

  it('passes native props through (rows, placeholder, defaultValue)', () => {
    render(<Textarea label="Poznámka" rows={4} placeholder="Volitelné" defaultValue="abc" />)
    const el = screen.getByPlaceholderText('Volitelné')
    expect(el).toHaveAttribute('rows', '4')
    expect(el).toHaveValue('abc')
  })

  it('renders bare textarea without label/error/hint', () => {
    render(<Textarea placeholder="Poznamka (volitelne)" />)
    const el = screen.getByPlaceholderText('Poznamka (volitelne)')
    expect(el.parentElement?.tagName).not.toBe('LABEL')
  })

  it('merges className', () => {
    render(<Textarea label="Poznámka" className="min-h-[80px]" />)
    expect(screen.getByLabelText('Poznámka')).toHaveClass('min-h-[80px]')
  })
})
