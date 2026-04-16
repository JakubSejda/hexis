import { db } from '@/db/client'
import { requireSessionUser } from '@/lib/auth-helpers'
import { fetchMuscleVolumes } from '@/lib/queries/heatmap'

export async function GET(req: Request) {
  const user = await requireSessionUser()
  if (user instanceof Response) return user
  const url = new URL(req.url)
  const days = Math.min(Number(url.searchParams.get('days') ?? 7), 365)
  const result = await fetchMuscleVolumes(db, user.id, days)
  return Response.json(result)
}
