import { z } from 'zod'
import { db } from '@/db/client'
import { getSessionUser } from '@/lib/auth-helpers'
import { fetchRange, fetchOlder, upsertWeek } from '@/lib/queries/measurements'
import { toWeekStart, weekRange } from '@/lib/week'
import { awardXp } from '@/lib/xp'

export async function GET(req: Request) {
  const user = await getSessionUser()
  if (!user) return unauth()
  const url = new URL(req.url)
  const beforeWeek = url.searchParams.get('beforeWeek')
  const limit = Math.min(Number(url.searchParams.get('limit') ?? 8), 52)

  if (beforeWeek) {
    const items = await fetchOlder(db, user.id, beforeWeek, limit)
    return Response.json({ items })
  }
  const weeks = weekRange(new Date(), limit)
  const items = await fetchRange(db, user.id, weeks[0]!, weeks[weeks.length - 1]!)
  return Response.json({ items })
}

const putSchema = z.object({
  weekStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  weightKg: z.number().positive().nullable().optional(),
  waistCm: z.number().positive().nullable().optional(),
  chestCm: z.number().positive().nullable().optional(),
  thighCm: z.number().positive().nullable().optional(),
  bicepsCm: z.number().positive().nullable().optional(),
  targetKcal: z.number().int().min(0).max(10000).nullable().optional(),
  targetProteinG: z.number().int().min(0).max(1000).nullable().optional(),
  targetCarbsG: z.number().int().min(0).max(1000).nullable().optional(),
  targetFatG: z.number().int().min(0).max(1000).nullable().optional(),
  targetSugarG: z.number().int().min(0).max(1000).nullable().optional(),
  note: z.string().max(500).nullable().optional(),
})

export async function PUT(req: Request) {
  const user = await getSessionUser()
  if (!user) return unauth()
  const body = await req.json().catch(() => ({}))
  const parsed = putSchema.safeParse(body)
  if (!parsed.success) return badRequest(parsed.error)

  if (toWeekStart(new Date(`${parsed.data.weekStart}T00:00:00Z`)) !== parsed.data.weekStart) {
    return badRequest({ message: 'weekStart must be a Monday' })
  }

  const { affectedRows, id } = await upsertWeek(db, user.id, parsed.data)
  let xpDelta = 0
  if (affectedRows === 1) {
    const xp = await awardXp({
      event: 'measurement_added',
      db,
      userId: user.id,
      meta: { measurementId: id },
    })
    xpDelta = xp.xpDelta
  }
  return Response.json({ id, xpDelta }, { status: affectedRows === 1 ? 201 : 200 })
}

function unauth() {
  return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
}

function badRequest(err: unknown) {
  return new Response(JSON.stringify({ error: 'Invalid body', details: err }), { status: 400 })
}
