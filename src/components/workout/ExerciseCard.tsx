'use client'
import { useState } from 'react'
import { SetInput } from './SetInput'
import { SetRow } from './SetRow'
import { SuggestionHint } from './SuggestionHint'
import { RestTimer } from './RestTimer'
import { Heading, useToast } from '@/components/ui'
import { restTimerStore } from '@/lib/rest-timer'
import { useXpFeedback } from '@/components/xp/XpFeedbackProvider'
import type { Suggestion } from '@/lib/progression'
import { StagnationBadge } from './StagnationBadge'

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
  stagnation?: { weeksSincePr: number; suggestion: 'deload' | 'variation' } | null
}

export function ExerciseCard({
  sessionId,
  exercise,
  historyLabel,
  initialSuggestion,
  onSetLogged,
  onEditSet,
  stagnation,
}: Props) {
  const [submitting, setSubmitting] = useState(false)
  const [suggestion, setSuggestion] = useState(initialSuggestion)
  const [xpFloat, setXpFloat] = useState<{ id: number; xp: number } | null>(null)
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
      setXpFloat({ id: Date.now(), xp: body.xpDelta })
      toast.show(`+${body.xpDelta} XP${body.levelUp ? ' · LEVEL UP!' : ''}`, 'success')
      if (exercise.restSec > 0) restTimerStore.start(exercise.restSec)
      if (body.nextSuggestion) setSuggestion(body.nextSuggestion)
      onSetLogged()
    } catch {
      toast.show('Set se neuložil, zkus znovu', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const repRange =
    exercise.repMin && exercise.repMax ? `${exercise.repMin}–${exercise.repMax}` : null

  const doneSets = exercise.sets.length
  const targetSets = Math.max(exercise.targetSets, doneSets)
  const pending = Math.max(0, targetSets - doneSets)

  return (
    <div className="flex flex-col gap-4">
      <header>
        <Heading level={2} variant="display" className="text-[2rem]">
          {exercise.name}
        </Heading>
        {stagnation ? (
          <StagnationBadge
            weeksSincePr={stagnation.weeksSincePr}
            suggestion={stagnation.suggestion}
          />
        ) : null}
        <p className="text-muted mt-2 text-sm">
          {repRange ? `${exercise.targetSets} série × ${repRange}` : 'Volný cvik'}
          {exercise.restSec ? ` · pauza ${Math.round((exercise.restSec / 60) * 10) / 10} min` : ''}
        </p>
        {historyLabel ? <p className="text-muted mt-1 text-xs">{historyLabel}</p> : null}
      </header>
      <div className="rounded-card border-border bg-surface relative flex flex-col gap-4 border p-4">
        <SuggestionHint suggestion={suggestion} />
        <SetInput
          initialWeightKg={suggestion.weightKg}
          initialReps={suggestion.reps}
          submitting={submitting}
          onSubmit={handleSubmit}
          exerciseIsBodyweight={exercise.type === 'bodyweight'}
        />
        {xpFloat ? (
          <span
            key={xpFloat.id}
            className="animate-hud-float bg-accent text-accent-foreground font-display rounded-tick pointer-events-none absolute right-6 bottom-40 px-2 py-0.5 text-base font-black"
          >
            +{xpFloat.xp} XP
          </span>
        ) : null}
        {targetSets > 0 ? (
          <div className="flex flex-col gap-1.5">
            {exercise.sets.map((s) => (
              <SetRow key={s.id} set={s} onTap={() => onEditSet(s.id)} />
            ))}
            {Array.from({ length: pending }).map((_, i) => (
              <div
                key={`p${i}`}
                className="rounded-control bg-surface-raised/50 text-muted grid grid-cols-[2rem_1fr] px-3 py-2.5 text-sm"
              >
                <span className="font-display font-black">{doneSets + i + 1}</span>
                <span>{repRange ? `cíl ${repRange} opakování` : 'čeká'}</span>
              </div>
            ))}
          </div>
        ) : null}
        <RestTimer defaultDurationSec={exercise.restSec || 90} />
      </div>
    </div>
  )
}
