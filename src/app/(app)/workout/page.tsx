import { desc, eq, sql } from 'drizzle-orm'
import { db } from '@/db/client'
import { plans, sessions } from '@/db/schema'
import { requireSessionUser } from '@/lib/auth-helpers'
import { redirect } from 'next/navigation'
import { ResumeBanner } from '@/components/workout/ResumeBanner'
import { PlanPicker } from '@/components/workout/PlanPicker'
import { SessionHistoryList } from '@/components/workout/SessionHistoryList'
import { checkAndFinishStaleSessions } from '@/lib/session-auto-finish'

export default async function WorkoutPage() {
  const user = await requireSessionUser()
  if (user instanceof Response) redirect('/login')
  await checkAndFinishStaleSessions(user.id, db)

  const userPlans = await db.select().from(plans).where(eq(plans.userId, user.id))
  const sortedPlans = userPlans.sort((a, b) => a.order - b.order)

  const lastFinished = await db
    .select({ planId: sessions.planId })
    .from(sessions)
    .where(eq(sessions.userId, user.id))
    .orderBy(desc(sessions.startedAt))
    .limit(1)
  const lastIdx = sortedPlans.findIndex((p) => p.id === (lastFinished[0]?.planId ?? -1))
  const recommended = sortedPlans[(lastIdx + 1) % Math.max(sortedPlans.length, 1)] ?? null

  const history = await db
    .select({
      id: sessions.id,
      planId: sessions.planId,
      planSlug: plans.slug,
      planName: plans.name,
      startedAt: sessions.startedAt,
      finishedAt: sessions.finishedAt,
      setCount: sql<number>`(SELECT COUNT(*) FROM session_sets WHERE session_sets.session_id = ${sessions.id})`,
      volumeKg: sql<number>`(SELECT COALESCE(SUM(weight_kg * reps), 0) FROM session_sets WHERE session_sets.session_id = ${sessions.id})`,
    })
    .from(sessions)
    .leftJoin(plans, eq(plans.id, sessions.planId))
    .where(eq(sessions.userId, user.id))
    .orderBy(desc(sessions.startedAt))
    .limit(10)

  return (
    <div className="flex flex-col gap-4 p-4">
      <ResumeBanner />
      <h1 className="text-xl">Vyber trenink</h1>
      <PlanPicker plans={sortedPlans} recommendedId={recommended?.id ?? null} />
      <h2 className="text-muted mt-4 text-sm">Historie</h2>
      <SessionHistoryList
        items={history.map((h) => ({
          ...h,
          startedAt: h.startedAt.toISOString(),
          finishedAt: h.finishedAt?.toISOString() ?? null,
          volumeKg: Number(h.volumeKg),
          setCount: Number(h.setCount),
        }))}
      />
    </div>
  )
}
