import { db } from '@/db/client'
import { rewards, rewardRedemptions } from '@/db/schema'
import { requireOwnership, requireSessionUser } from '@/lib/auth-helpers'
import { redeemSchema } from '@/lib/validators/rewards'
import { fetchRewardsBalance } from '@/lib/queries/rewards'
import { eq } from 'drizzle-orm'

type Params = { params: Promise<{ id: string }> }

export async function POST(req: Request, { params }: Params) {
  const user = await requireSessionUser()
  if (user instanceof Response) return user
  const { id } = await params
  const rewardId = Number(id)
  if (!Number.isFinite(rewardId)) {
    return Response.json({ error: 'Invalid id' }, { status: 400 })
  }

  const body = await req.json().catch(() => ({}))
  const parsed = redeemSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: 'Invalid body', issues: parsed.error.issues }, { status: 400 })
  }

  const owned = await requireOwnership(
    db.query.rewards.findFirst({ where: eq(rewards.id, rewardId) }),
    user.id
  )
  if (owned instanceof Response) return owned
  if (owned.archivedAt) {
    return Response.json({ error: 'Reward archived' }, { status: 404 })
  }

  const balance = await fetchRewardsBalance(db, user.id)
  if (balance.balanceXp < owned.costXp) {
    return Response.json(
      {
        error: 'Insufficient balance',
        missing: owned.costXp - balance.balanceXp,
      },
      { status: 402 }
    )
  }

  const [insert] = await db.insert(rewardRedemptions).values({
    userId: user.id,
    rewardId,
    costXp: owned.costXp,
    note: parsed.data.note ?? null,
  })
  const redemption = await db.query.rewardRedemptions.findFirst({
    where: eq(rewardRedemptions.id, insert.insertId),
  })
  const newBalance = await fetchRewardsBalance(db, user.id)
  return Response.json({ redemption, balance: newBalance }, { status: 201 })
}
