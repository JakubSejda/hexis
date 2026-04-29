import { db } from '@/db/client'
import { rewards } from '@/db/schema'
import { requireSessionUser } from '@/lib/auth-helpers'
import { rewardCreateSchema } from '@/lib/validators/rewards'
import {
  fetchActiveRewards,
  fetchRedemptionHistory,
  fetchRewardsBalance,
} from '@/lib/queries/rewards'
import { eq } from 'drizzle-orm'

export async function GET() {
  const user = await requireSessionUser()
  if (user instanceof Response) return user
  const [balance, rewardsList, history] = await Promise.all([
    fetchRewardsBalance(db, user.id),
    fetchActiveRewards(db, user.id),
    fetchRedemptionHistory(db, user.id),
  ])
  return Response.json({ balance, rewards: rewardsList, history })
}

export async function POST(req: Request) {
  const user = await requireSessionUser()
  if (user instanceof Response) return user
  const body = await req.json().catch(() => null)
  const parsed = rewardCreateSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: 'Invalid body', issues: parsed.error.issues }, { status: 400 })
  }
  const { name, costXp, description } = parsed.data
  const [insert] = await db.insert(rewards).values({
    userId: user.id,
    name,
    costXp,
    description: description ?? null,
  })
  const row = await db.query.rewards.findFirst({ where: eq(rewards.id, insert.insertId) })
  return Response.json(row, { status: 201 })
}
