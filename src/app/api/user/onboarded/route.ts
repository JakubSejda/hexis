import { and, eq, isNull } from 'drizzle-orm'
import { db } from '@/db/client'
import { requireSessionUser } from '@/lib/auth-helpers'
import { users } from '@/db/schema'

export async function POST() {
  const user = await requireSessionUser()
  if (user instanceof Response) return user

  // Idempotent: only the first call stamps the timestamp.
  await db
    .update(users)
    .set({ onboardedAt: new Date() })
    .where(and(eq(users.id, user.id), isNull(users.onboardedAt)))

  return Response.json({ ok: true })
}
