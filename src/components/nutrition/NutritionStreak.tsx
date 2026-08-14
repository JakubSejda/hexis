import { Card } from '@/components/ui'
import type { DayClass } from '@/lib/nutrition-classify'

const BG: Record<DayClass, string> = {
  hit: '#065f46',
  miss: '#7f1d1d',
  empty: '#1f2733',
}

type Props = {
  streak: number
  thisWeek: { dayLabel: string; klass: DayClass }[]
}

export function NutritionStreak({ streak, thisWeek }: Props) {
  return (
    <Card padding="md">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-muted font-mono text-[11px] tracking-[0.2em] uppercase">
            Výživa streak
          </div>
          <div className="text-muted mt-1 text-xs">Dní v řadě s hitem</div>
        </div>
        <div className="text-foreground font-mono text-3xl font-bold">{streak}</div>
      </div>
      <div className="mt-2.5 flex justify-center gap-1.5">
        {thisWeek.map((d, i) => (
          <div
            key={i}
            className={
              'hud-clip-sm flex h-6 w-6 items-center justify-center text-xs font-semibold ' +
              (d.klass === 'empty' ? 'text-muted' : 'text-white')
            }
            style={{ background: BG[d.klass] }}
          >
            {d.dayLabel}
          </div>
        ))}
      </div>
    </Card>
  )
}
