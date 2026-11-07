import { and, desc, eq, gte, inArray, sql } from 'drizzle-orm'
import type { MySql2Database } from 'drizzle-orm/mysql2'
import * as schema from '@/db/schema'
import { sessions, planExercises, sessionSets, exercises } from '@/db/schema'

type DB = MySql2Database<typeof schema>

/** Started-at timestamps of the user's sessions in the last 8 weeks. */
export async function fetchSessionsLast8Weeks(
  db: DB,
  userId: string,
  now: Date = new Date()
): Promise<Date[]> {
  const cutoff = new Date(now)
  cutoff.setUTCDate(cutoff.getUTCDate() - 56)
  const rows = await db
    .select({ startedAt: sessions.startedAt })
    .from(sessions)
    .where(and(eq(sessions.userId, userId), gte(sessions.startedAt, cutoff)))
    .orderBy(desc(sessions.startedAt))
  return rows.map((r) => r.startedAt)
}

/** Count of planned exercises per plan id, for the given plan ids. */
export async function fetchExerciseCountsByPlan(
  db: DB,
  planIds: number[]
): Promise<Map<number, number>> {
  if (planIds.length === 0) return new Map()
  const rows = await db
    .select({
      planId: planExercises.planId,
      count: sql<number>`count(*)`.as('count'),
    })
    .from(planExercises)
    .where(inArray(planExercises.planId, planIds))
    .groupBy(planExercises.planId)
  const map = new Map<number, number>()
  for (const r of rows) map.set(r.planId, Number(r.count))
  return map
}

/**
 * Progress for an active session: total exercises (plan exercises + any ad-hoc
 * exercises already logged) and completed count (distinct exercise_ids with
 * at least one set row).
 */
export async function fetchActiveSessionProgress(
  db: DB,
  sessionId: number,
  planId: number | null
): Promise<{ completed: number; total: number }> {
  const completedRows = await db
    .select({ exerciseId: sessionSets.exerciseId })
    .from(sessionSets)
    .where(eq(sessionSets.sessionId, sessionId))
    .groupBy(sessionSets.exerciseId)
  const completedIds = new Set(completedRows.map((r) => r.exerciseId))
  const completed = completedIds.size

  let plannedIds = new Set<number>()
  if (planId != null) {
    const planRows = await db
      .select({ exerciseId: planExercises.exerciseId })
      .from(planExercises)
      .where(eq(planExercises.planId, planId))
    plannedIds = new Set(planRows.map((r) => r.exerciseId))
  }

  // total = union of planned and completed (covers ad-hoc)
  const totalIds = new Set<number>([...plannedIds, ...completedIds])
  const total = totalIds.size || completed || 0

  return { completed, total }
}

export type QuestObjective = {
  exerciseId: number
  name: string
  targetSets: number
  doneSets: number
}

/**
 * The quest's checklist: the plan's exercises in order, each with the number
 * of sets already logged in the active session (0 when there is none).
 */
export async function fetchQuestObjectives(
  db: DB,
  planId: number,
  sessionId: number | null
): Promise<QuestObjective[]> {
  const rows = await db
    .select({
      exerciseId: planExercises.exerciseId,
      name: exercises.name,
      targetSets: planExercises.targetSets,
    })
    .from(planExercises)
    .innerJoin(exercises, eq(exercises.id, planExercises.exerciseId))
    .where(eq(planExercises.planId, planId))
    .orderBy(planExercises.order)

  const done = new Map<number, number>()
  if (sessionId != null) {
    const setRows = await db
      .select({
        exerciseId: sessionSets.exerciseId,
        count: sql<number>`count(*)`.as('count'),
      })
      .from(sessionSets)
      .where(eq(sessionSets.sessionId, sessionId))
      .groupBy(sessionSets.exerciseId)
    for (const r of setRows) done.set(r.exerciseId, Number(r.count))
  }

  return rows.map((r) => ({ ...r, doneSets: done.get(r.exerciseId) ?? 0 }))
}
