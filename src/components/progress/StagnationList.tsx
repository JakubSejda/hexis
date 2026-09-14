'use client'

import type { StagnationResult } from '@/lib/stagnation'
import { Heading } from '@/components/ui'

type Props = {
  items: StagnationResult[]
}

export function StagnationList({ items }: Props) {
  if (items.length === 0) return null

  return (
    <div className="hud-clip border-accent bg-accent/5 border-l-2 p-3">
      <Heading level={3} className="text-accent mb-2 text-sm">
        Stagnace
      </Heading>
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
