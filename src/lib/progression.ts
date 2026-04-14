export type ExerciseType = 'barbell' | 'db' | 'cable' | 'machine' | 'bodyweight' | 'smith'

export type HistorySet = {
  weightKg: number | null
  reps: number | null
  rpe?: number | null
}

export type HistorySession = {
  startedAt: Date
  sets: HistorySet[]
}

export type PlanSnapshot = {
  targetSets: number
  repMin: number
  repMax: number
  exerciseType: ExerciseType
}

export type CurrentSet = {
  setIndex: number
  weightKg: number | null
  reps: number | null
  rpe?: number | null
}

export type Suggestion = {
  weightKg: number | null
  reps: number | null
  reason: string
}

export type SuggestArgs = {
  history: HistorySession[] // last ~3 sessions, newest first
  planExercise: PlanSnapshot | null // null = ad-hoc
  currentSessionSets: CurrentSet[] // sets already logged in THIS session, this exercise
}

function incrementFor(type: ExerciseType): number {
  switch (type) {
    case 'db':
      return 1
    case 'bodyweight':
      return 0
    default:
      return 2.5
  }
}

export function suggestNextSet(args: SuggestArgs): Suggestion {
  const { history, planExercise, currentSessionSets } = args
  const last = history[0]

  // 1. Ad-hoc (no plan)
  if (!planExercise) {
    if (!last || last.sets.length === 0) {
      return { weightKg: null, reps: null, reason: 'Nová série — nastav sám' }
    }
    const lastSet = last.sets[last.sets.length - 1]!
    return {
      weightKg: lastSet.weightKg,
      reps: lastSet.reps,
      reason: 'Ad-hoc: podle minulé série',
    }
  }

  const inc = incrementFor(planExercise.exerciseType)
  const isBodyweight = planExercise.exerciseType === 'bodyweight'

  // 2. Mid-session re-eval
  if (currentSessionSets.length > 0) {
    const prev = currentSessionSets[currentSessionSets.length - 1]!
    const prevReps = prev.reps ?? 0
    const prevWeight = prev.weightKg
    const hardRpe = (prev.rpe ?? 0) >= 10
    if (hardRpe && prevReps < planExercise.repMin) {
      const downWeight = prevWeight !== null ? Math.max(0, prevWeight - inc) : null
      return {
        weightKg: isBodyweight ? null : downWeight,
        reps: planExercise.repMin,
        reason: 'Down-target: předchozí série RPE 10 pod repMin',
      }
    }
    return {
      weightKg: prevWeight,
      reps: prevReps >= planExercise.repMin ? prevReps : planExercise.repMin,
      reason: 'Navazuj na předchozí sérii',
    }
  }

  // 3. Start of session, no history
  if (!last || last.sets.length === 0) {
    return {
      weightKg: null,
      reps: planExercise.repMin,
      reason: 'První session — nastav váhu sám',
    }
  }

  // 4. Start of session, with history → double progression
  const allHitMax = last.sets.every((s) => (s.reps ?? 0) >= planExercise.repMax)
  const lastWeight = last.sets[0]?.weightKg ?? null

  if (allHitMax) {
    const bumped = isBodyweight
      ? null
      : lastWeight !== null
        ? Math.round((lastWeight + inc) * 100) / 100
        : null
    return {
      weightKg: bumped,
      reps: planExercise.repMin,
      reason: `Progres: všechny série hit ${planExercise.repMax}, +${inc} kg`,
    }
  }

  // partial: same weight, bump reps by 1 (capped)
  const topReps = Math.max(...last.sets.map((s) => s.reps ?? 0))
  const anyBelowMin = last.sets.some((s) => (s.reps ?? 0) < planExercise.repMin)

  if (anyBelowMin) {
    return {
      weightKg: lastWeight,
      reps: planExercise.repMin,
      reason: 'Restart: minule pod repMin',
    }
  }

  return {
    weightKg: lastWeight,
    reps: Math.min(topReps + 1, planExercise.repMax),
    reason: 'Navazuj: +1 rep',
  }
}
