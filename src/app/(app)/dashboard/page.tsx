import { and, desc, eq, isNull } from 'drizzle-orm'
import { db } from '@/db/client'
import { sessions, plans } from '@/db/schema'
import { requireSessionUser } from '@/lib/auth-helpers'
import { redirect } from 'next/navigation'
import { getTotalXp } from '@/lib/xp'
import { xpToLevel } from '@/lib/xp-events'
import { checkAndFinishStaleSessions } from '@/lib/session-auto-finish'
import Link from 'next/link'
import { AvatarHero } from '@/components/dashboard/AvatarHero'
import { TodayNutritionCard } from '@/components/dashboard/TodayNutritionCard'
import { WeekMeasurementCard } from '@/components/dashboard/WeekMeasurementCard'
import { NutritionStreakCard } from '@/components/dashboard/NutritionStreakCard'
import { fetchRange as fetchMeasurements } from '@/lib/queries/measurements'
import { fetchRange as fetchNutrition } from '@/lib/queries/nutrition'
import { getMacros } from '@/lib/queries/user-prefs'
import { calcStreak } from '@/lib/nutrition-streak'
import { classifyDay, type DayClass } from '@/lib/nutrition-classify'
import { toWeekStart, weekRange } from '@/lib/week'

export default async function DashboardPage() {
  const user = await requireSessionUser()
  if (user instanceof Response) redirect('/login')

  await checkAndFinishStaleSessions(user.id, db)

  const totalXp = await getTotalXp(db, user.id)
  const level = xpToLevel(totalXp)

  const [active] = await db
    .select({ id: sessions.id, planName: plans.name, startedAt: sessions.startedAt })
    .from(sessions)
    .leftJoin(plans, eq(plans.id, sessions.planId))
    .where(and(eq(sessions.userId, user.id), isNull(sessions.finishedAt)))
    .limit(1)

  const last7 = await db
    .select({ startedAt: sessions.startedAt })
    .from(sessions)
    .where(eq(sessions.userId, user.id))
    .orderBy(desc(sessions.startedAt))
    .limit(30)
  const streak = computeStreak(last7.map((r) => r.startedAt))

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

  // M3 — Nutrition + Measurements widgets
  const today = new Date()
  const todayDate = today.toISOString().slice(0, 10)
  const thisWeekStart = toWeekStart(today)
  const last8Weeks = weekRange(today, 8)
  const [measurementsRows, macros, recentNutrition] = await Promise.all([
    fetchMeasurements(db, user.id, last8Weeks[0]!, last8Weeks[last8Weeks.length - 1]!),
    getMacros(db, user.id),
    (async () => {
      const fromDate = new Date(today)
      fromDate.setUTCDate(fromDate.getUTCDate() - 30)
      const fromDateStr = fromDate.toISOString().slice(0, 10)
      return fetchNutrition(db, user.id, fromDateStr, todayDate)
    })(),
  ])

  const byWeek = new Map(measurementsRows.map((m) => [m.weekStart, m]))
  const thisWeekRow = byWeek.get(thisWeekStart) ?? null
  const prevWeekStart = last8Weeks[last8Weeks.length - 2] ?? null
  const prevWeekRow = prevWeekStart ? (byWeek.get(prevWeekStart) ?? null) : null
  const todayRow = recentNutrition.find((d) => d.date === todayDate) ?? null

  const dayClasses: { date: string; class: DayClass }[] = recentNutrition.map((d) => {
    const t = byWeek.get(toWeekStart(new Date(d.date + 'T00:00:00Z')))
    return {
      date: d.date,
      class: classifyDay({ kcalActual: d.kcalActual, targetKcal: t?.targetKcal ?? null }),
    }
  })
  const nutritionStreak = calcStreak({ today, days: dayClasses })

  const weekDots: { date: string; klass: DayClass }[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(thisWeekStart + 'T00:00:00Z')
    d.setUTCDate(d.getUTCDate() + i)
    const date = d.toISOString().slice(0, 10)
    const found = dayClasses.find((c) => c.date === date)
    weekDots.push({ date, klass: found?.class ?? 'empty' })
  }

  const weightSeries = last8Weeks.map((w) => {
    const v = byWeek.get(w)?.weightKg
    return v == null ? null : Number(v)
  })

  const measurementToTargets = (r: (typeof measurementsRows)[number] | null) =>
    r
      ? {
          targetKcal: r.targetKcal ?? null,
          targetProteinG: r.targetProteinG ?? null,
          targetCarbsG: r.targetCarbsG ?? null,
          targetFatG: r.targetFatG ?? null,
          targetSugarG: r.targetSugarG ?? null,
        }
      : null

  const measurementToValues = (r: (typeof measurementsRows)[number] | null) =>
    r
      ? {
          weightKg: r.weightKg ? Number(r.weightKg) : null,
          waistCm: r.waistCm ? Number(r.waistCm) : null,
          chestCm: r.chestCm ? Number(r.chestCm) : null,
          thighCm: r.thighCm ? Number(r.thighCm) : null,
          bicepsCm: r.bicepsCm ? Number(r.bicepsCm) : null,
        }
      : null

  return (
    <div className="flex flex-col gap-4 p-4">
      <AvatarHero
        level={level}
        totalXp={totalXp}
        userName={user.name ?? null}
        userEmail={user.email ?? ''}
      />
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

      <TodayNutritionCard
        today={
          todayRow
            ? {
                kcalActual: todayRow.kcalActual ?? null,
                proteinG: todayRow.proteinG ?? null,
                carbsG: todayRow.carbsG ?? null,
                fatG: todayRow.fatG ?? null,
                sugarG: todayRow.sugarG ?? null,
              }
            : null
        }
        targets={measurementToTargets(thisWeekRow)}
        trackedMacros={macros}
      />
      <WeekMeasurementCard
        thisWeek={measurementToValues(thisWeekRow)}
        prevWeek={measurementToValues(prevWeekRow)}
        weightSeries={weightSeries}
      />
      <NutritionStreakCard streak={nutritionStreak} thisWeekDays={weekDots} />
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
