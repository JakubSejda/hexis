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
      className="rounded-control bg-surface-raised text-foreground hover:bg-border grid w-full grid-cols-[2rem_1fr_auto] items-center px-3 py-2.5 text-left text-sm font-semibold transition-colors"
    >
      <span className="text-muted font-display text-sm font-black">{set.setIndex + 1}</span>
      <span>
        {w !== null ? `${String(w).replace('.', ',')} kg × ` : ''}
        {set.reps}
        {set.rpe ? <span className="text-muted font-normal"> · RPE {set.rpe}</span> : null}
      </span>
      <span className="rounded-tick bg-success text-background font-display px-1.5 py-0.5 text-[11px] font-black">
        ✓
      </span>
    </button>
  )
}
