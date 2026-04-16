import { sql } from 'drizzle-orm'
import type { MySql2Database } from 'drizzle-orm/mysql2'
import * as schema from '@/db/schema'

type DB = MySql2Database<typeof schema>

export type VolumeCategory = 'chest' | 'back' | 'shoulders' | 'arms' | 'legs'

export type WeeklyVolume = {
  weekStart: string
} & Record<VolumeCategory, number>

const SLUG_TO_CATEGORY: Record<string, VolumeCategory> = {
  chest: 'chest',
  'back-lats': 'back',
  'back-mid': 'back',
  'back-rear-delt': 'back',
  shoulders: 'shoulders',
  biceps: 'arms',
  triceps: 'arms',
  forearms: 'arms',
  quads: 'legs',
  hamstrings: 'legs',
  glutes: 'legs',
  calves: 'legs',
  adductors: 'legs',
}

type RawRow = {
  week_start: string
  slug: string
  volume: string | number
}

export async function fetchVolumeProgress(
  db: DB,
  userId: string,
  days: number
): Promise<WeeklyVolume[]> {
  const since = new Date()
  since.setDate(since.getDate() - days)
  const sinceStr = since.toISOString().slice(0, 10)

  const [rows] = await db.execute(sql`
    SELECT
      DATE(DATE_SUB(ss.completed_at, INTERVAL (WEEKDAY(ss.completed_at)) DAY)) AS week_start,
      mg.slug,
      SUM(CAST(ss.weight_kg AS DECIMAL(10,2)) * ss.reps) AS volume
    FROM session_sets ss
    JOIN sessions s ON s.id = ss.session_id
    JOIN exercise_muscle_groups emg ON emg.exercise_id = ss.exercise_id AND emg.is_primary = 1
    JOIN muscle_groups mg ON mg.id = emg.muscle_group_id
    WHERE s.user_id = ${userId}
      AND ss.completed_at >= ${sinceStr}
      AND ss.weight_kg IS NOT NULL
      AND ss.reps IS NOT NULL
    GROUP BY week_start, mg.slug
    ORDER BY week_start ASC
  `)

  const weekMap = new Map<string, WeeklyVolume>()

  for (const row of rows as unknown as RawRow[]) {
    const weekStart = String(row.week_start)
    const category = SLUG_TO_CATEGORY[row.slug]
    if (!category) continue

    let week = weekMap.get(weekStart)
    if (!week) {
      week = { weekStart, chest: 0, back: 0, shoulders: 0, arms: 0, legs: 0 }
      weekMap.set(weekStart, week)
    }
    week[category] += Number(row.volume)
  }

  return Array.from(weekMap.values()).sort((a, b) => a.weekStart.localeCompare(b.weekStart))
}
