import { db } from '@/db/client'
import { rewards, rewardRedemptions } from '@/db/schema'
import { requireOwnership, requireSessionUser } from '@/lib/auth-helpers'
import { rewardPatchSchema } from '@/lib/validators/rewards'
import { and, eq } from 'drizzle-orm'

type Params = { params: Promise<{ id: string }> }

export async function PATCH(req: Request, { params }: Params) {
  const user = await requireSessionUser()
  if (user instanceof Response) return user
  const { id } = await params
  const rewardId = Number(id)
  if (!Number.isFinite(rewardId)) {
    return Response.json({ error: 'Invalid id' }, { status: 400 })
  }
  const body = await req.json().catch(() => null)
  const parsed = rewardPatchSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: 'Invalid body', issues: parsed.error.issues }, { status: 400 })
  }

  const owned = await requireOwnership(
    db.query.rewards.findFirst({ where: eq(rewards.id, rewardId) }),
    user.id
  )
  if (owned instanceof Response) return owned

  const update: Record<string, unknown> = {}
  if (parsed.data.name !== undefined) update.name = parsed.data.name
  if (parsed.data.costXp !== undefined) update.costXp = parsed.data.costXp
  if (parsed.data.description !== undefined) update.description = parsed.data.description
  if (parsed.data.archivedAt !== undefined) {
    update.archivedAt = parsed.data.archivedAt === null ? null : new Date(parsed.data.archivedAt)
  }

  await db.update(rewards).set(update).where(eq(rewards.id, rewardId))
  const row = await db.query.rewards.findFirst({ where: eq(rewards.id, rewardId) })
  return Response.json(row)
}

export async function DELETE(_req: Request, { params }: Params) {
  const user = await requireSessionUser()
  if (user instanceof Response) return user
  const { id } = await params
  const rewardId = Number(id)
  if (!Number.isFinite(rewardId)) {
    return Response.json({ error: 'Invalid id' }, { status: 400 })
  }

  const owned = await requireOwnership(
    db.query.rewards.findFirst({ where: eq(rewards.id, rewardId) }),
    user.id
  )
  if (owned instanceof Response) return owned

  const existing = await db.query.rewardRedemptions.findFirst({
    where: and(eq(rewardRedemptions.userId, user.id), eq(rewardRedemptions.rewardId, rewardId)),
  })
  if (existing) {
    return Response.json({ error: 'Reward has redemptions; archive instead' }, { status: 409 })
  }

  await db.delete(rewards).where(eq(rewards.id, rewardId))
  return new Response(null, { status: 204 })
}
