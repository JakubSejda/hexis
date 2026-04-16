import { sql } from 'drizzle-orm'
import type { MySql2Database } from 'drizzle-orm/mysql2'
import * as schema from '@/db/schema'
import { detectStagnation, type StagnationResult } from '@/lib/stagnation'

type DB = MySql2Database<typeof schema>

type RawRow = {
  exercise_id: number
  exercise_name: string
  weight_kg: string
  reps: number
  completed_at: string
}

export async function fetchStagnatingExercises(
  db: DB,
  userId: string,
  now: Date
): Promise<StagnationResult[]> {
  const since = new Date(now)
  since.setDate(since.getDate() - 60)
  const sinceStr = since.toISOString().slice(0, 10)

  const [rows] = await db.execute(sql`
    SELECT
      ss.exercise_id,
      e.name AS exercise_name,
      ss.weight_kg,
      ss.reps,
      ss.completed_at
    FROM session_sets ss
    JOIN sessions s ON s.id = ss.session_id
    JOIN exercises e ON e.id = ss.exercise_id
    WHERE s.user_id = ${userId}
      AND ss.completed_at >= ${sinceStr}
      AND ss.weight_kg IS NOT NULL
      AND ss.reps IS NOT NULL
    ORDER BY ss.completed_at ASC
  `)

  const byExercise = new Map<
    number,
    { name: string; sets: { weightKg: number; reps: number; completedAt: string }[] }
  >()
  for (const row of rows as unknown as RawRow[]) {
    const eid = Number(row.exercise_id)
    let entry = byExercise.get(eid)
    if (!entry) {
      entry = { name: String(row.exercise_name), sets: [] }
      byExercise.set(eid, entry)
    }
    entry.sets.push({
      weightKg: Number(row.weight_kg),
      reps: Number(row.reps),
      completedAt: String(row.completed_at),
    })
  }

  const results: StagnationResult[] = []
  for (const [exerciseId, { name, sets }] of byExercise) {
    const result = detectStagnation({ exerciseId, exerciseName: name, sets, now })
    if (result.isStagnant) results.push(result)
  }

  return results
}
