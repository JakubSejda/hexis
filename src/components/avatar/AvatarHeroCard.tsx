import { RankLens, tierTone } from '@/components/dashboard/RankLens'
import { Card, ProgressBar } from '@/components/ui'
import type { TierMeta } from '@/lib/tiers'

const ROMAN = ['I', 'II', 'III', 'IV', 'V'] as const

type Props = {
  level: number
  tierMeta: TierMeta
  totalXp: number
  progress: { current: number; max: number }
}

/** Statistiky header: the same level/tier/XP readout as the hub, without the art. */
export function AvatarHeroCard({ level, tierMeta, totalXp, progress }: Props) {
  const range = `L${tierMeta.levelMin}–${tierMeta.levelMax === 999 ? '∞' : tierMeta.levelMax}`
  return (
    <Card padding="lg" className="relative overflow-hidden">
      <span aria-hidden className="hero-glow absolute inset-0" />
      <div className="relative flex items-end justify-between gap-4">
        <div className="font-display leading-none font-black uppercase">
          <span className="text-accent block text-lg">Level</span>
          <span className="hero-level block text-7xl">{level}</span>
        </div>
        <div className="flex flex-col items-end gap-2 pb-1 text-right">
          <RankLens
            label={ROMAN[tierMeta.tier - 1] ?? String(tierMeta.tier)}
            tone={tierTone(tierMeta.tier)}
          />
          <div className="font-display text-xl leading-none font-black uppercase">
            {tierMeta.name}
          </div>
          <div className="text-muted text-xs">
            Tier {tierMeta.tier} ({range})
          </div>
        </div>
      </div>
      <div className="relative mt-4">
        <ProgressBar
          value={progress.current}
          max={progress.max}
          variant="xp"
          height={10}
          label={`XP do levelu ${level + 1}`}
        />
        <div className="text-muted mt-1.5 flex justify-between text-xs font-semibold">
          <span>{totalXp.toLocaleString('cs-CZ')} XP</span>
          <span>
            {(progress.max - progress.current).toLocaleString('cs-CZ')} do levelu {level + 1}
          </span>
        </div>
      </div>
    </Card>
  )
}
