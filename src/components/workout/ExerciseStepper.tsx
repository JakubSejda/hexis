'use client'
import { useState, Suspense } from 'react'
import { useLongPress } from '@/components/ui/LongPress'
import { useRouter, useSearchParams } from 'next/navigation'
import { ExerciseCard } from './ExerciseCard'
import { StepperNav } from './StepperNav'
import { AdHocAddButton } from './AdHocAddButton'
import { EditSetSheet } from './EditSetSheet'
import type { Suggestion } from '@/lib/progression'

type Exercise = React.ComponentProps<typeof ExerciseCard>['exercise']

type Props = {
  sessionId: number
  exercises: Array<Exercise & { historyLabel: string | null; suggestion: Suggestion }>
  onRefresh: () => void
  onSkip: (exerciseId: number) => void
  onAdHoc: (exerciseId: number) => void
  onFinish: () => void
}

function StepperInner({ sessionId, exercises, onRefresh, onSkip, onAdHoc, onFinish }: Props) {
  const router = useRouter()
  const search = useSearchParams()
  const exParam = search.get('ex')
  const initialIdx = exercises.findIndex((e) => String(e.exerciseId) === exParam)
  const [idx, setIdx] = useState(initialIdx >= 0 ? initialIdx : 0)
  const [editSetId, setEditSetId] = useState<number | null>(null)

  const navigate = (newIdx: number) => {
    setIdx(newIdx)
    const params = new URLSearchParams(search.toString())
    params.set('ex', String(exercises[newIdx]!.exerciseId))
    router.replace(`?${params.toString()}`)
  }

  const current = exercises[idx]
  // Hook must be called unconditionally — guard inside the callback instead
  // of after an early return.
  const longPress = useLongPress(() => {
    if (!current) return
    if (confirm(`Přeskočit ${current.name}?`)) onSkip(current.exerciseId)
  })

  if (!current) {
    return (
      <div className="flex flex-col gap-3 p-4">
        <p className="text-muted text-sm">Žádné cviky v této session.</p>
        <AdHocAddButton onPicked={(id) => onAdHoc(id)} />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div {...longPress}>
        <ExerciseCard
          sessionId={sessionId}
          exercise={current}
          historyLabel={current.historyLabel}
          initialSuggestion={current.suggestion}
          onSetLogged={onRefresh}
          onEditSet={(setId) => setEditSetId(setId)}
        />
      </div>
      <StepperNav
        total={exercises.length}
        current={idx}
        onPrev={() => navigate(Math.max(0, idx - 1))}
        onNext={() => navigate(Math.min(exercises.length - 1, idx + 1))}
        labels={{
          prev: exercises[idx - 1]?.name.split(' ')[0] ?? '—',
          next: exercises[idx + 1]?.name.split(' ')[0] ?? 'Shrnutí',
        }}
      />
      {idx === exercises.length - 1 ? (
        <button
          type="button"
          onClick={onFinish}
          className="bg-primary text-background h-12 rounded-lg font-semibold"
        >
          Dokončit trénink
        </button>
      ) : null}
      <AdHocAddButton onPicked={(id) => onAdHoc(id)} />
      {editSetId !== null ? (
        <EditSetSheet
          sessionId={sessionId}
          setId={editSetId}
          onClose={() => setEditSetId(null)}
          onChanged={() => {
            setEditSetId(null)
            onRefresh()
          }}
        />
      ) : null}
    </div>
  )
}

export function ExerciseStepper(props: Props) {
  return (
    <Suspense fallback={<div className="text-muted p-4">Načítám...</div>}>
      <StepperInner {...props} />
    </Suspense>
  )
}
