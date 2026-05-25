// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BioHero } from '@/components/bio/BioHero'

describe('BioHero', () => {
  it('renders name and tier label', () => {
    render(
      <BioHero
        name="Jakub"
        tier={2}
        tierName="Silver"
        level={5}
        startedAt="2024-06-01"
        today={new Date('2026-05-07')}
      />
    )
    expect(screen.getByText('Jakub')).toBeInTheDocument()
    expect(screen.getByText(/Level 5/i)).toBeInTheDocument()
    expect(screen.getByText(/Silver/i)).toBeInTheDocument()
  })

  it('falls back to "Hráč" when name is null', () => {
    render(
      <BioHero
        name={null}
        tier={1}
        tierName="Bronze"
        level={1}
        startedAt={null}
        today={new Date('2026-05-07')}
      />
    )
    expect(screen.getByText('Hráč')).toBeInTheDocument()
  })

  it('hides Day count when startedAt is null', () => {
    render(
      <BioHero
        name="Jakub"
        tier={1}
        tierName="Bronze"
        level={1}
        startedAt={null}
        today={new Date('2026-05-07')}
      />
    )
    expect(screen.queryByText(/Day \d+/)).not.toBeInTheDocument()
  })

  it('renders Day N when startedAt is set (Day 1 inclusive)', () => {
    render(
      <BioHero
        name="Jakub"
        tier={1}
        tierName="Bronze"
        level={1}
        startedAt="2026-05-07"
        today={new Date('2026-05-07')}
      />
    )
    expect(screen.getByText(/Day 1/)).toBeInTheDocument()
  })

  it('renders an avatar image for the tier', () => {
    render(
      <BioHero
        name="Jakub"
        tier={3}
        tierName="Gold"
        level={10}
        startedAt={null}
        today={new Date('2026-05-07')}
      />
    )
    const img = screen.getByAltText(/Tier 3/i)
    expect(img).toBeInTheDocument()
  })
})
