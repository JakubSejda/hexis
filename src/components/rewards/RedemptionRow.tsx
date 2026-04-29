'use client'
import type { RedemptionWithReward } from '@/lib/queries/rewards'

const fmt = new Intl.DateTimeFormat('cs-CZ', { day: 'numeric', month: 'short' })

type Props = {
  redemption: RedemptionWithReward
  onDelete: (r: RedemptionWithReward) => void
}

export function RedemptionRow({ redemption, onDelete }: Props) {
  return (
    <div className="border-border flex items-center gap-3 border-b py-2 text-sm last:border-0">
      <span className="text-muted w-12 shrink-0 text-xs">{fmt.format(redemption.redeemedAt)}</span>
      <span
        className={
          'min-w-0 flex-1 truncate ' + (redemption.rewardArchived ? 'text-muted italic' : '')
        }
      >
        {redemption.rewardName}
        {redemption.note && <span className="text-muted ml-2 text-xs">· {redemption.note}</span>}
      </span>
      <span className="text-accent text-xs font-semibold">−{redemption.costXp} XP</span>
      <button
        type="button"
        aria-label="Smazat z historie"
        className="text-muted hover:text-destructive text-xs"
        onClick={() => onDelete(redemption)}
      >
        ×
      </button>
    </div>
  )
}
