'use client'
import { useState } from 'react'
import { Check } from 'lucide-react'
import { Button, NumberInput } from '@/components/ui'

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
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        {!exerciseIsBodyweight ? (
          <NumberInput value={weight} onChange={setWeight} step={2.5} suffix="kg" />
        ) : null}
        <NumberInput value={reps} onChange={setReps} step={1} suffix="reps" />
        {showRpe ? (
          <NumberInput value={rpe} onChange={setRpe} step={1} min={1} max={10} suffix="RPE" />
        ) : null}
      </div>
      <Button
        variant="success"
        size="lg"
        loading={submitting}
        disabled={reps === null}
        iconLeft={<Check size={14} aria-hidden />}
        className="gap-1"
        onClick={() => onSubmit({ weightKg: weight, reps, rpe })}
      >
        Zapsat sérii
      </Button>
    </div>
  )
}
