'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'

type Props = {
  total: number
  current: number
  onPrev: () => void
  onNext: () => void
  labels: { prev: string; next: string }
}

export function StepperNav({ total, current, onPrev, onNext, labels }: Props) {
  return (
    <div className="text-muted flex items-center justify-between text-xs">
      <button
        type="button"
        onClick={onPrev}
        disabled={current === 0}
        className="inline-flex items-center gap-1 px-2 disabled:opacity-30"
      >
        <ChevronLeft size={14} aria-hidden />
        {labels.prev}
      </button>
      <div className="flex gap-1">
        {Array.from({ length: total }).map((_, i) => (
          <span
            key={i}
            className={`h-2 w-2 rounded-full ${i === current ? 'bg-primary' : 'bg-border'}`}
          />
        ))}
      </div>
      <button
        type="button"
        onClick={onNext}
        disabled={current === total - 1}
        className="inline-flex items-center gap-1 px-2 disabled:opacity-30"
      >
        {labels.next}
        <ChevronRight size={14} aria-hidden />
      </button>
    </div>
  )
}
