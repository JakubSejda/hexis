import type { MySql2Database } from 'drizzle-orm/mysql2'
import * as schema from '@/db/schema'
import { fetchMuscleVolumes } from './heatmap'

type DB = MySql2Database<typeof schema>

export async function fetchMuscleVolumesLast8Weeks(
  db: DB,
  userId: string
): Promise<Record<string, number>> {
  const { muscles } = await fetchMuscleVolumes(db, userId, 56)
  return muscles
}
