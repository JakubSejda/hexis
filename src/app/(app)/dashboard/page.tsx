import { and, desc, eq, isNull } from 'drizzle-orm'
import { headers } from 'next/headers'
import { db } from '@/db/client'
import { sessions, plans, users } from '@/db/schema'
import { requireSessionUser } from '@/lib/auth-helpers'
import { redirect } from 'next/navigation'
import { fetchActiveHabitsWithStreak } from '@/lib/queries/habits'
import { resolveUserToday } from '@/lib/habits/tz'
import { TodaysChecksCard } from '@/components/dashboard/TodaysChecksCard'
import { getTotalXp } from '@/lib/xp'
import { XP_DELTAS, xpToLevel } from '@/lib/xp-events'
import { checkAndFinishStaleSessions } from '@/lib/session-auto-finish'
import { Container, Stack } from '@/components/ui'
import { PlayerHero } from '@/components/dashboard/PlayerHero'
import { QuestCard } from '@/components/dashboard/QuestCard'
import { SideQuests, type SideQuest } from '@/components/dashboard/SideQuests'
import { WeekPeek } from '@/components/dashboard/WeekPeek'
import { RegionHeader } from '@/components/dashboard/RegionHeader'
import { StagnationWarning } from '@/components/dashboard/StagnationWarning'
import { TelemetryRow } from '@/components/dashboard/TelemetryRow'
import { fetchWorkoutStreak } from '@/lib/queries/workout-streak'
import {
  fetchSessionsLast8Weeks,
  fetchExerciseCountsByPlan,
  fetchActiveSessionProgress,
  fetchQuestObjectives,
} from '@/lib/queries/dashboard-sessions'
import { fetchRange as fetchMeasurements } from '@/lib/queries/measurements'
import { fetchRange as fetchNutrition } from '@/lib/queries/nutrition'
import { fetchStagnatingExercises } from '@/lib/queries/stagnation'
import { fetchRewardsBalance } from '@/lib/queries/rewards'
import { fetchLifetimeTotals } from '@/lib/bio-lifetime'
import { listPhotos } from '@/lib/queries/photos'
import { toWeekStart } from '@/lib/week'
import { levelToTierMeta, xpToProgress } from '@/lib/tiers'
import { resolveTodayQuest } from '@/lib/today-quest'
import { resolveWeekPeek } from '@/lib/week-peek'

const nf = new Intl.NumberFormat('cs-CZ')

function daysSince(startedAt: string | null, today: Date): number | null {
  if (!startedAt) return null
  const start = new Date(`${startedAt}T00:00:00Z`)
  const diff = Math.floor((today.getTime() - start.getTime()) / 86_400_000)
  return diff >= 0 ? diff + 1 : null
}

export default async function DashboardPage() {
  const user = await requireSessionUser()
  if (user instanceof Response) redirect('/login')

  const [userRow] = await db
    .select({ onboardedAt: users.onboardedAt, startedAt: users.startedAt })
    .from(users)
    .where(eq(users.id, user.id))
  if (userRow && !userRow.onboardedAt) redirect('/onboarding')

  await checkAndFinishStaleSessions(user.id, db)

  const today = new Date()
  const todayDate = today.toISOString().slice(0, 10)
  const thisWeekStart = toWeekStart(today)

  const totalXp = await getTotalXp(db, user.id)
  const rewardsBalance = await fetchRewardsBalance(db, user.id)
  const lifetime = await fetchLifetimeTotals(db, user.id)
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

  const questPlanId =
    quest.kind === 'active'
      ? (active?.planId ?? null)
      : quest.kind === 'scheduled'
        ? quest.planId
        : null
  const objectives =
    questPlanId != null
      ? await fetchQuestObjectives(
          db,
          questPlanId,
          quest.kind === 'active' ? quest.sessionId : null
        )
      : []

  const [measurementsRows, todayNutrition, latestPhoto] = await Promise.all([
    fetchMeasurements(db, user.id, thisWeekStart, thisWeekStart),
    fetchNutrition(db, user.id, todayDate, todayDate),
    listPhotos(db, user.id, { limit: 1 }),
  ])
  const lastPhotoAt = latestPhoto.items[0]?.takenAt.slice(0, 10) ?? null

  const stagnation = await fetchStagnatingExercises(db, user.id, today)

  const reqHeaders = await headers()
  const userToday = resolveUserToday(reqHeaders.get('x-user-tz-offset'))
  const habitRows = await fetchActiveHabitsWithStreak(db, user.id, userToday)
  const dailyHabits = habitRows.filter((r) => r.cadence === 'daily')

  const thisWeekRow = measurementsRows.find((m) => m.weekStart === thisWeekStart) ?? null
  const todayRow = todayNutrition.find((d) => d.date === todayDate) ?? null
  const weekPeekDays = resolveWeekPeek(sessionsLast8Weeks, today)

  const sideQuests: SideQuest[] = [
    {
      key: 'nutrition',
      label: 'Zapsat jídlo',
      detail: todayRow?.kcalActual
        ? `${nf.format(todayRow.kcalActual)} kcal zapsáno`
        : 'Kalorie a bílkoviny za dnešek',
      xp: XP_DELTAS.nutrition_logged,
      done: todayRow != null,
      href: '/nutrition',
    },
    {
      key: 'weigh',
      label: 'Týdenní měření',
      detail: thisWeekRow?.weightKg
        ? `${String(thisWeekRow.weightKg).replace('.', ',')} kg tento týden`
        : 'Váha a míry za tento týden',
      xp: XP_DELTAS.measurement_added,
      done: thisWeekRow?.weightKg != null,
      href: '/progress',
    },
    {
      key: 'photo',
      label: 'Fotka proměny',
      detail: lastPhotoAt
        ? `Naposledy ${new Date(`${lastPhotoAt}T00:00:00Z`).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric' })}`
        : 'Stejná póza, stejné světlo',
      xp: XP_DELTAS.photo_uploaded,
      done: lastPhotoAt != null && lastPhotoAt >= thisWeekStart,
      href: '/progress/photos',
    },
  ]
  const sideDone = sideQuests.filter((q) => q.done).length

  return (
    <Container size="md">
      <Stack gap={6} className="py-2">
        <PlayerHero
          level={level}
          tier={tierMeta.tier}
          tierName={tierMeta.name}
          currentXp={progress.current}
          maxXp={progress.max}
          xpForNext={progress.max - progress.current}
          dayCount={daysSince(userRow?.startedAt ?? null, today)}
          sessionsTotal={lifetime.sessions}
        />
        <QuestCard quest={quest} objectives={objectives} streak={streak} />
        <section>
          <RegionHeader meta={`${sideDone} / ${sideQuests.length}`}>Vedlejší questy</RegionHeader>
          <SideQuests items={sideQuests} />
        </section>
        <TodaysChecksCard dailyHabits={dailyHabits} />
        <section>
          <RegionHeader>Stav</RegionHeader>
          <TelemetryRow
            streak={streak}
            balanceXp={rewardsBalance.balanceXp}
            weekDone={weekPeekDays.filter((d) => d.status === 'workout').length}
            weekTarget={sortedPlans.length > 0 ? sortedPlans.length : null}
          />
        </section>
        <section>
          <RegionHeader>Týden</RegionHeader>
          <WeekPeek days={weekPeekDays} />
        </section>
        {stagnation.length > 0 && <StagnationWarning items={stagnation} />}
      </Stack>
    </Container>
  )
}
