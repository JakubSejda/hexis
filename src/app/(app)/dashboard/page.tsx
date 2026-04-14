import { and, desc, eq, isNull } from 'drizzle-orm'
import { db } from '@/db/client'
import { sessions, plans } from '@/db/schema'
import { requireSessionUser } from '@/lib/auth-helpers'
import { redirect } from 'next/navigation'
import { getTotalXp } from '@/lib/xp'
import { xpToLevel, xpForNextLevel } from '@/lib/xp-events'
import { checkAndFinishStaleSessions } from '@/lib/session-auto-finish'
import Link from 'next/link'

export default async function DashboardPage() {
  const user = await requireSessionUser()
  if (user instanceof Response) redirect('/login')

  await checkAndFinishStaleSessions(user.id, db)

  const totalXp = await getTotalXp(db, user.id)
  const level = xpToLevel(totalXp)
  const nextThreshold = xpForNextLevel(level)

  const [active] = await db
    .select({ id: sessions.id, planName: plans.name, startedAt: sessions.startedAt })
    .from(sessions)
    .leftJoin(plans, eq(plans.id, sessions.planId))
    .where(and(eq(sessions.userId, user.id), isNull(sessions.finishedAt)))
    .limit(1)

  // streak = consecutive training days (ending today or yesterday)
  const last7 = await db
    .select({ startedAt: sessions.startedAt })
    .from(sessions)
    .where(eq(sessions.userId, user.id))
    .orderBy(desc(sessions.startedAt))
    .limit(30)
  const streak = computeStreak(last7.map((r) => r.startedAt))

  // next plan suggestion (rotation)
  const userPlans = await db.select().from(plans).where(eq(plans.userId, user.id))
  const lastFinished = await db
    .select({ planId: sessions.planId })
    .from(sessions)
    .where(eq(sessions.userId, user.id))
    .orderBy(desc(sessions.startedAt))
    .limit(1)
  const lastPlanId = lastFinished[0]?.planId ?? null
  const sortedPlans = userPlans.sort((a, b) => a.order - b.order)
  const lastIdx = sortedPlans.findIndex((p) => p.id === lastPlanId)
  const nextPlan = sortedPlans[(lastIdx + 1) % Math.max(sortedPlans.length, 1)] ?? null

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-[#6B7280]">
            {new Date().toLocaleDateString('cs-CZ', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
          </p>
          <h1 className="text-xl">Ahoj, {user.name ?? user.email}</h1>
        </div>
        <div className="text-right text-xs">
          <div className="text-lg font-bold text-[#10B981]">L{level}</div>
          <div className="text-[#6B7280]">
            {totalXp}/{nextThreshold} XP
          </div>
        </div>
      </div>
      <div className="rounded-lg border border-[#1F2733] p-3 text-center">
        <div className="text-2xl">{streak}</div>
        <div className="text-xs text-[#6B7280]">denni streak</div>
      </div>
      {active ? (
        <Link
          href={`/workout/${active.id}`}
          className="flex h-12 items-center justify-center rounded-lg bg-[#10B981] text-center font-semibold text-[#0A0E14]"
        >
          Pokracuj v {active.planName ?? 'treninku'} ›
        </Link>
      ) : nextPlan ? (
        <Link
          href="/workout"
          className="flex h-12 items-center justify-center rounded-lg bg-[#10B981] text-center font-semibold text-[#0A0E14]"
        >
          Zacit {nextPlan.name} ›
        </Link>
      ) : (
        <Link
          href="/workout"
          className="flex h-12 items-center justify-center rounded-lg border border-[#1F2733] text-center text-sm"
        >
          Do treninku
        </Link>
      )}
    </div>
  )
}

function computeStreak(startedAts: Date[]): number {
  if (startedAts.length === 0) return 0
  const days = new Set(startedAts.map((d) => d.toISOString().slice(0, 10)))
  let streak = 0
  const cursor = new Date()
  cursor.setHours(0, 0, 0, 0)
  const todayKey = cursor.toISOString().slice(0, 10)
  if (!days.has(todayKey)) {
    cursor.setDate(cursor.getDate() - 1)
    if (!days.has(cursor.toISOString().slice(0, 10))) return 0
  }
  while (days.has(cursor.toISOString().slice(0, 10))) {
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}
