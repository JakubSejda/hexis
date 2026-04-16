import { sql } from 'drizzle-orm'
import type { MySql2Database } from 'drizzle-orm/mysql2'
import * as schema from '@/db/schema'

type DB = MySql2Database<typeof schema>

export type MuscleVolumes = {
  muscles: Record<string, number>
  maxVolume: number
}

type RawRow = { slug: string; volume: string | number }

export async function fetchMuscleVolumes(
  db: DB,
  userId: string,
  days: number
): Promise<MuscleVolumes> {
  const since = new Date()
  since.setDate(since.getDate() - days)
  const sinceStr = since.toISOString().slice(0, 10)

  const [rows] = await db.execute(sql`
    SELECT mg.slug, SUM(CAST(ss.weight_kg AS DECIMAL(10,2)) * ss.reps) AS volume
    FROM session_sets ss
    JOIN sessions s ON s.id = ss.session_id
    JOIN exercise_muscle_groups emg ON emg.exercise_id = ss.exercise_id
    JOIN muscle_groups mg ON mg.id = emg.muscle_group_id
    WHERE s.user_id = ${userId}
      AND ss.completed_at >= ${sinceStr}
      AND ss.weight_kg IS NOT NULL
      AND ss.reps IS NOT NULL
    GROUP BY mg.slug
  `)

  const muscles: Record<string, number> = {}
  let maxVolume = 0
  for (const row of rows as unknown as RawRow[]) {
    const vol = Number(row.volume)
    muscles[row.slug] = vol
    if (vol > maxVolume) maxVolume = vol
  }
  return { muscles, maxVolume }
}
