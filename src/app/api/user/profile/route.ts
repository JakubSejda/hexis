import { eq } from 'drizzle-orm'
import { db } from '@/db/client'
import { requireSessionUser } from '@/lib/auth-helpers'
import { users } from '@/db/schema'
import { fetchProfile } from '@/lib/queries/profile'
import { profileUpdateSchema } from '@/lib/validators/profile'

export async function GET() {
  const user = await requireSessionUser()
  if (user instanceof Response) return user
  const profile = await fetchProfile(db, user.id)
  return Response.json({ profile: profile ?? null })
}

export async function PUT(req: Request) {
  const user = await requireSessionUser()
  if (user instanceof Response) return user

  const raw = await req.json().catch(() => null)
  if (raw === null) {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const parsed = profileUpdateSchema.safeParse(raw)
  if (!parsed.success) {
    return Response.json({ error: 'Invalid body', issues: parsed.error.issues }, { status: 400 })
  }
  const data = parsed.data
  const update: Record<string, unknown> = {}
  if ('name' in data) update.name = data.name ?? null
  if ('birthDate' in data) update.birthDate = data.birthDate ?? null
  if ('gender' in data) update.gender = data.gender ?? null
  if ('heightCm' in data) update.heightCm = data.heightCm ?? null
  if ('goalKg' in data)
    update.goalKg = data.goalKg === null || data.goalKg === undefined ? null : String(data.goalKg)
  if ('goalText' in data) update.goalText = data.goalText ?? null
  if ('startedAt' in data) update.startedAt = data.startedAt ?? null

  if (Object.keys(update).length > 0) {
    await db.update(users).set(update).where(eq(users.id, user.id))
  }

  const profile = await fetchProfile(db, user.id)
  return Response.json({ profile })
}
