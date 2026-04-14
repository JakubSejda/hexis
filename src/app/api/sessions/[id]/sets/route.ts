import { z } from 'zod'
import { and, desc, eq, ne } from 'drizzle-orm'
import { db } from '@/db/client'
import { sessions, sessionSets } from '@/db/schema'
import { getSessionUser, requireOwnership } from '@/lib/auth-helpers'
import { awardXp } from '@/lib/xp'
import { estimate1RM } from '@/lib/1rm'
import { suggestNextSet } from '@/lib/progression'

const postSchema = z.object({
  exerciseId: z.number().int().positive(),
  setIndex: z.number().int().min(0).max(50),
  weightKg: z.number().min(0).max(999).nullable(),
  reps: z.number().int().min(0).max(100).nullable(),
  rpe: z.number().int().min(1).max(10).nullable().optional(),
})

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser()
  if (!user) return unauth()
  const { id } = await params
  const sessionId = Number(id)
  const body = await req.json().catch(() => null)
  const parsed = postSchema.safeParse(body)
  if (!parsed.success) return badRequest()

  const owned = await requireOwnership(
    db.query.sessions.findFirst({ where: eq(sessions.id, sessionId) }),
    user.id
  )
  if (owned instanceof Response) return owned
  if (owned.finishedAt) {
    return new Response(JSON.stringify({ error: 'Session finished' }), { status: 409 })
  }

  const { exerciseId, setIndex, weightKg, reps, rpe } = parsed.data

  const [{ insertId }] = (await db.insert(sessionSets).values({
    sessionId,
    exerciseId,
    setIndex,
    weightKg: weightKg !== null ? String(weightKg) : null,
    reps: reps ?? null,
    rpe: rpe ?? null,
  })) as unknown as [{ insertId: number }]

  const xpSet = await awardXp({
    event: 'set_logged',
    db,
    userId: user.id,
    sessionId,
  })

  // PR detection
  let xpPr: Awaited<ReturnType<typeof awardXp>> | null = null
  if (weightKg !== null && reps !== null && reps > 0) {
    const newEst = estimate1RM(weightKg, reps)
    const priorSets = await db
      .select({
        weightKg: sessionSets.weightKg,
        reps: sessionSets.reps,
      })
      .from(sessionSets)
      .innerJoin(sessions, eq(sessions.id, sessionSets.sessionId))
      .where(
        and(
          eq(sessions.userId, user.id),
          eq(sessionSets.exerciseId, exerciseId),
          ne(sessionSets.id, insertId)
        )
      )
    const priorMax = priorSets.reduce((max, s) => {
      const v = estimate1RM(Number(s.weightKg ?? 0), s.reps ?? 0)
      return v > max ? v : max
    }, 0)
    if (newEst > priorMax) {
      xpPr = await awardXp({
        event: 'pr_achieved',
        db,
        userId: user.id,
        sessionId,
        meta: { exerciseId, estimated1RM: newEst },
      })
    }
  }

  // Recompute nextSuggestion for client
  const currentSets = await db
    .select()
    .from(sessionSets)
    .where(and(eq(sessionSets.sessionId, sessionId), eq(sessionSets.exerciseId, exerciseId)))
    .orderBy(desc(sessionSets.completedAt))

  const nextSuggestion = suggestNextSet({
    history: [],
    planExercise: null,
    currentSessionSets: currentSets.map((s) => ({
      setIndex: s.setIndex,
      weightKg: s.weightKg !== null ? Number(s.weightKg) : null,
      reps: s.reps,
      rpe: s.rpe,
    })),
  })

  const totalXpDelta = xpSet.xpDelta + (xpPr?.xpDelta ?? 0)
  const newTotalXp = xpPr?.newTotalXp ?? xpSet.newTotalXp
  const levelUp = xpSet.levelUp || (xpPr?.levelUp ?? false)

  return Response.json(
    {
      id: insertId,
      completedAt: new Date().toISOString(),
      xpDelta: totalXpDelta,
      newTotalXp,
      levelUp,
      nextSuggestion,
    },
    { status: 201 }
  )
}

function unauth() {
  return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
}
function badRequest() {
  return new Response(JSON.stringify({ error: 'Invalid body' }), { status: 400 })
}
