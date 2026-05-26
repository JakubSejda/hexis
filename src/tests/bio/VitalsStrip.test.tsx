// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { VitalsStrip } from '@/components/bio/VitalsStrip'

describe('VitalsStrip', () => {
  it('renders 4 slots: Výška, Věk, Pohlaví, Hmotnost', () => {
    render(<VitalsStrip heightCm={180} age={36} gender="male" weightKg={82.5} />)
    expect(screen.getByText('Výška')).toBeInTheDocument()
    expect(screen.getByText('Věk')).toBeInTheDocument()
    expect(screen.getByText('Pohlaví')).toBeInTheDocument()
    expect(screen.getByText('Hmotnost')).toBeInTheDocument()
    expect(screen.getByText('180 cm')).toBeInTheDocument()
    expect(screen.getByText('36 let')).toBeInTheDocument()
    expect(screen.getByText('muž')).toBeInTheDocument()
    expect(screen.getByText('82.5 kg')).toBeInTheDocument()
  })

  it('renders em-dash for null values', () => {
    render(<VitalsStrip heightCm={null} age={null} gender={null} weightKg={null} />)
    const dashes = screen.getAllByText('—')
    expect(dashes.length).toBe(4)
  })

  it('localizes gender to female', () => {
    render(<VitalsStrip heightCm={null} age={null} gender="female" weightKg={null} />)
    expect(screen.getByText('žena')).toBeInTheDocument()
  })

  it('localizes gender to other', () => {
    render(<VitalsStrip heightCm={null} age={null} gender="other" weightKg={null} />)
    expect(screen.getByText('jiné')).toBeInTheDocument()
  })

  it('wraps in a /settings/profile link when at least one slot is empty', () => {
    render(<VitalsStrip heightCm={180} age={null} gender="male" weightKg={82.5} />)
    const link = screen.getByRole('link', { name: /doplň profil/i })
    expect(link).toHaveAttribute('href', '/settings/profile')
  })

  it('does not show the link when all slots are filled', () => {
    render(<VitalsStrip heightCm={180} age={36} gender="male" weightKg={82.5} />)
    expect(screen.queryByRole('link', { name: /doplň profil/i })).not.toBeInTheDocument()
  })
})
