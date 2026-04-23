import { Sparkline } from '@/components/ui'
import type { Goal, Direction } from '@/lib/measurement-delta'
import { calcDelta, deltaDirection } from '@/lib/measurement-delta'

const COLOR: Record<Direction, string> = {
  good: '#10b981',
  bad: '#ef4444',
  neutral: '#6b7280',
}

type Props = {
  label: string
  values: (number | null)[]
  goal: Goal
  unit?: string
  precision?: number
}

export function SparklineCard({ label, values, goal, unit, precision = 1 }: Props) {
  const nonNull = values
    .map((v, i) => ({ v, i }))
    .filter((p): p is { v: number; i: number } => p.v != null)
  const last = nonNull[nonNull.length - 1]?.v ?? null
  const prev = nonNull[nonNull.length - 2]?.v ?? null
  const delta = calcDelta(last, prev)
  const direction = deltaDirection(delta, goal)
  const color = COLOR[direction]
  const sign =
    delta == null ? '—' : delta > 0 ? `+${delta.toFixed(precision)}` : delta.toFixed(precision)
  return (
    <div className="border-border bg-surface min-w-[140px] rounded-lg border p-3">
      <div className="text-muted text-xs">{label}</div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-foreground text-xl font-bold">
          {last == null ? '—' : last.toFixed(precision)}
        </span>
        <span className="text-xs" style={{ color }}>
          {sign}
        </span>
      </div>
      <Sparkline values={values} width={120} height={32} color={color} className="mt-1.5 block" />
      {unit && <div className="text-muted text-[10px]">{unit}</div>}
    </div>
  )
}
