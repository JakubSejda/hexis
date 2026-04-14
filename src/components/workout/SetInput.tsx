'use client'
import { useState } from 'react'
import { NumberInput } from '@/components/ui/NumberInput'

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
      <button
        type="button"
        disabled={submitting || reps === null}
        onClick={() => onSubmit({ weightKg: weight, reps, rpe })}
        className="h-12 rounded-lg bg-[#10B981] font-semibold text-[#0A0E14] disabled:opacity-50"
      >
        {submitting ? 'Ukládám…' : '✓ Zapsat sérii'}
      </button>
    </div>
  )
}
