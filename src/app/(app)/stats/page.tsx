import { requireSessionUser } from '@/lib/auth-helpers'
import { redirect } from 'next/navigation'
import { db } from '@/db/client'
import { getTotalXp } from '@/lib/xp'
import { xpToLevel } from '@/lib/xp-events'
import { levelToTier, levelToTierMeta, xpToProgress } from '@/lib/tiers'
import { fetchXpHistory } from '@/lib/queries/xp-history'
import { AvatarHeroCard } from '@/components/avatar/AvatarHeroCard'
import { TierLadder } from '@/components/avatar/TierLadder'
import { NextTierPreview } from '@/components/avatar/NextTierPreview'
import { XpHistoryChart } from '@/components/avatar/XpHistoryChart'
import { XpBreakdown } from '@/components/avatar/XpBreakdown'
import { MuscleRankSection } from '@/components/anatomy/MuscleRankSection'
import { RegionHeader } from '@/components/dashboard/RegionHeader'

export default async function AvatarPage() {
  const user = await requireSessionUser()
  if (user instanceof Response) redirect('/login')

  const totalXp = await getTotalXp(db, user.id)
  const level = xpToLevel(totalXp)
  const tierMeta = levelToTierMeta(level)
  const progress = xpToProgress(totalXp, level)
  const history = await fetchXpHistory(db, user.id, 30)

  return (
    <div className="space-y-6 p-4">
      <AvatarHeroCard level={level} tierMeta={tierMeta} totalXp={totalXp} progress={progress} />

      <section>
        <RegionHeader>Avatar Progress</RegionHeader>
        <TierLadder currentTier={levelToTier(level)} />
        <NextTierPreview currentLevel={level} totalXp={totalXp} />
      </section>

      <section>
        <RegionHeader>Muscle Rank</RegionHeader>
        <MuscleRankSection userId={user.id} />
      </section>

      <section>
        <RegionHeader>XP History</RegionHeader>
        <XpHistoryChart daily={history.daily} days={30} />
        <XpBreakdown byEventTotal={history.byEventTotal} total={history.total} />
      </section>
    </div>
  )
}
