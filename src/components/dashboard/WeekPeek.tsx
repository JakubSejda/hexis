import Link from 'next/link'
import type { WeekPeekDay } from '@/lib/week-peek'

const GLYPH: Record<WeekPeekDay['status'], string> = {
  workout: '●',
  rest: '○',
  empty: '·',
}

const COLOR: Record<WeekPeekDay['status'], string> = {
  workout: 'text-accent',
  rest: 'text-muted',
  empty: 'text-border',
}

export function WeekPeek({ days }: { days: WeekPeekDay[] }) {
  return (
    <Link
      href="/training"
      className="border-border bg-surface hover:border-accent/60 block rounded-xl border p-4 transition-colors"
    >
      <div className="grid grid-cols-7 gap-2 text-center">
        {days.map((d, i) => (
          <div key={i} data-day-status={d.status} className="flex flex-col items-center gap-1">
            <span className="text-muted text-[10px]">{d.weekdayLabel}</span>
            <span className={`text-lg leading-none ${COLOR[d.status]}`}>{GLYPH[d.status]}</span>
          </div>
        ))}
      </div>
      <div className="text-muted mt-3 text-center text-[10px]">
        <span className="text-accent">●</span> workout &middot;{' '}
        <span className="text-muted">○</span> rest &middot; <span className="text-border">·</span>{' '}
        future
      </div>
    </Link>
  )
}
