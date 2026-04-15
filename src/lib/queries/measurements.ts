import { and, asc, desc, eq, gte, lte, sql } from 'drizzle-orm'
import type { MySql2Database } from 'drizzle-orm/mysql2'
import * as schema from '@/db/schema'
import { measurements } from '@/db/schema'

type DB = MySql2Database<typeof schema>

export type MeasurementRow = typeof measurements.$inferSelect

export type MeasurementUpsertInput = {
  weekStart: string // YYYY-MM-DD
  weightKg?: number | null
  waistCm?: number | null
  chestCm?: number | null
  thighCm?: number | null
  bicepsCm?: number | null
  targetKcal?: number | null
  targetProteinG?: number | null
  targetCarbsG?: number | null
  targetFatG?: number | null
  targetSugarG?: number | null
  note?: string | null
}

/** Returns rows in ascending weekStart order. */
export async function fetchRange(
  db: DB,
  userId: string,
  fromWeek: string,
  toWeek: string
): Promise<MeasurementRow[]> {
  return db
    .select()
    .from(measurements)
    .where(
      and(
        eq(measurements.userId, userId),
        gte(measurements.weekStart, new Date(fromWeek)),
        lte(measurements.weekStart, new Date(toWeek))
      )
    )
    .orderBy(asc(measurements.weekStart))
}

/** Returns up to `limit` weeks ending at `beforeWeek` (exclusive), descending order. */
export async function fetchOlder(
  db: DB,
  userId: string,
  beforeWeek: string,
  limit: number
): Promise<MeasurementRow[]> {
  return db
    .select()
    .from(measurements)
    .where(and(eq(measurements.userId, userId), sql`${measurements.weekStart} < ${beforeWeek}`))
    .orderBy(desc(measurements.weekStart))
    .limit(limit)
}

/**
 * Upserts a measurement row keyed on (userId, weekStart).
 * Returns { affectedRows, id } — affectedRows === 1 on insert, 2 on update.
 */
export async function upsertWeek(
  db: DB,
  userId: string,
  input: MeasurementUpsertInput
): Promise<{ affectedRows: number; id: number }> {
  const decimalCols = ['weightKg', 'waistCm', 'chestCm', 'thighCm', 'bicepsCm'] as const
  const values: Record<string, unknown> = { userId, weekStart: input.weekStart }
  for (const k of decimalCols) {
    if (k in input) values[k] = input[k] == null ? null : String(input[k])
  }
  const intCols = [
    'targetKcal',
    'targetProteinG',
    'targetCarbsG',
    'targetFatG',
    'targetSugarG',
  ] as const
  for (const k of intCols) {
    if (k in input) values[k] = input[k] ?? null
  }
  if ('note' in input) values.note = input.note ?? null
  const updateSet = Object.fromEntries(
    Object.entries(values).filter(([k]) => k !== 'userId' && k !== 'weekStart')
  )
  const result = (await db
    .insert(measurements)
    .values(values as typeof measurements.$inferInsert)
    .onDuplicateKeyUpdate({ set: updateSet })) as unknown as [
    { affectedRows: number; insertId: number },
  ]
  const affectedRows = result[0].affectedRows
  let id = result[0].insertId
  if (id === 0) {
    const existing = await db.query.measurements.findFirst({
      where: and(
        eq(measurements.userId, userId),
        eq(measurements.weekStart, new Date(input.weekStart))
      ),
      columns: { id: true },
    })
    id = existing?.id ?? 0
  }
  return { affectedRows, id }
}

export async function deleteById(
  db: DB,
  userId: string,
  id: number
): Promise<{ deleted: boolean }> {
  const result = (await db
    .delete(measurements)
    .where(and(eq(measurements.id, id), eq(measurements.userId, userId)))) as unknown as [
    { affectedRows: number },
  ]
  return { deleted: result[0].affectedRows > 0 }
}
