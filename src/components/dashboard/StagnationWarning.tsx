import type { StagnationResult } from '@/lib/stagnation'
import Link from 'next/link'

type Props = {
  items: StagnationResult[]
}

export function StagnationWarning({ items }: Props) {
  if (items.length === 0) return null
  return (
    <Link href="/stats/strength" className="hud-clip-sm bg-accent/40 block p-px">
      <span className="hud-clip-sm bg-accent-soft/40 block p-3">
        <span className="text-accent block text-sm font-semibold">
          {items.length === 1
            ? `${items[0]!.exerciseName}: ${items[0]!.weeksSincePr} t. bez PR`
            : `${items.length} cviky stagnují`}
        </span>
        <span className="text-muted mt-0.5 block text-xs">Tap pro detail</span>
      </span>
    </Link>
  )
}
