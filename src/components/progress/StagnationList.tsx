'use client'

import type { StagnationResult } from '@/lib/stagnation'

type Props = {
  items: StagnationResult[]
}

export function StagnationList({ items }: Props) {
  if (items.length === 0) return null

  return (
    <div className="border-accent/30 bg-accent/5 rounded-lg border p-3">
      <h3 className="text-accent mb-2 text-sm font-semibold">Stagnace</h3>
      <ul className="flex flex-col gap-1.5">
        {items.map((item) => (
          <li key={item.exerciseId} className="text-foreground text-sm">
            <span className="font-medium">{item.exerciseName}</span>
            <span className="text-muted">
              {' '}
              — {item.weeksSincePr} t. bez PR
              {item.suggestion === 'deload' ? ' · zkus deload' : ' · zkus jinou variantu'}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
