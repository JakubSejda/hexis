import type { MySql2Database } from 'drizzle-orm/mysql2'
import { eq, sql } from 'drizzle-orm'
import * as schema from '@/db/schema'
import { users, xpEvents } from '@/db/schema'
import { XP_DELTAS, xpToLevel, type XpEventType } from './xp-events'
import { levelToTier } from './tiers'

type DB = MySql2Database<typeof schema>

type AwardArgs = {
  event: XpEventType
  db: DB
  userId: string
  sessionId?: number | null
  meta?: Record<string, unknown>
}

export async function awardXp(args: AwardArgs) {
  const delta = XP_DELTAS[args.event]
  return appendXpEvent({ ...args, xpDelta: delta })
}

type ReverseArgs = {
  event: XpEventType
  db: DB
  userId: string
  sessionId: number | null
  meta?: Record<string, unknown>
}

export async function reverseXp(args: ReverseArgs) {
  const delta = -XP_DELTAS[args.event]
  return appendXpEvent({ ...args, xpDelta: delta })
}

async function appendXpEvent(args: {
  event: XpEventType
  db: DB
  userId: string
  sessionId?: number | null
  meta?: Record<string, unknown>
  xpDelta: number
}) {
  const totalBefore = await getTotalXp(args.db, args.userId)
  const levelBefore = xpToLevel(totalBefore)
  await args.db.insert(xpEvents).values({
    userId: args.userId,
    eventType: args.event,
    xpDelta: args.xpDelta,
    sessionId: args.sessionId ?? null,
    meta: args.meta ?? null,
  })
  const totalAfter = totalBefore + args.xpDelta
  const levelAfter = xpToLevel(totalAfter)
  if (levelAfter !== levelBefore) {
    await args.db.update(users).set({ level: levelAfter }).where(eq(users.id, args.userId))
  }
  const tierBefore = levelToTier(levelBefore)
  const tierAfter = levelToTier(levelAfter)
  return {
    xpDelta: args.xpDelta,
    newTotalXp: totalAfter,
    levelBefore,
    levelAfter,
    levelUp: levelAfter > levelBefore,
    tierBefore,
    tierAfter,
    tierUp: tierAfter > tierBefore,
  }
}

export async function getTotalXp(db: DB, userId: string): Promise<number> {
  const rows = await db
    .select({ total: sql<number>`COALESCE(SUM(${xpEvents.xpDelta}), 0)` })
    .from(xpEvents)
    .where(eq(xpEvents.userId, userId))
  return Number(rows[0]?.total ?? 0)
}
