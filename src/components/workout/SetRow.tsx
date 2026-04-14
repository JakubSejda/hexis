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
      className="flex w-full items-center justify-between rounded-md bg-[#1F2733] px-3 py-2 text-sm text-[#10B981]"
    >
      <span className="text-[#6B7280]">Série {set.setIndex + 1}</span>
      <span>
        {w !== null ? `${w} × ` : ''}
        {set.reps}
        {set.rpe ? ` @${set.rpe}` : ''}
      </span>
    </button>
  )
}
