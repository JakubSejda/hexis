import { and, eq, isNull, like, or, sql } from 'drizzle-orm'
import { db } from '@/db/client'
import { exercises } from '@/db/schema'
import { getSessionUser } from '@/lib/auth-helpers'

export async function GET(req: Request) {
  const user = await getSessionUser()
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'content-type': 'application/json' },
    })
  }
  const url = new URL(req.url)
  const trained = url.searchParams.get('trained') === 'true'
  if (trained) {
    const [rows] = await db.execute(sql`
      SELECT e.id, e.name, e.type, COUNT(DISTINCT ss.id) AS set_count
      FROM exercises e
      JOIN session_sets ss ON ss.exercise_id = e.id
      JOIN sessions s ON s.id = ss.session_id
      WHERE s.user_id = ${user.id}
      GROUP BY e.id, e.name, e.type
      HAVING set_count >= 2
      ORDER BY set_count DESC
    `)
    return Response.json({ exercises: rows })
  }
  const q = url.searchParams.get('q')?.trim()
  const includeCatalog = url.searchParams.get('includeCatalog') !== 'false'

  const ownership = includeCatalog
    ? or(eq(exercises.userId, user.id), isNull(exercises.userId))
    : eq(exercises.userId, user.id)
  const where = q ? and(ownership, like(exercises.name, `%${q}%`)) : ownership

  const rows = await db.select().from(exercises).where(where).limit(50)
  return Response.json(rows)
}
