import Image from 'next/image'
import type { Tier } from '@/lib/tiers'
import { daysSince } from '@/lib/bio-day-count'

import { RankLens } from '@/components/dashboard/RankLens'
import { Pill } from '@/components/ui'
const ROMAN = ['I', 'II', 'III', 'IV', 'V'] as const

type Props = {
  name: string | null
  tier: Tier
  tierName: string
  level: number
  startedAt: string | null
  today: Date
}

/** The player card: portrait, level, tier lens, name and day of the journey. */
export function BioHero({ name, tier, tierName, level, startedAt, today }: Props) {
  const day = daysSince(startedAt, today)
  return (
    <div className="rounded-card border-border bg-surface relative overflow-hidden border">
      <div className="relative h-72">
        <Image
          src="/images/player-portrait.webp"
          alt=""
          fill
          priority
          sizes="(min-width: 768px) 640px, 100vw"
          className="object-cover object-[center_20%]"
        />
        <span
          aria-hidden
          className="from-surface absolute inset-x-0 bottom-0 h-24 bg-linear-to-t to-transparent"
        />
        <div className="absolute inset-x-3 top-3 flex items-start justify-between">
          <Pill variant="accent" size="md" className="font-display font-black">
            LVL {level}
          </Pill>
          <RankLens label={ROMAN[tier - 1] ?? String(tier)} title={`Tier ${tierName}`} />
        </div>
      </div>
      <div className="px-4 pb-4">
        <div className="font-display text-3xl leading-none font-black uppercase">
          {name ?? 'Hráč'}
        </div>
        <p className="text-muted mt-2 text-sm">
          {tierName}
          {day !== null ? ` · Den ${day} cesty` : ''}
        </p>
      </div>
    </div>
  )
}
