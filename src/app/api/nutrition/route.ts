import { z } from 'zod'
import { db } from '@/db/client'
import { getSessionUser } from '@/lib/auth-helpers'
import { fetchRange, monthBounds, upsertDay } from '@/lib/queries/nutrition'
import { awardXp } from '@/lib/xp'

export async function GET(req: Request) {
  const user = await getSessionUser()
  if (!user) return unauth()
  const url = new URL(req.url)
  const all = url.searchParams.get('all') === 'true'
  if (all) {
    const { fetchAllNutrition } = await import('@/lib/queries/export-helpers')
    const items = await fetchAllNutrition(db, user.id)
    return Response.json({ items })
  }
  const month = url.searchParams.get('month')
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return new Response(JSON.stringify({ error: 'month=YYYY-MM required' }), { status: 400 })
  }
  const { from, to } = monthBounds(month)
  const items = await fetchRange(db, user.id, from, to)
  return Response.json({ items })
}

const putSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  kcalActual: z.number().int().min(0).max(15000).nullable().optional(),
  proteinG: z.number().int().min(0).max(2000).nullable().optional(),
  carbsG: z.number().int().min(0).max(2000).nullable().optional(),
  fatG: z.number().int().min(0).max(1000).nullable().optional(),
  sugarG: z.number().int().min(0).max(2000).nullable().optional(),
  note: z.string().max(500).nullable().optional(),
})

export async function PUT(req: Request) {
  const user = await getSessionUser()
  if (!user) return unauth()
  const body = await req.json().catch(() => ({}))
  const parsed = putSchema.safeParse(body)
  if (!parsed.success) return badRequest(parsed.error)
  const { affectedRows, id } = await upsertDay(db, user.id, parsed.data)
  if (affectedRows === 1) {
    const xp = await awardXp({
      event: 'nutrition_logged',
      db,
      userId: user.id,
      meta: { nutritionId: id },
    })
    return Response.json(
      {
        id,
        xpDelta: xp.xpDelta,
        levelUp: xp.levelUp,
        tierUp: xp.tierUp,
        levelAfter: xp.levelAfter,
        tierAfter: xp.tierAfter,
      },
      { status: 201 }
    )
  }
  return Response.json({ id, xpDelta: 0 }, { status: 200 })
}

function unauth() {
  return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
}

function badRequest(err: unknown) {
  return new Response(JSON.stringify({ error: 'Invalid body', details: err }), { status: 400 })
}
