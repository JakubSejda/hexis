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
      className="border-accent/30 bg-accent/5 block rounded-lg border p-3"
    >
      <p className="text-accent text-sm font-semibold">
        {items.length === 1
          ? `${items[0]!.exerciseName}: ${items[0]!.weeksSincePr} t. bez PR`
          : `${items.length} cviky stagnují`}
      </p>
      <p className="text-muted mt-0.5 text-xs">Tap pro detail</p>
    </Link>
  )
}
