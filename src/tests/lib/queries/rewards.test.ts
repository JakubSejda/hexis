import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { db } from '@/db/client'
import { users, xpEvents, rewards, rewardRedemptions } from '@/db/schema'
import { eq, like } from 'drizzle-orm'
import {
  fetchRewardsBalance,
  fetchActiveRewards,
  fetchRedemptionHistory,
} from '@/lib/queries/rewards'

const PREFIX = 'rwtest_'
const USER = `${PREFIX}user000000000001`

beforeAll(async () => {
  await db.insert(users).values({
    id: USER,
    email: `${PREFIX}user@hexis.local`,
    name: 'Rewards Test',
    passwordHash: 'x',
  })
})

afterAll(async () => {
  await db.delete(rewardRedemptions).where(eq(rewardRedemptions.userId, USER))
  await db.delete(rewards).where(eq(rewards.userId, USER))
  await db.delete(xpEvents).where(eq(xpEvents.userId, USER))
  await db.delete(users).where(like(users.id, `${PREFIX}%`))
})

beforeEach(async () => {
  await db.delete(rewardRedemptions).where(eq(rewardRedemptions.userId, USER))
  await db.delete(rewards).where(eq(rewards.userId, USER))
  await db.delete(xpEvents).where(eq(xpEvents.userId, USER))
})

describe('fetchRewardsBalance', () => {
  it('returns zeros for a user with no XP and no redemptions', async () => {
    const result = await fetchRewardsBalance(db, USER)
    expect(result).toEqual({ totalXp: 0, spentXp: 0, balanceXp: 0 })
  })

  it('subtracts redeemed cost_xp from totalXp', async () => {
    await db.insert(xpEvents).values({ userId: USER, eventType: 'session_complete', xpDelta: 100 })
    const [r] = await db.insert(rewards).values({ userId: USER, name: 'sushi', costXp: 30 })
    await db.insert(rewardRedemptions).values({
      userId: USER,
      rewardId: r.insertId,
      costXp: 30,
    })
    const result = await fetchRewardsBalance(db, USER)
    expect(result).toEqual({ totalXp: 100, spentXp: 30, balanceXp: 70 })
  })

  it('handles negative xpEvents (refunds) correctly', async () => {
    await db.insert(xpEvents).values([
      { userId: USER, eventType: 'session_complete', xpDelta: 100 },
      { userId: USER, eventType: 'session_complete', xpDelta: -20 },
    ])
    const result = await fetchRewardsBalance(db, USER)
    expect(result).toEqual({ totalXp: 80, spentXp: 0, balanceXp: 80 })
  })

  it('sums multiple redemptions', async () => {
    await db.insert(xpEvents).values({ userId: USER, eventType: 'session_complete', xpDelta: 500 })
    const [r] = await db.insert(rewards).values({ userId: USER, name: 'kniha', costXp: 100 })
    await db.insert(rewardRedemptions).values([
      { userId: USER, rewardId: r.insertId, costXp: 100 },
      { userId: USER, rewardId: r.insertId, costXp: 100 },
      { userId: USER, rewardId: r.insertId, costXp: 100 },
    ])
    const result = await fetchRewardsBalance(db, USER)
    expect(result).toEqual({ totalXp: 500, spentXp: 300, balanceXp: 200 })
  })
})

describe('fetchActiveRewards', () => {
  it('returns empty array when user has no rewards', async () => {
    const result = await fetchActiveRewards(db, USER)
    expect(result).toEqual([])
  })

  it('excludes archived rewards and orders by costXp ascending', async () => {
    await db.insert(rewards).values([
      { userId: USER, name: 'big', costXp: 500 },
      { userId: USER, name: 'small', costXp: 50 },
      { userId: USER, name: 'archived', costXp: 200, archivedAt: new Date() },
    ])
    const result = await fetchActiveRewards(db, USER)
    expect(result.map((r) => r.name)).toEqual(['small', 'big'])
  })
})

describe('fetchRedemptionHistory', () => {
  it('returns empty array when user has no redemptions', async () => {
    const result = await fetchRedemptionHistory(db, USER)
    expect(result).toEqual([])
  })

  it('returns rows joined with reward name and ordered redeemedAt DESC', async () => {
    const [r] = await db.insert(rewards).values({ userId: USER, name: 'sushi', costXp: 30 })
    const earlier = new Date(Date.now() - 60_000)
    const later = new Date()
    await db.insert(rewardRedemptions).values([
      { userId: USER, rewardId: r.insertId, costXp: 30, redeemedAt: earlier },
      { userId: USER, rewardId: r.insertId, costXp: 30, redeemedAt: later, note: 'birthday' },
    ])
    const result = await fetchRedemptionHistory(db, USER)
    expect(result).toHaveLength(2)
    expect(result[0]!.note).toBe('birthday')
    expect(result[0]!.rewardName).toBe('sushi')
    expect(result[0]!.rewardArchived).toBe(false)
    expect(result[1]!.note).toBeNull()
  })

  it('marks rewardArchived=true when joined reward has archivedAt set', async () => {
    const [r] = await db.insert(rewards).values({
      userId: USER,
      name: 'old reward',
      costXp: 50,
      archivedAt: new Date(),
    })
    await db.insert(rewardRedemptions).values({
      userId: USER,
      rewardId: r.insertId,
      costXp: 50,
    })
    const result = await fetchRedemptionHistory(db, USER)
    expect(result).toHaveLength(1)
    expect(result[0]!.rewardArchived).toBe(true)
    expect(result[0]!.rewardName).toBe('old reward')
  })
})
