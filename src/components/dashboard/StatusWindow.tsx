import Link from 'next/link'
import { Card, Heading, ProgressBar } from '@/components/ui'
import { HexEmblem } from './HexEmblem'
import type { Tier } from '@/lib/tiers'

type Props = {
  level: number
  currentXp: number
  xpToLevel: number
  xpForNext: number
  tier: Tier
  tierName: string
  tierColor: string
  streak: number
}

export function StatusWindow({
  level,
  currentXp,
  xpToLevel,
  xpForNext,
  tier,
  tierName,
  tierColor,
  streak,
}: Props) {
  const today = new Date().toLocaleDateString('cs-CZ', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
  return (
    <Card as={Link} href="/stats" variant="interactive" className="animate-hud-power-on block">
      <div className="text-muted flex items-center justify-between font-mono text-xs tracking-[0.15em] uppercase">
        <span>{today}</span>
        {streak > 0 && (
          <span>
            🔥 <span className="text-accent font-semibold">{streak}</span> day streak
          </span>
        )}
      </div>
      <div className="mt-3 flex flex-col items-center gap-2">
        <HexEmblem
          level={level}
          tierColor={tierColor}
          className={tier >= 3 ? 'animate-tier-glow' : undefined}
        />
        <Heading level={2} as="div" variant="display" className="text-foreground">
          Level {level}
        </Heading>
        <div className="text-system font-mono text-xs tracking-[0.2em] uppercase">
          — {tierName} —
        </div>
        <div className="mt-2 w-full">
          <ProgressBar value={currentXp} max={xpToLevel} variant="xp" height={8} />
          <div className="text-muted-strong mt-1.5 flex justify-between font-mono text-xs">
            <span>{currentXp} XP</span>
            <span>
              {xpForNext} do L{level + 1}
            </span>
          </div>
        </div>
      </div>
    </Card>
  )
}
