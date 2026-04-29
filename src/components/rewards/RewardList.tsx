'use client'
import { EmptyState } from '@/components/ui'
import { Gift } from 'lucide-react'
import { RewardCard } from './RewardCard'
import type { RewardRow } from '@/lib/queries/rewards'

type Props = {
  rewards: RewardRow[]
  balanceXp: number
  redemptionCounts: Record<number, number>
  onRedeem: (r: RewardRow) => void
  onEdit: (r: RewardRow) => void
  onArchive: (r: RewardRow) => void
  onDelete: (r: RewardRow) => void
  onCreate: () => void
}

export function RewardList({
  rewards,
  balanceXp,
  redemptionCounts,
  onRedeem,
  onEdit,
  onArchive,
  onDelete,
  onCreate,
}: Props) {
  if (rewards.length === 0) {
    return (
      <EmptyState
        icon={Gift}
        title="Žádné odměny"
        description="Vytvoř si první odměnu — co si chceš dopřát za odvedenou práci?"
        action={
          <button
            type="button"
            onClick={onCreate}
            className="bg-accent text-on-accent rounded-lg px-3 py-2 text-sm font-semibold"
          >
            Vytvoř si první odměnu
          </button>
        }
      />
    )
  }
  return (
    <div className="flex flex-col gap-2">
      {rewards.map((r) => (
        <RewardCard
          key={r.id}
          reward={r}
          balanceXp={balanceXp}
          onRedeem={onRedeem}
          onEdit={onEdit}
          onArchive={onArchive}
          onDelete={onDelete}
          hasRedemptions={(redemptionCounts[r.id] ?? 0) > 0}
        />
      ))}
    </div>
  )
}
