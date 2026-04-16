import { sql } from 'drizzle-orm'
import type { MySql2Database } from 'drizzle-orm/mysql2'
import * as schema from '@/db/schema'
import { estimate1RM } from '@/lib/1rm'

type DB = MySql2Database<typeof schema>

export type StrengthDataPoint = {
  date: string
  best1rm: number
}

type RawRow = {
  completed_date: string
  weight_kg: string | null
  reps: number | null
}

/**
 * Returns daily best estimated 1RM for a given exercise,
 * ordered by date ascending.
 */
export async function fetchStrengthProgress(
  db: DB,
  userId: string,
  exerciseId: number,
  days: number
): Promise<StrengthDataPoint[]> {
  const since = new Date()
  since.setDate(since.getDate() - days)
  const sinceStr = since.toISOString().slice(0, 10)

  const [rows] = await db.execute(sql`
    SELECT
      DATE(ss.completed_at) AS completed_date,
      ss.weight_kg,
      ss.reps
    FROM session_sets ss
    JOIN sessions s ON s.id = ss.session_id
    WHERE s.user_id = ${userId}
      AND ss.exercise_id = ${exerciseId}
      AND ss.completed_at >= ${sinceStr}
      AND ss.weight_kg IS NOT NULL
      AND ss.reps IS NOT NULL
    ORDER BY ss.completed_at ASC
  `)

  // Aggregate best 1RM per day in application layer
  const dayMap = new Map<string, number>()
  for (const row of rows as unknown as RawRow[]) {
    const date = String(row.completed_date)
    const w = Number(row.weight_kg)
    const r = Number(row.reps)
    const e1rm = estimate1RM(w, r)
    const current = dayMap.get(date) ?? 0
    if (e1rm > current) dayMap.set(date, e1rm)
  }

  return Array.from(dayMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, best1rm]) => ({ date, best1rm }))
}
