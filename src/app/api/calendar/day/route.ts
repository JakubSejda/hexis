import { db } from '@/db/client'
import { requireSessionUser } from '@/lib/auth-helpers'
import { fetchDayDetail } from '@/lib/queries/calendar'

const YMD = /^\d{4}-\d{2}-\d{2}$/

export async function GET(req: Request) {
  const user = await requireSessionUser()
  if (user instanceof Response) return user

  const url = new URL(req.url)
  const date = url.searchParams.get('date')
  if (!date || !YMD.test(date)) {
    return Response.json({ error: 'Invalid date' }, { status: 400 })
  }

  const detail = await fetchDayDetail(db, user.id, date)
  return Response.json(detail)
}
