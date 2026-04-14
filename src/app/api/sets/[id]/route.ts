import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { db } from '@/db/client'
import { sessionSets, sessions } from '@/db/schema'
import { getSessionUser } from '@/lib/auth-helpers'
import { reverseXp } from '@/lib/xp'

const patchSchema = z.object({
  weightKg: z.number().min(0).max(999).nullable().optional(),
  reps: z.number().int().min(0).max(100).nullable().optional(),
  rpe: z.number().int().min(1).max(10).nullable().optional(),
})

async function loadOwnedSet(setId: number, userId: string) {
  const row = await db
    .select({
      id: sessionSets.id,
      sessionId: sessionSets.sessionId,
      exerciseId: sessionSets.exerciseId,
      weightKg: sessionSets.weightKg,
      reps: sessionSets.reps,
      rpe: sessionSets.rpe,
      sessionUserId: sessions.userId,
    })
    .from(sessionSets)
    .innerJoin(sessions, eq(sessions.id, sessionSets.sessionId))
    .where(eq(sessionSets.id, setId))
    .limit(1)
  if (!row[0] || row[0].sessionUserId !== userId) return null
  return row[0]
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser()
  if (!user) return new Response(null, { status: 401 })
  const { id } = await params
  const setId = Number(id)
  const body = await req.json().catch(() => null)
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: 'Invalid body' }), { status: 400 })
  }

  const set = await loadOwnedSet(setId, user.id)
  if (!set) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 })

  const updates: Record<string, unknown> = {}
  if (parsed.data.weightKg !== undefined) {
    updates.weightKg = parsed.data.weightKg !== null ? String(parsed.data.weightKg) : null
  }
  if (parsed.data.reps !== undefined) updates.reps = parsed.data.reps
  if (parsed.data.rpe !== undefined) updates.rpe = parsed.data.rpe

  if (Object.keys(updates).length > 0) {
    await db.update(sessionSets).set(updates).where(eq(sessionSets.id, setId))
  }
  return Response.json({ id: setId, ...parsed.data })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser()
  if (!user) return new Response(null, { status: 401 })
  const { id } = await params
  const setId = Number(id)
  const set = await loadOwnedSet(setId, user.id)
  if (!set) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 })

  await db.delete(sessionSets).where(eq(sessionSets.id, setId))

  await reverseXp({
    event: 'set_logged',
    db,
    userId: user.id,
    sessionId: set.sessionId,
  })

  return new Response(null, { status: 204 })
}
