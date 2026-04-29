import type { MySql2Database } from 'drizzle-orm/mysql2'
import { eq, sql, isNull, desc, and, asc } from 'drizzle-orm'
import * as schema from '@/db/schema'
import { rewards, rewardRedemptions } from '@/db/schema'
import { getTotalXp } from '@/lib/xp'

type DB = MySql2Database<typeof schema>

export type RewardsBalance = {
  totalXp: number
  spentXp: number
  balanceXp: number
}

export async function fetchRewardsBalance(db: DB, userId: string): Promise<RewardsBalance> {
  const totalXp = await getTotalXp(db, userId)
  const rows = await db
    .select({ spent: sql<number>`COALESCE(SUM(${rewardRedemptions.costXp}), 0)` })
    .from(rewardRedemptions)
    .where(eq(rewardRedemptions.userId, userId))
  const spentXp = Number(rows[0]?.spent ?? 0)
  return { totalXp, spentXp, balanceXp: totalXp - spentXp }
}

export type RewardRow = typeof rewards.$inferSelect

export async function fetchActiveRewards(db: DB, userId: string): Promise<RewardRow[]> {
  return db
    .select()
    .from(rewards)
    .where(and(eq(rewards.userId, userId), isNull(rewards.archivedAt)))
    .orderBy(asc(rewards.costXp), asc(rewards.id))
}

export type RedemptionWithReward = {
  id: number
  rewardId: number
  rewardName: string
  rewardArchived: boolean
  costXp: number
  note: string | null
  redeemedAt: Date
}

export async function fetchRedemptionHistory(
  db: DB,
  userId: string,
  limit = 50
): Promise<RedemptionWithReward[]> {
  const rows = await db
    .select({
      id: rewardRedemptions.id,
      rewardId: rewardRedemptions.rewardId,
      rewardName: rewards.name,
      archivedAt: rewards.archivedAt,
      costXp: rewardRedemptions.costXp,
      note: rewardRedemptions.note,
      redeemedAt: rewardRedemptions.redeemedAt,
    })
    .from(rewardRedemptions)
    .leftJoin(rewards, eq(rewardRedemptions.rewardId, rewards.id))
    .where(eq(rewardRedemptions.userId, userId))
    .orderBy(desc(rewardRedemptions.redeemedAt))
    .limit(limit)

  return rows.map((r) => ({
    id: r.id,
    rewardId: r.rewardId,
    rewardName: r.rewardName ?? '(smazaná odměna)',
    rewardArchived: r.archivedAt != null,
    costXp: r.costXp,
    note: r.note,
    redeemedAt: r.redeemedAt,
  }))
}
