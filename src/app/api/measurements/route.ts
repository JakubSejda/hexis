import { db } from '@/db/client'
import { getSessionUser } from '@/lib/auth-helpers'
import { fetchRange, fetchOlder } from '@/lib/queries/measurements'
import { weekRange } from '@/lib/week'

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

function unauth() {
  return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
}
