import { sql } from 'drizzle-orm'
import { db } from '@/db/client'
import { requireSessionUser } from '@/lib/auth-helpers'

export async function GET() {
  const user = await requireSessionUser()
  if (user instanceof Response) return user

  const [rows] = await db.execute(sql`
    SELECT
      ss.id,
      ss.session_id,
      e.name AS exercise_name,
      ss.set_index,
      ss.weight_kg,
      ss.reps,
      ss.rpe,
      ss.completed_at
    FROM session_sets ss
    JOIN sessions s ON s.id = ss.session_id
    JOIN exercises e ON e.id = ss.exercise_id
    WHERE s.user_id = ${user.id}
    ORDER BY ss.completed_at ASC
  `)

  return Response.json({ sets: rows })
}
