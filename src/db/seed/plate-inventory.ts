import type { MySql2Database } from 'drizzle-orm/mysql2'
import { eq } from 'drizzle-orm'
import * as schema from '../schema'
import { plateInventories } from '../schema'

export const DEFAULT_PLATE_INVENTORY = {
  barKg: '20',
  plates: [
    { weightKg: 25, pairs: 2 },
    { weightKg: 20, pairs: 2 },
    { weightKg: 15, pairs: 2 },
    { weightKg: 10, pairs: 2 },
    { weightKg: 5, pairs: 2 },
    { weightKg: 2.5, pairs: 2 },
    { weightKg: 1.25, pairs: 2 },
  ],
} as const

export async function seedPlateInventory(db: MySql2Database<typeof schema>, userId: string) {
  const existing = await db.query.plateInventories.findFirst({
    where: eq(plateInventories.userId, userId),
  })
  if (existing) return // idempotent
  await db.insert(plateInventories).values({
    userId,
    barKg: DEFAULT_PLATE_INVENTORY.barKg,
    plates: [...DEFAULT_PLATE_INVENTORY.plates],
  })
}
