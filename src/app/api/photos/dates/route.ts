import { db } from '@/db/client'
import { requireSessionUser } from '@/lib/auth-helpers'
import { getDistinctDates } from '@/lib/queries/photos'

export async function GET() {
  const user = await requireSessionUser()
  if (user instanceof Response) return user

  const dates = await getDistinctDates(db, user.id)
  return Response.json({ dates })
}
