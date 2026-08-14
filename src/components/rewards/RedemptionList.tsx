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
    <div className="hud-clip bg-border p-px">
      <div className="hud-clip bg-surface px-3">
        {history.map((r) => (
          <RedemptionRow key={r.id} redemption={r} onDelete={onDelete} />
        ))}
      </div>
    </div>
  )
}
