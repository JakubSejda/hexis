'use client'
import { useState, Suspense } from 'react'
import { Button, Dialog, Skeleton, useLongPress } from '@/components/ui'
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
        <p className="text-muted text-sm">Žádné cviky v této session.</p>
        <AdHocAddButton onPicked={(id) => onAdHoc(id)} />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <header className="animate-hud-power-on">
        <div className="text-system flex items-center justify-between font-mono text-xs tracking-[0.2em] uppercase">
          <span>Mise aktivní</span>
          <span>
            Cvik {String(idx + 1).padStart(2, '0')}/{String(exercises.length).padStart(2, '0')}
          </span>
        </div>
        {planName ? (
          <div className="text-foreground mt-1 text-xl font-black tracking-tight uppercase italic">
            {planName}
          </div>
        ) : null}
        <div className="mt-2 flex gap-1" aria-hidden>
          {exercises.map((e, i) => (
            <span
              key={e.exerciseId}
              className={`h-1 flex-1 ${i <= idx ? 'bg-system' : 'bg-border'}`}
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
          Dokončit trénink
        </Button>
      ) : null}
      <div className="flex gap-2">
        <Button variant="outline" size="md" className="flex-1" onClick={() => setSkipOpen(true)}>
          Přeskočit cvik
        </Button>
        {idx !== exercises.length - 1 ? (
          <Button variant="outline" size="md" className="flex-1" onClick={onFinish}>
            Dokončit trénink
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
      <Dialog
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
      </Dialog>
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
