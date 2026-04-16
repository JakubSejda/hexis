import { eq, asc } from 'drizzle-orm'
import type { MySql2Database } from 'drizzle-orm/mysql2'
import * as schema from '@/db/schema'
import { measurements, nutritionDays } from '@/db/schema'

type DB = MySql2Database<typeof schema>

export async function fetchAllMeasurements(db: DB, userId: string) {
  return db
    .select()
    .from(measurements)
    .where(eq(measurements.userId, userId))
    .orderBy(asc(measurements.weekStart))
}

export async function fetchAllNutrition(db: DB, userId: string) {
  return db
    .select()
    .from(nutritionDays)
    .where(eq(nutritionDays.userId, userId))
    .orderBy(asc(nutritionDays.date))
}
