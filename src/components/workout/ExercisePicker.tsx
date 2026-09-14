'use client'
import { useEffect, useState } from 'react'
import { Input, Sheet } from '@/components/ui'

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

  // Debounced: typing "bench" used to fire five requests for the whole
  // catalogue. The first load (q === '') runs immediately so the sheet is not
  // empty while the user reads it.
  useEffect(() => {
    if (!open) return
    let alive = true
    const run = () => {
      const url = new URL('/api/exercises', window.location.origin)
      if (q) url.searchParams.set('q', q)
      fetch(url)
        .then((r) => r.json())
        .then((data) => {
          if (alive) setItems(data)
        })
        .catch(() => {
          if (alive) setItems([])
        })
    }
    if (q === '') {
      run()
      return () => {
        alive = false
      }
    }
    const timer = setTimeout(run, 250)
    return () => {
      alive = false
      clearTimeout(timer)
    }
  }, [open, q])

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="Vyber cvik">
      <Input
        variant="search"
        placeholder="Hledej…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="mb-3"
      />
      <ul className="max-h-[50vh] overflow-y-auto">
        {items.map((ex) => (
          <li key={ex.id} className="[contain-intrinsic-size:auto_44px] [content-visibility:auto]">
            <button
              type="button"
              onClick={() => onPicked(ex.id, ex.name)}
              className="text-foreground hover:bg-surface-raised flex min-h-11 w-full items-center justify-between py-3 text-left text-sm transition-colors"
            >
              <span>{ex.name}</span>
              <span className="text-muted text-xs">{ex.type}</span>
            </button>
          </li>
        ))}
        {items.length === 0 ? <li className="text-muted py-3 text-xs">Nic nenalezeno</li> : null}
      </ul>
    </Sheet>
  )
}
