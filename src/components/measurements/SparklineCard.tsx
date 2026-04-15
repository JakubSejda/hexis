import { Sparkline } from '@/components/ui/Sparkline'
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
    <div className="min-w-[140px] rounded-lg border border-[#1f2733] bg-[#141a22] p-3">
      <div className="text-xs text-[#6b7280]">{label}</div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-xl font-bold text-[#e5e7eb]">
          {last == null ? '—' : last.toFixed(precision)}
        </span>
        <span className="text-xs" style={{ color }}>
          {sign}
        </span>
      </div>
      <Sparkline values={values} width={120} height={32} color={color} className="mt-1.5 block" />
      {unit && <div className="text-[10px] text-[#6b7280]">{unit}</div>}
    </div>
  )
}
