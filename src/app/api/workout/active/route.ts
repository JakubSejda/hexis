import { and, desc, eq, isNull } from 'drizzle-orm'
import { db } from '@/db/client'
import { sessions, plans } from '@/db/schema'
import { getSessionUser } from '@/lib/auth-helpers'
import { checkAndFinishStaleSessions } from '@/lib/session-auto-finish'

export async function GET() {
  const user = await getSessionUser()
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'content-type': 'application/json' },
    })
  }
  await checkAndFinishStaleSessions(user.id, db)
  const active = await db
    .select({
      id: sessions.id,
      planId: sessions.planId,
      startedAt: sessions.startedAt,
      planSlug: plans.slug,
      planName: plans.name,
    })
    .from(sessions)
    .leftJoin(plans, eq(plans.id, sessions.planId))
    .where(and(eq(sessions.userId, user.id), isNull(sessions.finishedAt)))
    .orderBy(desc(sessions.startedAt))
    .limit(1)

  return Response.json({ active: active[0] ?? null })
}
