import { redirect } from 'next/navigation'
import { db } from '@/db/client'
import { requireSessionUser } from '@/lib/auth-helpers'
import {
  fetchActiveRewards,
  fetchRedemptionHistory,
  fetchRewardsBalance,
} from '@/lib/queries/rewards'
import { rewardRedemptions } from '@/db/schema'
import { eq, sql } from 'drizzle-orm'
import { RewardsPageClient } from '@/components/rewards/RewardsPageClient'

export const dynamic = 'force-dynamic'

export default async function RewardsPage() {
  const user = await requireSessionUser()
  if (user instanceof Response) {
    redirect('/login')
  }

  const [balance, rewards, history, countsRows] = await Promise.all([
    fetchRewardsBalance(db, user.id),
    fetchActiveRewards(db, user.id),
    fetchRedemptionHistory(db, user.id),
    db
      .select({
        rewardId: rewardRedemptions.rewardId,
        n: sql<number>`COUNT(*)`,
      })
      .from(rewardRedemptions)
      .where(eq(rewardRedemptions.userId, user.id))
      .groupBy(rewardRedemptions.rewardId),
  ])

  const redemptionCounts: Record<number, number> = {}
  for (const row of countsRows) redemptionCounts[row.rewardId] = Number(row.n)

  return (
    <main className="mx-auto w-full max-w-2xl space-y-6 p-4">
      <h1 className="text-foreground text-2xl font-bold">Odměny</h1>
      <RewardsPageClient
        initialBalance={balance}
        initialRewards={rewards}
        initialHistory={history}
        redemptionCounts={redemptionCounts}
      />
    </main>
  )
}
