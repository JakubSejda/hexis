import type { MySql2Database } from 'drizzle-orm/mysql2'
import { and, desc, eq, isNull, lt } from 'drizzle-orm'
import * as schema from '@/db/schema'
import { sessions, sessionSets } from '@/db/schema'
import { awardXp } from './xp'

type DB = MySql2Database<typeof schema>

const TWELVE_H_MS = 12 * 3600 * 1000
const FALLBACK_DURATION_MS = 3600 * 1000

/**
 * Lazy auto-finish of sessions older than 12 hours.
 * Called from GET /api/workout/active, POST /api/sessions, and dashboard SSR.
 * Idempotent — the UPDATE WHERE finishedAt IS NULL guards against races.
 */
export async function checkAndFinishStaleSessions(userId: string, db: DB) {
  const threshold = new Date(Date.now() - TWELVE_H_MS)
  const stale = await db
    .select()
    .from(sessions)
    .where(
      and(
        eq(sessions.userId, userId),
        isNull(sessions.finishedAt),
        lt(sessions.startedAt, threshold)
      )
    )

  for (const s of stale) {
    const lastSet = await db.query.sessionSets.findFirst({
      where: eq(sessionSets.sessionId, s.id),
      orderBy: desc(sessionSets.completedAt),
    })
    const finishedAt =
      lastSet?.completedAt ?? new Date(s.startedAt.getTime() + FALLBACK_DURATION_MS)

    await db
      .update(sessions)
      .set({ finishedAt })
      .where(and(eq(sessions.id, s.id), isNull(sessions.finishedAt)))

    // Prevent duplicate XP: check xp_events for existing session_complete
    const already = await db.query.xpEvents.findFirst({
      where: (xp, { and, eq }) =>
        and(eq(xp.userId, userId), eq(xp.sessionId, s.id), eq(xp.eventType, 'session_complete')),
    })
    if (!already) {
      await awardXp({ event: 'session_complete', db, userId, sessionId: s.id })
    }
  }
}
