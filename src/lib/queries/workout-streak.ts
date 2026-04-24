import { desc, eq } from 'drizzle-orm'
import { sessions } from '@/db/schema'
import type { db as DbClient } from '@/db/client'
import { computeWorkoutStreak } from '@/lib/workout-streak'

export async function fetchWorkoutStreak(db: typeof DbClient, userId: string): Promise<number> {
  const rows = await db
    .select({ startedAt: sessions.startedAt })
    .from(sessions)
    .where(eq(sessions.userId, userId))
    .orderBy(desc(sessions.startedAt))
    .limit(60)
  return computeWorkoutStreak(rows.map((r) => r.startedAt))
}
