'use client'
import type { RedemptionWithReward } from '@/lib/queries/rewards'
import { RedemptionRow } from './RedemptionRow'

type Props = {
  history: RedemptionWithReward[]
  onDelete: (r: RedemptionWithReward) => void
}

export function RedemptionList({ history, onDelete }: Props) {
  if (history.length === 0) {
    return <p className="text-muted text-sm">Zatím žádná vyzvednutí.</p>
  }
  return (
    <div className="border-border bg-surface rounded-xl border px-3">
      {history.map((r) => (
        <RedemptionRow key={r.id} redemption={r} onDelete={onDelete} />
      ))}
    </div>
  )
}
