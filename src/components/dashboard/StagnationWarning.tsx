import type { StagnationResult } from '@/lib/stagnation'
import Link from 'next/link'

type Props = {
  items: StagnationResult[]
}

export function StagnationWarning({ items }: Props) {
  if (items.length === 0) return null
  return (
    <Link
      href="/stats/strength"
      className="rounded-card border-warning/40 bg-warning/10 block border px-4 py-3"
    >
      <span className="block">
        <span className="text-warning block text-sm font-semibold">
          {items.length === 1
            ? `${items[0]!.exerciseName}: ${items[0]!.weeksSincePr} t. bez PR`
            : `${items.length} cviky stagnují`}
        </span>
        <span className="text-muted mt-0.5 block text-xs">
          Otevři detail a zkus deload nebo variantu cviku
        </span>
      </span>
    </Link>
  )
}
