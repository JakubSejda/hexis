import { db } from '@/db/client'
import { requireSessionUser } from '@/lib/auth-helpers'
import { fetchStrengthProgress } from '@/lib/queries/strength-progress'
import { exercises } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(req: Request) {
  const user = await requireSessionUser()
  if (user instanceof Response) return user

  const url = new URL(req.url)
  const exerciseId = Number(url.searchParams.get('exerciseId'))
  if (!exerciseId || !Number.isFinite(exerciseId)) {
    return new Response(JSON.stringify({ error: 'exerciseId required' }), { status: 400 })
  }
  const days = Math.min(Number(url.searchParams.get('days') ?? 90), 365)

  const exercise = await db.query.exercises.findFirst({
    where: eq(exercises.id, exerciseId),
    columns: { id: true, name: true },
  })
  const dataPoints = await fetchStrengthProgress(db, user.id, exerciseId, days)

  return Response.json({
    exerciseId,
    exerciseName: exercise?.name ?? 'Unknown',
    dataPoints,
  })
}
