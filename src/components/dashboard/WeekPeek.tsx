import Link from 'next/link'
import { Card, cn } from '@/components/ui'
import type { WeekPeekDay } from '@/lib/week-peek'

const DOT: Record<WeekPeekDay['status'], string> = {
  workout: 'bg-accent-deep',
  rest: 'bg-surface-raised',
  empty: 'border-border border border-dashed',
}

export function WeekPeek({ days }: { days: WeekPeekDay[] }) {
  return (
    <Card as={Link} href="/calendar" variant="interactive" padding="sm" className="block">
      <div className="grid grid-cols-7 gap-1 text-center">
        {days.map((d, i) => (
          <div key={i} data-day-status={d.status} className="flex flex-col items-center gap-1.5">
            <span className="text-muted text-[11px] font-semibold">{d.weekdayLabel}</span>
            <span aria-hidden className={cn('size-8 rounded-full', DOT[d.status])} />
          </div>
        ))}
      </div>
      <div className="text-muted mt-3 flex justify-center gap-4 text-[11px]">
        <span className="flex items-center gap-1.5">
          <span aria-hidden className="bg-accent-deep size-2.5 rounded-full" /> trénink
        </span>
        <span className="flex items-center gap-1.5">
          <span aria-hidden className="bg-surface-raised size-2.5 rounded-full" /> volno
        </span>
        <span className="flex items-center gap-1.5">
          <span aria-hidden className="border-border size-2.5 rounded-full border border-dashed" />{' '}
          zbývá
        </span>
      </div>
    </Card>
  )
}
