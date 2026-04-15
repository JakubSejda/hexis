import { and, asc, eq, gte, lte } from 'drizzle-orm'
import type { MySql2Database } from 'drizzle-orm/mysql2'
import * as schema from '@/db/schema'
import { nutritionDays } from '@/db/schema'

type DB = MySql2Database<typeof schema>

export type NutritionRow = typeof nutritionDays.$inferSelect

export type NutritionUpsertInput = {
  date: string // YYYY-MM-DD
  kcalActual?: number | null
  proteinG?: number | null
  carbsG?: number | null
  fatG?: number | null
  sugarG?: number | null
  note?: string | null
}

export async function fetchRange(
  db: DB,
  userId: string,
  fromDate: string,
  toDate: string
): Promise<NutritionRow[]> {
  return db
    .select()
    .from(nutritionDays)
    .where(
      and(
        eq(nutritionDays.userId, userId),
        gte(nutritionDays.date, new Date(fromDate)),
        lte(nutritionDays.date, new Date(toDate))
      )
    )
    .orderBy(asc(nutritionDays.date))
}

/** First and last date of `monthYYYY-MM` formatted as YYYY-MM-DD. */
export function monthBounds(month: string): { from: string; to: string } {
  const [y, m] = month.split('-').map(Number)
  if (!y || !m) throw new Error(`invalid month: ${month}`)
  const from = `${month}-01`
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate()
  const to = `${month}-${String(last).padStart(2, '0')}`
  return { from, to }
}

export async function upsertDay(
  db: DB,
  userId: string,
  input: NutritionUpsertInput
): Promise<{ affectedRows: number; id: number }> {
  const intCols = ['kcalActual', 'proteinG', 'carbsG', 'fatG', 'sugarG'] as const
  const values: Record<string, unknown> = { userId, date: input.date }
  for (const k of intCols) {
    if (k in input) values[k] = input[k] ?? null
  }
  if ('note' in input) values.note = input.note ?? null
  const updateSet = Object.fromEntries(
    Object.entries(values).filter(([k]) => k !== 'userId' && k !== 'date')
  )
  const result = (await db
    .insert(nutritionDays)
    .values(values as typeof nutritionDays.$inferInsert)
    .onDuplicateKeyUpdate({ set: updateSet })) as unknown as [
    { affectedRows: number; insertId: number },
  ]
  const affectedRows = result[0].affectedRows
  let id = result[0].insertId
  if (id === 0) {
    const existing = await db.query.nutritionDays.findFirst({
      where: and(eq(nutritionDays.userId, userId), eq(nutritionDays.date, new Date(input.date))),
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
    .delete(nutritionDays)
    .where(and(eq(nutritionDays.id, id), eq(nutritionDays.userId, userId)))) as unknown as [
    { affectedRows: number },
  ]
  return { deleted: result[0].affectedRows > 0 }
}
