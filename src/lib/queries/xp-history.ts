import { sql } from 'drizzle-orm'
import type { MySql2Database } from 'drizzle-orm/mysql2'
import * as schema from '@/db/schema'
import type { XpEventType } from '@/lib/xp-events'

type DB = MySql2Database<typeof schema>

export type DailyXp = {
  date: string
  totalXp: number
  byEvent: Partial<Record<XpEventType, number>>
}

export type XpHistory = {
  daily: DailyXp[]
  total: number
  byEventTotal: Partial<Record<XpEventType, { xp: number; count: number }>>
}

type RawRow = {
  date: string
  event_type: XpEventType
  sum: string | number
  cnt: string | number
}

/**
 * Fetches XP history aggregated by day and event type.
 * `days` controls how far back to look (default 30).
 */
export async function fetchXpHistory(db: DB, userId: string, days: number): Promise<XpHistory> {
  const since = new Date()
  since.setDate(since.getDate() - days)
  const sinceStr = since.toISOString().slice(0, 10)

  const [rows] = await db.execute(sql`
    SELECT
      DATE(created_at) AS date,
      event_type,
      SUM(xp_delta) AS sum,
      COUNT(*) AS cnt
    FROM xp_events
    WHERE user_id = ${userId}
      AND created_at >= ${sinceStr}
    GROUP BY DATE(created_at), event_type
    ORDER BY date ASC
  `)

  const dayMap = new Map<string, DailyXp>()
  const byEventTotal: XpHistory['byEventTotal'] = {}
  let total = 0

  for (const row of rows as unknown as RawRow[]) {
    const date = typeof row.date === 'string' ? row.date : String(row.date)
    const xp = Number(row.sum)
    const cnt = Number(row.cnt)

    // Per-day aggregation
    let day = dayMap.get(date)
    if (!day) {
      day = { date, totalXp: 0, byEvent: {} }
      dayMap.set(date, day)
    }
    day.totalXp += xp
    day.byEvent[row.event_type] = (day.byEvent[row.event_type] ?? 0) + xp

    // Grand totals
    total += xp
    const et = byEventTotal[row.event_type]
    if (et) {
      et.xp += xp
      et.count += cnt
    } else {
      byEventTotal[row.event_type] = { xp, count: cnt }
    }
  }

  return {
    daily: Array.from(dayMap.values()),
    total,
    byEventTotal,
  }
}
