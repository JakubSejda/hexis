'use client'
import { useState } from 'react'
import { SetInput } from './SetInput'
import { SetRow } from './SetRow'
import { SuggestionHint } from './SuggestionHint'
import { RestTimer } from './RestTimer'
import { useToast } from '@/components/ui'
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

  const targetRange =
    exercise.repMin && exercise.repMax
      ? `${exercise.repMin}–${exercise.repMax} × ${exercise.targetSets}`
      : 'ad-hoc'

  const doneSets = exercise.sets.length
  const targetSets = Math.max(exercise.targetSets, doneSets)

  return (
    <div className="hud-clip bg-system/60 p-px">
      <div className="hud-clip bg-surface relative flex flex-col gap-3 p-4">
        <header>
          <div className="text-system font-mono text-xs tracking-[0.2em] uppercase">
            Aktuální cvik
          </div>
          <h3 className="text-foreground mt-1 text-2xl font-black tracking-tight uppercase italic">
            {exercise.name}
          </h3>
          {stagnation ? (
            <StagnationBadge
              weeksSincePr={stagnation.weeksSincePr}
              suggestion={stagnation.suggestion}
            />
          ) : null}
          <p className="text-muted mt-1 font-mono text-xs">Cíl: {targetRange}</p>
          {historyLabel ? (
            <p className="text-muted mt-1 font-mono text-xs">{historyLabel}</p>
          ) : null}
        </header>
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
            className="animate-hud-float text-accent pointer-events-none absolute right-4 bottom-24 font-mono text-lg font-bold"
          >
            +{xpFloat.xp} XP
          </span>
        ) : null}
        {targetSets > 0 && (
          <div className="text-muted flex items-center gap-2 font-mono text-xs tracking-[0.15em] uppercase">
            <span>Série</span>
            <span className="flex gap-1.5" aria-hidden>
              {Array.from({ length: targetSets }).map((_, i) => (
                <span
                  key={i}
                  className={i < doneSets ? 'bg-accent' : 'bg-border'}
                  style={{
                    width: 12,
                    height: 12,
                    clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                  }}
                />
              ))}
            </span>
            <span>
              {doneSets}/{targetSets}
            </span>
          </div>
        )}
        <RestTimer defaultDurationSec={exercise.restSec || 90} />
        <div className="flex flex-col gap-1">
          {exercise.sets.map((s) => (
            <SetRow key={s.id} set={s} onTap={() => onEditSet(s.id)} />
          ))}
        </div>
      </div>
    </div>
  )
}
