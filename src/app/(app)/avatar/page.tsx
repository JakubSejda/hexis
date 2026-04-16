import { requireSessionUser } from '@/lib/auth-helpers'
import { redirect } from 'next/navigation'
import { db } from '@/db/client'
import { getTotalXp } from '@/lib/xp'
import { xpToLevel } from '@/lib/xp-events'
import { levelToTier, levelToTierMeta, xpToProgress } from '@/lib/tiers'
import { fetchXpHistory } from '@/lib/queries/xp-history'
import { Avatar } from '@/components/avatar/Avatar'
import { ProgressBar } from '@/components/ui/ProgressBar'
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
      <div className="flex flex-col items-center gap-2 rounded-xl border border-[#1F2733] bg-[#141A22] p-6">
        <h1 className="mb-2 text-lg font-semibold text-[#e5e7eb]">Tvůj avatar</h1>
        <Avatar tier={tierMeta.tier} size={160} />
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-bold" style={{ color: tierMeta.color }}>
            Level {level}
          </span>
          <span className="text-base text-[#6b7280]">· {tierMeta.name}</span>
        </div>
        <div className="text-xs text-[#6b7280]">
          Tier {tierMeta.tier} (L{tierMeta.levelMin}–
          {tierMeta.levelMax === 999 ? '∞' : tierMeta.levelMax})
        </div>
        <div className="mt-2 w-full max-w-md">
          <ProgressBar value={progress.current} max={progress.max} tone="primary" height={10} />
          <div className="mt-1 flex justify-between text-xs text-[#6b7280]">
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
