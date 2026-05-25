import { and, eq, isNotNull, sql } from 'drizzle-orm'
import type { MySql2Database } from 'drizzle-orm/mysql2'
import * as schema from '@/db/schema'
import { sessions, sessionSets, xpEvents } from '@/db/schema'

type DB = MySql2Database<typeof schema>

export type LifetimeTotals = {
  sessions: number
  sets: number
  liftedKg: number
  totalXp: number
}

export async function fetchLifetimeTotals(db: DB, userId: string): Promise<LifetimeTotals> {
  const [sessionsRow] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(sessions)
    .where(and(eq(sessions.userId, userId), isNotNull(sessions.finishedAt)))

  const [setsRow] = await db
    .select({
      sets: sql<number>`COUNT(*)`,
      lifted: sql<number>`COALESCE(SUM(${sessionSets.weightKg} * ${sessionSets.reps}), 0)`,
    })
    .from(sessionSets)
    .innerJoin(sessions, eq(sessions.id, sessionSets.sessionId))
    .where(and(eq(sessions.userId, userId), isNotNull(sessions.finishedAt)))

  const [xpRow] = await db
    .select({ total: sql<number>`COALESCE(SUM(${xpEvents.xpDelta}), 0)` })
    .from(xpEvents)
    .where(eq(xpEvents.userId, userId))

  return {
    sessions: Number(sessionsRow?.count ?? 0),
    sets: Number(setsRow?.sets ?? 0),
    liftedKg: Number(setsRow?.lifted ?? 0),
    totalXp: Number(xpRow?.total ?? 0),
  }
}
