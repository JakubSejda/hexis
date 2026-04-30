import type { MySql2Database } from 'drizzle-orm/mysql2'
import { and, asc, desc, eq, isNull, sql } from 'drizzle-orm'
import * as schema from '@/db/schema'
import { habits, habitCompletions, xpEvents } from '@/db/schema'
import { countConsecutiveDays, countConsecutiveClosedWeeks, isoWeekKey } from '@/lib/habits/streak'
import type { HabitMilestone } from '@/lib/habits/milestone'

type DB = MySql2Database<typeof schema>

export type HabitRow = typeof habits.$inferSelect

export type HabitWithStreak = HabitRow & {
  currentStreak: number
  completedToday: boolean
  completedThisWeek?: number
}

export async function fetchActiveHabitsWithStreak(
  db: DB,
  userId: string,
  today: string
): Promise<HabitWithStreak[]> {
  const rows = await db
    .select()
    .from(habits)
    .where(and(eq(habits.userId, userId), isNull(habits.archivedAt)))
    .orderBy(asc(habits.cadence), asc(habits.id))

  if (rows.length === 0) return []

  const all = await db
    .select({
      habitId: habitCompletions.habitId,
      completedOn: habitCompletions.completedOn,
    })
    .from(habitCompletions)
    .where(eq(habitCompletions.userId, userId))
    .orderBy(desc(habitCompletions.completedOn))

  const byHabit = new Map<number, string[]>()
  for (const r of all) {
    const ymd = ymdFromDb(r.completedOn)
    const arr = byHabit.get(r.habitId) ?? []
    arr.push(ymd)
    byHabit.set(r.habitId, arr)
  }

  const currentWeekKey = isoWeekKey(today)

  return rows.map((h): HabitWithStreak => {
    const dates = byHabit.get(h.id) ?? []
    if (h.cadence === 'daily') {
      return {
        ...h,
        currentStreak: countConsecutiveDays(dates, today),
        completedToday: dates.includes(today),
      }
    }
    const completedThisWeek = dates.filter((d) => isoWeekKey(d) === currentWeekKey).length
    return {
      ...h,
      currentStreak: countConsecutiveClosedWeeks(dates, h.weeklyTarget ?? 1, today),
      completedToday: dates.includes(today),
      completedThisWeek,
    }
  })
}

export type HabitWithCompletions = HabitRow & { completionDates: string[] }

export async function fetchHabitWithCompletions(
  db: DB,
  userId: string,
  habitId: number
): Promise<HabitWithCompletions | null> {
  const row = await db.query.habits.findFirst({ where: eq(habits.id, habitId) })
  if (!row || row.userId !== userId) return null
  const completions = await db
    .select({ completedOn: habitCompletions.completedOn })
    .from(habitCompletions)
    .where(eq(habitCompletions.habitId, habitId))
    .orderBy(desc(habitCompletions.completedOn))
    .limit(200)
  return { ...row, completionDates: completions.map((c) => ymdFromDb(c.completedOn)) }
}

export async function findActiveHabitByCaseInsensitiveName(
  db: DB,
  userId: string,
  name: string
): Promise<HabitRow | null> {
  const trimmed = name.trim()
  if (!trimmed) return null
  const rows = await db
    .select()
    .from(habits)
    .where(
      and(
        eq(habits.userId, userId),
        isNull(habits.archivedAt),
        sql`LOWER(${habits.name}) = LOWER(${trimmed})`
      )
    )
    .limit(1)
  return rows[0] ?? null
}

export async function hasMilestoneBeenAwarded(
  db: DB,
  userId: string,
  habitId: number,
  milestone: HabitMilestone
): Promise<boolean> {
  const rows = await db
    .select({ id: xpEvents.id })
    .from(xpEvents)
    .where(
      and(
        eq(xpEvents.userId, userId),
        eq(xpEvents.eventType, 'habit_streak'),
        sql`JSON_EXTRACT(${xpEvents.meta}, '$.habitId') = ${habitId}`,
        sql`JSON_EXTRACT(${xpEvents.meta}, '$.milestone') = ${milestone}`
      )
    )
    .limit(1)
  return rows.length > 0
}

function ymdFromDb(value: Date | string): string {
  if (typeof value === 'string') return value.slice(0, 10)
  const y = value.getUTCFullYear()
  const m = String(value.getUTCMonth() + 1).padStart(2, '0')
  const d = String(value.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}
