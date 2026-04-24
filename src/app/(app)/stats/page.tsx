import { requireSessionUser } from '@/lib/auth-helpers'
import { redirect } from 'next/navigation'
import { db } from '@/db/client'
import { getTotalXp } from '@/lib/xp'
import { xpToLevel } from '@/lib/xp-events'
import { levelToTier, levelToTierMeta, xpToProgress } from '@/lib/tiers'
import { fetchXpHistory } from '@/lib/queries/xp-history'
import { Avatar } from '@/components/avatar/Avatar'
import { ProgressBar } from '@/components/ui'
import { TierLadder } from '@/components/avatar/TierLadder'
import { NextTierPreview } from '@/components/avatar/NextTierPreview'
import { XpHistoryChart } from '@/components/avatar/XpHistoryChart'
import { XpBreakdown } from '@/components/avatar/XpBreakdown'

export default async function AvatarPage() {
  const user = await requireSessionUser()
  if (user instanceof Response) redirect('/login')

  const totalXp = await getTotalXp(db, user.id)
  const level = xpToLevel(totalXp)
  const tierMeta = levelToTierMeta(level)
  const progress = xpToProgress(totalXp, level)
  const history = await fetchXpHistory(db, user.id, 30)

  return (
    <div className="space-y-4 p-4">
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
      <TierLadder currentTier={levelToTier(level)} />
      <NextTierPreview currentLevel={level} totalXp={totalXp} />
      <XpHistoryChart daily={history.daily} days={30} />
      <XpBreakdown byEventTotal={history.byEventTotal} total={history.total} />
    </div>
  )
}
