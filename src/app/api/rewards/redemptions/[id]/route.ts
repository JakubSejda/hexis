import { db } from '@/db/client'
import { rewardRedemptions } from '@/db/schema'
import { requireOwnership, requireSessionUser } from '@/lib/auth-helpers'
import { eq } from 'drizzle-orm'

type Params = { params: Promise<{ id: string }> }

export async function DELETE(_req: Request, { params }: Params) {
  const user = await requireSessionUser()
  if (user instanceof Response) return user
  const { id } = await params
  const redemptionId = Number(id)
  if (!Number.isFinite(redemptionId)) {
    return Response.json({ error: 'Invalid id' }, { status: 400 })
  }

  const owned = await requireOwnership(
    db.query.rewardRedemptions.findFirst({ where: eq(rewardRedemptions.id, redemptionId) }),
    user.id
  )
  if (owned instanceof Response) return owned

  await db.delete(rewardRedemptions).where(eq(rewardRedemptions.id, redemptionId))
  return new Response(null, { status: 204 })
}
