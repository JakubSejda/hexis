import { and, desc, eq, isNull } from 'drizzle-orm'
import { db } from '@/db/client'
import { sessions, plans } from '@/db/schema'
import { requireSessionUser } from '@/lib/auth-helpers'
import { redirect } from 'next/navigation'
import { getTotalXp } from '@/lib/xp'
import { xpToLevel } from '@/lib/xp-events'
import { checkAndFinishStaleSessions } from '@/lib/session-auto-finish'
import { Container, Stack } from '@/components/ui'
import { StatusWindow } from '@/components/dashboard/StatusWindow'
import { TodayQuest } from '@/components/dashboard/TodayQuest'
import { LifeAreaCard } from '@/components/dashboard/LifeAreaCard'
import { WeekPeek } from '@/components/dashboard/WeekPeek'
import { RegionHeader } from '@/components/dashboard/RegionHeader'
import { StagnationWarning } from '@/components/dashboard/StagnationWarning'
import { MuscleWidget } from '@/components/dashboard/MuscleWidget'
import { fetchWorkoutStreak } from '@/lib/queries/workout-streak'
import {
  fetchSessionsLast8Weeks,
  fetchExerciseCountsByPlan,
  fetchActiveSessionProgress,
} from '@/lib/queries/dashboard-sessions'
import { fetchRange as fetchMeasurements } from '@/lib/queries/measurements'
import { fetchRange as fetchNutrition } from '@/lib/queries/nutrition'
import { fetchStagnatingExercises } from '@/lib/queries/stagnation'
import { fetchMuscleVolumes } from '@/lib/queries/heatmap'
import { toWeekStart, weekRange } from '@/lib/week'
import { levelToTierMeta, xpToProgress } from '@/lib/tiers'
import { resolveTodayQuest } from '@/lib/today-quest'
import {
  resolveTrainingCard,
  resolveNutritionCard,
  resolveProgressCard,
  resolveStatsCard,
} from '@/lib/dashboard-life-areas'
import { resolveWeekPeek } from '@/lib/week-peek'

export default async function DashboardPage() {
  const user = await requireSessionUser()
  if (user instanceof Response) redirect('/login')

  await checkAndFinishStaleSessions(user.id, db)

  const today = new Date()
  const todayDate = today.toISOString().slice(0, 10)
  const thisWeekStart = toWeekStart(today)
  const last8Weeks = weekRange(today, 8)

  const totalXp = await getTotalXp(db, user.id)
  const level = xpToLevel(totalXp)
  const tierMeta = levelToTierMeta(level)
  const progress = xpToProgress(totalXp, level)

  const [active] = await db
    .select({ id: sessions.id, planId: sessions.planId, planName: plans.name })
    .from(sessions)
    .leftJoin(plans, eq(plans.id, sessions.planId))
    .where(and(eq(sessions.userId, user.id), isNull(sessions.finishedAt)))
    .limit(1)

  const streak = await fetchWorkoutStreak(db, user.id)
  const sessionsLast8Weeks = await fetchSessionsLast8Weeks(db, user.id, today)

  const userPlans = await db.select().from(plans).where(eq(plans.userId, user.id))
  const sortedPlans = [...userPlans].sort((a, b) => a.order - b.order)

  const lastFinishedRow = await db
    .select({ planId: sessions.planId, finishedAt: sessions.finishedAt })
    .from(sessions)
    .where(and(eq(sessions.userId, user.id)))
    .orderBy(desc(sessions.startedAt))
    .limit(1)
  const lastFinished = lastFinishedRow[0]?.finishedAt
    ? { planId: lastFinishedRow[0].planId, finishedAt: lastFinishedRow[0].finishedAt }
    : null

  const exerciseCounts = await fetchExerciseCountsByPlan(
    db,
    sortedPlans.map((p) => p.id)
  )

  const activeProgress = active
    ? await fetchActiveSessionProgress(db, active.id, active.planId ?? null)
    : null

  const quest = resolveTodayQuest({
    activeSession:
      active && activeProgress
        ? {
            id: active.id,
            planName: active.planName ?? 'trénink',
            completed: activeProgress.completed,
            total: activeProgress.total,
          }
        : null,
    lastFinished,
    plans: sortedPlans,
    exerciseCounts,
    today,
  })

  const [measurementsRows, recentNutrition] = await Promise.all([
    fetchMeasurements(db, user.id, last8Weeks[0]!, last8Weeks[last8Weeks.length - 1]!),
    (async () => {
      const fromDate = new Date(today)
      fromDate.setUTCDate(fromDate.getUTCDate() - 30)
      const fromDateStr = fromDate.toISOString().slice(0, 10)
      return fetchNutrition(db, user.id, fromDateStr, todayDate)
    })(),
  ])

  const stagnation = await fetchStagnatingExercises(db, user.id, today)
  const heatmapData = await fetchMuscleVolumes(db, user.id, 7)

  const byWeek = new Map(measurementsRows.map((m) => [m.weekStart, m]))
  const thisWeekRow = byWeek.get(thisWeekStart) ?? null
  const todayRow = recentNutrition.find((d) => d.date === todayDate) ?? null

  const weightSeries = last8Weeks.map((w) => {
    const v = byWeek.get(w)?.weightKg
    return v == null ? null : Number(v)
  })

  const trainingCard = resolveTrainingCard(sessionsLast8Weeks, today)
  const nutritionCard = resolveNutritionCard(
    todayRow
      ? {
          kcalActual: todayRow.kcalActual ?? null,
          targetKcal: thisWeekRow?.targetKcal ?? null,
        }
      : null,
    thisWeekRow ? { targetKcal: thisWeekRow.targetKcal ?? null } : null
  )
  const progressCard = resolveProgressCard(weightSeries)
  const statsCard = resolveStatsCard(level, totalXp)
  const weekPeekDays = resolveWeekPeek(sessionsLast8Weeks, today)

  return (
    <Container size="full">
      <Stack gap={6} className="py-4">
        <StatusWindow
          level={level}
          currentXp={progress.current}
          xpToLevel={progress.max}
          xpForNext={progress.max - progress.current}
          tier={tierMeta.tier}
          tierName={tierMeta.name}
          tierColor={tierMeta.color}
          streak={streak}
        />
        <TodayQuest quest={quest} />
        <section>
          <RegionHeader>Life Areas</RegionHeader>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <LifeAreaCard
              label="TRAINING"
              value={trainingCard.value}
              secondary={trainingCard.secondary}
              visual={trainingCard.visual}
              empty={trainingCard.empty}
              href="/training"
            />
            <LifeAreaCard
              label="NUTRITION"
              value={nutritionCard.value}
              secondary={nutritionCard.secondary}
              visual={nutritionCard.visual}
              empty={nutritionCard.empty}
              href="/nutrition"
            />
            <LifeAreaCard
              label="PROGRESS"
              value={progressCard.value}
              secondary={progressCard.secondary}
              visual={progressCard.visual}
              empty={progressCard.empty}
              href="/progress"
            />
            <LifeAreaCard
              label="STATS"
              value={statsCard.value}
              secondary={statsCard.secondary}
              visual={statsCard.visual}
              empty={statsCard.empty}
              href="/stats"
            />
          </div>
        </section>
        <section>
          <RegionHeader>Muscle Volume</RegionHeader>
          <MuscleWidget data={heatmapData.muscles} maxVolume={heatmapData.maxVolume} />
        </section>
        <section>
          <RegionHeader>This Week</RegionHeader>
          <WeekPeek days={weekPeekDays} />
        </section>
        {stagnation.length > 0 && <StagnationWarning items={stagnation} />}
      </Stack>
    </Container>
  )
}
