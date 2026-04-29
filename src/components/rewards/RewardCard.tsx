'use client'
import { Button, Menu } from '@/components/ui'
import { MoreVertical } from 'lucide-react'
import type { RewardRow } from '@/lib/queries/rewards'

type Props = {
  reward: RewardRow
  balanceXp: number
  onRedeem: (r: RewardRow) => void
  onEdit: (r: RewardRow) => void
  onArchive: (r: RewardRow) => void
  onDelete: (r: RewardRow) => void
  hasRedemptions?: boolean
}

export function RewardCard({
  reward,
  balanceXp,
  onRedeem,
  onEdit,
  onArchive,
  onDelete,
  hasRedemptions,
}: Props) {
  const missing = reward.costXp - balanceXp
  const cantAfford = missing > 0
  return (
    <div
      data-reward-id={reward.id}
      className="border-border bg-surface flex items-start gap-3 rounded-xl border p-3"
    >
      <div className="min-w-0 flex-1">
        <div className="text-foreground truncate text-sm font-semibold">{reward.name}</div>
        {reward.description && (
          <div className="text-muted mt-0.5 line-clamp-2 text-xs">{reward.description}</div>
        )}
        <div className="text-muted mt-1 text-xs">
          <span className="text-accent font-semibold">{reward.costXp} XP</span>
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <Button
          data-redeem-button
          size="sm"
          variant="primary"
          disabled={cantAfford}
          title={cantAfford ? `Chybí ${missing} XP` : undefined}
          onClick={() => onRedeem(reward)}
        >
          Vyzvednout
        </Button>
        <Menu.Root>
          <Menu.Trigger
            aria-label={`Možnosti pro ${reward.name}`}
            className="hover:bg-surface-raised text-muted rounded p-1"
          >
            <MoreVertical className="h-4 w-4" />
          </Menu.Trigger>
          <Menu.Content align="end">
            <Menu.Item onSelect={() => onEdit(reward)}>Upravit</Menu.Item>
            <Menu.Item onSelect={() => onArchive(reward)}>Archivovat</Menu.Item>
            {!hasRedemptions && (
              <Menu.Item onSelect={() => onDelete(reward)} variant="danger">
                Smazat
              </Menu.Item>
            )}
          </Menu.Content>
        </Menu.Root>
      </div>
    </div>
  )
}
