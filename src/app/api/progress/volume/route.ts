import { db } from '@/db/client'
import { requireSessionUser } from '@/lib/auth-helpers'
import { fetchVolumeProgress } from '@/lib/queries/volume-progress'

export async function GET(req: Request) {
  const user = await requireSessionUser()
  if (user instanceof Response) return user

  const url = new URL(req.url)
  const days = Math.min(Number(url.searchParams.get('days') ?? 90), 365)
  const weeks = await fetchVolumeProgress(db, user.id, days)

  return Response.json({ weeks })
}
