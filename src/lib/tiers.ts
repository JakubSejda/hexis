export type Tier = 1 | 2 | 3 | 4 | 5

export type TierMeta = {
  tier: Tier
  name: string
  levelMin: number
  levelMax: number
  color: string
  accent: string
}

export const TIERS: readonly TierMeta[] = [
  { tier: 1, name: 'Rookie', levelMin: 1, levelMax: 5, color: '#b45309', accent: '#92400e' },
  { tier: 2, name: 'Apprentice', levelMin: 6, levelMax: 15, color: '#64748b', accent: '#475569' },
  { tier: 3, name: 'Warrior', levelMin: 16, levelMax: 30, color: '#ca8a04', accent: '#a16207' },
  { tier: 4, name: 'Beast', levelMin: 31, levelMax: 50, color: '#10b981', accent: '#065f46' },
  { tier: 5, name: 'Titan', levelMin: 51, levelMax: 999, color: '#0ea5e9', accent: '#0c4a6e' },
] as const

export function levelToTier(level: number): Tier {
  if (level <= 5) return 1
  if (level <= 15) return 2
  if (level <= 30) return 3
  if (level <= 50) return 4
  return 5
}

export function levelToTierMeta(level: number): TierMeta {
  return TIERS[levelToTier(level) - 1]!
}

export function nextTierMeta(level: number): TierMeta | null {
  const current = levelToTier(level)
  if (current === 5) return null
  return TIERS[current]!
}

export function xpToProgress(
  totalXp: number,
  currentLevel: number
): { current: number; max: number; percent: number } {
  const floor = Math.pow(currentLevel - 1, 2) * 100
  const ceil = Math.pow(currentLevel, 2) * 100
  const current = Math.max(0, totalXp - floor)
  const max = ceil - floor
  const percent = max > 0 ? Math.min((current / max) * 100, 100) : 0
  return { current, max, percent }
}
