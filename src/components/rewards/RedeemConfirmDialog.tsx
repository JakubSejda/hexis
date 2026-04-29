'use client'
import { useState } from 'react'
import { Dialog } from '@/components/ui/compound/Dialog'
import { Button, Input } from '@/components/ui'
import type { RewardRow } from '@/lib/queries/rewards'

type Props = {
  open: boolean
  reward: RewardRow | null
  onOpenChange: (open: boolean) => void
  onConfirm: (input: { note?: string }) => void
}

export function RedeemConfirmDialog({ open, reward, onOpenChange, onConfirm }: Props) {
  const [note, setNote] = useState('')

  // Render-phase sync: reset note when dialog opens.
  // Preferred over useEffect+setState, which the react-hooks lint rule flags.
  const [prevOpen, setPrevOpen] = useState(open)
  if (open !== prevOpen) {
    setPrevOpen(open)
    if (open) setNote('')
  }

  if (!reward) return null
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Vyzvednout odměnu"
      description={`${reward.name} — ${reward.costXp} XP`}
    >
      <div className="flex flex-col gap-3">
        <Input
          label="Poznámka (volitelná)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={280}
        />
        <div className="mt-2 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Zrušit
          </Button>
          <Button
            variant="primary"
            onClick={() => onConfirm(note.trim() ? { note: note.trim() } : {})}
          >
            Vyzvednout
          </Button>
        </div>
      </div>
    </Dialog>
  )
}
