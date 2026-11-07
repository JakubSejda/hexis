'use client'
import { useState } from 'react'
import { Button, NumberInput } from '@/components/ui'
import { XP_DELTAS } from '@/lib/xp-events'

type Props = {
  initialWeightKg: number | null
  initialReps: number | null
  showRpe?: boolean
  submitting: boolean
  onSubmit: (v: { weightKg: number | null; reps: number | null; rpe: number | null }) => void
  exerciseIsBodyweight?: boolean
}

export function SetInput({
  initialWeightKg,
  initialReps,
  showRpe = true,
  submitting,
  onSubmit,
  exerciseIsBodyweight,
}: Props) {
  const [weight, setWeight] = useState<number | null>(initialWeightKg)
  const [reps, setReps] = useState<number | null>(initialReps)
  const [rpe, setRpe] = useState<number | null>(null)

  return (
    <div className="flex flex-col gap-3">
      <div className={exerciseIsBodyweight ? 'grid grid-cols-1' : 'grid grid-cols-2 gap-3'}>
        {!exerciseIsBodyweight ? (
          <NumberInput
            variant="hero"
            label="Váha kg"
            placeholder="0"
            value={weight}
            onChange={setWeight}
            step={2.5}
            suffix="kg"
          />
        ) : null}
        <NumberInput
          variant="hero"
          label="Opakování"
          value={reps}
          onChange={setReps}
          step={1}
          suffix="opak."
        />
      </div>
      {showRpe ? (
        <div className="text-muted flex items-center justify-between gap-2 text-xs">
          <span>Náročnost RPE (nepovinné)</span>
          <NumberInput value={rpe} onChange={setRpe} step={1} min={1} max={10} />
        </div>
      ) : null}
      <Button
        variant="success"
        size="lg"
        loading={submitting}
        disabled={reps === null}
        className="justify-between px-6"
        onClick={() => onSubmit({ weightKg: weight, reps, rpe })}
      >
        Zapsat sérii
        <span>+{XP_DELTAS.set_logged} XP</span>
      </Button>
    </div>
  )
}
