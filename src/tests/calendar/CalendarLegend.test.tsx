// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CalendarLegend } from '@/components/calendar/CalendarLegend'

describe('CalendarLegend', () => {
  it('renders 4 signal labels and the streak swatch', () => {
    render(<CalendarLegend />)
    expect(screen.getByText('Training')).toBeInTheDocument()
    expect(screen.getByText('Návyk')).toBeInTheDocument()
    expect(screen.getByText('Vážení')).toBeInTheDocument()
    expect(screen.getByText('Foto')).toBeInTheDocument()
    expect(screen.getByText(/3\+ den streak/i)).toBeInTheDocument()
  })
})
