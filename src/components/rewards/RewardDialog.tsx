'use client'
import { useState } from 'react'
import { Button, Dialog, Input, NumberInput } from '@/components/ui'

type Initial = { name: string; costXp: number; description?: string | null }

type Props = {
  open: boolean
  mode: 'create' | 'edit'
  initial?: Initial
  onOpenChange: (open: boolean) => void
  onSubmit: (payload: { name: string; costXp: number; description?: string }) => void
}

export function RewardDialog({ open, mode, initial, onOpenChange, onSubmit }: Props) {
  const [name, setName] = useState(initial?.name ?? '')
  const [cost, setCost] = useState<number | null>(initial ? initial.costXp : null)
  const [description, setDescription] = useState(initial?.description ?? '')
  const [error, setError] = useState<string | null>(null)

  // Render-phase sync: reset form fields when dialog transitions from closed → open.
  // Preferred over useEffect+setState, which the react-hooks lint rule flags.
  const [prevOpen, setPrevOpen] = useState(open)
  if (open !== prevOpen) {
    setPrevOpen(open)
    if (open) {
      setName(initial?.name ?? '')
      setCost(initial ? initial.costXp : null)
      setDescription(initial?.description ?? '')
      setError(null)
    }
  }

  const handleSubmit = () => {
    const trimmed = name.trim()
    if (!trimmed) {
      setError('Název je povinný')
      return
    }
    if (cost == null || cost < 1) {
      setError('Cena musí být kladné celé číslo')
      return
    }
    onSubmit({
      name: trimmed,
      costXp: cost,
      ...(description.trim() ? { description: description.trim() } : {}),
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={mode === 'create' ? 'Nová odměna' : 'Upravit odměnu'}
    >
      <div className="flex flex-col gap-3">
        <Input
          label="Název"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={80}
          autoFocus
        />
        {/* Standalone label + NumberInput so getByLabelText uniquely matches the <input>.
            NumberInput's built-in label wraps the stepper buttons too, causing RTL ambiguity. */}
        <div className="flex flex-col gap-1">
          <label htmlFor="reward-cost-input" className="text-muted text-xs font-medium">
            Cena (XP)
          </label>
          <NumberInput
            id="reward-cost-input"
            value={cost}
            onChange={(n) => setCost(n)}
            min={1}
            max={999_999}
            step={10}
          />
        </div>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted text-xs font-medium">Popis</span>
          <textarea
            aria-label="Popis"
            className="border-border bg-surface text-foreground rounded-md border px-3 py-2 text-sm focus:outline-none focus-visible:ring-2"
            rows={3}
            maxLength={280}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>
        {error && <div className="text-danger text-sm">{error}</div>}
        <div className="mt-2 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Zrušit
          </Button>
          <Button variant="primary" onClick={handleSubmit}>
            Uložit
          </Button>
        </div>
      </div>
    </Dialog>
  )
}
