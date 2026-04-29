'use client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { RegionHeader } from '@/components/dashboard/RegionHeader'
import { Button } from '@/components/ui'
import { BalanceCard } from './BalanceCard'
import { RewardList } from './RewardList'
import { RedemptionList } from './RedemptionList'
import { RewardDialog } from './RewardDialog'
import { RedeemConfirmDialog } from './RedeemConfirmDialog'
import type { RedemptionWithReward, RewardRow, RewardsBalance } from '@/lib/queries/rewards'

type Props = {
  initialBalance: RewardsBalance
  initialRewards: RewardRow[]
  initialHistory: RedemptionWithReward[]
  redemptionCounts: Record<number, number>
}

export function RewardsPageClient({
  initialBalance,
  initialRewards,
  initialHistory,
  redemptionCounts,
}: Props) {
  const router = useRouter()
  const [editing, setEditing] = useState<RewardRow | null>(null)
  const [creating, setCreating] = useState(false)
  const [redeeming, setRedeeming] = useState<RewardRow | null>(null)

  const handleCreate = async (payload: { name: string; costXp: number; description?: string }) => {
    const res = await fetch('/api/rewards', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) return
    setCreating(false)
    router.refresh()
  }

  const handleEdit = async (payload: { name: string; costXp: number; description?: string }) => {
    if (!editing) return
    const res = await fetch(`/api/rewards/${editing.id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) return
    setEditing(null)
    router.refresh()
  }

  const handleArchive = async (r: RewardRow) => {
    const res = await fetch(`/api/rewards/${r.id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ archivedAt: new Date().toISOString() }),
    })
    if (!res.ok) return
    router.refresh()
  }

  const handleDelete = async (r: RewardRow) => {
    if (!confirm(`Trvale smazat "${r.name}"?`)) return
    const res = await fetch(`/api/rewards/${r.id}`, { method: 'DELETE' })
    if (!res.ok) return
    router.refresh()
  }

  const handleRedeem = async (input: { note?: string }) => {
    if (!redeeming) return
    const res = await fetch(`/api/rewards/${redeeming.id}/redeem`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(input),
    })
    if (!res.ok) {
      const json = await res.json().catch(() => null)
      alert(json?.error === 'Insufficient balance' ? 'Nedostatek XP' : 'Nepodařilo se vyzvednout')
      return
    }
    setRedeeming(null)
    router.refresh()
  }

  const handleDeleteRedemption = async (r: RedemptionWithReward) => {
    if (!confirm('Smazat z historie?')) return
    const res = await fetch(`/api/rewards/redemptions/${r.id}`, { method: 'DELETE' })
    if (!res.ok) return
    router.refresh()
  }

  return (
    <div className="space-y-6">
      <BalanceCard balance={initialBalance} />

      <div className="flex justify-end">
        <Button variant="primary" onClick={() => setCreating(true)}>
          + Nová odměna
        </Button>
      </div>

      <section className="space-y-3">
        <RegionHeader>Tvoje odměny</RegionHeader>
        <RewardList
          rewards={initialRewards}
          balanceXp={initialBalance.balanceXp}
          redemptionCounts={redemptionCounts}
          onRedeem={(r) => setRedeeming(r)}
          onEdit={(r) => setEditing(r)}
          onArchive={handleArchive}
          onDelete={handleDelete}
          onCreate={() => setCreating(true)}
        />
      </section>

      <section className="space-y-3">
        <RegionHeader>Historie</RegionHeader>
        <RedemptionList history={initialHistory} onDelete={handleDeleteRedemption} />
      </section>

      <RewardDialog
        open={creating}
        mode="create"
        onOpenChange={setCreating}
        onSubmit={handleCreate}
      />
      <RewardDialog
        open={editing != null}
        mode="edit"
        initial={
          editing
            ? { name: editing.name, costXp: editing.costXp, description: editing.description }
            : undefined
        }
        onOpenChange={(o) => !o && setEditing(null)}
        onSubmit={handleEdit}
      />
      <RedeemConfirmDialog
        open={redeeming != null}
        reward={redeeming}
        onOpenChange={(o) => !o && setRedeeming(null)}
        onConfirm={handleRedeem}
      />
    </div>
  )
}
