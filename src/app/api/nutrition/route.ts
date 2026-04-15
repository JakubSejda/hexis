import { db } from '@/db/client'
import { getSessionUser } from '@/lib/auth-helpers'
import { fetchRange, monthBounds } from '@/lib/queries/nutrition'

export async function GET(req: Request) {
  const user = await getSessionUser()
  if (!user) return unauth()
  const url = new URL(req.url)
  const month = url.searchParams.get('month')
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return new Response(JSON.stringify({ error: 'month=YYYY-MM required' }), { status: 400 })
  }
  const { from, to } = monthBounds(month)
  const items = await fetchRange(db, user.id, from, to)
  return Response.json({ items })
}

function unauth() {
  return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
}
