import { Avatar } from '@/components/avatar/Avatar'
import { ProgressBar } from '@/components/ui'
import type { TierMeta } from '@/lib/tiers'

type Props = {
  level: number
  tierMeta: TierMeta
  totalXp: number
  progress: { current: number; max: number }
}

export function AvatarHeroCard({ level, tierMeta, totalXp, progress }: Props) {
  return (
    <div className="border-border bg-surface flex flex-col items-center gap-2 rounded-xl border p-6">
      <h1 className="text-foreground mb-2 text-lg font-semibold">Tvůj avatar</h1>
      <Avatar tier={tierMeta.tier} size={160} />
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl font-bold" style={{ color: tierMeta.color }}>
          Level {level}
        </span>
        <span className="text-muted text-base">· {tierMeta.name}</span>
      </div>
      <div className="text-muted text-xs">
        Tier {tierMeta.tier} (L{tierMeta.levelMin}–
        {tierMeta.levelMax === 999 ? '∞' : tierMeta.levelMax})
      </div>
      <div className="mt-2 w-full max-w-md">
        <ProgressBar value={progress.current} max={progress.max} variant="xp" height={10} />
        <div className="text-muted mt-1 flex justify-between text-xs">
          <span>{totalXp.toLocaleString('cs-CZ')} XP</span>
          <span>
            {(progress.max - progress.current).toLocaleString('cs-CZ')} do L{level + 1}
          </span>
        </div>
      </div>
    </div>
  )
}
