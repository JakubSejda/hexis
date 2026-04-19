'use client'
import { useEffect, useState } from 'react'
import { BottomSheet } from '@/components/ui/BottomSheet'

type Exercise = { id: number; name: string; type: string; userId: string | null }

export function ExercisePicker({
  open,
  onOpenChange,
  onPicked,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  onPicked: (id: number, name: string) => void
}) {
  const [q, setQ] = useState('')
  const [items, setItems] = useState<Exercise[]>([])

  useEffect(() => {
    if (!open) return
    const url = new URL('/api/exercises', window.location.origin)
    if (q) url.searchParams.set('q', q)
    fetch(url)
      .then((r) => r.json())
      .then(setItems)
      .catch(() => setItems([]))
  }, [open, q])

  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} title="Vyber cvik">
      <input
        placeholder="Hledej..."
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="border-border bg-background text-foreground mb-3 h-11 w-full rounded-lg border px-3"
      />
      <ul className="max-h-[50vh] overflow-y-auto">
        {items.map((ex) => (
          <li key={ex.id}>
            <button
              type="button"
              onClick={() => onPicked(ex.id, ex.name)}
              className="text-foreground flex w-full items-center justify-between py-3 text-left text-sm"
            >
              <span>{ex.name}</span>
              <span className="text-muted text-xs">{ex.type}</span>
            </button>
          </li>
        ))}
        {items.length === 0 ? <li className="text-muted py-3 text-xs">Nic nenalezeno</li> : null}
      </ul>
    </BottomSheet>
  )
}
