import { and, desc, eq, isNull } from 'drizzle-orm'
import { db } from '@/db/client'
import { sessions, plans } from '@/db/schema'
import { requireSessionUser } from '@/lib/auth-helpers'
import { redirect } from 'next/navigation'
import { getTotalXp } from '@/lib/xp'
import { xpToLevel } from '@/lib/xp-events'
import { checkAndFinishStaleSessions } from '@/lib/session-auto-finish'
import Link from 'next/link'
import { Container, Stack } from '@/components/ui/layout'
import { Card } from '@/components/ui'
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
import { StagnationWarning } from '@/components/dashboard/StagnationWarning'
import { fetchStagnatingExercises } from '@/lib/queries/stagnation'
import { MuscleWidget } from '@/components/dashboard/MuscleWidget'
import { fetchMuscleVolumes } from '@/lib/queries/heatmap'
import { ChevronRight } from 'lucide-react'

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

  const stagnation = await fetchStagnatingExercises(db, user.id, new Date())
  const heatmapData = await fetchMuscleVolumes(db, user.id, 7)

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
    <Container size="full">
      <Stack gap={4} className="py-4">
        <AvatarHero
          level={level}
          totalXp={totalXp}
          userName={user.name ?? null}
          userEmail={user.email ?? ''}
        />
        <Card padding="sm" className="text-center">
          <div className="text-2xl">{streak}</div>
          <div className="text-muted text-xs">denni streak</div>
        </Card>
        <StagnationWarning items={stagnation} />
        {active ? (
          <Link
            href={`/workout/${active.id}`}
            className="bg-primary text-background flex h-12 items-center justify-center gap-1 rounded-lg text-center font-semibold"
          >
            Pokracuj v {active.planName ?? 'treninku'}
            <ChevronRight size={14} aria-hidden />
          </Link>
        ) : nextPlan ? (
          <Link
            href="/workout"
            className="bg-primary text-background flex h-12 items-center justify-center gap-1 rounded-lg text-center font-semibold"
          >
            Zacit {nextPlan.name}
            <ChevronRight size={14} aria-hidden />
          </Link>
        ) : (
          <Link
            href="/workout"
            className="border-border flex h-12 items-center justify-center rounded-lg border text-center text-sm"
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
        <MuscleWidget data={heatmapData.muscles} maxVolume={heatmapData.maxVolume} />
      </Stack>
    </Container>
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
