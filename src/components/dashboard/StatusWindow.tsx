import Link from 'next/link'
import { Avatar } from '@/components/avatar/Avatar'
import { ProgressBar } from '@/components/ui'
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
    <Link
      href="/stats"
      className="border-border bg-surface hover:border-accent/60 block rounded-2xl border p-4 transition-colors"
    >
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted">{today}</span>
        {streak > 0 && (
          <span className="text-muted">
            🔥 <span className="text-accent font-semibold">{streak}</span> day streak
          </span>
        )}
      </div>
      <div className="mt-2 flex flex-col items-center gap-2">
        <Avatar tier={tier} size={140} ringPulse={tier >= 3} />
        <div className="text-3xl font-bold" style={{ color: tierColor }}>
          Level {level}
        </div>
        <div className="text-muted text-xs tracking-[0.3em] uppercase">— {tierName} —</div>
        <div className="mt-2 w-full">
          <ProgressBar value={currentXp} max={xpToLevel} variant="xp" height={8} />
          <div className="text-muted mt-1 flex justify-between text-xs">
            <span>{currentXp} XP</span>
            <span>
              {xpForNext} do L{level + 1}
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
