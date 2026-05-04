import { db } from '@/db/client'
import { habits } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { requireSessionUser, requireOwnership } from '@/lib/auth-helpers'
import { habitPatchSchema } from '@/lib/validators/habits'
import { findActiveHabitByCaseInsensitiveName } from '@/lib/queries/habits'

type Ctx = { params: Promise<{ id: string }> }

export async function PATCH(req: Request, ctx: Ctx) {
  const user = await requireSessionUser()
  if (user instanceof Response) return user
  const { id: idStr } = await ctx.params
  const id = Number(idStr)
  if (!Number.isInteger(id) || id <= 0) {
    return Response.json({ error: 'Invalid id' }, { status: 400 })
  }
  const row = await requireOwnership(
    db.query.habits.findFirst({ where: eq(habits.id, id) }),
    user.id
  )
  if (row instanceof Response) return row

  const body = await req.json().catch(() => null)
  const parsed = habitPatchSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: 'Invalid body', issues: parsed.error.issues }, { status: 400 })
  }

  if (parsed.data.name && parsed.data.name.toLowerCase() !== row.name.toLowerCase()) {
    const dup = await findActiveHabitByCaseInsensitiveName(db, user.id, parsed.data.name)
    if (dup && dup.id !== row.id) {
      return Response.json({ error: 'Duplicate name' }, { status: 409 })
    }
  }

  const updates: Record<string, unknown> = {}
  if (parsed.data.name !== undefined) updates.name = parsed.data.name
  if (parsed.data.weight !== undefined) updates.weight = parsed.data.weight
  if (parsed.data.archivedAt !== undefined) {
    updates.archivedAt = parsed.data.archivedAt === null ? null : new Date(parsed.data.archivedAt)
  }
  await db.update(habits).set(updates).where(eq(habits.id, id))
  const fresh = await db.query.habits.findFirst({ where: eq(habits.id, id) })
  return Response.json({ habit: fresh })
}
