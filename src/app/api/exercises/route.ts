import { and, eq, isNull, like, or } from 'drizzle-orm'
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
  const q = url.searchParams.get('q')?.trim()
  const includeCatalog = url.searchParams.get('includeCatalog') !== 'false'

  const ownership = includeCatalog
    ? or(eq(exercises.userId, user.id), isNull(exercises.userId))
    : eq(exercises.userId, user.id)
  const where = q ? and(ownership, like(exercises.name, `%${q}%`)) : ownership

  const rows = await db.select().from(exercises).where(where).limit(50)
  return Response.json(rows)
}
