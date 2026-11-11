import { and, count, eq, gte, isNotNull, lte } from 'drizzle-orm'
import type { MySql2Database } from 'drizzle-orm/mysql2'
import * as schema from '@/db/schema'
import { measurements, nutritionDays, sessions } from '@/db/schema'
import { fetchLifetimeTotals } from '@/lib/bio-lifetime'
import { fetchActiveHabitsWithStreak } from '@/lib/queries/habits'
import { toWeekStart } from '@/lib/week'
import type { AttributeInputs } from '@/lib/attributes'

type DB = MySql2Database<typeof schema>

const ymd = (d: Date) => d.toISOString().slice(0, 10)

function daysAgo(today: Date, n: number): Date {
  const d = new Date(today)
  d.setUTCDate(d.getUTCDate() - n)
  return d
}

/** Everything `computeAttributes` needs, in four small queries. */
export async function fetchAttributeInputs(
  db: DB,
  userId: string,
  today: Date,
  userToday: string
): Promise<AttributeInputs> {
  const [lifetime, [nutrition], [weigh], [recent], habits] = await Promise.all([
    fetchLifetimeTotals(db, userId),
    db
      .select({ n: count() })
      .from(nutritionDays)
      .where(
        and(
          eq(nutritionDays.userId, userId),
          gte(nutritionDays.date, ymd(daysAgo(today, 29))),
          lte(nutritionDays.date, ymd(today))
        )
      ),
    db
      .select({ n: count() })
      .from(measurements)
      .where(
        and(
          eq(measurements.userId, userId),
          isNotNull(measurements.weightKg),
          gte(measurements.weekStart, toWeekStart(daysAgo(today, 7 * 7)))
        )
      ),
    db
      .select({ n: count() })
      .from(sessions)
      .where(and(eq(sessions.userId, userId), gte(sessions.startedAt, daysAgo(today, 28)))),
    fetchActiveHabitsWithStreak(db, userId, userToday),
  ])

  return {
    liftedKg: lifetime.liftedKg,
    sets: lifetime.sets,
    nutritionDays30: Number(nutrition?.n ?? 0),
    weighWeeks8: Number(weigh?.n ?? 0),
    sessions28: Number(recent?.n ?? 0),
    bestHabitStreak: habits.reduce((m, h) => Math.max(m, h.currentStreak), 0),
  }
}
