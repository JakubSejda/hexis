'use client'

import type { StagnationResult } from '@/lib/stagnation'

type Props = {
  items: StagnationResult[]
}

export function StagnationList({ items }: Props) {
  if (items.length === 0) return null

  return (
    <div className="rounded-lg border border-[#f59e0b]/30 bg-[#f59e0b]/5 p-3">
      <h3 className="mb-2 text-sm font-semibold text-[#f59e0b]">Stagnace</h3>
      <ul className="flex flex-col gap-1.5">
        {items.map((item) => (
          <li key={item.exerciseId} className="text-sm text-[#e5e7eb]">
            <span className="font-medium">{item.exerciseName}</span>
            <span className="text-[#6b7280]">
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
