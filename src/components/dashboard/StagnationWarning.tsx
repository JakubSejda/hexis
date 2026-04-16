import type { StagnationResult } from '@/lib/stagnation'
import Link from 'next/link'

type Props = {
  items: StagnationResult[]
}

export function StagnationWarning({ items }: Props) {
  if (items.length === 0) return null
  return (
    <Link
      href="/progress/strength"
      className="block rounded-lg border border-[#f59e0b]/30 bg-[#f59e0b]/5 p-3"
    >
      <p className="text-sm font-semibold text-[#f59e0b]">
        {items.length === 1
          ? `${items[0]!.exerciseName}: ${items[0]!.weeksSincePr} t. bez PR`
          : `${items.length} cviky stagnují`}
      </p>
      <p className="mt-0.5 text-xs text-[#6b7280]">Tap pro detail</p>
    </Link>
  )
}
