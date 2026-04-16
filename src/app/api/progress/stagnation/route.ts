import { db } from '@/db/client'
import { requireSessionUser } from '@/lib/auth-helpers'
import { fetchStagnatingExercises } from '@/lib/queries/stagnation'

export async function GET() {
  const user = await requireSessionUser()
  if (user instanceof Response) return user
  const exercises = await fetchStagnatingExercises(db, user.id, new Date())
  return Response.json({ exercises })
}
