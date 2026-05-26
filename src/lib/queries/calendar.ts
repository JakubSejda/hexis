import { and, eq, gte, isNotNull, lte, sql } from 'drizzle-orm'
import type { MySql2Database } from 'drizzle-orm/mysql2'
import * as schema from '@/db/schema'
import { sessions, habitCompletions, measurements, bodyPhotos } from '@/db/schema'

type DB = MySql2Database<typeof schema>

function setOf(rows: Array<{ d: unknown }>): Set<string> {
  const out = new Set<string>()
  for (const r of rows) {
    if (typeof r.d === 'string') out.add(r.d)
    else if (r.d instanceof Date) {
      const y = r.d.getUTCFullYear()
      const m = String(r.d.getUTCMonth() + 1).padStart(2, '0')
      const day = String(r.d.getUTCDate()).padStart(2, '0')
      out.add(`${y}-${m}-${day}`)
    }
  }
  return out
}

/** Sessions count on the day they finished, only when finishedAt IS NOT NULL. */
export async function fetchSessionDatesInRange(
  db: DB,
  userId: string,
  from: string,
  to: string
): Promise<Set<string>> {
  const rows = await db
    .select({ d: sql<string>`DATE(${sessions.finishedAt})` })
    .from(sessions)
    .where(
      and(
        eq(sessions.userId, userId),
        isNotNull(sessions.finishedAt),
        gte(sessions.finishedAt, new Date(`${from}T00:00:00Z`)),
        lte(sessions.finishedAt, new Date(`${to}T23:59:59Z`))
      )
    )
  return setOf(rows)
}

export async function fetchHabitDatesInRange(
  db: DB,
  userId: string,
  from: string,
  to: string
): Promise<Set<string>> {
  const rows = await db
    .select({ d: habitCompletions.completedOn })
    .from(habitCompletions)
    .where(
      and(
        eq(habitCompletions.userId, userId),
        gte(habitCompletions.completedOn, from),
        lte(habitCompletions.completedOn, to)
      )
    )
  return setOf(rows)
}

export async function fetchMeasurementDatesInRange(
  db: DB,
  userId: string,
  from: string,
  to: string
): Promise<Set<string>> {
  const rows = await db
    .select({ d: measurements.weekStart })
    .from(measurements)
    .where(
      and(
        eq(measurements.userId, userId),
        gte(measurements.weekStart, from),
        lte(measurements.weekStart, to)
      )
    )
  return setOf(rows)
}

export async function fetchPhotoDatesInRange(
  db: DB,
  userId: string,
  from: string,
  to: string
): Promise<Set<string>> {
  const rows = await db
    .select({ d: bodyPhotos.takenAt })
    .from(bodyPhotos)
    .where(
      and(eq(bodyPhotos.userId, userId), gte(bodyPhotos.takenAt, from), lte(bodyPhotos.takenAt, to))
    )
  return setOf(rows)
}
