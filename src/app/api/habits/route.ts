import { db } from '@/db/client'
import { habits } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { requireSessionUser } from '@/lib/auth-helpers'
import { habitCreateSchema } from '@/lib/validators/habits'
import {
  fetchActiveHabitsWithStreak,
  findActiveHabitByCaseInsensitiveName,
} from '@/lib/queries/habits'
import { resolveUserToday } from '@/lib/habits/tz'

export async function GET(req: Request) {
  const user = await requireSessionUser()
  if (user instanceof Response) return user
  const today = resolveUserToday(req.headers.get('X-User-Tz-Offset'))
  const list = await fetchActiveHabitsWithStreak(db, user.id, today)
  return Response.json({ habits: list })
}

export async function POST(req: Request) {
  const user = await requireSessionUser()
  if (user instanceof Response) return user
  const body = await req.json().catch(() => null)
  const parsed = habitCreateSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: 'Invalid body', issues: parsed.error.issues }, { status: 400 })
  }
  const { name, cadence, weeklyTarget, weight } = parsed.data
  const existing = await findActiveHabitByCaseInsensitiveName(db, user.id, name)
  if (existing) {
    return Response.json({ error: 'Duplicate name' }, { status: 409 })
  }
  const [insert] = await db.insert(habits).values({
    userId: user.id,
    name,
    cadence,
    weeklyTarget: cadence === 'weekly' ? (weeklyTarget ?? null) : null,
    weight,
  })
  const row = await db.query.habits.findFirst({ where: eq(habits.id, insert.insertId) })
  return Response.json({ habit: row }, { status: 201 })
}
