import { desc, eq } from 'drizzle-orm'
import type { MySql2Database } from 'drizzle-orm/mysql2'
import * as schema from '@/db/schema'
import { sessions } from '@/db/schema'
import { computeWorkoutStreak } from '@/lib/workout-streak'

type DB = MySql2Database<typeof schema>

export async function fetchWorkoutStreak(db: DB, userId: string): Promise<number> {
  const rows = await db
    .select({ startedAt: sessions.startedAt })
    .from(sessions)
    .where(eq(sessions.userId, userId))
    .orderBy(desc(sessions.startedAt))
    .limit(60)
  return computeWorkoutStreak(rows.map((r) => r.startedAt))
}
