'use client'

type SetData = {
  id: number
  setIndex: number
  weightKg: string | number | null
  reps: number | null
  rpe: number | null
}

export function SetRow({ set, onTap }: { set: SetData; onTap?: () => void }) {
  const w = set.weightKg !== null ? Number(set.weightKg) : null
  return (
    <button
      type="button"
      onClick={onTap}
      className="bg-border text-primary flex w-full items-center justify-between rounded-md px-3 py-2 text-sm"
    >
      <span className="text-muted">Série {set.setIndex + 1}</span>
      <span>
        {w !== null ? `${w} × ` : ''}
        {set.reps}
        {set.rpe ? ` @${set.rpe}` : ''}
      </span>
    </button>
  )
}
