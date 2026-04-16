import { estimate1RM } from '@/lib/1rm'

type SetData = {
  weightKg: number
  reps: number
  completedAt: string // YYYY-MM-DD or ISO
}

type DetectArgs = {
  exerciseId: number
  exerciseName: string
  sets: SetData[]
  now: Date
}

export type StagnationResult = {
  exerciseId: number
  exerciseName: string
  lastPrDate: string
  weeksSincePr: number
  isStagnant: boolean
  suggestion: 'deload' | 'variation'
}

export function detectStagnation(args: DetectArgs): StagnationResult {
  const { exerciseId, exerciseName, sets, now } = args
  const empty: StagnationResult = {
    exerciseId,
    exerciseName,
    lastPrDate: '',
    weeksSincePr: 0,
    isStagnant: false,
    suggestion: 'deload',
  }
  if (sets.length === 0) return empty

  let maxE1rm = 0
  let prDate = ''

  const sorted = [...sets].sort(
    (a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime()
  )
  for (const s of sorted) {
    const e1rm = estimate1RM(s.weightKg, s.reps)
    if (e1rm > maxE1rm) {
      maxE1rm = e1rm
      prDate = s.completedAt.slice(0, 10)
    }
  }

  if (!prDate) return empty

  const msPerWeek = 7 * 24 * 60 * 60 * 1000
  const diff = now.getTime() - new Date(prDate + 'T00:00:00Z').getTime()
  const weeksSincePr = Math.floor(diff / msPerWeek)

  return {
    exerciseId,
    exerciseName,
    lastPrDate: prDate,
    weeksSincePr,
    isStagnant: weeksSincePr >= 2,
    suggestion: weeksSincePr >= 4 ? 'variation' : 'deload',
  }
}
