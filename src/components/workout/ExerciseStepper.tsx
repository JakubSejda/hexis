'use client'
import { useState, Suspense } from 'react'
import { Button, Sheet, Skeleton, useLongPress } from '@/components/ui'
import { useRouter, useSearchParams } from 'next/navigation'
import { ExerciseCard } from './ExerciseCard'
import { StepperNav } from './StepperNav'
import { AdHocAddButton } from './AdHocAddButton'
import { EditSetSheet } from './EditSetSheet'
import type { Suggestion } from '@/lib/progression'

type Exercise = React.ComponentProps<typeof ExerciseCard>['exercise']

type Props = {
  sessionId: number
  planName?: string | null
  exercises: Array<Exercise & { historyLabel: string | null; suggestion: Suggestion }>
  onRefresh: () => void
  onSkip: (exerciseId: number) => void
  onAdHoc: (exerciseId: number) => void
  onFinish: () => void
}

function StepperInner({
  sessionId,
  planName,
  exercises,
  onRefresh,
  onSkip,
  onAdHoc,
  onFinish,
}: Props) {
  const router = useRouter()
  const search = useSearchParams()
  const exParam = search.get('ex')
  const initialIdx = exercises.findIndex((e) => String(e.exerciseId) === exParam)
  const [idx, setIdx] = useState(initialIdx >= 0 ? initialIdx : 0)
  const [editSetId, setEditSetId] = useState<number | null>(null)
  const [skipOpen, setSkipOpen] = useState(false)

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
    setSkipOpen(true)
  })

  const doSkip = () => {
    if (!current) return
    setSkipOpen(false)
    onSkip(current.exerciseId)
  }

  if (!current) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-muted text-sm">V tomhle tréninku zatím nejsou žádné cviky.</p>
        <AdHocAddButton onPicked={(id) => onAdHoc(id)} />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <header className="animate-hud-power-on">
        <div className="text-muted flex items-center justify-between text-sm">
          <span>
            Quest <b className="text-foreground">aktivní</b>
            {planName ? ` · ${planName.split(' — ')[0]}` : ''}
          </span>
          <span className="font-display text-foreground font-black">
            {idx + 1}/{exercises.length}
          </span>
        </div>
        <div className="mt-3 flex gap-1" aria-hidden>
          {exercises.map((e, i) => (
            <span
              key={e.exerciseId}
              className={`h-1 flex-1 rounded-full ${
                i === idx
                  ? 'bg-accent'
                  : e.sets.length >= e.targetSets && e.targetSets > 0
                    ? 'bg-success'
                    : 'bg-surface-raised'
              }`}
            />
          ))}
        </div>
      </header>
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
        <Button variant="success" size="lg" onClick={onFinish}>
          Dokončit quest
        </Button>
      ) : null}
      <div className="flex gap-2">
        <Button variant="outline" size="md" className="flex-1" onClick={() => setSkipOpen(true)}>
          Přeskočit
        </Button>
        {idx !== exercises.length - 1 ? (
          <Button variant="outline" size="md" className="flex-1" onClick={onFinish}>
            Dokončit
          </Button>
        ) : null}
      </div>
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
      <Sheet
        open={skipOpen}
        onOpenChange={setSkipOpen}
        title={current ? `Přeskočit ${current.name}?` : 'Přeskočit cvik?'}
        dismissible={false}
      >
        <div className="flex gap-2">
          <Button variant="outline" size="lg" className="flex-1" onClick={() => setSkipOpen(false)}>
            Zrušit
          </Button>
          <Button variant="primary" size="lg" className="flex-1" onClick={doSkip}>
            Přeskočit
          </Button>
        </div>
      </Sheet>
    </div>
  )
}

export function ExerciseStepper(props: Props) {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col gap-4 py-4">
          <Skeleton shape="card" />
          <Skeleton shape="block" />
        </div>
      }
    >
      <StepperInner {...props} />
    </Suspense>
  )
}
