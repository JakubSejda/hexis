import { z } from 'zod'
import { and, asc, eq, inArray } from 'drizzle-orm'
import { db } from '@/db/client'
import { sessions, sessionSets, planExercises, exercises, plans, xpEvents } from '@/db/schema'
import { getSessionUser, requireOwnership } from '@/lib/auth-helpers'
import { awardXp } from '@/lib/xp'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser()
  if (!user) return unauth()
  const { id } = await params
  const sessionId = Number(id)
  if (!Number.isFinite(sessionId)) return notFound()

  const owned = await requireOwnership(
    db.query.sessions.findFirst({ where: eq(sessions.id, sessionId) }),
    user.id
  )
  if (owned instanceof Response) return owned

  const plan = owned.planId
    ? await db.query.plans.findFirst({ where: eq(plans.id, owned.planId) })
    : null

  const planRows = owned.planId
    ? await db
        .select({
          exerciseId: planExercises.exerciseId,
          order: planExercises.order,
          targetSets: planExercises.targetSets,
          repMin: planExercises.repMin,
          repMax: planExercises.repMax,
          restSec: planExercises.restSec,
          name: exercises.name,
          type: exercises.type,
        })
        .from(planExercises)
        .leftJoin(exercises, eq(exercises.id, planExercises.exerciseId))
        .where(eq(planExercises.planId, owned.planId!))
        .orderBy(asc(planExercises.order))
    : []

  const sets = await db
    .select()
    .from(sessionSets)
    .where(eq(sessionSets.sessionId, sessionId))
    .orderBy(asc(sessionSets.completedAt))

  // Collect ad-hoc exercises (in sets but not in plan)
  const planIds = new Set(planRows.map((r) => r.exerciseId))
  const adhocIds = [...new Set(sets.map((s) => s.exerciseId).filter((eid) => !planIds.has(eid)))]
  const adhocExercises =
    adhocIds.length > 0
      ? await db.select().from(exercises).where(inArray(exercises.id, adhocIds))
      : []

  const allExercises = [
    ...planRows.map((r) => ({
      exerciseId: r.exerciseId,
      name: r.name ?? '—',
      type: r.type,
      order: r.order,
      targetSets: r.targetSets,
      repMin: r.repMin,
      repMax: r.repMax,
      restSec: r.restSec,
      sets: sets
        .filter((s) => s.exerciseId === r.exerciseId)
        .map(({ id, setIndex, weightKg, reps, rpe, completedAt }) => ({
          id,
          setIndex,
          weightKg,
          reps,
          rpe,
          completedAt,
        })),
    })),
    ...adhocExercises.map((ex, idx) => ({
      exerciseId: ex.id,
      name: ex.name,
      type: ex.type,
      order: 100 + idx,
      targetSets: 0,
      repMin: 0,
      repMax: 0,
      restSec: 0,
      sets: sets
        .filter((s) => s.exerciseId === ex.id)
        .map(({ id, setIndex, weightKg, reps, rpe, completedAt }) => ({
          id,
          setIndex,
          weightKg,
          reps,
          rpe,
          completedAt,
        })),
    })),
  ]

  return Response.json({
    id: owned.id,
    planId: owned.planId,
    planSlug: plan?.slug ?? null,
    planName: plan?.name ?? null,
    startedAt: owned.startedAt,
    finishedAt: owned.finishedAt,
    note: owned.note,
    exercises: allExercises,
  })
}

// ── PATCH ───────────────────────────────────────────────────────────

const patchSchema = z.object({
  finishedAt: z.boolean().optional(),
  note: z.string().max(2000).nullable().optional(),
})

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser()
  if (!user) return unauth()
  const { id } = await params
  const sessionId = Number(id)
  const body = await req.json().catch(() => null)
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: 'Invalid body' }), { status: 400 })
  }

  const owned = await requireOwnership(
    db.query.sessions.findFirst({ where: eq(sessions.id, sessionId) }),
    user.id
  )
  if (owned instanceof Response) return owned

  const updates: Record<string, unknown> = {}
  let xpAward: Awaited<ReturnType<typeof awardXp>> | null = null

  if (parsed.data.note !== undefined) updates.note = parsed.data.note
  if (parsed.data.finishedAt === true && !owned.finishedAt) {
    updates.finishedAt = new Date()
  }

  if (Object.keys(updates).length > 0) {
    await db.update(sessions).set(updates).where(eq(sessions.id, sessionId))
  }

  if (updates.finishedAt) {
    xpAward = await awardXp({
      event: 'session_complete',
      db,
      userId: user.id,
      sessionId,
    })
  }

  return Response.json({
    id: sessionId,
    finishedAt: (updates.finishedAt as Date | undefined) ?? owned.finishedAt,
    note: (parsed.data.note ?? owned.note) as string | null,
    xpDelta: xpAward?.xpDelta ?? 0,
    newTotalXp: xpAward?.newTotalXp ?? null,
    levelUp: xpAward?.levelUp ?? false,
  })
}

// ── DELETE ───────────────────────────────────────────────────────────

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser()
  if (!user) return unauth()
  const { id } = await params
  const sessionId = Number(id)

  const owned = await requireOwnership(
    db.query.sessions.findFirst({ where: eq(sessions.id, sessionId) }),
    user.id
  )
  if (owned instanceof Response) return owned

  // Reversal: sum all xp_events with this sessionId -> append one event with -sum
  const events = await db
    .select()
    .from(xpEvents)
    .where(and(eq(xpEvents.userId, user.id), eq(xpEvents.sessionId, sessionId)))
  const netXp = events.reduce((acc, e) => acc + e.xpDelta, 0)
  if (netXp !== 0) {
    await db.insert(xpEvents).values({
      userId: user.id,
      eventType: 'session_complete',
      xpDelta: -netXp,
      sessionId,
      meta: { reason: 'session_deleted' },
    })
  }

  await db.delete(sessionSets).where(eq(sessionSets.sessionId, sessionId))
  await db.delete(sessions).where(eq(sessions.id, sessionId))

  return new Response(null, { status: 204 })
}

// ── helpers ─────────────────────────────────────────────────────────

function unauth() {
  return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
}
function notFound() {
  return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 })
}
