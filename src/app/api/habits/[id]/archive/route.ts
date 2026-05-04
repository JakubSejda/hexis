import { db } from '@/db/client'
import { habits } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { requireSessionUser, requireOwnership } from '@/lib/auth-helpers'

type Ctx = { params: Promise<{ id: string }> }

export async function POST(_req: Request, ctx: Ctx) {
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

  if (!row.archivedAt) {
    await db.update(habits).set({ archivedAt: new Date() }).where(eq(habits.id, id))
  }
  const fresh = await db.query.habits.findFirst({ where: eq(habits.id, id) })
  return Response.json({ habit: fresh })
}
