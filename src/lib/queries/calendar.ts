import { and, eq, gte, isNotNull, lte, sql } from 'drizzle-orm'
import type { MySql2Database } from 'drizzle-orm/mysql2'
import * as schema from '@/db/schema'
import { sessions, habitCompletions, measurements, bodyPhotos, plans, habits } from '@/db/schema'
import type { DayDetailData } from '@/lib/calendar/types'

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

export async function fetchDayDetail(db: DB, userId: string, date: string): Promise<DayDetailData> {
  const dayStart = new Date(`${date}T00:00:00Z`)
  const dayEnd = new Date(`${date}T23:59:59Z`)

  const [sessionRows, habitRows, measurementRow, photoRows] = await Promise.all([
    db
      .select({
        id: sessions.id,
        planName: plans.name,
        startedAt: sessions.startedAt,
        finishedAt: sessions.finishedAt,
      })
      .from(sessions)
      .leftJoin(plans, eq(plans.id, sessions.planId))
      .where(
        and(
          eq(sessions.userId, userId),
          isNotNull(sessions.finishedAt),
          gte(sessions.finishedAt, dayStart),
          lte(sessions.finishedAt, dayEnd)
        )
      ),
    db
      .select({ id: habits.id, name: habits.name })
      .from(habitCompletions)
      .innerJoin(habits, eq(habits.id, habitCompletions.habitId))
      .where(and(eq(habitCompletions.userId, userId), eq(habitCompletions.completedOn, date))),
    db
      .select({ weightKg: measurements.weightKg, waistCm: measurements.waistCm })
      .from(measurements)
      .where(and(eq(measurements.userId, userId), eq(measurements.weekStart, date)))
      .limit(1),
    db
      .select({ id: bodyPhotos.id, pose: bodyPhotos.pose })
      .from(bodyPhotos)
      .where(and(eq(bodyPhotos.userId, userId), eq(bodyPhotos.takenAt, date))),
  ])

  return {
    date,
    sessions: sessionRows.map((r) => ({
      id: r.id,
      planName: r.planName ?? 'trénink',
      durationMin:
        r.startedAt && r.finishedAt
          ? Math.round((r.finishedAt.getTime() - r.startedAt.getTime()) / 60_000)
          : null,
    })),
    habits: habitRows.map((r) => ({ id: r.id, name: r.name })),
    measurement: measurementRow[0]
      ? {
          weightKg: measurementRow[0].weightKg ? Number(measurementRow[0].weightKg) : null,
          waistCm: measurementRow[0].waistCm ? Number(measurementRow[0].waistCm) : null,
        }
      : null,
    photos: photoRows.map((r) => ({
      id: r.id,
      pose: r.pose,
      fullUrl: `/api/photos/${r.id}`,
      thumbUrl: `/api/photos/${r.id}/thumb`,
    })),
  }
}
