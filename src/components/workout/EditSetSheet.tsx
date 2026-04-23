'use client'
import { useState } from 'react'
import { BottomSheet, Dialog, NumberInput, useToast } from '@/components/ui'

type Props = {
  sessionId: number
  setId: number
  onClose: () => void
  onChanged: () => void
}

export function EditSetSheet({ setId, onClose, onChanged }: Props) {
  const [weight, setWeight] = useState<number | null>(null)
  const [reps, setReps] = useState<number | null>(null)
  const [rpe, setRpe] = useState<number | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const toast = useToast()

  const save = async () => {
    const res = await fetch(`/api/sets/${setId}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ weightKg: weight, reps, rpe }),
    })
    if (!res.ok) toast.show('Uložení selhalo', 'error')
    else onChanged()
  }

  const doDelete = async () => {
    setConfirmOpen(false)
    const res = await fetch(`/api/sets/${setId}`, { method: 'DELETE' })
    if (!res.ok) toast.show('Mazání selhalo', 'error')
    else onChanged()
  }

  return (
    <>
      <BottomSheet open={true} onOpenChange={(v) => !v && onClose()} title="Upravit sérii">
        <div className="flex flex-col gap-3">
          <NumberInput value={weight} onChange={setWeight} step={2.5} suffix="kg" />
          <NumberInput value={reps} onChange={setReps} step={1} suffix="reps" />
          <NumberInput value={rpe} onChange={setRpe} step={1} min={1} max={10} suffix="RPE" />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={save}
              className="bg-primary text-background h-11 flex-1 rounded-lg font-semibold"
            >
              Uložit
            </button>
            <button
              type="button"
              onClick={() => setConfirmOpen(true)}
              className="border-danger text-danger h-11 rounded-lg border px-4"
            >
              Smazat
            </button>
          </div>
        </div>
      </BottomSheet>
      <Dialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Smazat sérii?"
        description="Tuto akci nelze vrátit."
        dismissible={false}
      >
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setConfirmOpen(false)}
            className="border-border text-foreground h-11 flex-1 rounded-lg border font-semibold"
          >
            Zrušit
          </button>
          <button
            type="button"
            onClick={doDelete}
            className="bg-danger text-background h-11 flex-1 rounded-lg font-semibold"
          >
            Smazat
          </button>
        </div>
      </Dialog>
    </>
  )
}
