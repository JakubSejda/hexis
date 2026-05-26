import { eq } from 'drizzle-orm'
import type { MySql2Database } from 'drizzle-orm/mysql2'
import * as schema from '@/db/schema'
import { users } from '@/db/schema'

type DB = MySql2Database<typeof schema>

export type UserProfile = {
  name: string | null
  birthDate: string | null
  gender: 'male' | 'female' | 'other' | null
  heightCm: number | null
  goalKg: string | null
  goalText: string | null
  startedAt: string | null
}

export async function fetchProfile(db: DB, userId: string): Promise<UserProfile | null> {
  const rows = await db
    .select({
      name: users.name,
      birthDate: users.birthDate,
      gender: users.gender,
      heightCm: users.heightCm,
      goalKg: users.goalKg,
      goalText: users.goalText,
      startedAt: users.startedAt,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)
  return rows[0] ?? null
}
