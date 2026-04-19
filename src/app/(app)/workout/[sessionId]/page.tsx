import { redirect } from 'next/navigation'
import { requireSessionUser } from '@/lib/auth-helpers'
import { db } from '@/db/client'
import {
  sessions,
  sessionSets,
  planExercises,
  exercises,
  exerciseMuscleGroups,
  muscleGroups,
} from '@/db/schema'
import { and, asc, desc, eq, inArray, ne } from 'drizzle-orm'
import { WorkoutHeatmap } from '@/components/heatmap/WorkoutHeatmap'
import { WorkoutSessionClient } from '@/components/workout/WorkoutSessionClient'
import { SessionSummary } from '@/components/workout/SessionSummary'
import { SessionDetailView } from '@/components/workout/SessionDetailView'
import { suggestNextSet } from '@/lib/progression'

export default async function WorkoutSessionPage({
  params,
  searchParams,
}: {
  params: Promise<{ sessionId: string }>
  searchParams: Promise<{ edit?: string }>
}) {
  const user = await requireSessionUser()
  if (user instanceof Response) redirect('/login')
  const userId = user.id
  const { sessionId: idStr } = await params
  const { edit } = await searchParams
  const sessionId = Number(idStr)

  // Fetch session
  const session = await db.query.sessions.findFirst({
    where: eq(sessions.id, sessionId),
  })
  if (!session || session.userId !== userId) {
    return <div className="text-danger p-4 text-sm">Session nenalezena.</div>
  }

  // Fetch plan exercises
  const planRows = session.planId
    ? await db
        .select({
          exerciseId: planExercises.exerciseId,
          order: planExercises.order,
          targetSets: planExercises.targetSets,
          repMin: planExercises.repMin,
          repMax: planExercises.repMax,
          restSec: planExercises.restSec,
          name: exercises.name,
          type: exercises.type,
        })
        .from(planExercises)
        .leftJoin(exercises, eq(exercises.id, planExercises.exerciseId))
        .where(eq(planExercises.planId, session.planId!))
        .orderBy(asc(planExercises.order))
    : []

  // Fetch sets
  const sets = await db
    .select()
    .from(sessionSets)
    .where(eq(sessionSets.sessionId, sessionId))
    .orderBy(asc(sessionSets.completedAt))

  // Ad-hoc exercises
  const planIds = new Set(planRows.map((r) => r.exerciseId))
  const adhocIds = [...new Set(sets.map((s) => s.exerciseId).filter((eid) => !planIds.has(eid)))]
  const adhocExercises =
    adhocIds.length > 0
      ? await db.select().from(exercises).where(inArray(exercises.id, adhocIds))
      : []

  // Build exercise blocks
  const allExercises = [
    ...planRows.map((r) => ({
      exerciseId: r.exerciseId,
      name: r.name ?? '—',
      type: r.type ?? 'barbell',
      order: r.order,
      targetSets: r.targetSets,
      repMin: r.repMin,
      repMax: r.repMax,
      restSec: r.restSec,
      sets: sets
        .filter((s) => s.exerciseId === r.exerciseId)
        .map(({ id, setIndex, weightKg, reps, rpe }) => ({
          id,
          setIndex,
          weightKg,
          reps,
          rpe,
        })),
    })),
    ...adhocExercises.map((ex, idx) => ({
      exerciseId: ex.id,
      name: ex.name,
      type: ex.type,
      order: 100 + idx,
      targetSets: 0,
      repMin: 0,
      repMax: 0,
      restSec: 0,
      sets: sets
        .filter((s) => s.exerciseId === ex.id)
        .map(({ id, setIndex, weightKg, reps, rpe }) => ({
          id,
          setIndex,
          weightKg,
          reps,
          rpe,
        })),
    })),
  ]

  const allExIds = allExercises.map((e) => e.exerciseId)
  const exerciseMuscles =
    allExIds.length > 0
      ? await db
          .select({ exerciseId: exerciseMuscleGroups.exerciseId, slug: muscleGroups.slug })
          .from(exerciseMuscleGroups)
          .innerJoin(muscleGroups, eq(muscleGroups.id, exerciseMuscleGroups.muscleGroupId))
          .where(inArray(exerciseMuscleGroups.exerciseId, allExIds))
      : []

  const exerciseToMuscles = new Map<number, string[]>()
  for (const row of exerciseMuscles) {
    const arr = exerciseToMuscles.get(row.exerciseId) ?? []
    arr.push(row.slug)
    exerciseToMuscles.set(row.exerciseId, arr)
  }

  const doneExIds = new Set(allExercises.filter((e) => e.sets.length > 0).map((e) => e.exerciseId))
  const plannedMuscles: string[] = []
  const doneMuscles: string[] = []
  for (const ex of allExercises) {
    const muscles = exerciseToMuscles.get(ex.exerciseId) ?? []
    if (doneExIds.has(ex.exerciseId)) {
      doneMuscles.push(...muscles)
    } else {
      plannedMuscles.push(...muscles)
    }
  }

  // Finished session -> readonly view
  if (session.finishedAt) {
    return (
      <SessionDetailView sessionId={sessionId} exercises={allExercises} editMode={edit === '1'} />
    )
  }

  // Active session: build suggestions
  async function fetchHistory(exerciseId: number) {
    const histSets = await db
      .select({
        weightKg: sessionSets.weightKg,
        reps: sessionSets.reps,
        rpe: sessionSets.rpe,
        sessionId: sessionSets.sessionId,
        completedAt: sessionSets.completedAt,
      })
      .from(sessionSets)
      .innerJoin(sessions, eq(sessions.id, sessionSets.sessionId))
      .where(
        and(
          eq(sessions.userId, userId),
          eq(sessionSets.exerciseId, exerciseId),
          ne(sessions.id, sessionId)
        )
      )
      .orderBy(desc(sessionSets.completedAt))
      .limit(30)
    const bySession = new Map<number, typeof histSets>()
    for (const s of histSets) {
      const arr = bySession.get(s.sessionId) ?? []
      arr.push(s)
      bySession.set(s.sessionId, arr)
    }
    const sessionsSorted = [...bySession.values()].slice(0, 3)
    return sessionsSorted.map((setGroup) => ({
      startedAt: setGroup[0]!.completedAt ?? new Date(),
      sets: setGroup.map((s) => ({
        weightKg: s.weightKg !== null ? Number(s.weightKg) : null,
        reps: s.reps,
        rpe: s.rpe,
      })),
    }))
  }

  const exercisesWithSuggestions = await Promise.all(
    allExercises.map(async (ex) => {
      const history = await fetchHistory(ex.exerciseId)
      const suggestion = suggestNextSet({
        history,
        planExercise:
          ex.targetSets > 0
            ? {
                targetSets: ex.targetSets,
                repMin: ex.repMin,
                repMax: ex.repMax,
                exerciseType: ex.type as
                  | 'barbell'
                  | 'db'
                  | 'cable'
                  | 'machine'
                  | 'bodyweight'
                  | 'smith',
              }
            : null,
        currentSessionSets: ex.sets.map((s) => ({
          setIndex: s.setIndex,
          weightKg: s.weightKg !== null ? Number(s.weightKg) : null,
          reps: s.reps,
          rpe: s.rpe,
        })),
      })
      const historyLabel = history[0]?.sets.length
        ? `Minule: ${history[0]!.sets.map((s) => `${s.weightKg ?? '—'}x${s.reps ?? 0}`).join(', ')}`
        : null
      return { ...ex, suggestion, historyLabel }
    })
  )

  const totalSets = allExercises.reduce((a, e) => a + e.sets.length, 0)
  const totalVolume = allExercises.reduce(
    (a, e) => a + e.sets.reduce((b, s) => b + Number(s.weightKg ?? 0) * (s.reps ?? 0), 0),
    0
  )
  // Server component — Date.now() evaluates once per request on the server,
  // no render-purity or hydration concern. The lint rule can't distinguish
  // server components from client ones.
  // eslint-disable-next-line react-hooks/purity
  const durationMin = Math.floor((Date.now() - new Date(session.startedAt).getTime()) / 60000)

  return (
    <>
      <details className="border-border rounded-lg border p-3">
        <summary className="text-muted cursor-pointer text-sm">Svalová mapa</summary>
        <div className="mt-2">
          <WorkoutHeatmap plannedMuscles={plannedMuscles} doneMuscles={doneMuscles} />
        </div>
      </details>
      <WorkoutSessionClient sessionId={sessionId} exercises={exercisesWithSuggestions} />
      <SessionSummary
        sessionId={sessionId}
        totalSets={totalSets}
        totalVolume={totalVolume}
        durationMin={durationMin}
        note={session.note}
      />
    </>
  )
}
