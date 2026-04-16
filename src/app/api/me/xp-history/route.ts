import { db } from '@/db/client'
import { requireSessionUser } from '@/lib/auth-helpers'
import { fetchXpHistory } from '@/lib/queries/xp-history'

export async function GET(req: Request) {
  const user = await requireSessionUser()
  if (user instanceof Response) return user

  const url = new URL(req.url)
  const rawDays = Number(url.searchParams.get('days') ?? 30)
  const days = Number.isFinite(rawDays) && rawDays > 0 ? Math.min(Math.floor(rawDays), 365) : 30

  const history = await fetchXpHistory(db, user.id, days)
  return Response.json(history)
}
