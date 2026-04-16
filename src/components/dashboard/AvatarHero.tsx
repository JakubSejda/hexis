import Link from 'next/link'
import { Avatar } from '@/components/avatar/Avatar'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { levelToTierMeta, xpToProgress } from '@/lib/tiers'

type Props = { level: number; totalXp: number; userName: string | null; userEmail: string }

export function AvatarHero({ level, totalXp, userName, userEmail }: Props) {
  const tierMeta = levelToTierMeta(level)
  const progress = xpToProgress(totalXp, level)
  const toNext = progress.max - progress.current
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-[#1F2733] bg-[#141A22] p-4">
      <p className="text-xs text-[#6b7280]">
        {new Date().toLocaleDateString('cs-CZ', { weekday: 'long', day: 'numeric', month: 'long' })}
      </p>
      <h1 className="text-base text-[#e5e7eb]">Ahoj, {userName ?? userEmail}</h1>
      <Link href="/avatar" className="mt-1">
        <Avatar tier={tierMeta.tier} size={80} />
      </Link>
      <div className="flex items-baseline gap-2">
        <span className="text-xl font-bold" style={{ color: tierMeta.color }}>
          Level {level}
        </span>
        <span className="text-sm text-[#6b7280]">&middot; {tierMeta.name}</span>
      </div>
      <div className="w-full max-w-xs">
        <ProgressBar value={progress.current} max={progress.max} tone="primary" height={8} />
        <div className="mt-1 flex justify-between text-xs text-[#6b7280]">
          <span>{progress.current} XP</span>
          <span>
            {toNext} do L{level + 1}
          </span>
        </div>
      </div>
    </div>
  )
}
