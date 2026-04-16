'use client'
import { useState } from 'react'
import { SetInput } from './SetInput'
import { SetRow } from './SetRow'
import { SuggestionHint } from './SuggestionHint'
import { RestTimer } from './RestTimer'
import { useToast } from '@/components/ui/Toast'
import { restTimerStore } from '@/lib/rest-timer'
import { useXpFeedback } from '@/components/xp/XpFeedbackProvider'
import type { Suggestion } from '@/lib/progression'

type ApiSet = {
  id: number
  setIndex: number
  weightKg: string | null
  reps: number | null
  rpe: number | null
}
type Exercise = {
  exerciseId: number
  name: string
  type: string
  targetSets: number
  repMin: number
  repMax: number
  restSec: number
  sets: ApiSet[]
}

type Props = {
  sessionId: number
  exercise: Exercise
  historyLabel: string | null
  initialSuggestion: Suggestion
  onSetLogged: () => void
  onEditSet: (setId: number) => void
}

export function ExerciseCard({
  sessionId,
  exercise,
  historyLabel,
  initialSuggestion,
  onSetLogged,
  onEditSet,
}: Props) {
  const [submitting, setSubmitting] = useState(false)
  const [suggestion, setSuggestion] = useState(initialSuggestion)
  const toast = useToast()
  const { notifyXp } = useXpFeedback()

  const handleSubmit = async (v: {
    weightKg: number | null
    reps: number | null
    rpe: number | null
  }) => {
    setSubmitting(true)
    try {
      const res = await fetch(`/api/sessions/${sessionId}/sets`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          exerciseId: exercise.exerciseId,
          setIndex: exercise.sets.length,
          weightKg: v.weightKg,
          reps: v.reps,
          rpe: v.rpe,
        }),
      })
      if (!res.ok) throw new Error(`${res.status}`)
      const body = await res.json()
      notifyXp(body)
      toast.show(`+${body.xpDelta} XP${body.levelUp ? ' · LEVEL UP!' : ''}`, 'success')
      if (exercise.restSec > 0) restTimerStore.start(exercise.restSec)
      if (body.nextSuggestion) setSuggestion(body.nextSuggestion)
      onSetLogged()
    } catch (e) {
      toast.show('Set se neuložil, zkus znovu', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const targetRange =
    exercise.repMin && exercise.repMax
      ? `${exercise.repMin}–${exercise.repMax} × ${exercise.targetSets}`
      : 'ad-hoc'

  return (
    <div className="flex flex-col gap-3">
      <header>
        <h3 className="text-lg font-semibold text-[#E5E7EB]">{exercise.name}</h3>
        <p className="text-xs text-[#6B7280]">Cíl: {targetRange}</p>
        {historyLabel ? <p className="mt-1 text-xs text-[#6B7280]">{historyLabel}</p> : null}
      </header>
      <SuggestionHint suggestion={suggestion} />
      <SetInput
        initialWeightKg={suggestion.weightKg}
        initialReps={suggestion.reps}
        submitting={submitting}
        onSubmit={handleSubmit}
        exerciseIsBodyweight={exercise.type === 'bodyweight'}
      />
      <RestTimer defaultDurationSec={exercise.restSec || 90} />
      <div className="flex flex-col gap-1">
        {exercise.sets.map((s) => (
          <SetRow key={s.id} set={s} onTap={() => onEditSet(s.id)} />
        ))}
      </div>
    </div>
  )
}
