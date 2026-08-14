import { Avatar } from '@/components/avatar/Avatar'
import { daysSince } from '@/lib/bio-day-count'
import type { Tier } from '@/lib/tiers'

type Props = {
  name: string | null
  tier: Tier
  tierName: string
  level: number
  startedAt: string | null
  today: Date
}

export function BioHero({ name, tier, tierName, level, startedAt, today }: Props) {
  const day = daysSince(startedAt, today)
  return (
    <div className="border-border bg-surface flex flex-col items-start gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:gap-4">
      <Avatar tier={tier} size={96} />
      <div className="flex flex-1 flex-col gap-1">
        <span className="text-foreground text-xl font-bold">{name ?? 'Hráč'}</span>
        <span className="text-muted text-xs tracking-[0.2em] uppercase">
          Level {level} · {tierName}
        </span>
      </div>
      {day !== null && (
        <div className="text-right">
          <div className="text-foreground text-3xl font-bold">Day {day}</div>
        </div>
      )}
    </div>
  )
}
