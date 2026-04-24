export type Quest =
  | { kind: 'active'; sessionId: number; planName: string; completed: number; total: number }
  | { kind: 'rest'; nextPlanName: string | null }
  | { kind: 'scheduled'; planName: string; exerciseCount: number }
  | { kind: 'no-plan' }

type Plan = { id: number; name: string; order: number }

type Input = {
  activeSession: { id: number; planName: string; completed: number; total: number } | null
  lastFinished: { planId: number | null; finishedAt: Date } | null
  plans: Plan[]
  exerciseCounts: Map<number, number>
  today: Date
}

function isSameUtcDay(a: Date, b: Date): boolean {
  return a.toISOString().slice(0, 10) === b.toISOString().slice(0, 10)
}

function nextPlanAfter(lastFinishedPlanId: number | null, sortedPlans: Plan[]): Plan | null {
  if (sortedPlans.length === 0) return null
  if (lastFinishedPlanId == null) return sortedPlans[0] ?? null
  const idx = sortedPlans.findIndex((p) => p.id === lastFinishedPlanId)
  if (idx === -1) return sortedPlans[0] ?? null
  return sortedPlans[(idx + 1) % sortedPlans.length] ?? null
}

export function resolveTodayQuest(input: Input): Quest {
  const { activeSession, lastFinished, plans, exerciseCounts, today } = input

  if (activeSession) {
    return {
      kind: 'active',
      sessionId: activeSession.id,
      planName: activeSession.planName,
      completed: activeSession.completed,
      total: activeSession.total,
    }
  }

  if (plans.length === 0) return { kind: 'no-plan' }

  const sorted = [...plans].sort((a, b) => a.order - b.order)

  if (lastFinished && isSameUtcDay(lastFinished.finishedAt, today)) {
    const next = nextPlanAfter(lastFinished.planId, sorted)
    return { kind: 'rest', nextPlanName: next ? next.name : null }
  }

  const next = nextPlanAfter(lastFinished?.planId ?? null, sorted)
  if (!next) return { kind: 'no-plan' }
  return {
    kind: 'scheduled',
    planName: next.name,
    exerciseCount: exerciseCounts.get(next.id) ?? 0,
  }
}
