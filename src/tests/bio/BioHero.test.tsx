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
    expect(screen.getByText('LVL 5')).toBeInTheDocument()
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

  it('hides the day count when startedAt is null', () => {
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
    expect(screen.queryByText(/Den \d+/)).not.toBeInTheDocument()
  })

  it('renders Den N when startedAt is set (Den 1 inclusive)', () => {
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
    expect(screen.getByText(/Den 1 cesty/)).toBeInTheDocument()
  })

  it('renders the tier lens', () => {
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
    expect(screen.getByTitle(/^Tier /)).toBeInTheDocument()
    expect(screen.getByText('LVL 10')).toBeInTheDocument()
  })
})
