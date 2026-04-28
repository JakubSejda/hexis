// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AvatarHeroCard } from '../AvatarHeroCard'

describe('AvatarHeroCard', () => {
  it('renders the level, tier name, and tier range', () => {
    render(
      <AvatarHeroCard
        level={12}
        tierMeta={{
          tier: 2 as const,
          name: 'Apprentice',
          color: '#0af',
          accent: '#000',
          levelMin: 10,
          levelMax: 24,
        }}
        totalXp={1234}
        progress={{ current: 200, max: 500 }}
      />
    )
    expect(screen.getByText(/Level 12/)).toBeDefined()
    expect(screen.getByText(/Apprentice/)).toBeDefined()
    expect(screen.getByText(/Tier 2 \(L10–24\)/)).toBeDefined()
    expect(screen.getByText(/1[ , ]234 XP/)).toBeDefined()
    expect(screen.getByText(/300.*do L13/)).toBeDefined()
  })

  it('renders ∞ for the top-tier upper bound', () => {
    render(
      <AvatarHeroCard
        level={99}
        tierMeta={{
          tier: 5 as const,
          name: 'Mythic',
          color: '#fc0',
          accent: '#000',
          levelMin: 80,
          levelMax: 999,
        }}
        totalXp={500_000}
        progress={{ current: 0, max: 1 }}
      />
    )
    expect(screen.getByText(/Tier 5 \(L80–∞\)/)).toBeDefined()
  })
})
