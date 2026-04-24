import Link from 'next/link'
import { Avatar } from '@/components/avatar/Avatar'
import { ProgressBar } from '@/components/ui'
import { levelToTierMeta, xpToProgress } from '@/lib/tiers'

type Props = { level: number; totalXp: number; userName: string | null; userEmail: string }

export function AvatarHero({ level, totalXp, userName, userEmail }: Props) {
  const tierMeta = levelToTierMeta(level)
  const progress = xpToProgress(totalXp, level)
  const toNext = progress.max - progress.current
  return (
    <div className="border-border bg-surface flex flex-col items-center gap-2 rounded-xl border p-4">
      <p className="text-muted text-xs">
        {new Date().toLocaleDateString('cs-CZ', { weekday: 'long', day: 'numeric', month: 'long' })}
      </p>
      <h1 className="text-foreground text-base">Ahoj, {userName ?? userEmail}</h1>
      <Link href="/stats" className="mt-1">
        <Avatar tier={tierMeta.tier} size={80} />
      </Link>
      <div className="flex items-baseline gap-2">
        <span className="text-xl font-bold" style={{ color: tierMeta.color }}>
          Level {level}
        </span>
        <span className="text-muted text-sm">&middot; {tierMeta.name}</span>
      </div>
      <div className="w-full max-w-xs">
        <ProgressBar value={progress.current} max={progress.max} variant="xp" height={8} />
        <div className="text-muted mt-1 flex justify-between text-xs">
          <span>{progress.current} XP</span>
          <span>
            {toNext} do L{level + 1}
          </span>
        </div>
      </div>
    </div>
  )
}
