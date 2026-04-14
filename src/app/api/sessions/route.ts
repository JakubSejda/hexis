import { z } from 'zod'
import { and, desc, eq, isNull, lt, sql } from 'drizzle-orm'
import { db } from '@/db/client'
import { sessions } from '@/db/schema'
import { getSessionUser } from '@/lib/auth-helpers'
import { checkAndFinishStaleSessions } from '@/lib/session-auto-finish'

const postSchema = z.object({
  planId: z.number().int().positive().nullable().optional(),
})

export async function POST(req: Request) {
  const user = await getSessionUser()
  if (!user) return unauth()
  const body = await req.json().catch(() => ({}))
  const parsed = postSchema.safeParse(body)
  if (!parsed.success) return badRequest(parsed.error)

  await checkAndFinishStaleSessions(user.id, db)

  const existing = await db.query.sessions.findFirst({
    where: and(eq(sessions.userId, user.id), isNull(sessions.finishedAt)),
  })
  if (existing) {
    return new Response(
      JSON.stringify({ error: 'Active session exists', activeSessionId: existing.id }),
      { status: 409, headers: { 'content-type': 'application/json' } }
    )
  }

  const [{ insertId }] = (await db.insert(sessions).values({
    userId: user.id,
    planId: parsed.data.planId ?? null,
    startedAt: new Date(),
  })) as unknown as [{ insertId: number }]

  return Response.json({ id: insertId }, { status: 201 })
}

export async function GET(req: Request) {
  const user = await getSessionUser()
  if (!user) return unauth()
  const url = new URL(req.url)
  const limit = Math.min(Number(url.searchParams.get('limit') ?? 20), 100)
  const cursor = Number(url.searchParams.get('cursor') ?? 0)

  const rows = await db
    .select({
      id: sessions.id,
      planId: sessions.planId,
      startedAt: sessions.startedAt,
      finishedAt: sessions.finishedAt,
      setCount: sql<number>`(SELECT COUNT(*) FROM session_sets WHERE session_sets.session_id = ${sessions.id})`,
      volumeKg: sql<number>`(SELECT COALESCE(SUM(weight_kg * reps), 0) FROM session_sets WHERE session_sets.session_id = ${sessions.id})`,
    })
    .from(sessions)
    .where(
      cursor > 0
        ? and(eq(sessions.userId, user.id), lt(sessions.id, cursor))
        : eq(sessions.userId, user.id)
    )
    .orderBy(desc(sessions.startedAt))
    .limit(limit + 1)

  const hasMore = rows.length > limit
  const items = hasMore ? rows.slice(0, limit) : rows
  const nextCursor = hasMore ? items[items.length - 1]!.id : null

  return Response.json({ items, nextCursor })
}

function unauth() {
  return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
}
function badRequest(err: unknown) {
  return new Response(JSON.stringify({ error: 'Invalid body', details: err }), { status: 400 })
}
